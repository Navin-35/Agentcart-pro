export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  specs: Record<string, any>;
  rating: number;
  image_url?: string;
  merchant_id: string;
  merchant_name: string;
  merchant_trust_score: number;
}

export interface AgentStep {
  step_number: number;
  title: string;
  thought: string;
  action: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECOVERING' | 'PENDING_APPROVAL' | 'SUCCESS' | 'REJECTED' | 'ERROR';
  data?: any;
}

export interface AuditLog {
  id: string;
  session_id: string;
  timestamp: string;
  event_type: string;
  status: string;
  summary: string;
  details: Record<string, any>;
  previous_hash: string;
  cryptographic_hash: string;
}

export interface PolicyConfig {
  max_single_transaction_limit: number;
  auto_approve_limit: number;
  allowed_categories: string[];
  require_human_approval_always: boolean;
  enforce_stock_check: boolean;
  min_merchant_trust_score: number;
}

/**
 * Secure HITL pending state.
 * NOTE: The frontend NEVER holds verifiedTotal from the server —
 * instead it holds the server-issued approval_id and fetches details from the backend.
 */
export interface HitlPendingState {
  sessionId: string;
  approvalId: string;          // Server-issued — never client-generated
  proposal: any;               // Display-only copy from the SSE stream
  verifiedTotal: number;       // Display-only copy from the SSE stream
}

export interface PolicyCheckResult {
  name: string;
  passed: boolean;
  label: string;
  detail: string;
}

export interface PolicyDecisionCard {
  session_id: string;
  checks: PolicyCheckResult[];
  final_decision: 'AUTO_APPROVED' | 'HITL_REQUIRED' | 'REJECTED';
  decision_reason: string;
  verified_total: number;
  auto_approve_ceiling: number;
  per_tx_limit: number;
  daily_limit: number;
  daily_spent: number;
  mandate_id: string;
  idempotency_key: string;
}

export interface AgentSpendMandate {
  mandate_id: string;
  per_transaction_limit: number;
  daily_limit: number;
  auto_approve_ceiling: number;
  allowed_categories: string[];
  blocked_categories: string[];
  min_merchant_trust: number;
  require_human_always: boolean;
  expires_at: number | null;
  signature: string;
  created_at: number;
  is_active: boolean;
}

export interface TransactionHistory {
  from_state: string | null;
  to_state: string;
  timestamp: number;
  note: string;
}

export interface Transaction {
  tx_id: string;
  session_id: string;
  state: string;
  intent: string;
  amount: number | null;
  approval_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: number;
  updated_at: number;
  failure_reason: string | null;
  history: TransactionHistory[];
}

export interface RazorpayStatus {
  status: string;
  mock_mode: boolean;
  key_id: string;
  key_id_masked: string;
  has_secret: boolean;
  live_client_ready: boolean;
  settlement_rail: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  is_mock?: boolean;
}
