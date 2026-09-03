from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class AuditLogEntry(BaseModel):
    id: str = Field(..., description="Unique UUID of audit record")
    session_id: str = Field(..., description="Trace/Session ID")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    event_type: str = Field(..., description="AGENT_INTAKE, TOOL_CALL, POLICY_CHECK, HITL_REQUIRED, HITL_APPROVED, PAYMENT_EXECUTED, PAYMENT_CAPTURED, ERROR_RECOVERED")
    status: str = Field(..., description="SUCCESS, WARNING, REJECTED, PENDING_APPROVAL")
    summary: str = Field(..., description="Human readable description")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detailed JSON metadata")
    previous_hash: str = Field(default="0"*64, description="SHA-256 hash of prior block")
    cryptographic_hash: str = Field(..., description="Deterministic SHA-256 chained hash")

class AuditLedgerSummary(BaseModel):
    total_logs: int
    session_count: int
    is_chain_intact: bool
    latest_block_hash: str
