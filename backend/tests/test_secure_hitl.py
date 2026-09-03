"""
Tests for secure HITL (Human-in-the-Loop) approval flow.

Key security property being tested:
  - The server must not trust any amount, product, or proposal data from the client.
  - The client sends ONLY: session_id + approval_id
  - The server retrieves the stored transaction from the database
  - Tampered amounts, wrong sessions, and replayed approvals are all blocked.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.transaction_store import transaction_store, TransactionState
from app.services.policy_engine import policy_engine
from app.domain.order import OrderProposal, CartItem
from app.domain.policy import PolicyConfig

client = TestClient(app)


def test_hitl_approval_requires_valid_approval_id():
    """Approval with non-existent approval_id must return 404."""
    response = client.post("/api/v1/agent/approve-hitl", json={
        "session_id": "sess_test_001",
        "approval_id": "appr_nonexistent_00000000"
    })
    assert response.status_code == 404


def test_hitl_approval_rejects_wrong_session():
    """Approval with correct approval_id but wrong session_id must return 403."""
    # Create a transaction and walk it to AWAITING_APPROVAL via valid transitions
    tx_id = transaction_store.create("sess_real_owner", "Buy keyboard", 3500.0)
    approval_id = "appr_test_security_001"
    transaction_store.transition(tx_id, TransactionState.DISCOVERING)
    transaction_store.transition(tx_id, TransactionState.QUOTED)
    transaction_store.transition(tx_id, TransactionState.VERIFYING)
    transaction_store.transition(
        tx_id, TransactionState.AWAITING_APPROVAL,
        note="Test HITL",
        approval_id=approval_id,
        amount=3500.0
    )

    # Attacker uses correct approval_id but wrong session_id
    response = client.post("/api/v1/agent/approve-hitl", json={
        "session_id": "sess_attacker_999",  # Wrong session
        "approval_id": approval_id
    })
    assert response.status_code == 403
    assert "Session ID does not match" in response.json()["detail"]


def test_hitl_cannot_tamper_amount():
    """
    The client cannot influence the payment amount via the approval request body.
    The amount must be retrieved from the server-stored transaction only.
    """
    tx_id = transaction_store.create("sess_hitl_test", "Buy headphones", 4500.0)
    approval_id = "appr_test_amount_guard"
    transaction_store.transition(tx_id, TransactionState.DISCOVERING)
    transaction_store.transition(tx_id, TransactionState.QUOTED)
    transaction_store.transition(tx_id, TransactionState.VERIFYING)
    transaction_store.transition(
        tx_id, TransactionState.AWAITING_APPROVAL,
        note="HITL for 4500",
        approval_id=approval_id,
        amount=4500.0
    )

    # Client sends only session_id + approval_id (no amount field to tamper)
    response = client.post("/api/v1/agent/approve-hitl", json={
        "session_id": "sess_hitl_test",
        "approval_id": approval_id
    })
    # Verify the response uses the server-stored amount (4500.0), not any client-supplied value
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 4500.0


def test_hitl_cannot_reuse_approval_id():
    """Each approval_id can only be used once (state machine prevents double-use)."""
    tx_id = transaction_store.create("sess_replay_test", "Buy mouse", 3200.0)
    approval_id = "appr_test_replay_guard"
    transaction_store.transition(tx_id, TransactionState.DISCOVERING)
    transaction_store.transition(tx_id, TransactionState.QUOTED)
    transaction_store.transition(tx_id, TransactionState.VERIFYING)
    transaction_store.transition(
        tx_id, TransactionState.AWAITING_APPROVAL,
        note="HITL for replay test",
        approval_id=approval_id,
        amount=3200.0
    )

    # First approval — should succeed
    r1 = client.post("/api/v1/agent/approve-hitl", json={
        "session_id": "sess_replay_test",
        "approval_id": approval_id
    })
    assert r1.status_code == 200

    # Second approval with same approval_id — state is no longer AWAITING_APPROVAL
    r2 = client.post("/api/v1/agent/approve-hitl", json={
        "session_id": "sess_replay_test",
        "approval_id": approval_id
    })
    assert r2.status_code == 409  # Conflict — wrong state


def test_approval_id_is_server_issued():
    """
    After running the agent and hitting HITL, the approval_id must come from
    the server's SSE stream, not be created by the client.
    """
    # Force HITL by setting auto_approve_limit very low
    policy_engine.update_config(PolicyConfig(
        max_single_transaction_limit=10000.0,
        auto_approve_limit=500.0,  # Low threshold forces HITL
        allowed_categories=["accessories", "cables", "peripherals"],
        require_human_approval_always=False,
        enforce_stock_check=True,
        min_merchant_trust_score=0.85
    ))

    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(
            product_id="prod_hdmi_cable_4k",
            quantity=1,
            unit_price=799.0,
            name="4K HDMI Cable"
        )],
        total_amount=799.0,
        user_goal="Buy HDMI cable"
    )

    result = policy_engine.verify_order_proposal("sess_approval_id_test", proposal)
    assert result.status == "HITL_REQUIRED"
    assert result.approval_id is not None
    assert result.approval_id.startswith("appr_")
    assert len(result.approval_id) > 10  # Server-generated, not trivially guessable
