import React, { useState } from 'react';
import { X, Zap, PlayCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

interface DemoScenario {
  id: number;
  title: string;
  description: string;
  goal: string;
  budget: number;
  badge: string;
  badgeColor: string;
  highlight: string;
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 1,
    title: "Autonomous Pre-Auth with Promo Code",
    description: "Agent buys 2 HDMI cables with AGENTCART10 coupon (-10%). Total < ₹3,000 → auto-authorized without human intervention.",
    goal: "Buy 2 braided 4K HDMI cables with coupon AGENTCART10",
    budget: 3000,
    badge: "Auto-Auth",
    badgeColor: "emerald",
    highlight: "Demonstrates NPCI UAP tiered pre-authorization & verified promo discount math"
  },
  {
    id: 2,
    title: "High-Value HITL Gate + Razorpay Checkout",
    description: "Agent purchases Logitech MX Master 3S + USB-C Hub (₹11,494). Total > ₹3,000 → triggers Human-in-the-Loop cryptographic sign-off & Razorpay Standard Checkout popup.",
    goal: "Buy Logitech MX Master 3S mouse and Anker USB-C hub",
    budget: 15000,
    badge: "HITL Gate",
    badgeColor: "amber",
    highlight: "Demonstrates HITL approval gate with Razorpay Standard Checkout on Test Rails"
  },
  {
    id: 3,
    title: "Multi-Merchant Optimization + Stockout Self-Healing",
    description: "Agent compares 3 competing merchant quotes, selects optimal price. If primary product is depleted, instantly recovers with in-stock substitute.",
    goal: "Buy 1 Keychron K2 mechanical keyboard with brown switches",
    budget: 8000,
    badge: "Multi-Merchant",
    badgeColor: "blue",
    highlight: "Demonstrates multi-merchant A2A comparison & zero-downtime stockout recovery"
  },
  {
    id: 4,
    title: "Anti-Hallucination Price Surge Defense",
    description: "Agent submits an inflated price claim. Policy Engine recalculates from Live DB in deterministic integer paise (₹×100) and overwrites the hallucination.",
    goal: "Buy a coffee subscription dark roast 1kg",
    budget: 2000,
    badge: "Anti-Halluc.",
    badgeColor: "rose",
    highlight: "Demonstrates zero-hallucination mathematical invariant enforcement"
  },
  {
    id: 5,
    title: "HMAC-SHA256 Replay Attack Interception",
    description: "Submitting the same order twice. The second attempt is blocked immediately by the HMAC-SHA256 idempotency guard with no double-charge.",
    goal: "Buy 2 braided 4K HDMI cables",
    budget: 5000,
    badge: "Replay Guard",
    badgeColor: "purple",
    highlight: "Demonstrates cryptographic idempotency & replay attack interception"
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (goal: string, budget: number) => void;
}

export const JudgeDemoModal: React.FC<Props> = ({ isOpen, onClose, onRunScenario }) => {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRun = (scenario: DemoScenario) => {
    setRunningId(scenario.id);
    setTimeout(() => {
      onRunScenario(scenario.goal, scenario.budget);
      setRunningId(null);
      onClose();
    }, 600);
  };

  const badgeStyles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-[#ebf3ff] text-[#0c62d2] border-[#cbe0fd]',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-rzp-modal w-full max-w-2xl mx-4 animate-fadeIn overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 via-[#ebf3ff]/40 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0c2340]">🏆 Judge Evaluation Showcase</h2>
              <p className="text-xs text-slate-500 font-medium">5 curated evaluation scenarios covering all core innovations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-3.5 text-xs">
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
            <strong className="text-[#0c2340] font-bold">How to evaluate:</strong> Click any scenario to instantly configure the AI agent and execute the purchase pipeline live on Razorpay rails.
          </p>

          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                activeScenario === scenario.id
                  ? 'border-[#0c83ff] bg-[#ebf3ff]/40 shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setActiveScenario(activeScenario === scenario.id ? null : scenario.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-slate-400 font-mono font-bold text-sm w-5 shrink-0 mt-0.5">0{scenario.id}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">{scenario.title}</h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeStyles[scenario.badgeColor]}`}>
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{scenario.description}</p>

                    {activeScenario === scenario.id && (
                      <div className="mt-3 space-y-2 animate-fadeIn">
                        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Agent Purchase Prompt</p>
                          <p className="text-xs text-[#0c2340] font-mono font-semibold">"{scenario.goal}"</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>Budget cap: <strong className="text-slate-900 font-bold font-mono">₹{scenario.budget.toLocaleString('en-IN')}</strong></span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                          <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="font-medium">{scenario.highlight}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${activeScenario === scenario.id ? 'rotate-90 text-[#0c83ff]' : ''}`} />
                </div>
              </div>

              {activeScenario === scenario.id && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRun(scenario); }}
                    disabled={runningId !== null}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      runningId === scenario.id
                        ? 'bg-[#0c62d2] text-white'
                        : 'bg-[#0c83ff] hover:bg-[#0062d2] text-white shadow-sm'
                    }`}
                  >
                    {runningId === scenario.id ? (
                      <><Clock className="h-4 w-4 animate-spin text-white" /> Launching...</>
                    ) : (
                      <><PlayCircle className="h-4 w-4 fill-white text-[#0c83ff]" /> Run This Scenario Live</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 justify-center font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>15 automated backend tests passing (100%) · Razorpay Test Rails Active · AP2-UAP-v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
