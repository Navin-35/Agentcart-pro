import pytest
from app.domain.order import OrderProposal, CartItem
from app.services.policy_engine import policy_engine

def test_anti_hallucination_price_integrity():
    """Scenario 4: If an LLM hallucinates an arbitrary lower price, the policy engine recalculates from true DB price."""
    session_id = "test_sess_hallucination"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(product_id="prod_hdmi_cable_4k", quantity=1, unit_price=99.0, name="HDMI Cable (Fake Price)")],
        total_amount=99.0,  # True DB price is 799.0
        user_goal="Buy cheap HDMI cable"
    )
    
    result = policy_engine.verify_order_proposal(session_id, proposal)
    assert result.is_valid is True
    # The verified total must strictly match the true live DB price (₹799.0), not the hallucinated ₹99.0
    assert result.verified_total == 799.0
