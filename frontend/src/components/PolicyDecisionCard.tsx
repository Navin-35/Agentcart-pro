import React from 'react';
import { CheckCircle2, XCircle, Shield, ChevronRight, Fingerprint, TrendingUp } from 'lucide-react';
import { PolicyDecisionCard as PolicyDecisionCardType, PolicyCheckResult } from '../types';

interface Props {
  card: PolicyDecisionCardType | null;
}

const CHECK_ICONS: Record<string, string> = {
  price: '₹',
  stock: '📦',
  category: '🏷️',
  mandate: '📋',
  replay: '🔑',
  merchant_trust: '⭐',
};

const CheckRow: React.FC<{ check: PolicyCheckResult }> = ({ check }) => (
  <div className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] transition-all ${
    check.passed ? 'bg-emerald-50/70 border border-emerald-200' : 'bg-red-50/70 border border-red-200'
  }`}>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px]">{CHECK_ICONS[check.name] || '•'}</span>
      <span className={`font-semibold ${check.passed ? 'text-emerald-900' : 'text-red-900'}`}>
        {check.label}
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500 text-[10px] max-w-[160px] truncate text-right font-medium">{check.detail}</span>
      {check.passed
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        : <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
      }
    </div>
  </div>
);

export const PolicyDecisionCard: React.FC<Props> = ({ card }) => {
  if (!card) return null;

  const isApproved = card.final_decision === 'AUTO_APPROVED';
  const isHITL = card.final_decision === 'HITL_REQUIRED';

  const decisionStyle = isApproved
    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
    : isHITL
    ? 'bg-amber-500 text-white shadow-amber-500/20'
    : 'bg-rose-600 text-white shadow-rose-500/20';

  const decisionLabel = isApproved
    ? '✅ AUTONOMOUSLY AUTHORIZED'
    : isHITL
    ? '⚠️ HUMAN APPROVAL REQUIRED'
    : '❌ REJECTED';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs space-y-3 shadow-rzp-card animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-[#0c83ff]" />
          <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider">
            Deterministic Decision
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Fingerprint className="h-3 w-3 text-slate-400" />
          <span className="text-[10px] font-mono text-slate-500 font-semibold truncate max-w-[120px]">
            {card.idempotency_key.slice(0, 16)}…
          </span>
        </div>
      </div>

      {/* Per-check results */}
      <div className="space-y-1.5">
        {card.checks.map((check, i) => (
          <CheckRow key={i} check={check} />
        ))}
      </div>

      {/* Spend limits */}
      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1">
        <div className="flex items-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] text-slate-600 uppercase tracking-wide font-bold">Policy Ceiling Limits</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[9px] text-slate-500">Auto-approve ≤</div>
            <div className="text-slate-900 font-mono font-bold text-[11px]">₹{card.auto_approve_ceiling.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500">Per-tx limit</div>
            <div className="text-slate-900 font-mono font-bold text-[11px]">₹{card.per_tx_limit.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500">Daily limit</div>
            <div className="text-slate-900 font-mono font-bold text-[11px]">₹{card.daily_limit.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Final decision */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${decisionStyle} shadow-sm font-bold`}>
        <span className="text-[11px] uppercase tracking-wide">{decisionLabel}</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">₹{card.verified_total.toLocaleString('en-IN')}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-80" />
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-center font-mono">
        Mandate: {card.mandate_id.slice(0, 20)}…
      </div>
    </div>
  );
};
