import os
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "AgentCart — Trustworthy Autonomous Commerce Agent"
    VERSION: str = "2.1.0"
    API_V1_PREFIX: str = "/api/v1"

    # Razorpay Test Credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TVQr6C3It4AWiR")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_MOCK_MODE: bool = os.getenv("RAZORPAY_MOCK_MODE", "false").lower() == "true"

    # Security — never hardcode in source; always read from env
    AP2_MANDATE_SECRET: str = os.getenv("AP2_MANDATE_SECRET", "dev_mandate_secret_change_in_production")

    # CORS — wildcard is demo-only; restrict in production via this env var
    # Example: ALLOWED_ORIGINS=http://localhost:3000,https://agentcart.example.com
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: os.getenv("ALLOWED_ORIGINS", "*").split(",")
    )

    # Financial Policy Defaults (in INR)
    DEFAULT_MAX_TRANSACTION_LIMIT: float = 20000.0  # Hard ceiling
    DEFAULT_AUTO_APPROVE_LIMIT: float = 3000.0      # UAP-style autonomous ceiling
    DEFAULT_DAILY_LIMIT: float = 30000.0            # Daily spend cap
    ALLOWED_CATEGORIES: List[str] = Field(default_factory=lambda: [
        "accessories", "cables", "peripherals", "pantry", "audio", "storage", "workspace"
    ])

    # SQLite Database Paths
    AUDIT_DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "audit_ledger.db")
    IDEMPOTENCY_DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "idempotency.db")
    TRANSACTIONS_DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "transactions.db")
    MANDATE_DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "mandates.db")

settings = Settings()
