import pytest
from app.services.razorpay_service import razorpay_service
from app.core.security import verify_razorpay_signature

def test_razorpay_order_and_settlement_simulation():
    session_id = "test_rzp_sess"
    amount = 2499.0
    
    order = razorpay_service.create_order(session_id, amount, "rcpt_test_rzp", {"goal": "Anker Hub"})
    assert order["id"].startswith("order_")
    assert order["amount"] == 249900
    
    settlement = razorpay_service.simulate_payment_settlement(session_id, order["id"], amount, "upi")
    assert settlement["status"] == "captured"
    assert settlement["method"] == "upi"
    assert len(settlement["razorpay_signature"]) == 64
