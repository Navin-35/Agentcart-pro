from typing import Optional, List, Dict, Any
from app.domain.catalog import Product
from app.services.catalog_service import catalog_service

class AgentRecoveryEngine:
    """
    Self-healing engine for autonomous commerce agents:
    - Recovers from merchant stockouts by finding equivalent in-stock items
    - Catches price surges and adapts proposals
    """
    def find_in_stock_alternative(self, out_of_stock_item: Product, max_budget: Optional[float] = None) -> Optional[Product]:
        """
        Find best matching alternative product in same category with available stock.
        """
        all_products = catalog_service.list_all()
        candidates = [
            p for p in all_products
            if p.category == out_of_stock_item.category
            and p.stock > 0
            and p.id != out_of_stock_item.id
        ]
        
        if max_budget is not None:
            candidates = [p for p in candidates if p.price <= max_budget]
            
        if not candidates:
            return None
            
        # Sort by rating descending and price proximity
        candidates.sort(key=lambda p: (p.rating, -abs(p.price - out_of_stock_item.price)), reverse=True)
        return candidates[0]

recovery_engine = AgentRecoveryEngine()
