from typing import List, Optional, Dict, Any
from app.domain.catalog import Product, CatalogQuery

# Realistic Tech/Developer Hardware & Enterprise Pantry Catalog
DEFAULT_INVENTORY: List[Product] = [
    Product(
        id="prod_usb_c_hub_01",
        name="Anker 7-in-1 USB-C Hub (4K HDMI, 100W PD, SD Reader)",
        category="accessories",
        description="High-speed USB-C multi-port adapter with 4K@60Hz HDMI, 100W Power Delivery pass-through, dual USB 3.0 ports.",
        price=2499.0,
        stock=25,
        specs={"ports": 7, "power_delivery_watts": 100, "hdmi_res": "4K@60Hz", "warranty_months": 18},
        rating=4.8,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Anker India Official",
        merchant_trust_score=0.99
    ),
    Product(
        id="prod_hdmi_cable_4k",
        name="Ultra High Speed 4K@60Hz HDMI 2.1 Braided Cable (2M)",
        category="cables",
        description="Heavy duty braided 4K/8K HDR HDMI cable for monitors, dev workstations, and presentation displays.",
        price=799.0,
        stock=40,
        specs={"length_meters": 2, "bandwidth_gbps": 48, "connector": "Gold Plated HDMI 2.1"},
        rating=4.7,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="CableTech Pro",
        merchant_trust_score=0.98
    ),
    Product(
        id="prod_mx_master_3s",
        name="Logitech MX Master 3S Wireless Performance Mouse",
        category="peripherals",
        description="Quiet click ergonomic wireless mouse with 8K DPI sensor, MagSpeed electromagnetic scrolling, and dual connectivity.",
        price=8995.0,
        stock=12,
        specs={"dpi": 8000, "connectivity": "Bluetooth / Logi Bolt", "battery_life_days": 70},
        rating=4.9,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Logitech Authorized Store",
        merchant_trust_score=0.99
    ),
    Product(
        id="prod_mech_keyboard_k2",
        name="Keychron K2 V2 Wireless Mechanical Keyboard (Gateron Brown)",
        category="peripherals",
        description="75% compact Bluetooth mechanical keyboard with Mac & Windows layout support and hot-swappable switches.",
        price=6499.0,
        stock=15,
        specs={"switches": "Gateron Brown", "layout": "75%", "backlight": "RGB", "battery_mah": 4000},
        rating=4.8,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Keychron India",
        merchant_trust_score=0.97
    ),
    Product(
        id="prod_coffee_beans_1kg",
        name="Blue Tokai Attikan Estate Dark Roast Coffee Beans (1kg)",
        category="pantry",
        description="Freshly roasted specialty arabica whole beans with tasting notes of dark chocolate and roasted almond.",
        price=1450.0,
        stock=30,
        specs={"roast": "Dark", "origin": "Biligirirangan Hills", "grind": "Whole Beans", "weight_kg": 1.0},
        rating=4.9,
        merchant_id="merchant_rzp_food_02",
        merchant_name="Blue Tokai Direct",
        merchant_trust_score=0.99
    ),
    Product(
        id="prod_macbook_charger_100w",
        name="GaN 100W Fast Charger with Dual USB-C & USB-A",
        category="accessories",
        description="Compact GaN III fast charger suitable for MacBook Pro 16, Dell XPS, iPad Pro, and fast charging Android phones.",
        price=2999.0,
        stock=20,
        specs={"technology": "GaN III", "total_output_watts": 100, "ports": 3},
        rating=4.6,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="PowerVolt Store",
        merchant_trust_score=0.96
    ),
    Product(
        id="prod_budget_ergonomic_mouse",
        name="Portronics Toad One Ergonomic Wireless Mouse",
        category="peripherals",
        description="Budget-friendly vertical optical mouse with adjustable DPI and silent click mechanisms.",
        price=699.0,
        stock=50,
        specs={"dpi": 1600, "connectivity": "2.4GHz Wireless", "ergonomic": True},
        rating=4.2,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Portronics India",
        merchant_trust_score=0.95
    ),
    Product(
        id="prod_thunderbolt4_cable",
        name="Thunderbolt 4 / USB4 40Gbps 240W Fast Charging Braided Cable (1.2M)",
        category="cables",
        description="Ultra-high-speed 40Gbps data transfer, 8K video output, and 240W EPR fast charging for MacBook and ThinkPad.",
        price=1899.0,
        stock=35,
        specs={"bandwidth_gbps": 40, "power_watts": 240, "video_res": "8K@60Hz", "length_meters": 1.2},
        rating=4.9,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="CableTech Pro",
        merchant_trust_score=0.98
    ),
    Product(
        id="prod_samsung_t7_1tb",
        name="Samsung T7 Shield 1TB Rugged Portable NVMe SSD (USB 3.2 Gen 2)",
        category="storage",
        description="Rugged water/dust resistant external SSD with up to 1,050 MB/s read speeds and hardware encryption.",
        price=7899.0,
        stock=22,
        specs={"capacity": "1TB", "speed_mbps": 1050, "interface": "USB-C 3.2 Gen 2", "ip_rating": "IP65"},
        rating=4.9,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Samsung Memory Direct",
        merchant_trust_score=0.99
    ),
    Product(
        id="prod_benq_screenbar",
        name="BenQ ScreenBar Plus Auto-Dimming LED e-Reading Monitor Lamp",
        category="workspace",
        description="Precision desk lamp with zero-screen-glare optical design and desktop dial controller for eye comfort.",
        price=2999.0,
        stock=18,
        specs={"power_source": "USB-A", "auto_dimming": True, "color_temp_k": "2700K-6500K"},
        rating=4.8,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="BenQ India Store",
        merchant_trust_score=0.97
    ),
    Product(
        id="prod_sony_wh1000xm5",
        name="Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        category="audio",
        description="Industry leading active noise cancellation with 8 microphones, 30hr battery life, and LDAC high-res audio.",
        price=9990.0,
        stock=8,
        specs={"anc": True, "battery_hours": 30, "codec": "LDAC / AAC / SBC", "driver_mm": 30},
        rating=4.9,
        merchant_id="merchant_rzp_tech_01",
        merchant_name="Sony Authorized Direct",
        merchant_trust_score=0.99
    )
]

# Verified Promo / Coupon Directory for Autonomous Agent Negotiation
PROMO_CODES: Dict[str, Dict[str, Any]] = {
    "AGENTCART10": {"discount_percent": 10.0, "max_discount": 1000.0, "min_order": 1000.0, "description": "10% off Autonomous Commerce Debut"},
    "DEVPROMO15": {"discount_percent": 15.0, "max_discount": 1500.0, "min_order": 2500.0, "description": "15% Developer Tools Discount"},
    "FREESHIP": {"discount_percent": 0.0, "fixed_discount": 150.0, "min_order": 500.0, "description": "Free Express Priority Shipping"}
}

class MerchantCatalogService:
    def __init__(self):
        self.products: Dict[str, Product] = {p.id: p.model_copy() for p in DEFAULT_INVENTORY}

    def reset_catalog(self) -> None:
        """Reset all products to their default prices and stock."""
        self.products = {p.id: p.model_copy() for p in DEFAULT_INVENTORY}

    def list_all(self) -> List[Product]:
        return list(self.products.values())

    def get_by_id(self, product_id: str) -> Optional[Product]:
        return self.products.get(product_id)

    def search(self, query: CatalogQuery) -> List[Product]:
        results = []
        q = (query.query or "").lower().strip()
        
        for p in self.products.values():
            # In stock filter
            if query.in_stock_only and p.stock <= 0:
                continue
                
            # Category filter
            if query.category and query.category.lower() != "all":
                if p.category.lower() != query.category.lower():
                    continue
                    
            # Price filter
            if query.max_price is not None and p.price > query.max_price:
                continue
                
            # Keyword search across name, description, category, merchant, and specs
            if q:
                specs_str = " ".join([f"{k}:{v}" for k, v in p.specs.items()]).lower()
                searchable_text = f"{p.name} {p.description} {p.category} {p.merchant_name} {specs_str}".lower()
                tokens = q.split()
                if not all(t in searchable_text for t in tokens):
                    continue
                    
            results.append(p)
            if len(results) >= query.limit:
                break
                
        return results

    # Chaos Injection Hooks (For verifying resiliency, fail-safes, and anti-hallucination)
    def simulate_price_surge(self, product_id: str, new_price: float) -> bool:
        if product_id in self.products:
            self.products[product_id].price = new_price
            return True
        return False

    def simulate_stock_depletion(self, product_id: str) -> bool:
        if product_id in self.products:
            self.products[product_id].stock = 0
            return True
        return False

    def get_multi_merchant_quotes(self, product_id: str) -> List[Dict[str, Any]]:
        """
        Generate competitive live quotes from multiple certified Razorpay merchants for a given product.
        Simulates Agent-to-Agent (A2A) MCP merchant discovery.
        """
        product = self.get_by_id(product_id)
        if not product:
            return []

        base_price = product.price
        quotes = [
            {
                "merchant_id": product.merchant_id,
                "merchant_name": product.merchant_name,
                "product_id": product.id,
                "unit_price": base_price,
                "stock": product.stock,
                "delivery_days": 1,
                "shipping_fee": 0.0,
                "trust_score": product.merchant_trust_score,
                "rating": product.rating,
                "recommended": True,
                "fulfillment_badge": "Razorpay Instant Rails"
            },
            {
                "merchant_id": "merchant_prime_hub_02",
                "merchant_name": f"PrimeTech Direct ({product.category.capitalize()})",
                "product_id": product.id,
                "unit_price": round(base_price * 1.04, 2),
                "stock": max(10, product.stock + 5),
                "delivery_days": 2,
                "shipping_fee": 49.0,
                "trust_score": 0.95,
                "rating": 4.6,
                "recommended": False,
                "fulfillment_badge": "Standard Priority"
            },
            {
                "merchant_id": "merchant_express_b2b_03",
                "merchant_name": "Enterprise Bulk Supply Co.",
                "product_id": product.id,
                "unit_price": round(base_price * 0.98, 2),
                "stock": max(15, product.stock + 10),
                "delivery_days": 3,
                "shipping_fee": 99.0,
                "trust_score": 0.96,
                "rating": 4.5,
                "recommended": False,
                "fulfillment_badge": "B2B Freight"
            }
        ]
        return quotes

    def validate_promo_code(self, code: Optional[str], subtotal: float) -> Dict[str, Any]:
        """Validate coupon code and compute deterministic discount."""
        if not code:
            return {"valid": False, "discount": 0.0, "reason": "No code provided"}
        
        normalized = code.strip().upper()
        if normalized not in PROMO_CODES:
            return {"valid": False, "discount": 0.0, "reason": f"Coupon '{code}' is invalid or expired"}
        
        promo = PROMO_CODES[normalized]
        if subtotal < promo.get("min_order", 0.0):
            min_req = promo.get("min_order", 0.0)
            return {"valid": False, "discount": 0.0, "reason": f"Minimum order of ₹{min_req:,.2f} required for coupon {normalized}"}
        
        discount = 0.0
        if "fixed_discount" in promo:
            discount = promo["fixed_discount"]
        elif "discount_percent" in promo:
            discount = (subtotal * promo["discount_percent"]) / 100.0
            if "max_discount" in promo:
                discount = min(discount, promo["max_discount"])
                
        return {
            "valid": True,
            "promo_code": normalized,
            "discount": round(discount, 2),
            "description": promo.get("description", "")
        }

catalog_service = MerchantCatalogService()
