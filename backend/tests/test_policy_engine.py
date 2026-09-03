import pytest
from app.domain.order import OrderProposal, CartItem
from app.services.policy_engine import policy_engine
from app.services.razorpay_service import razorpay_service

def test_autonomous_pre_auth_within_limit():
    """Scenario 1: Purchase within ₹3,000 auto-approve threshold executes autonomously."""
    session_id = "test_sess_01"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(product_id="prod_hdmi_cable_4k", quantity=2, unit_price=799.0, name="HDMI Cable")],
        total_amount=1598.0,
        user_goal="Buy 2 HDMI cables for monitor"
    )
    
    result = policy_engine.verify_order_proposal(session_id, proposal)
    assert result.is_valid is True
    assert result.status == "AUTO_APPROVED"
    assert result.requires_human_signature is False
    assert result.verified_total == 1598.0
    
    order = razorpay_service.create_order(session_id, result.verified_total, "rcpt_test_01")
    assert order["id"].startswith("order_")
    assert order["amount"] == 159800  # paise

def test_hitl_approval_gate_trigger():
    """Scenario 2: Purchase exceeding auto-limit (₹3,000) correctly triggers HITL gate."""
    session_id = "test_sess_02"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(product_id="prod_mech_keyboard_k2", quantity=1, unit_price=6499.0, name="Keychron Keyboard")],
        total_amount=6499.0,
        user_goal="Order Keychron K2 mechanical keyboard"
    )
    
    result = policy_engine.verify_order_proposal(session_id, proposal)
    assert result.is_valid is True
    assert result.status == "HITL_REQUIRED"
    assert result.requires_human_signature is True
    assert result.verified_total == 6499.0

def test_hard_spending_ceiling_rejection():
    """Scenario 3: Purchase exceeding hard cap (₹10,000) is strictly rejected."""
    session_id = "test_sess_03"
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[CartItem(product_id="prod_mx_master_3s", quantity=2, unit_price=8995.0, name="MX Master 3S")],
        total_amount=17990.0,
        user_goal="Order 2 Logitech MX Master mice"
    )
    
    result = policy_engine.verify_order_proposal(session_id, proposal)
    assert result.is_valid is False
    assert result.status == "REJECTED_OVER_BUDGET"
