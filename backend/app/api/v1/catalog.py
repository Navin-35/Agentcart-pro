from fastapi import APIRouter, HTTPException
from app.services.catalog_service import catalog_service
from app.domain.catalog import CatalogQuery, PriceSurgeRequest, StockDepleteRequest

router = APIRouter(prefix="/catalog", tags=["Merchant Catalog"])

@router.get("")
def list_products():
    """Retrieve full merchant catalog."""
    return {"products": [p.model_dump() for p in catalog_service.list_all()]}

@router.post("/search")
def search_products(query: CatalogQuery):
    """Search catalog by text, category, and price cap."""
    results = catalog_service.search(query)
    return {"results": [p.model_dump() for p in results]}

@router.get("/{product_id}")
def get_product(product_id: str):
    """Get single product details and specs."""
    p = catalog_service.get_by_id(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p.model_dump()

# Chaos Simulation Endpoints
@router.post("/simulate-price-surge")
def simulate_price_surge(req: PriceSurgeRequest):
    """Simulate a sudden price surge by the merchant mid-transaction."""
    success = catalog_service.simulate_price_surge(req.product_id, req.new_price)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": f"Updated price of {req.product_id} to ₹{req.new_price:,.2f}"}

@router.post("/simulate-stockout")
def simulate_stockout(req: StockDepleteRequest):
    """Simulate merchant inventory stockout for a specific SKU."""
    success = catalog_service.simulate_stock_depletion(req.product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": f"Stock depleted for {req.product_id}"}

@router.post("/reset")
def reset_catalog():
    """Reset merchant inventory back to default pricing and stock."""
    catalog_service.reset_catalog()
    return {"status": "success", "message": "Catalog reset to default state"}
