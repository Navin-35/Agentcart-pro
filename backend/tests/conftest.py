import sys
import os
import sqlite3
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.catalog_service import catalog_service
from app.services.policy_engine import policy_engine
from app.domain.policy import PolicyConfig
from app.services.audit_service import audit_service
from app.services.idempotency_service import idempotency_service
from app.services.transaction_store import transaction_store
from app.services.mandate_service import mandate_service


@pytest.fixture(autouse=True)
def reset_system_state():
    """Reset all services before every test to ensure test isolation."""
    catalog_service.reset_catalog()
    policy_engine.update_config(PolicyConfig(
        max_single_transaction_limit=10000.0,
        auto_approve_limit=3000.0,
        allowed_categories=["accessories", "cables", "peripherals", "pantry", "audio", "storage", "workspace"],
        require_human_approval_always=False,
        enforce_stock_check=True,
        min_merchant_trust_score=0.85
    ))
    # Clear persistent idempotency store for test isolation
    try:
        conn = sqlite3.connect(idempotency_service.db_path)
        conn.execute("DELETE FROM idempotency_keys")
        conn.commit()
        conn.close()
    except Exception:
        pass
    # Clear transactions table
    try:
        conn2 = sqlite3.connect(transaction_store.db_path)
        conn2.execute("DELETE FROM transactions")
        conn2.execute("DELETE FROM transaction_history")
        conn2.commit()
        conn2.close()
    except Exception:
        pass
    # Clear audit ledger
    audit_service.clear()
    yield
