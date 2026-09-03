"""
Agent Spend Mandate Service.

An Agent Spend Mandate is the user's explicit authorization grant that defines
exactly what an autonomous agent is permitted to purchase on their behalf.

Unlike a simple budget cap, a mandate captures:
    - Per-transaction limit
    - Daily spending limit
    - Allowed product categories
    - Blocked product categories
    - Minimum merchant trust threshold
    - Auto-approve ceiling (vs. human approval required)
    - Expiry date

Design principle:
    The mandate is created by the user, stored server-side, and verified
    deterministically before any payment is authorized.
    The LLM agent cannot modify or bypass the mandate.
"""
import sqlite3
import time
import uuid
import json
import os
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.security import generate_mandate_signature


class AgentSpendMandate(BaseModel):
    """
    Structured user authorization grant for autonomous agent purchases.
    All limits are in INR.
    """
    mandate_id: str = Field(default_factory=lambda: f"mandate_{uuid.uuid4().hex[:12]}")
    per_transaction_limit: float = Field(default=20000.0, description="Maximum single transaction amount (INR)")
    daily_limit: float = Field(default=30000.0, description="Maximum total spend per day (INR)")
    auto_approve_ceiling: float = Field(default=3000.0, description="Transactions at or below this amount auto-approve")
    allowed_categories: List[str] = Field(
        default_factory=lambda: ["accessories", "cables", "peripherals", "audio", "storage", "workspace"],
        description="Whitelisted product categories"
    )
    blocked_categories: List[str] = Field(
        default_factory=list,
        description="Explicitly blocked categories (takes priority over allowed)"
    )
    min_merchant_trust: float = Field(default=0.85, description="Minimum merchant trust score (0.0–1.0)")
    require_human_always: bool = Field(default=False, description="Always require human approval regardless of amount")
    expires_at: Optional[int] = Field(default=None, description="Unix timestamp when mandate expires (None = no expiry)")
    signature: str = Field(default="", description="HMAC-SHA256 over mandate fields — tamper-evident")
    created_at: int = Field(default_factory=lambda: int(time.time()))
    is_active: bool = Field(default=True)

    def sign(self) -> "AgentSpendMandate":
        """Compute and set the HMAC-SHA256 signature over mandate parameters."""
        payload = (
            f"{self.mandate_id}:{self.per_transaction_limit:.2f}:"
            f"{self.daily_limit:.2f}:{self.auto_approve_ceiling:.2f}:"
            f"{','.join(sorted(self.allowed_categories))}:"
            f"{','.join(sorted(self.blocked_categories))}:"
            f"{self.min_merchant_trust:.2f}:{self.expires_at}"
        )
        self.signature = generate_mandate_signature(payload)
        return self

    def verify_signature(self) -> bool:
        """Verify mandate has not been tampered with since creation."""
        payload = (
            f"{self.mandate_id}:{self.per_transaction_limit:.2f}:"
            f"{self.daily_limit:.2f}:{self.auto_approve_ceiling:.2f}:"
            f"{','.join(sorted(self.allowed_categories))}:"
            f"{','.join(sorted(self.blocked_categories))}:"
            f"{self.min_merchant_trust:.2f}:{self.expires_at}"
        )
        expected = generate_mandate_signature(payload)
        import hmac as _hmac
        return _hmac.compare_digest(self.signature, expected)

    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return int(time.time()) > self.expires_at

    def allows_category(self, category: str) -> bool:
        cat = category.lower()
        if cat in [b.lower() for b in self.blocked_categories]:
            return False
        if self.allowed_categories:
            return cat in [a.lower() for a in self.allowed_categories]
        return True


class MandateCheckResult(BaseModel):
    passed: bool
    reason: str
    checks: Dict[str, Any] = Field(default_factory=dict)


class MandateService:
    """Stores and retrieves the active spend mandate (persisted in SQLite)."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.MANDATE_DB_PATH
        self._mem_conn: Optional[sqlite3.Connection] = None
        self._init_db()
        self._active: Optional[AgentSpendMandate] = None
        self._load_active()

    def _connect(self) -> sqlite3.Connection:
        if self.db_path == ":memory:":
            if self._mem_conn is None:
                self._mem_conn = sqlite3.connect(":memory:", check_same_thread=False)
                self._mem_conn.row_factory = sqlite3.Row
            return self._mem_conn
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _close(self, conn: sqlite3.Connection) -> None:
        if self.db_path != ":memory:":
            conn.close()

    def _init_db(self):
        if self.db_path != ":memory:":
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = self._connect()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS mandates (
                mandate_id   TEXT PRIMARY KEY,
                data         TEXT NOT NULL,
                is_active    INTEGER NOT NULL DEFAULT 1,
                created_at   INTEGER NOT NULL
            )
        """)
        conn.commit()
        self._close(conn)

    def _load_active(self):
        conn = self._connect()
        row = conn.execute(
            "SELECT data FROM mandates WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
        self._close(conn)
        if row:
            try:
                self._active = AgentSpendMandate(**json.loads(row["data"]))
            except Exception:
                self._active = None

    def create_mandate(self, params: Dict[str, Any]) -> AgentSpendMandate:
        """Create a new mandate, sign it, deactivate old ones, and persist."""
        mandate = AgentSpendMandate(**params).sign()
        conn = self._connect()
        # Deactivate previous mandates
        conn.execute("UPDATE mandates SET is_active = 0")
        conn.execute(
            "INSERT INTO mandates (mandate_id, data, is_active, created_at) VALUES (?, ?, 1, ?)",
            (mandate.mandate_id, json.dumps(mandate.model_dump()), int(time.time()))
        )
        conn.commit()
        self._close(conn)
        self._active = mandate
        return mandate

    def get_active(self) -> AgentSpendMandate:
        """Return active mandate or create a sensible default."""
        if self._active and not self._active.is_expired():
            return self._active
        # Bootstrap a signed default mandate
        return self.create_mandate({
            "per_transaction_limit": settings.DEFAULT_MAX_TRANSACTION_LIMIT,
            "daily_limit": settings.DEFAULT_DAILY_LIMIT,
            "auto_approve_ceiling": settings.DEFAULT_AUTO_APPROVE_LIMIT,
            "allowed_categories": settings.ALLOWED_CATEGORIES,
            "blocked_categories": [],
            "min_merchant_trust": 0.85,
        })

    def verify_mandate(
        self,
        amount: float,
        category: str,
        merchant_trust: float,
        daily_spent: float = 0.0
    ) -> MandateCheckResult:
        """
        Deterministically check a proposed transaction against the active mandate.
        Returns a structured pass/fail result with per-check details.
        """
        mandate = self.get_active()
        checks: Dict[str, Any] = {}
        failures = []

        # 1. Mandate not expired
        expired = mandate.is_expired()
        checks["mandate_valid"] = not expired
        if expired:
            failures.append("Mandate has expired")

        # 2. Mandate signature intact
        sig_ok = mandate.verify_signature()
        checks["signature_intact"] = sig_ok
        if not sig_ok:
            failures.append("Mandate signature verification failed (tampered?)")

        # 3. Per-transaction limit
        checks["per_transaction_limit"] = {
            "limit": mandate.per_transaction_limit,
            "requested": amount,
            "pass": amount <= mandate.per_transaction_limit
        }
        if amount > mandate.per_transaction_limit:
            failures.append(f"Amount ₹{amount:,.2f} exceeds per-transaction limit ₹{mandate.per_transaction_limit:,.2f}")

        # 4. Daily limit
        remaining_daily = mandate.daily_limit - daily_spent
        checks["daily_limit"] = {
            "limit": mandate.daily_limit,
            "spent_today": daily_spent,
            "remaining": remaining_daily,
            "pass": (daily_spent + amount) <= mandate.daily_limit
        }
        if (daily_spent + amount) > mandate.daily_limit:
            failures.append(f"Would exceed daily limit ₹{mandate.daily_limit:,.2f} (spent today: ₹{daily_spent:,.2f})")

        # 5. Category allowed
        cat_ok = mandate.allows_category(category)
        checks["category"] = {
            "category": category,
            "allowed": mandate.allowed_categories,
            "blocked": mandate.blocked_categories,
            "pass": cat_ok
        }
        if not cat_ok:
            failures.append(f"Category '{category}' not permitted by mandate")

        # 6. Merchant trust
        checks["merchant_trust"] = {
            "required": mandate.min_merchant_trust,
            "actual": merchant_trust,
            "pass": merchant_trust >= mandate.min_merchant_trust
        }
        if merchant_trust < mandate.min_merchant_trust:
            failures.append(f"Merchant trust {merchant_trust:.2f} below mandate minimum {mandate.min_merchant_trust:.2f}")

        passed = len(failures) == 0
        return MandateCheckResult(
            passed=passed,
            reason=failures[0] if failures else "All mandate checks passed",
            checks=checks
        )

    def needs_human_approval(self, amount: float) -> bool:
        mandate = self.get_active()
        return mandate.require_human_always or amount > mandate.auto_approve_ceiling


mandate_service = MandateService()
