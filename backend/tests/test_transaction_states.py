"""
Tests for the Transaction State Machine.

The financial workflow is modeled as a controlled state machine.
Only valid transitions are allowed — backward transitions and jumps are blocked.
"""
import pytest
from app.services.transaction_store import TransactionStore, TransactionState


@pytest.fixture
def store():
    return TransactionStore(db_path=":memory:")


def test_transaction_created_in_intent_received(store):
    """New transactions start in INTENT_RECEIVED state."""
    tx_id = store.create("sess_001", "Buy keyboard")
    tx = store.get(tx_id)
    assert tx["state"] == TransactionState.INTENT_RECEIVED


def test_valid_forward_transition(store):
    """Valid state transitions must succeed."""
    tx_id = store.create("sess_001", "Buy mouse")
    ok = store.transition(tx_id, TransactionState.DISCOVERING, note="Agent started")
    assert ok is True
    tx = store.get(tx_id)
    assert tx["state"] == TransactionState.DISCOVERING


def test_invalid_backward_transition_blocked(store):
    """Backward state transitions must be blocked."""
    tx_id = store.create("sess_001", "Buy monitor")
    store.transition(tx_id, TransactionState.DISCOVERING)
    store.transition(tx_id, TransactionState.QUOTED)
    store.transition(tx_id, TransactionState.VERIFYING)

    # Try to go backward — VERIFYING → DISCOVERING is invalid
    ok = store.transition(tx_id, TransactionState.DISCOVERING)
    assert ok is False  # Blocked
    # State unchanged
    tx = store.get(tx_id)
    assert tx["state"] == TransactionState.VERIFYING


def test_skip_to_paid_from_intent_blocked(store):
    """Cannot skip from INTENT_RECEIVED to PAID."""
    tx_id = store.create("sess_001", "Buy SSD")
    ok = store.transition(tx_id, TransactionState.PAID)
    assert ok is False


def test_terminal_state_no_further_transitions(store):
    """Once FAILED, no further transitions are allowed."""
    tx_id = store.create("sess_001", "Buy cable")
    store.transition(tx_id, TransactionState.DISCOVERING)
    store.transition(tx_id, TransactionState.FAILED)

    ok = store.transition(tx_id, TransactionState.DISCOVERING)
    assert ok is False


def test_full_happy_path(store):
    """A complete happy-path transaction from INTENT_RECEIVED to PAID."""
    tx_id = store.create("sess_001", "Buy headphones", amount=1500.0)
    assert store.transition(tx_id, TransactionState.DISCOVERING)
    assert store.transition(tx_id, TransactionState.QUOTED)
    assert store.transition(tx_id, TransactionState.VERIFYING)
    assert store.transition(tx_id, TransactionState.AUTHORIZED)
    assert store.transition(tx_id, TransactionState.PAYMENT_PENDING)
    assert store.transition(tx_id, TransactionState.PAID)

    tx = store.get(tx_id)
    assert tx["state"] == TransactionState.PAID
    assert len(tx["history"]) == 7  # 1 create + 6 transitions


def test_awaiting_approval_path(store):
    """HITL flow: VERIFYING → AWAITING_APPROVAL → AUTHORIZED → PAID."""
    tx_id = store.create("sess_001", "Buy expensive item", amount=7500.0)
    store.transition(tx_id, TransactionState.DISCOVERING)
    store.transition(tx_id, TransactionState.QUOTED)
    store.transition(tx_id, TransactionState.VERIFYING)

    # Goes to HITL
    ok = store.transition(tx_id, TransactionState.AWAITING_APPROVAL,
                          approval_id="appr_test_001", amount=7500.0)
    assert ok is True

    # Human approves
    assert store.transition(tx_id, TransactionState.AUTHORIZED)
    assert store.transition(tx_id, TransactionState.PAYMENT_PENDING)
    assert store.transition(tx_id, TransactionState.PAID)


def test_get_by_approval_id(store):
    """Lookup by approval_id must return the correct transaction."""
    tx_id = store.create("sess_001", "Buy tablet", amount=8000.0)
    store.transition(tx_id, TransactionState.DISCOVERING)
    store.transition(tx_id, TransactionState.QUOTED)
    store.transition(tx_id, TransactionState.VERIFYING)
    store.transition(tx_id, TransactionState.AWAITING_APPROVAL,
                     approval_id="appr_lookup_test", amount=8000.0)

    tx = store.get_by_approval_id("appr_lookup_test")
    assert tx is not None
    assert tx["tx_id"] == tx_id
    assert tx["state"] == TransactionState.AWAITING_APPROVAL
