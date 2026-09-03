from fastapi import APIRouter
from app.services.policy_engine import policy_engine
from app.domain.policy import PolicyConfig

router = APIRouter(prefix="/policy", tags=["Financial Guardrails Policy"])

@router.get("")
def get_current_policy():
    """Retrieve current financial guardrails and spending policy."""
    return policy_engine.config.model_dump()

@router.post("")
def update_policy(config: PolicyConfig):
    """Update spending limits, pre-auth thresholds, or whitelisted categories."""
    policy_engine.update_config(config)
    return {"status": "success", "config": policy_engine.config.model_dump()}
