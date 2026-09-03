import { Product, PolicyConfig, AuditLog, AgentStep, AgentSpendMandate, Transaction } from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Catalog
  async getCatalog(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/catalog`);
    const data = await res.json();
    return data.products || [];
  },

  async simulatePriceSurge(productId: string, newPrice: number): Promise<void> {
    await fetch(`${API_BASE}/catalog/simulate-price-surge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, new_price: newPrice })
    });
  },

  async simulateStockout(productId: string): Promise<void> {
    await fetch(`${API_BASE}/catalog/simulate-stockout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId })
    });
  },

  async resetCatalog(): Promise<void> {
    await fetch(`${API_BASE}/catalog/reset`, { method: 'POST' });
  },

  // Policy Guardrails
  async getPolicy(): Promise<PolicyConfig> {
    const res = await fetch(`${API_BASE}/policy`);
    return await res.json();
  },

  async updatePolicy(policy: PolicyConfig): Promise<void> {
    await fetch(`${API_BASE}/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
  },

  // Audit Logs
  async getAuditLogs(sessionId?: string): Promise<AuditLog[]> {
    const url = sessionId
      ? `${API_BASE}/audit/logs?session_id=${sessionId}`
      : `${API_BASE}/audit/logs?limit=50`;
    const res = await fetch(url);
    const data = await res.json();
    return data.logs || [];
  },

  async verifyChain(): Promise<{ is_chain_intact: boolean; latest_hash: string; total_records: number }> {
    const res = await fetch(`${API_BASE}/audit/verify-chain`);
    return await res.json();
  },

  async clearAuditLogs(): Promise<void> {
    await fetch(`${API_BASE}/audit/clear`, { method: 'POST' });
  },

  /**
   * Secure HITL approval — sends ONLY session_id + approval_id.
   * The server fetches the proposal/amount from the transaction store.
   * The client does NOT send amount, product, or proposal data.
   */
  async approveHitl(sessionId: string, approvalId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/agent/approve-hitl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        approval_id: approvalId
        // NOTE: No amount or proposal fields — server fetches those server-side
      })
    });
    return await res.json();
  },

  /**
   * Fetch approval details by server-issued approval_id.
   * Used to display what the user is approving (sourced from server, not client memory).
   */
  async getApprovalDetails(approvalId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/agent/approval/${approvalId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Spend Mandate
  async getMandate(): Promise<AgentSpendMandate> {
    const res = await fetch(`${API_BASE}/agent/mandate`);
    return await res.json();
  },

  async setMandate(params: Partial<AgentSpendMandate>): Promise<any> {
    const res = await fetch(`${API_BASE}/agent/mandate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  },

  // Transactions
  async getTransaction(txId: string): Promise<Transaction | null> {
    const res = await fetch(`${API_BASE}/agent/transaction/${txId}`);
    if (!res.ok) return null;
    return res.json();
  },

  async listTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/agent/transactions`);
    const data = await res.json();
    return data.transactions || [];
  },

  // Razorpay Gateway
  async getRazorpayStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/status`);
    return await res.json();
  },

  async updateRazorpayConfig(keyId: string, keySecret: string, mockMode: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key_id: keyId,
        key_secret: keySecret,
        mock_mode: mockMode
      })
    });
    return await res.json();
  },

  async testRazorpayConnection(keyId?: string, keySecret?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key_id: keyId,
        key_secret: keySecret
      })
    });
    return await res.json();
  },

  async verifyPaymentSignature(
    sessionId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    amount: number
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        amount: amount
      })
    });
    return await res.json();
  },

  // Agent SSE Streaming
  streamAgentExecution(
    goal: string,
    sessionId: string,
    maxBudget: number,
    onStep: (step: AgentStep) => void,
    onDone: () => void,
    onError: (err: any) => void
  ): () => void {
    const controller = new AbortController();

    fetch(`${API_BASE}/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: goal,
        session_id: sessionId,
        max_budget: maxBudget
      }),
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                onDone();
                return;
              }
              try {
                const step: AgentStep = JSON.parse(dataStr);
                onStep(step);
              } catch (e) {
                console.error('Parse error', e);
              }
            }
          }
        }
        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err);
        }
      });

    return () => controller.abort();
  },

  // Invoice
  async getInvoice(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/agent/invoice/${sessionId}`);
    if (!res.ok) return null;
    return res.json();
  }
};
