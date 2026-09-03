import pytest
from app.domain.order import OrderProposal, CartItem
from app.services.policy_engine import policy_engine

def test_idempotency_replay_defense():
    """Scenario 5: Replaying an identical transaction is blocked to prevent double-billing."""
    session_id = "test_sess_replay"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(product_id="prod_hdmi_cable_4k", quantity=1, unit_price=799.0, name="HDMI Cable")],
        total_amount=799.0,
        user_goal="Buy 1 HDMI cable"
    )
    
    # First execution succeeds
    result1 = policy_engine.verify_order_proposal(session_id, proposal)
    assert result1.is_valid is True
    policy_engine.mark_key_processed(result1.idempotency_key)
    
    # Replay execution attempt must be blocked
    result2 = policy_engine.verify_order_proposal(session_id, proposal)
    assert result2.is_valid is False
    assert result2.status == "REJECTED_DUPLICATE"
