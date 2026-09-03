import pytest
from app.services.catalog_service import catalog_service
from app.agent.reasoner import buyer_agent_reasoner
from app.services.audit_service import audit_service

@pytest.mark.asyncio
async def test_agent_graceful_stockout_recovery():
    """Scenario 6: Live agent detects out-of-stock item and autonomously substitutes in-stock alternative."""
    # Deplete stock of Keychron keyboard
    catalog_service.simulate_stock_depletion("prod_mech_keyboard_k2")
    
    session_id = "test_agent_sess_stockout"
    steps = []
    
    async for step in buyer_agent_reasoner.run_goal_stream(session_id, "Buy a mechanical keyboard for office"):
        steps.append(step)
        
    step_titles = [s["title"] for s in steps]
    assert any("Stockout Detected" in t or "Gracefully" in t for t in step_titles)
    
    logs = audit_service.get_logs_by_session(session_id)
    event_types = [l.event_type for l in logs]
    assert "ERROR_RECOVERED" in event_types
