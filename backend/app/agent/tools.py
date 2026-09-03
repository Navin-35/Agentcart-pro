"""
MCP-style tool definitions for the AI Buyer Agent.

These functions define the boundary between the agent and commerce capabilities.
The agent must call these tools rather than directly accessing internal services.

Tool Permission Levels:
    OPEN        — Agent may call freely
    RESTRICTED  — Agent may call but action is logged and audited
    HIGHLY_RESTRICTED — Agent may initiate but human approval or policy gate required

Design principle: Tool permissions prevent the agent from calling high-risk
operations (payment capture, refund) without going through the policy gate.
"""
from typing import List, Optional, Dict, Any
from app.services.catalog_service import catalog_service
from app.domain.catalog import Product, CatalogQuery


# ──────────────────────────────────────────────────────
# PERMISSION: OPEN — Safe, read-only catalog operations
# ──────────────────────────────────────────────────────

def tool_search_products(
    query_text: str,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    in_stock_only: bool = False
) -> List[Dict[str, Any]]:
    """
    MCP Tool [OPEN]: Search merchant catalog by keywords, category, and price cap.
    Returns ranked list of matching products with price and stock from the live DB.
    The agent uses this to discover candidate products — it cannot modify results.
    """
    q = CatalogQuery(
        query=query_text,
        category=category,
        max_price=max_price,
        in_stock_only=in_stock_only,
        limit=10
    )
    products = catalog_service.search(q)
    return [p.model_dump() for p in products]


def tool_get_product(product_id: str) -> Optional[Dict[str, Any]]:
    """
    MCP Tool [OPEN]: Retrieve real-time price, stock, specs, and merchant trust for a product.
    Price here is authoritative — the Policy Engine will enforce this same DB price.
    """
    p = catalog_service.get_by_id(product_id)
    return p.model_dump() if p else None


def tool_get_price(product_id: str) -> Optional[Dict[str, Any]]:
    """
    MCP Tool [OPEN]: Get live price and currency for a product.
    The agent should use this to quote the user — but the Policy Engine
    independently recalculates from the same source.
    """
    p = catalog_service.get_by_id(product_id)
    if not p:
        return None
    return {
        "product_id": p.id,
        "name": p.name,
        "price_inr": p.price,
        "currency": "INR"
    }


def tool_check_inventory(product_id: str, quantity: int = 1) -> Dict[str, Any]:
    """
    MCP Tool [OPEN]: Check if requested quantity is available.
    Returns stock level and whether the request is fulfillable.
    """
    p = catalog_service.get_by_id(product_id)
    if not p:
        return {"product_id": product_id, "available": False, "stock": 0, "reason": "Product not found"}
    fulfillable = p.stock >= quantity
    return {
        "product_id": p.id,
        "name": p.name,
        "stock": p.stock,
        "requested": quantity,
        "fulfillable": fulfillable,
        "reason": "In stock" if fulfillable else f"Only {p.stock} available, {quantity} requested"
    }


def tool_check_merchant(merchant_id: str) -> Dict[str, Any]:
    """
    MCP Tool [OPEN]: Retrieve merchant verification status and trust metrics.
    The agent uses this to assess merchant reliability before recommending a product.
    """
    products = catalog_service.list_all()
    merchant_products = [p for p in products if p.merchant_id == merchant_id]
    if not merchant_products:
        return {"merchant_id": merchant_id, "found": False, "trust_score": 0.0, "verified": False}
    sample = merchant_products[0]
    avg_rating = sum(p.rating for p in merchant_products) / len(merchant_products)
    return {
        "merchant_id": merchant_id,
        "merchant_name": sample.merchant_name,
        "found": True,
        "trust_score": sample.merchant_trust_score,
        "verified": sample.merchant_trust_score >= 0.85,
        "product_count": len(merchant_products),
        "avg_rating": round(avg_rating, 2),
        "payment_rail": "Razorpay"
    }


def tool_validate_promo_code(code: str, subtotal: float) -> Dict[str, Any]:
    """
    MCP Tool [OPEN]: Validate promotional coupon and compute discount on proposed subtotal.
    Discount is computed deterministically — the agent cannot claim a larger discount.
    """
    return catalog_service.validate_promo_code(code, subtotal)


def tool_check_policy() -> Dict[str, Any]:
    """
    MCP Tool [OPEN]: Query current policy constraints and active spend mandate.
    Agent uses this to understand what it's authorized to buy before proposing.
    """
    from app.services.policy_engine import policy_engine
    from app.services.mandate_service import mandate_service
    config = policy_engine.config.model_dump()
    mandate = mandate_service.get_active()
    return {
        "policy": config,
        "mandate": {
            "mandate_id": mandate.mandate_id,
            "per_transaction_limit": mandate.per_transaction_limit,
            "daily_limit": mandate.daily_limit,
            "auto_approve_ceiling": mandate.auto_approve_ceiling,
            "allowed_categories": mandate.allowed_categories,
            "blocked_categories": mandate.blocked_categories,
            "min_merchant_trust": mandate.min_merchant_trust,
            "expires_at": mandate.expires_at,
            "is_expired": mandate.is_expired()
        }
    }


# ──────────────────────────────────────────────────────────────────────
# PERMISSION: RESTRICTED — Write operations; logged and policy-gated
# ──────────────────────────────────────────────────────────────────────

def tool_reserve_inventory(product_id: str, quantity: int, session_id: str) -> Dict[str, Any]:
    """
    MCP Tool [RESTRICTED]: Soft-reserve inventory ahead of payment.
    Prevents race conditions where another buyer claims the last unit mid-checkout.
    Reservation is released automatically if payment is not captured.
    Note: Current implementation is a check; full reservation would require
    a dedicated inventory reservation table.
    """
    p = catalog_service.get_by_id(product_id)
    if not p:
        return {"reserved": False, "reason": "Product not found"}
    if p.stock < quantity:
        return {
            "reserved": False,
            "reason": f"Insufficient stock: {p.stock} available, {quantity} requested",
            "available_stock": p.stock
        }
    return {
        "reserved": True,
        "product_id": product_id,
        "quantity": quantity,
        "session_id": session_id,
        "reservation_id": f"rsv_{session_id[:8]}_{product_id[:8]}",
        "expires_in_seconds": 300  # 5 minute reservation window
    }


# ──────────────────────────────────────────────────────────────────────────────────
# PERMISSION: HIGHLY RESTRICTED — Payment operations require policy gate + HITL/auth
# ──────────────────────────────────────────────────────────────────────────────────

# NOTE: CREATE_PAYMENT, CAPTURE_PAYMENT, REFUND_PAYMENT are NOT exposed as direct
# agent tools. The agent submits an OrderProposal which goes through the Policy Gate.
# Only after the Policy Gate authorizes can the payment layer execute.
# This is the enforcement of: "LLM proposes; deterministic systems authorize."

TOOL_PERMISSIONS = {
    "search_products":    "OPEN",
    "get_product":        "OPEN",
    "get_price":          "OPEN",
    "check_inventory":    "OPEN",
    "check_merchant":     "OPEN",
    "validate_promo":     "OPEN",
    "check_policy":       "OPEN",
    "reserve_inventory":  "RESTRICTED",
    "create_payment":     "HIGHLY_RESTRICTED",  # Policy gate required
    "capture_payment":    "HIGHLY_RESTRICTED",  # Policy gate + Razorpay verification
    "refund_payment":     "HIGHLY_RESTRICTED",  # Human approval required
}
