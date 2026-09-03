from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CartItem(BaseModel):
    product_id: str = Field(..., description="Target product ID")
    quantity: int = Field(default=1, ge=1, description="Quantity to purchase")
    unit_price: float = Field(..., description="Claimed unit price by Agent (will be overwritten by Policy Engine)")
    name: str = Field(..., description="Item name")
    merchant_id: Optional[str] = Field(default="merchant_rzp_tech_01")
    merchant_name: Optional[str] = Field(default="Authorized Store")


class MerchantQuote(BaseModel):
    merchant_id: str
    merchant_name: str
    product_id: str
    unit_price: float
    stock: int
    delivery_days: int
    shipping_fee: float
    trust_score: float
    rating: float
    recommended: bool = False


class MathematicalProof(BaseModel):
    """
    Formal arithmetic proof for zero-hallucination non-repudiation.
    Guarantees: Final_Paise == SUM(Unit_Paise * Qty) - Discount_Paise
    This ensures the LLM cannot hallucinate prices — the Policy Engine
    recalculates from the live DB and the proof captures the invariant.
    """
    formula: str = "Paise_Total = SUM(Unit_Paise * Qty) - Discount_Paise + Tax_Paise"
    item_paise_sum: int
    discount_paise: int
    tax_paise: int
    final_paise_total: int
    final_inr_total: float
    invariant_verified: bool = True
    proof_hash: str


class AP2MandateToken(BaseModel):
    """
    AP2-inspired delegated mandate token — scoped to session and time-limited.
    Note: This is an AgentCart-specific authorization token inspired by emerging
    agentic payment protocols. It is NOT a certified NPCI AP2 or UAP standard token.
    """
    mandate_id: str
    session_id: str
    payer_agent_id: str = "agent_buyer_01"
    merchant_scope: str
    max_authorized_inr: float
    issued_at: int
    expires_at: int
    cryptographic_signature: str
    protocol_version: str = "AgentCart-Auth-v2.1"


class OrderProposal(BaseModel):
    merchant_id: str = Field(default="merchant_rzp_tech_01")
    items: List[CartItem] = Field(..., min_length=1)
    total_amount: float = Field(..., gt=0)
    user_goal: str = Field(..., description="User original intent text")
    currency: str = Field(default="INR")
    promo_code: Optional[str] = Field(default=None, description="Applied verified promotional coupon")
    discount_amount: float = Field(default=0.0, ge=0.0, description="Verified discount deducted from subtotal")
    ap2_mandate: Optional[AP2MandateToken] = None
    mathematical_proof: Optional[MathematicalProof] = None
    # Server-issued approval ID for HITL — never client-supplied
    approval_id: Optional[str] = None
    tx_id: Optional[str] = None


class OrderReceipt(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    status: str
    method: str = "upi"
    amount: float
    currency: str = "INR"
    timestamp: int
    is_mock: bool = True
    checkout_options: Optional[Dict[str, Any]] = None
    invoice_number: Optional[str] = None
    ap2_mandate_id: Optional[str] = None
    proof_hash: Optional[str] = None
