import pytest
from app.domain.order import OrderProposal, CartItem
from app.agent.reasoner import buyer_agent_reasoner
from app.services.catalog_service import catalog_service
from app.services.policy_engine import policy_engine
from app.services.razorpay_service import razorpay_service

def test_multi_item_intent_decomposition():
    """Verify high-accuracy multi-item goal parsing."""
    goal = "Buy 2 braided 4K HDMI cables and 1 Keychron K2 mechanical keyboard under 8000"
    intents = buyer_agent_reasoner._decompose_goal_intents(goal)
    assert len(intents) == 2
    assert intents[0]["quantity"] == 2
    assert "hdmi" in intents[0]["item_text"].lower()
    assert intents[1]["quantity"] == 1
    assert "keychron" in intents[1]["item_text"].lower() or "keyboard" in intents[1]["item_text"].lower()

def test_promo_code_deterministic_validation():
    """Verify coupon code application and discount logic."""
    subtotal = 5000.0
    res = catalog_service.validate_promo_code("AGENTCART10", subtotal)
    assert res["valid"] is True
    assert res["discount"] == 500.0  # 10% of 5000

    # Test invalid code
    invalid_res = catalog_service.validate_promo_code("FAKEDISCOUNT99", subtotal)
    assert invalid_res["valid"] is False

def test_multi_item_policy_verification_with_discount():
    """Verify that multi-item proposal with promo code is verified with correct math."""
    session_id = "test_multi_promo_01"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[
            CartItem(product_id="prod_hdmi_cable_4k", quantity=2, unit_price=799.0, name="HDMI Cable"), # 1598
            CartItem(product_id="prod_coffee_beans_1kg", quantity=1, unit_price=1450.0, name="Coffee Beans") # 1450
        ],
        total_amount=3048.0,
        user_goal="Buy 2 HDMI cables and 1kg coffee beans with coupon AGENTCART10",
        promo_code="AGENTCART10"
    )
    # Subtotal is 1598 + 1450 = 3048. 10% discount is 304.80. Net total is 2743.20 <= 3000 -> Auto Approved!
    result = policy_engine.verify_order_proposal(session_id, proposal)
    assert result.is_valid is True
    assert result.status == "AUTO_APPROVED"
    assert round(result.verified_total, 2) == 2743.20

def test_razorpay_checkout_options_generation():
    """Verify that Razorpay order creation generates checkout payload for frontend."""
    session_id = "test_checkout_opts_01"
    order = razorpay_service.create_order(session_id, 2499.0, "rcpt_test_opts")
    assert "checkout_options" in order
    opts = order["checkout_options"]
    assert opts["amount"] == 249900
    assert opts["currency"] == "INR"
    assert "key" in opts
    assert opts["key"].startswith("rzp_test_")
