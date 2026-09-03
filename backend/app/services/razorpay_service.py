import time
import uuid
import hmac
import hashlib
from typing import Dict, Any, Optional
import razorpay
from app.core.config import settings
from app.core.security import verify_razorpay_signature
from app.services.audit_service import audit_service
from app.domain.order import OrderReceipt

class RazorpayService:
    def __init__(self):
        self.mock_mode = settings.RAZORPAY_MOCK_MODE
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.client: Optional[razorpay.Client] = None
        self._init_client()

    def _init_client(self):
        try:
            if not self.mock_mode and self.key_id and self.key_secret:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
                self.client.set_app_details({"title": "AgentCart Pro", "version": "2.0.0"})
            else:
                self.client = None
        except Exception as e:
            print(f"[RazorpayService] Live client init fallback to mock: {e}")
            self.client = None

    def set_credentials(self, key_id: str, key_secret: str, mock_mode: bool = False):
        self.key_id = key_id.strip() if key_id else ""
        self.key_secret = key_secret.strip() if key_secret else ""
        self.mock_mode = mock_mode
        if not mock_mode and self.key_id and self.key_secret:
            try:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
                self.client.set_app_details({"title": "AgentCart Pro", "version": "2.0.0"})
            except Exception as e:
                print(f"[RazorpayService] Error re-initializing client: {e}")
                self.client = None
                self.mock_mode = True
        else:
            self.client = None

    def test_credentials(self, key_id: Optional[str] = None, key_secret: Optional[str] = None) -> Dict[str, Any]:
        """Test API key and secret against live Razorpay API."""
        k_id = (key_id or self.key_id).strip()
        k_sec = (key_secret or self.key_secret).strip()

        if not k_id or not k_sec:
            return {
                "success": False,
                "message": "Key ID and Key Secret are required to test live connectivity.",
                "is_mock": True
            }

        try:
            test_client = razorpay.Client(auth=(k_id, k_sec))
            # Test ping via fetching orders list or light test
            res = test_client.order.all({"count": 1})
            return {
                "success": True,
                "message": f"Successfully connected to Razorpay Test Rails! (Key: {k_id[:12]}...)",
                "details": {"orders_found": len(res.get("items", []))},
                "is_mock": False
            }
        except razorpay.errors.BadRequestError as e:
            return {
                "success": False,
                "message": f"Razorpay Authentication failed: {str(e)}",
                "is_mock": True
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Razorpay API Error: {str(e)}",
                "is_mock": True
            }

    def create_order(
        self,
        session_id: str,
        amount: float,
        receipt_id: str,
        notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        amount_in_paise = int(round(amount * 100))
        notes = notes or {}
        
        # 1. Attempt Live Test Rails via Razorpay SDK
        if not self.mock_mode and self.client and self.key_secret:
            try:
                order_payload = {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": receipt_id[:40],
                    "notes": notes,
                    "payment_capture": 1
                }
                order = self.client.order.create(data=order_payload)
                order["is_mock"] = False
                order["checkout_options"] = self.generate_checkout_options(order["id"], amount_in_paise, notes)
                
                audit_service.record(
                    session_id=session_id,
                    event_type="PAYMENT_EXECUTED",
                    status="SUCCESS",
                    summary=f"Razorpay Live Test Order created: {order.get('id')} for ₹{amount:,.2f}",
                    details={"order_id": order.get("id"), "amount_paise": amount_in_paise, "currency": "INR"}
                )
                return order
            except Exception as e:
                audit_service.record(
                    session_id=session_id,
                    event_type="PAYMENT_EXECUTED",
                    status="WARNING",
                    summary=f"Razorpay API call failed, falling back to autonomous sandbox: {str(e)}",
                    details={"error": str(e)}
                )

        # 2. Mock / Autonomous Sandbox Order Creation
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        mock_order = {
            "id": mock_order_id,
            "entity": "order",
            "amount": amount_in_paise,
            "amount_paid": 0,
            "amount_due": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "status": "created",
            "attempts": 0,
            "notes": notes,
            "created_at": int(time.time()),
            "is_mock": True
        }
        mock_order["checkout_options"] = self.generate_checkout_options(mock_order_id, amount_in_paise, notes)
        
        audit_service.record(
            session_id=session_id,
            event_type="PAYMENT_EXECUTED",
            status="SUCCESS",
            summary=f"Autonomous Sandbox Order generated: {mock_order_id} for ₹{amount:,.2f}",
            details=mock_order
        )
        return mock_order

    def generate_checkout_options(self, order_id: str, amount_paise: int, notes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate options payload for razorpay.js modal."""
        return {
            "key": self.key_id or "rzp_test_TVQr6C3It4AWiR",
            "amount": amount_paise,
            "currency": "INR",
            "name": "AgentCart Pro Commerce",
            "description": f"Autonomous Order {order_id}",
            "order_id": order_id,
            "prefill": {
                "name": "AI Buyer Agent",
                "email": "agent@agentcart.pro",
                "contact": "+919876543210"
            },
            "notes": notes,
            "theme": {
                "color": "#2563EB"
            }
        }

    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> bool:
        """Cryptographically verify Razorpay payment signature."""
        secret = self.key_secret or "mock_secret"
        expected_signature = verify_razorpay_signature(order_id, payment_id, secret)
        return hmac.compare_digest(expected_signature, signature)

    def simulate_payment_settlement(
        self,
        session_id: str,
        order_id: str,
        amount: float,
        method: str = "upi"
    ) -> Dict[str, Any]:
        """Simulate autonomous instantaneous settlement for test agents."""
        payment_id = f"pay_mock_{uuid.uuid4().hex[:14]}"
        secret = self.key_secret or "mock_secret_signature"
        signature = verify_razorpay_signature(order_id, payment_id, secret)
        
        receipt_data = {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
            "status": "captured",
            "method": method,
            "amount": amount,
            "currency": "INR",
            "timestamp": int(time.time()),
            "autonomous_settlement": True
        }
        
        audit_service.record(
            session_id=session_id,
            event_type="PAYMENT_CAPTURED",
            status="SUCCESS",
            summary=f"Payment {payment_id} settled via {method.upper()} Autonomous Rails for ₹{amount:,.2f}",
            details=receipt_data
        )
        return receipt_data

razorpay_service = RazorpayService()
