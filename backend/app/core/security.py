import hmac
import hashlib
import json
from typing import Any, Dict
from app.core.config import settings

def generate_sha256_hash(data: str) -> str:
    """Generate deterministic SHA-256 hex digest for any string input."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def generate_idempotency_key(session_id: str, merchant_id: str, total_amount: float, item_signatures: str) -> str:
    """
    Generate unique idempotency hash to prevent replay attacks and duplicate payment executions.
    Key is HMAC-SHA256 over: session_id + merchant_id + total_amount + item_signatures.
    """
    raw_payload = f"{session_id}:{merchant_id}:{total_amount:.2f}:{item_signatures}"
    secret = settings.AP2_MANDATE_SECRET.encode("utf-8")
    return hmac.new(secret, raw_payload.encode("utf-8"), hashlib.sha256).hexdigest()

def generate_chain_hash(previous_hash: str, entry_id: str, timestamp: str, event_type: str, status: str, summary: str, details: Dict[str, Any]) -> str:
    """
    Generate Merkle/blockchain-style chained cryptographic hash linking previous ledger entry to current.
    Format: SHA-256(previous_hash | entry_id | timestamp | event_type | status | summary | json(details))
    """
    sorted_details = json.dumps(details, sort_keys=True)
    raw_str = f"{previous_hash}|{entry_id}|{timestamp}|{event_type}|{status}|{summary}|{sorted_details}"
    return generate_sha256_hash(raw_str)

def generate_mandate_signature(payload: str) -> str:
    """
    HMAC-SHA256 signature for spend mandate tokens.
    Secret is read from settings.AP2_MANDATE_SECRET (never hardcoded).
    """
    secret = settings.AP2_MANDATE_SECRET.encode("utf-8")
    return hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_razorpay_signature(order_id: str, payment_id: str, key_secret: str) -> str:
    """Generate valid HMAC-SHA256 Razorpay test signature."""
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    secret = key_secret.encode("utf-8")
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()
