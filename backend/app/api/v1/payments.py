from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.razorpay_service import razorpay_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/payments", tags=["Razorpay Gateway & Settlement"])

class RazorpayConfigRequest(BaseModel):
    key_id: str
    key_secret: str
    mock_mode: bool = False

class TestConnectionRequest(BaseModel):
    key_id: Optional[str] = None
    key_secret: Optional[str] = None

class VerifySignatureRequest(BaseModel):
    session_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: float

@router.get("/status")
def get_payment_status():
    has_secret = bool(razorpay_service.key_secret)
    return {
        "status": "ready",
        "mock_mode": razorpay_service.mock_mode,
        "key_id": razorpay_service.key_id,
        "key_id_masked": f"{razorpay_service.key_id[:10]}..." if razorpay_service.key_id else "None",
        "has_secret": has_secret,
        "live_client_ready": bool(razorpay_service.client),
        "settlement_rail": "UPI / NetBanking / Cards / Autonomous A2A Rails"
    }

@router.post("/config")
def update_razorpay_config(req: RazorpayConfigRequest):
    razorpay_service.set_credentials(req.key_id, req.key_secret, req.mock_mode)
    return {
        "status": "success",
        "mock_mode": razorpay_service.mock_mode,
        "key_id": razorpay_service.key_id,
        "key_id_masked": f"{razorpay_service.key_id[:10]}..." if razorpay_service.key_id else "None",
        "has_secret": bool(razorpay_service.key_secret),
        "live_client_ready": bool(razorpay_service.client)
    }

@router.post("/test-connection")
def test_razorpay_connection(req: TestConnectionRequest):
    res = razorpay_service.test_credentials(req.key_id, req.key_secret)
    return res

@router.post("/verify-signature")
def verify_payment(req: VerifySignatureRequest):
    is_valid = razorpay_service.verify_payment_signature(
        req.razorpay_order_id,
        req.razorpay_payment_id,
        req.razorpay_signature
    )
    
    audit_service.record(
        session_id=req.session_id,
        event_type="PAYMENT_CAPTURED",
        status="SUCCESS" if is_valid else "FAILED",
        summary=f"Razorpay Client Payment Verified: {req.razorpay_payment_id} for ₹{req.amount:,.2f}",
        details={
            "order_id": req.razorpay_order_id,
            "payment_id": req.razorpay_payment_id,
            "signature_valid": is_valid,
            "amount": req.amount
        }
    )
    
    return {
        "verified": is_valid,
        "order_id": req.razorpay_order_id,
        "payment_id": req.razorpay_payment_id,
        "status": "captured" if is_valid else "verification_failed"
    }
