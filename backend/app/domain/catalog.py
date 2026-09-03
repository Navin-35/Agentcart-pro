from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class Product(BaseModel):
    id: str = Field(..., description="Unique product identifier")
    name: str = Field(..., description="Full commercial product name")
    category: str = Field(..., description="Category: accessories, cables, peripherals, pantry")
    description: str = Field(..., description="Technical and marketing description")
    price: float = Field(..., gt=0, description="Price in INR")
    stock: int = Field(..., ge=0, description="Available units in merchant inventory")
    specs: Dict[str, Any] = Field(default_factory=dict, description="Structured specifications")
    rating: float = Field(default=4.5, ge=1.0, le=5.0, description="Product rating")
    image_url: Optional[str] = Field(default=None, description="Product image asset URL")
    merchant_id: str = Field(default="merchant_rzp_tech_01", description="Merchant account ID on Razorpay")
    merchant_name: str = Field(default="CloudGear Technologies", description="Merchant store brand")
    merchant_trust_score: float = Field(default=0.98, ge=0.0, le=1.0, description="Reputation score for policy gate")

class CatalogQuery(BaseModel):
    query: Optional[str] = Field(default=None, description="Free-form search text or keywords")
    category: Optional[str] = Field(default=None, description="Filter by category")
    max_price: Optional[float] = Field(default=None, description="Maximum budget per item")
    in_stock_only: bool = Field(default=False, description="Filter out stockout items")
    limit: int = Field(default=10, ge=1, le=50, description="Max products to return")

class PriceSurgeRequest(BaseModel):
    product_id: str
    new_price: float

class StockDepleteRequest(BaseModel):
    product_id: str
