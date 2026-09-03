from typing import Optional
from fastapi import APIRouter, Query
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Ledger"])

@router.get("/logs")
def get_audit_logs(session_id: Optional[str] = None, limit: int = Query(default=50, ge=1, le=200)):
    """Retrieve tamper-evident audit logs by session or latest chronological events."""
    if session_id:
        logs = audit_service.get_logs_by_session(session_id)
    else:
        logs = audit_service.get_all_logs(limit=limit)
    return {"logs": [log.model_dump() for log in logs]}

@router.get("/verify-chain")
def verify_audit_chain():
    """Cryptographically inspect and verify SHA-256 block hash chaining."""
    is_intact = audit_service.verify_chain_integrity()
    return {
        "is_chain_intact": is_intact,
        "latest_hash": audit_service._latest_hash,
        "total_records": len(audit_service._memory_cache)
    }

@router.post("/clear")
def clear_audit_ledger():
    """Clear audit logs (for demo/eval reset)."""
    audit_service.clear()
    return {"status": "success", "message": "Audit ledger reset"}
