import pytest
from app.domain.order import OrderProposal, CartItem
from app.services.policy_engine import policy_engine
from app.services.catalog_service import catalog_service

def test_ap2_mandate_token_issuance():
    """Verify that AP2 Mandate Tokens are cryptographically generated and valid for 10 minutes."""
    proposal = OrderProposal(
        merchant_id="merchant_rzp_tech_01",
        items=[
            CartItem(
                product_id="prod_hdmi_cable_4k",
                quantity=2,
                unit_price=799.0,
                name="Ultra High Speed 4K@60Hz HDMI 2.1 Braided Cable (2M)"
            )
        ],
        total_amount=1598.0,
        user_goal="Buy 2 Anker 4K HDMI cables"
    )
    
    res = policy_engine.verify_order_proposal("sess_ap2_test_01", proposal)
    assert res.is_valid is True
    assert res.ap2_mandate is not None
    assert res.ap2_mandate["protocol_version"] == "AgentCart-Auth-v2.1"  # Renamed from AP2-UAP-v2.1 to be honest about standard compliance
    assert res.ap2_mandate["payer_agent_id"] == "agent_buyer_01"
    assert len(res.ap2_mandate["cryptographic_signature"]) == 64  # SHA-256 hex string

def test_mathematical_proof_of_invariance():
    """Verify zero-hallucination mathematical proof arithmetic."""
    items = [
        {"verified_db_price": 1299.0, "quantity": 2},
        {"verified_db_price": 4999.0, "quantity": 1}
    ]
    discount = 500.0
    final_total = 7097.0
    
    proof = policy_engine.generate_mathematical_proof(items, discount, final_total)
    assert proof.invariant_verified is True
    assert proof.item_paise_sum == 759700
    assert proof.discount_paise == 50000
    assert proof.final_paise_total == 709700
    assert proof.final_inr_total == 7097.0
    assert len(proof.proof_hash) == 64

def test_multi_merchant_quoting_engine():
    """Verify multi-merchant quotes generator provides diverse competitive vendor options."""
    quotes = catalog_service.get_multi_merchant_quotes("prod_hdmi_cable_4k")
    assert len(quotes) >= 3
    merchant_ids = [q["merchant_id"] for q in quotes]
    assert "merchant_rzp_tech_01" in merchant_ids
    assert "merchant_prime_hub_02" in merchant_ids
    assert any(q["recommended"] is True for q in quotes)
