from fastapi import APIRouter
from app.api.v1.catalog import router as catalog_router
from app.api.v1.policy import router as policy_router
from app.api.v1.audit import router as audit_router
from app.api.v1.payments import router as payments_router
from app.api.v1.agent import router as agent_router

api_v1_router = APIRouter()
api_v1_router.include_router(catalog_router)
api_v1_router.include_router(policy_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(payments_router)
api_v1_router.include_router(agent_router)
