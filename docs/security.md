# AgentCart — Security Model & Threat Defense

## Security Principles

1. **Zero-Trust LLM Operations**: The generative model has zero financial authority. Price calculations, stock availability, and policy checks are executed deterministically on the backend.
2. **Server-Owned HITL Approval Tokens**: Human-in-the-Loop approval transfers *only* a server-generated `approval_id` and `session_id`. The client is incapable of tampering with amount, item count, or merchant recipient during approval.
3. **Persistent Replay Protection**: Idempotency keys are derived from `HMAC-SHA256(secret, session_id + merchant_id + amount + items)` and stored in an indexed SQLite database with unique constraints. Replays fail even across process restarts.
4. **Tamper-Evident Spend Mandates**: User spending grants are signed with HMAC-SHA256. If any parameter (limit, category whitelist, expiration) is altered, signature verification immediately fails.
5. **Cryptographically Chained Audit Ledger**: Every transaction state transition is linked to the previous block's SHA-256 hash in Merkle-tree style, providing non-repudiation.

---

## Threat Matrix & Mitigation

| Threat | Vector | AgentCart Mitigation |
|---|---|---|
| **Price Hallucination** | LLM claims product costs ₹100 instead of ₹10,000 | Policy Engine re-fetches price directly from database and overwrites proposal prior to math check. |
| **Client-Side Amount Tampering** | Malicious user intercepts `/approve-hitl` and changes amount to ₹1 | Client sends only `approval_id`. Server retrieves stored proposal & amount from database. |
| **Approval Replay / Double-Spend** | Re-sending an approval token to trigger multiple charges | State machine locks transaction to `AUTHORIZED`/`PAID`, rejecting repeated transitions (HTTP 409). |
| **Payment Order Replay** | Replaying payment requests after server reboot | Persistent SQLite idempotency table rejects duplicate keys regardless of server restart. |
| **Excessive Agent Spending** | Prompt injection inducing agent to over-purchase | Mandate limits (per-transaction, daily cap, auto-approve threshold) enforced before payment rails can be called. |
| **Untrusted Merchant Fraud** | Agent ordering from low-reputation or fraudulent seller | Policy Engine rejects any vendor with trust score < `min_merchant_trust`. |
| **Audit Ledger Tampering** | Modifying historical transaction logs in SQLite | `verify_chain` checks all SHA-256 block links from genesis block forward. Any edit invalidates downstream hashes. |
