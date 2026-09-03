"""
Transaction State Machine — SQLite-backed.

Every purchase intent is modeled as a controlled state machine.
Only valid state transitions are allowed. This prevents the financial
workflow from being a loose collection of unrelated API calls.

States:
    INTENT_RECEIVED  → Agent received user goal
    DISCOVERING      → Agent searching catalog
    QUOTED           → Products selected, price quoted
    VERIFYING        → Policy engine validating
    AWAITING_APPROVAL→ Waiting for human sign-off (HITL)
    AUTHORIZED       → Policy approved (auto or human)
    PAYMENT_PENDING  → Razorpay order created, awaiting capture
    PAID             → Payment captured and verified
    FAILED           → Terminal failure state
    CANCELLED        → User or system cancelled
    REFUNDED         → Payment returned

Design principle:
    The agent can propose; only this state machine can authorize transitions.
"""
import sqlite3
import time
import uuid
import json
import os
from typing import Optional, Dict, Any, List
from enum import Enum
from app.core.config import settings


class TransactionState(str, Enum):
    INTENT_RECEIVED   = "INTENT_RECEIVED"
    DISCOVERING       = "DISCOVERING"
    QUOTED            = "QUOTED"
    VERIFYING         = "VERIFYING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    AUTHORIZED        = "AUTHORIZED"
    PAYMENT_PENDING   = "PAYMENT_PENDING"
    PAID              = "PAID"
    FAILED            = "FAILED"
    CANCELLED         = "CANCELLED"
    REFUNDED          = "REFUNDED"


# Valid forward transitions — backward transitions are not allowed
VALID_TRANSITIONS: Dict[TransactionState, List[TransactionState]] = {
    TransactionState.INTENT_RECEIVED:   [TransactionState.DISCOVERING, TransactionState.FAILED, TransactionState.CANCELLED],
    TransactionState.DISCOVERING:       [TransactionState.QUOTED, TransactionState.FAILED, TransactionState.CANCELLED],
    TransactionState.QUOTED:            [TransactionState.VERIFYING, TransactionState.FAILED, TransactionState.CANCELLED],
    TransactionState.VERIFYING:         [TransactionState.AUTHORIZED, TransactionState.AWAITING_APPROVAL, TransactionState.FAILED, TransactionState.CANCELLED],
    TransactionState.AWAITING_APPROVAL: [TransactionState.AUTHORIZED, TransactionState.CANCELLED],
    TransactionState.AUTHORIZED:        [TransactionState.PAYMENT_PENDING, TransactionState.FAILED],
    TransactionState.PAYMENT_PENDING:   [TransactionState.PAID, TransactionState.FAILED],
    TransactionState.PAID:              [TransactionState.REFUNDED],
    TransactionState.FAILED:            [],  # Terminal
    TransactionState.CANCELLED:         [],  # Terminal
    TransactionState.REFUNDED:          [],  # Terminal
}


class TransactionStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.TRANSACTIONS_DB_PATH
        self._mem_conn: Optional[sqlite3.Connection] = None
        self._init_db()

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
            CREATE TABLE IF NOT EXISTS transactions (
                tx_id         TEXT PRIMARY KEY,
                session_id    TEXT NOT NULL,
                state         TEXT NOT NULL,
                intent        TEXT,
                proposal      TEXT,
                approval_id   TEXT UNIQUE,
                razorpay_order_id TEXT,
                razorpay_payment_id TEXT,
                amount        REAL,
                idempotency_key TEXT,
                created_at    INTEGER NOT NULL,
                updated_at    INTEGER NOT NULL,
                failure_reason TEXT,
                metadata      TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transaction_history (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                tx_id         TEXT NOT NULL,
                from_state    TEXT,
                to_state      TEXT NOT NULL,
                timestamp     INTEGER NOT NULL,
                note          TEXT
            )
        """)
        conn.commit()
        self._close(conn)

    def create(self, session_id: str, intent: str, amount: float = 0.0) -> str:
        """Create a new transaction in INTENT_RECEIVED state. Returns tx_id."""
        tx_id = f"tx_{uuid.uuid4().hex[:16]}"
        now = int(time.time())
        conn = self._connect()
        conn.execute(
            """
            INSERT INTO transactions
              (tx_id, session_id, state, intent, amount, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (tx_id, session_id, TransactionState.INTENT_RECEIVED, intent, amount, now, now)
        )
        conn.execute(
            "INSERT INTO transaction_history (tx_id, from_state, to_state, timestamp, note) VALUES (?, ?, ?, ?, ?)",
            (tx_id, None, TransactionState.INTENT_RECEIVED, now, "Transaction created")
        )
        conn.commit()
        self._close(conn)
        return tx_id

    def transition(self, tx_id: str, new_state: TransactionState, note: str = "", **kwargs) -> bool:
        """
        Attempt a state transition. Returns True if successful, False if invalid.
        Additional kwargs are stored as metadata updates (e.g. razorpay_order_id, failure_reason).
        """
        conn = self._connect()
        row = conn.execute("SELECT state FROM transactions WHERE tx_id = ?", (tx_id,)).fetchone()
        if not row:
            self._close(conn)
            return False

        current = TransactionState(row["state"])
        allowed = VALID_TRANSITIONS.get(current, [])
        if new_state not in allowed:
            self._close(conn)
            return False

        now = int(time.time())
        updates = {"state": new_state, "updated_at": now}
        # Apply allowed optional field updates
        for field in ["proposal", "approval_id", "razorpay_order_id",
                      "razorpay_payment_id", "amount", "idempotency_key",
                      "failure_reason", "metadata"]:
            if field in kwargs:
                val = kwargs[field]
                updates[field] = json.dumps(val) if isinstance(val, dict) else val

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE transactions SET {set_clause} WHERE tx_id = ?",
            (*updates.values(), tx_id)
        )
        conn.execute(
            "INSERT INTO transaction_history (tx_id, from_state, to_state, timestamp, note) VALUES (?, ?, ?, ?, ?)",
            (tx_id, current, new_state, now, note)
        )
        conn.commit()
        self._close(conn)
        return True

    def get(self, tx_id: str) -> Optional[Dict[str, Any]]:
        conn = self._connect()
        row = conn.execute("SELECT * FROM transactions WHERE tx_id = ?", (tx_id,)).fetchone()
        if not row:
            self._close(conn)
            return None
        history = conn.execute(
            "SELECT from_state, to_state, timestamp, note FROM transaction_history WHERE tx_id = ? ORDER BY id",
            (tx_id,)
        ).fetchall()
        self._close(conn)
        result = dict(row)
        # Deserialize JSON fields
        for field in ["proposal", "metadata"]:
            if result.get(field):
                try:
                    result[field] = json.loads(result[field])
                except Exception:
                    pass
        result["history"] = [dict(h) for h in history]
        return result

    def get_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent transaction for a session."""
        conn = self._connect()
        row = conn.execute(
            "SELECT tx_id FROM transactions WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
            (session_id,)
        ).fetchone()
        self._close(conn)
        if not row:
            return None
        return self.get(row["tx_id"])

    def get_by_approval_id(self, approval_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a transaction by its server-issued approval_id (used for HITL)."""
        conn = self._connect()
        row = conn.execute(
            "SELECT tx_id FROM transactions WHERE approval_id = ?", (approval_id,)
        ).fetchone()
        self._close(conn)
        if not row:
            return None
        return self.get(row["tx_id"])

    def get_daily_total(self, session_prefix: str = "", days: int = 1) -> float:
        """Sum of PAID transaction amounts in the past N days (for daily limit enforcement)."""
        since = int(time.time()) - (days * 86400)
        conn = self._connect()
        row = conn.execute(
            "SELECT SUM(amount) as total FROM transactions WHERE state = 'PAID' AND created_at >= ?",
            (since,)
        ).fetchone()
        self._close(conn)
        return float(row["total"] or 0.0)

    def list_recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        conn = self._connect()
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        self._close(conn)
        return [dict(r) for r in rows]


transaction_store = TransactionStore()
