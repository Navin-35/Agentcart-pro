import React, { useRef, useEffect, useState } from 'react';
import { Terminal, CheckCircle, Sparkles, ChevronDown, ChevronRight, CreditCard, PackageCheck, ShieldCheck } from 'lucide-react';
import { AgentStep } from '../types';

interface Props {
  steps: AgentStep[];
  activeSessionId: string;
  onOpenRazorpayCheckout?: (checkoutOptions: any) => void;
  onApproveHitl?: () => void;
}

export const AgentReasoningStream: React.FC<Props> = ({
  steps,
  activeSessionId,
  onOpenRazorpayCheckout,
  onApproveHitl
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const toggleExpand = (stepNumber: number) => {
    setExpandedSteps(prev => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  return (
    <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col overflow-hidden shadow-rzp-card min-h-[380px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="h-4 w-4 text-[#0c83ff]" /> Live Agent Reasoning Trace
        </span>
        {activeSessionId && (
          <span className="font-mono text-[10px] font-semibold text-[#0c62d2] bg-[#ebf3ff] border border-[#cbe0fd] px-2 py-0.5 rounded-md shadow-xs">
            {activeSessionId}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1 text-xs">
        {steps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
            <div className="h-12 w-12 rounded-2xl bg-[#ebf3ff] text-[#0c83ff] flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-bold text-[#0c2340]">Agent is standing by</p>
            <p className="text-[11px] max-w-xs mt-1 text-slate-500">
              Submit a purchase goal to watch autonomous tool execution, price verification, and Razorpay rails settlement in real time.
            </p>
          </div>
        ) : (
          steps.map((step, idx) => {
            const hasData = step.data && Object.keys(step.data).length > 0;
            const isExpanded = !!expandedSteps[step.step_number];

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all shadow-xs ${
                  step.status === 'SUCCESS' ? 'bg-emerald-50/40 border-emerald-200' :
                  step.status === 'REJECTED' ? 'bg-rose-50/40 border-rose-200' :
                  step.status === 'PENDING_APPROVAL' ? 'bg-amber-50/50 border-amber-200' :
                  step.status === 'RECOVERING' ? 'bg-purple-50/40 border-purple-200' :
                  'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">#{step.step_number}</span>
                    <span className="font-bold text-slate-900">{step.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-md ${
                    step.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    step.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    step.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    step.status === 'RECOVERING' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    'bg-[#ebf3ff] text-[#0c62d2] border border-[#cbe0fd]'
                  }`}>
                    {step.status}
                  </span>
                </div>
                
                <p className="text-slate-700 leading-relaxed font-sans text-xs">{step.thought}</p>

                {/* Multi-Item Breakdown if present */}
                {step.data?.items && (
                  <div className="mt-2.5 space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-[#0c2340] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <PackageCheck className="h-4 w-4 text-[#0c83ff]" /> Verified Itemized Basket
                      </span>
                      {step.data.discount_amount > 0 && (
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Coupon {step.data.promo_code}: -₹{step.data.discount_amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-100 pt-1">
                      {step.data.items.map((it: any, i: number) => (
                        <div key={i} className="py-1.5 flex items-center justify-between text-[11px] text-slate-700">
                          <span className="font-medium">{it.quantity}x {it.name}</span>
                          <span className="font-mono font-bold text-slate-900">₹{(it.unit_price * it.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Human Approval Action Banner */}
                {step.status === 'PENDING_APPROVAL' && onApproveHitl && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="text-xs text-amber-900">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>⚠️</span> Human Approval Required (₹{step.data?.verification?.verified_total?.toLocaleString('en-IN') || '11,494'})
                      </p>
                      <p className="text-[10px] text-amber-800 font-mono mt-0.5">Approval ID: {step.data?.approval_id || 'appr_pending'}</p>
                    </div>
                    <button
                      onClick={onApproveHitl}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Authorize &amp; Settle</span>
                    </button>
                  </div>
                )}

                {/* Order & Settlement Payload Info */}
                {step.data?.order && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#ebf3ff]/80 border border-[#cbe0fd] font-mono text-[11px] space-y-1.5 shadow-xs">
                    <div className="text-[#0c2340] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[#0c62d2]">
                        <CheckCircle className="h-4 w-4 text-emerald-600" /> Razorpay Order: {step.data.order.id}
                      </span>
                      <span className="text-emerald-700 font-bold text-xs">
                        ₹{step.data.verified_total?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {step.data.settlement && (
                      <div className="text-slate-600 text-[10px] space-y-0.5 border-t border-[#cbe0fd]/60 pt-1.5">
                        <div>Settlement ID: <span className="text-[#0c62d2] font-semibold">{step.data.settlement.razorpay_payment_id}</span></div>
                        <div className="truncate text-slate-500">Signature: {step.data.settlement.razorpay_signature}</div>
                      </div>
                    )}

                    {/* Interactive Razorpay Checkout Button */}
                    {step.data.checkout_options && onOpenRazorpayCheckout && (
                      <button
                        onClick={() => onOpenRazorpayCheckout(step.data.checkout_options)}
                        className="mt-2 w-full py-2 px-3 rounded-lg bg-[#0c83ff] hover:bg-[#0062d2] text-white flex items-center justify-center space-x-1.5 text-xs font-sans font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Launch Razorpay Standard Checkout (UPI/Test Card)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Expandable JSON Data Inspector */}
                {hasData && (
                  <div className="mt-2 pt-1">
                    <button
                      onClick={() => toggleExpand(step.step_number)}
                      className="text-[10px] text-slate-500 hover:text-[#0c83ff] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span>{isExpanded ? "Hide raw payload" : "Inspect action payload"}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-1.5 p-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-40">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
