from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.services.catalog_service import catalog_service
from app.services.razorpay_service import razorpay_service
from app.services.mandate_service import mandate_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AgentCart — Trustworthy autonomous commerce agent with policy-controlled payments. "
        "LLM proposes; deterministic systems authorize. "
        "Features: Spend mandates, transaction state machine, persistent idempotency, "
        "hash-chained audit ledger, secure HITL, Razorpay verification."
    )
)

# CORS middleware
# NOTE: allow_origins=["*"] is intentionally permissive for local demo use.
# In production, restrict to specific origins via ALLOWED_ORIGINS env var.
origins = settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
# Backward-compatibility alias (/api)
app.include_router(api_v1_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup — ensures DBs are ready before first request."""
    # Trigger mandate service to load/create default mandate
    mandate_service.get_active()
    print(f"[AgentCart] {settings.PROJECT_NAME} v{settings.VERSION} started.")
    print(f"[AgentCart] Razorpay mode: {'MOCK' if razorpay_service.mock_mode else 'LIVE TEST'}")
    print(f"[AgentCart] Catalog: {len(catalog_service.list_all())} products loaded.")

@app.get("/health", tags=["System Health"])
def health_check():
    mandate = mandate_service.get_active()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "payment_mode": "MOCK" if razorpay_service.mock_mode else "RAZORPAY_TEST",
        "catalog_items": len(catalog_service.list_all()),
        "active_mandate_id": mandate.mandate_id,
        "mandate_expires_at": mandate.expires_at,
        "architecture": "LLM proposes; deterministic systems authorize"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
