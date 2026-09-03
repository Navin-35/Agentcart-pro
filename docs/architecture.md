# AgentCart — System Architecture

## Overview & Core Philosophy

**AgentCart** is a trustworthy autonomous commerce agent with policy-controlled payments.

> **Fundamental Principle:** *The LLM agent proposes; deterministic systems authorize.*

The agent is never trusted for financial math, budget ceilings, price consistency, merchant trustworthiness, or duplicate prevention. All money movements require passage through the deterministic Policy Engine and Spend Mandate check.

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

## Component Architecture

### 1. Agent Layer (`app/agent`)
- **`reasoner.py`**: Executes an iterative reasoning stream (SSE). Decomposes user goal, calls MCP catalog tools, handles out-of-stock recovery, and formats candidate `OrderProposal`s.
- **`tools.py`**: Defines strictly scoped tool APIs with permission tiers (`OPEN`, `RESTRICTED`, `HIGHLY_RESTRICTED`). Payment and checkout functions are purposefully *not* callable by the agent directly.
- **`recovery.py`**: Heuristic fallback engine to find alternatives when items are unavailable.

### 2. Policy Engine & Mandate System (`app/services`)
- **`mandate_service.py`**: Manages the user's cryptographic `AgentSpendMandate` (HMAC-SHA256 signed). Enforces per-transaction limits, daily budgets, whitelisted/blacklisted categories, merchant trust scores, and expiry timestamps.
- **`policy_engine.py`**: Authoritative gate. Re-queries live database for prices and stock (overwriting any LLM hallucinations), generates invariant mathematical proofs (`Paise_Total == SUM(Unit_Paise * Qty) - Discount + Tax`), checks idempotency, and routes to either autonomous execution or HITL gating.
- **`transaction_store.py`**: SQLite-backed finite state machine tracking transactions through discrete states (`INTENT_RECEIVED` → `DISCOVERING` → `QUOTED` → `VERIFYING` → `AWAITING_APPROVAL` → `AUTHORIZED` → `PAYMENT_PENDING` → `PAID`).

### 3. Security & Idempotency Layer (`app/core`, `app/services`)
- **`idempotency_service.py`**: Persistent SQLite-backed store preventing replay attacks across server restarts.
- **`security.py`**: HMAC-SHA256 signature helpers for mandate verification and Razorpay payment signatures.

### 4. Payments & Rails (`app/services/razorpay_service.py`)
- Seamless integration with Razorpay Order creation, server-side signature verification, and mock fallback rails.

### 5. Audit & Non-Repudiation (`app/services/audit_service.py`)
- Append-only hash-chained ledger storing cryptographic SHA-256 blocks for every event. Chain verification detects any database tampering.
