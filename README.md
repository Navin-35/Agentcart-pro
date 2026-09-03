# AgentCart — Trustworthy Autonomous Commerce Agent with Policy-Controlled Payments

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Razorpay](https://img.shields.io/badge/Payment-Razorpay%20Test%20Rails-blue)](https://razorpay.com/)
[![Tests](https://img.shields.io/badge/Tests-41%20Passing-brightgreen.svg)](backend/tests/)

</div>

---

## 🎯 Positioning & Core Philosophy

**AgentCart** is an autonomous commerce agent designed around a strict security principle:

> **"The AI shopping agent proposes and plans; deterministic systems authorize."**

In autonomous commerce, large language models are valuable for natural-language intent parsing, product discovery, and negotiation. However, **LLMs must never hold unconstrained financial authority**. AgentCart enforces rigorous financial guardrails, tamper-evident spending mandates, persistent replay defense, and cryptographic auditability before any money moves.

```
Natural-Language Intent
        ↓
AI Shopping Agent (Reasoning Loop)
        ↓
Merchant Tools / MCP Discovery
        ↓
Price + Stock Verification (Live DB)
        ↓
User Spending Mandate (HMAC Signed)
        ↓
Deterministic Policy Engine & Math Proof
        ↓
Auto Approval / Human Sign-off (HITL)
        ↓
Razorpay Payment Rails (Live/Mock)
        ↓
Signature & Webhook Verification
        ↓
SHA-256 Hash-Chained Audit Ledger
```

---

## 🛡️ Key Features & Architectural Defense

### 1. Deterministic Policy Engine & Anti-Hallucination
- **Price Verification**: Overwrites any LLM-claimed prices with live database records.
- **Mathematical Invariant Proof**: Formal arithmetic guarantee (`Paise_Total = SUM(Unit_Paise * Qty) - Discount + Tax`) generating a SHA-256 proof hash.
- **Zero-Trust Boundary**: Gating logic cannot be bypassed by prompt injection or model error.

### 2. Cryptographic Spend Mandates
- Structured spending authority granted by the user (`AgentSpendMandate`).
- Defines per-transaction ceilings, daily spending limits, category whitelists, merchant trust thresholds, and expiration.
- Sealed with **HMAC-SHA256** signatures to guarantee tamper-evidence.

### 3. Secure Human-in-the-Loop (HITL) Sign-off
- When an order exceeds the autonomous pre-authorization ceiling, execution pauses and issues a server-side `approval_id`.
- The user reviews and approves via the dashboard. The approval request sends **only** the `session_id` and `approval_id` — preventing client-side amount tampering.

### 4. Persistent Replay & Idempotency Guard
- Replay attacks are prevented via HMAC-SHA256 idempotency keys backed by SQLite with unique constraints.
- Replays and duplicate orders are blocked **even across server restarts**.

### 5. Transaction State Machine
- Strict finite state machine (`INTENT_RECEIVED` → `DISCOVERING` → `QUOTED` → `VERIFYING` → `AWAITING_APPROVAL` → `AUTHORIZED` → `PAYMENT_PENDING` → `PAID`).
- Enforces linear, one-way progression with comprehensive transition logs.

### 6. Hash-Chained Audit Ledger
- Every state transition, tool call, policy evaluation, and payment settlement is recorded in a cryptographic, hash-chained ledger (`SHA-256(prev_hash | entry_data)`).
- One-click blockchain-style chain verification detects any tampering in past records.

### 7. Dual-Mode Razorpay Rails
- Live Razorpay Test API integration (Orders, Key Validation, Signature Verification).
- High-fidelity simulated test rails when credentials are not supplied, allowing end-to-end testing without external API setup.

> **Note on Standards Compliance:** AgentCart's delegated authorization token and pre-approval mechanisms are **inspired by** emerging Agentic Payment Protocols (e.g., AP2 and UAP drafts), but are implemented natively as `AgentCart-Auth-v2.1` for transparent, auditable reference architecture.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/agentcart.git
cd agentcart
cp .env.example .env
```

### 2. Run Backend
```bash
cd backend
python -m venv venv
# On Linux/macOS: source venv/bin/activate
# On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend Swagger API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run with Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Testing & Verification

Run the comprehensive pytest test suite (41 tests):
```bash
cd backend
python -m pytest tests/ -v
```

### Test Suite Highlights:
- `test_anti_hallucination.py`: Verifies live DB price overwrite and math invariant proofs.
- `test_secure_hitl.py`: Verifies server-side approval tokens, session validation, and amount-tamper resistance.
- `test_idempotency_persistent.py`: Verifies replay attack rejection surviving server restarts.
- `test_mandate.py`: Verifies spend mandate signing, limits, and expiration checks.
- `test_transaction_states.py`: Verifies state machine forward-only flow and terminal state guarantees.
- `test_audit_integrity.py`: Verifies SHA-256 Merkle/hash-chain integrity and tamper detection.

---

## 📚 Documentation
- [Architecture & Design Details](docs/architecture.md)
- [Security Model & Threat Defense](docs/security.md)

---

## 📄 License
MIT License. Created for the Razorpay Agentic AI Hackathon & Autonomous Commerce Research.
