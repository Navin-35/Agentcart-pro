from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PolicyConfig(BaseModel):
    """Legacy flat policy config — kept for backward compatibility with existing API routes."""
    max_single_transaction_limit: float = Field(default=20000.0, description="Hard ceiling for any single transaction")
    auto_approve_limit: float = Field(default=3000.0, description="UAP-style autonomous pre-authorization threshold")
    allowed_categories: List[str] = Field(default_factory=lambda: ["accessories", "cables", "peripherals", "pantry", "audio", "storage", "workspace"])
    require_human_approval_always: bool = Field(default=False, description="Enforce HITL on all transactions regardless of amount")
    enforce_stock_check: bool = Field(default=True, description="Strictly verify stock before approving order")
    min_merchant_trust_score: float = Field(default=0.85, description="Reject merchants below trust threshold")


class PolicyCheckResult(BaseModel):
    """Structured result for a single policy check."""
    name: str
    passed: bool
    label: str       # Human-readable label e.g. "Price Verified"
    detail: str      # e.g. "₹1,599 ≤ ₹3,000 auto-approve limit"


class PolicyDecisionCard(BaseModel):
    """
    Per-transaction policy verdict card.
    Shown in the UI so the user can see exactly why a transaction was approved or blocked.

    Example:
        POLICY DECISION
        Price        ✓ PASS
        Stock        ✓ PASS
        Category     ✓ PASS
        Mandate      ✓ PASS
        Replay       ✓ PASS
        Merchant     ✓ PASS
        ─────────────────────
        ✅ AUTONOMOUSLY APPROVED
    """
    session_id: str
    checks: List[PolicyCheckResult] = Field(default_factory=list)
    final_decision: str        # AUTO_APPROVED | HITL_REQUIRED | REJECTED
    decision_reason: str
    verified_total: float
    auto_approve_ceiling: float
    per_tx_limit: float
    daily_limit: float
    daily_spent: float
    mandate_id: str = ""
    idempotency_key: str = ""

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.checks)


class VerificationResult(BaseModel):
    is_valid: bool
    status: str  # AUTO_APPROVED, HITL_REQUIRED, REJECTED_*
    reason: str
    verified_total: float
    idempotency_key: str
    requires_human_signature: bool = False
    details: Dict[str, Any] = Field(default_factory=dict)
    mathematical_proof: Optional[Dict[str, Any]] = None
    ap2_mandate: Optional[Dict[str, Any]] = None
    policy_decision_card: Optional[Dict[str, Any]] = None
    approval_id: Optional[str] = None
