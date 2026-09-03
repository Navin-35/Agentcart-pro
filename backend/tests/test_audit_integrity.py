import pytest
from app.services.audit_service import audit_service

def test_tamper_evident_merkle_chain_integrity():
    """Scenario 7: Audit log records tamper-evident cryptographic hashes for every step."""
    session_id = "test_audit_sess"
    
    e1 = audit_service.record(session_id, "AGENT_INTAKE", "SUCCESS", "Goal received", {"q": 1})
    e2 = audit_service.record(session_id, "POLICY_CHECK", "SUCCESS", "Pre-authorized", {"amount": 1500})
    e3 = audit_service.record(session_id, "PAYMENT_EXECUTED", "SUCCESS", "Order created", {"order_id": "order_123"})
    
    assert len(e1.cryptographic_hash) == 64
    assert len(e2.cryptographic_hash) == 64
    assert len(e3.cryptographic_hash) == 64
    
    # Verify cryptographic block chaining
    assert e2.previous_hash == e1.cryptographic_hash
    assert e3.previous_hash == e2.cryptographic_hash
    
    # Whole chain verification
    assert audit_service.verify_chain_integrity() is True
