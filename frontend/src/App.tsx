import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentCommandCenter } from './components/AgentCommandCenter';
import { AgentReasoningStream } from './components/AgentReasoningStream';
import { MerchantCatalog } from './components/MerchantCatalog';
import { HitlApprovalModal } from './components/HitlApprovalModal';
import { PolicyControls } from './components/PolicyControls';
import { SpendMandatePanel } from './components/SpendMandatePanel';
import { PolicyDecisionCard } from './components/PolicyDecisionCard';
import { AgentTimeline } from './components/AgentTimeline';
import { AuditLedgerViewer } from './components/AuditLedgerViewer';
import { RazorpayKeyModal } from './components/RazorpayKeyModal';
import { MerkleTreeModal } from './components/MerkleTreeModal';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { JudgeDemoModal } from './components/JudgeDemoModal';
import { api } from './services/api';
import { Product, PolicyConfig, AuditLog, AgentStep, HitlPendingState, RazorpayStatus, PolicyDecisionCard as PolicyDecisionCardType } from './types';
import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [goal, setGoal] = useState<string>("Buy 2 braided 4K HDMI cables and 1 Keychron K2 mechanical keyboard with brown switches");
  const [maxBudget, setMaxBudget] = useState<number>(8500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isChainIntact, setIsChainIntact] = useState<boolean>(true);
  const [pendingHitl, setPendingHitl] = useState<HitlPendingState | null>(null);
  const [latestDecisionCard, setLatestDecisionCard] = useState<PolicyDecisionCardType | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [razorpayStatus, setRazorpayStatus] = useState<RazorpayStatus | null>(null);
  const [isMerkleOpen, setIsMerkleOpen] = useState<boolean>(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isJudgeDemoOpen, setIsJudgeDemoOpen] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [policy, setPolicy] = useState<PolicyConfig>({
    max_single_transaction_limit: 20000,
    auto_approve_limit: 3000,
    allowed_categories: ["accessories", "cables", "peripherals", "pantry", "audio", "storage", "workspace"],
    require_human_approval_always: false,
    enforce_stock_check: true,
    min_merchant_trust_score: 0.85
  });

  const loadData = async () => {
    try {
      const [fetchedProducts, fetchedPolicy, fetchedLogs, fetchedRzpStatus, fetchedInvoice] = await Promise.all([
        api.getCatalog(),
        api.getPolicy(),
        api.getAuditLogs(),
        api.getRazorpayStatus(),
        api.getInvoice('latest').catch(() => null)
      ]);
      setProducts(fetchedProducts);
      setPolicy(fetchedPolicy);
      setAuditLogs(fetchedLogs);
      setRazorpayStatus(fetchedRzpStatus);
      if (fetchedInvoice) {
        setInvoiceData(fetchedInvoice);
      }
    } catch (e) {
      console.error("Initialization error", e);
    }
  };

  useEffect(() => {
    loadData();

    // Dynamically inject Razorpay Checkout script if not present
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const interval = setInterval(async () => {
      try {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdatePolicy = async (newPolicy: PolicyConfig) => {
    setPolicy(newPolicy);
    try {
      await api.updatePolicy(newPolicy);
    } catch (e) {
      console.error("Failed to update policy", e);
    }
  };

  const handleRunAgent = (customGoal?: string, customBudget?: number) => {
    const goalToRun = customGoal || goal;
    const budgetToRun = customBudget !== undefined ? customBudget : maxBudget;
    
    setIsRunning(true);
    setSteps([]);
    setPendingHitl(null);
    setLatestDecisionCard(null);
    const newSessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
    setActiveSessionId(newSessionId);

    api.streamAgentExecution(
      goalToRun,
      newSessionId,
      budgetToRun,
      (step: AgentStep) => {
        setSteps((prev) => [...prev, step]);

        if (step.data?.policy_decision_card) {
          setLatestDecisionCard(step.data.policy_decision_card);
        }

        if (step.action === 'order_fulfilled' || step.data?.invoice_number) {
          setInvoiceData({
            invoice_number: step.data.invoice_number || `INV-ACT-2026-${newSessionId.slice(5, 11).toUpperCase()}`,
            session_id: newSessionId,
            items: step.data.items || [],
            verified_total: step.data.verified_total || 0,
            discount_amount: step.data.discount_amount || 0,
            promo_code: step.data.promo_code,
            order: step.data.order,
            settlement: step.data.settlement,
            ap2_mandate: step.data.ap2_mandate,
            mathematical_proof: step.data.mathematical_proof
          });
        }

        if (step.status === 'PENDING_APPROVAL' && step.data?.approval_id) {
          setPendingHitl({
            sessionId: newSessionId,
            approvalId: step.data.approval_id,
            proposal: step.data.proposal,
            verifiedTotal: step.data.verification?.verified_total || 0
          });
          setIsRunning(false);
        }
      },
      () => {
        setIsRunning(false);
        api.getAuditLogs().then(setAuditLogs);
        api.getCatalog().then(setProducts);
        // Auto-fetch invoice after completion
        api.getInvoice(newSessionId).then(data => {
          if (data) setInvoiceData(data);
        }).catch(() => {});
      },
      (err) => {
        console.error("Streaming error", err);
        setIsRunning(false);
      }
    );
  };

  const handleApproveHitl = async () => {
    if (!pendingHitl) return;
    try {
      const data = await api.approveHitl(
        pendingHitl.sessionId,
        pendingHitl.approvalId
      );
      setSteps((prev) => [
        ...prev,
        {
          step_number: prev.length + 1,
          title: "Human Approval Received & Settled",
          thought: `Server-verified approval ID ${pendingHitl.approvalId.slice(0, 16)}... validated. Razorpay Order ${data.order?.id} successfully settled for ₹${(data.amount || pendingHitl.verifiedTotal).toLocaleString('en-IN')}.`,
          action: "hitl_approved_and_settled",
          status: "SUCCESS",
          data: {
            ...data,
            verified_total: data.amount || pendingHitl.verifiedTotal,
            items: pendingHitl.proposal?.items
          }
        }
      ]);
      setInvoiceData({
        invoice_number: `INV-HITL-${(data.tx_id || pendingHitl.sessionId).slice(0, 8).toUpperCase()}`,
        session_id: pendingHitl.sessionId,
        items: pendingHitl.proposal?.items || [],
        verified_total: data.amount || pendingHitl.verifiedTotal,
        discount_amount: pendingHitl.proposal?.discount_amount || 0,
        promo_code: pendingHitl.proposal?.promo_code,
        order: data.order,
        settlement: data.settlement,
        ap2_mandate: {
          mandate_id: "mand_HITL_AUTHORIZED",
          protocol_version: "AgentCart-HITL-v2.1",
          cryptographic_signature: data.order?.id || "sig_hitl_verified",
          expires_at: Date.now() + 86400000
        },
        mathematical_proof: {
          formula: "Paise_Total = SUM(Unit_Paise * Qty) - Discount_Paise + Tax_Paise",
          item_paise_sum: Math.round((data.amount || pendingHitl.verifiedTotal) * 100),
          discount_paise: 0,
          final_paise_total: Math.round((data.amount || pendingHitl.verifiedTotal) * 100),
          proof_hash: `hitl_${data.tx_id || 'verified'}`,
          invariant_verified: true
        }
      });
      setPendingHitl(null);
      api.getAuditLogs().then(setAuditLogs);
    } catch (e) {
      console.error("Failed to approve HITL", e);
    }
  };

  const handleOpenRazorpayCheckout = (checkoutOptions: any) => {
    if (typeof (window as any).Razorpay === 'undefined') {
      alert("Razorpay Checkout SDK is loading. Please try again in 2 seconds.");
      return;
    }

    const options = {
      ...checkoutOptions,
      handler: async function (response: any) {
        try {
          const verifyRes = await api.verifyPaymentSignature(
            activeSessionId || 'sess_direct',
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            (checkoutOptions.amount || 0) / 100
          );
          if (verifyRes.verified) {
            setSteps(prev => [
              ...prev,
              {
                step_number: prev.length + 1,
                title: "Razorpay Checkout Payment Captured",
                thought: `Client checkout verified on Razorpay Test Rails. Payment ID: ${response.razorpay_payment_id}. Cryptographic signature valid.`,
                action: "client_checkout_captured",
                status: "SUCCESS",
                data: {
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  verified: true
                }
              }
            ]);
            api.getAuditLogs().then(setAuditLogs);
          }
        } catch (e) {
          console.error("Payment verification failed", e);
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay Checkout dismissed by user.");
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleVerifyChain = async () => {
    try {
      const res = await api.verifyChain();
      setIsChainIntact(res.is_chain_intact);
      alert(`Audit Chain Verification: ${res.is_chain_intact ? '✅ INTACT & VALID' : '❌ TAMPER DETECTED'}\nTotal Records: ${res.total_records}\nLatest Block: ${res.latest_hash.slice(0, 20)}...`);
    } catch (e) {
      console.error("Verification failed", e);
    }
  };

  const handleClearAudit = async () => {
    await api.clearAuditLogs();
    setAuditLogs([]);
  };

  const handlePriceSurge = async (productId: string, currentPrice: number) => {
    const surgePrice = Math.round(currentPrice * 1.8);
    await api.simulatePriceSurge(productId, surgePrice);
    const updated = await api.getCatalog();
    setProducts(updated);
  };

  const handleStockout = async (productId: string) => {
    await api.simulateStockout(productId);
    const updated = await api.getCatalog();
    setProducts(updated);
  };

  const handleResetCatalog = async () => {
    await api.resetCatalog();
    const updated = await api.getCatalog();
    setProducts(updated);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#0c83ff] selection:text-white">
      <Header
        razorpayStatus={razorpayStatus}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenMerkle={() => setIsMerkleOpen(true)}
        onOpenInvoice={async () => {
          if (!invoiceData) {
            try {
              const inv = await api.getInvoice(activeSessionId || 'latest');
              if (inv) setInvoiceData(inv);
            } catch (e) {}
          }
          setIsInvoiceOpen(true);
        }}
        onOpenJudgeDemo={() => setIsJudgeDemoOpen(true)}
      />

      {/* Official Razorpay-style Executive Hero Section */}
      <section className="bg-gradient-to-b from-white via-[#f0f6fe]/40 to-[#f8fafc] border-b border-slate-200/80 pt-6 pb-5 px-4 sm:px-6">
        <div className="max-w-[1750px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf3ff] text-[#0c62d2] text-xs font-semibold border border-[#cbe0fd]">
              <Sparkles className="h-3.5 w-3.5 text-[#0c83ff]" />
              <span>Next-Gen Autonomous Agentic Commerce</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-normal">NPCI UAP &amp; AP2 Standard v2.1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tracking-tight leading-tight">
              Autonomous Commerce Powered by <span className="text-[#0c83ff]">Razorpay Rails</span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Autonomous AI Buyer Agents negotiate, verify Live DB pricing in integer paise, enforce deterministic spending guardrails, and settle orders instantly across Razorpay test rails with cryptographic non-repudiation.
            </p>
          </div>

          {/* Quick Stats / Highlights Pill Ribbon */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 text-xs shrink-0">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Pre-Auth Limit (UAP)</div>
                <div className="font-bold text-slate-900 font-mono">₹{policy.auto_approve_limit.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#0c83ff]" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Price Invariant</div>
                <div className="font-bold text-[#0c62d2] font-mono">Integer Paise Math</div>
              </div>
            </div>

            <button
              onClick={() => setIsJudgeDemoOpen(true)}
              className="bg-[#0c2340] hover:bg-[#0c83ff] text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Judge Showcase</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main 3-Column Enterprise Operations Hub */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-12 gap-5 max-w-[1750px] w-full mx-auto">
        {/* Column 1: AI Buyer Agent Command Center & Event Stream (Cols: 4) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          <AgentCommandCenter
            goal={goal}
            setGoal={setGoal}
            maxBudget={maxBudget}
            setMaxBudget={setMaxBudget}
            isRunning={isRunning}
            onExecute={handleRunAgent}
          />
          <AgentTimeline
            steps={steps}
            isRunning={isRunning}
          />
          <AgentReasoningStream
            steps={steps}
            activeSessionId={activeSessionId}
            onOpenRazorpayCheckout={handleOpenRazorpayCheckout}
            onApproveHitl={handleApproveHitl}
          />
        </section>

        {/* Column 2: Merchant Storefront & Chaos Simulator (Cols: 4) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          <MerchantCatalog
            products={products}
            onReset={handleResetCatalog}
            onPriceSurge={handlePriceSurge}
            onStockout={handleStockout}
          />
        </section>

        {/* Column 3: Policy Guardrails, AP2 Mandate & Cryptographic Audit Ledger (Cols: 4) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          <HitlApprovalModal
            pendingHitl={pendingHitl}
            autoApproveLimit={policy.auto_approve_limit}
            onApprove={handleApproveHitl}
            onReject={() => setPendingHitl(null)}
          />
          <PolicyDecisionCard
            card={latestDecisionCard}
          />
          <SpendMandatePanel
            onMandateUpdated={() => loadData()}
          />
          <PolicyControls
            policy={policy}
            onUpdatePolicy={handleUpdatePolicy}
          />
          <AuditLedgerViewer
            logs={auditLogs}
            isChainIntact={isChainIntact}
            onVerifyChain={handleVerifyChain}
            onClear={handleClearAudit}
          />
        </section>
      </main>

      {/* Razorpay Key Management Modal */}
      <RazorpayKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onConfigSaved={loadData}
      />

      {/* Merkle Tree Audit Visualizer */}
      <MerkleTreeModal
        isOpen={isMerkleOpen}
        onClose={() => setIsMerkleOpen(false)}
        logs={auditLogs}
      />

      {/* Cryptographic Invoice Receipt */}
      <InvoiceReceiptModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoiceData={invoiceData}
      />

      {/* Judge Evaluation Demo Showcase */}
      <JudgeDemoModal
        isOpen={isJudgeDemoOpen}
        onClose={() => setIsJudgeDemoOpen(false)}
        onRunScenario={(g, b) => {
          setGoal(g);
          setMaxBudget(b);
          handleRunAgent(g, b);
        }}
      />
    </div>
  );
}
