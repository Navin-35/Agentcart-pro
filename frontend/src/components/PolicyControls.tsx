import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PolicyConfig } from '../types';

interface Props {
  policy: PolicyConfig;
  onUpdatePolicy: (newPolicy: PolicyConfig) => void;
}

export const PolicyControls: React.FC<Props> = ({ policy, onUpdatePolicy }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-rzp-card">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          Deterministic Policy Guardrails
        </span>
        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Security Gate
        </span>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Autonomous Pre-Auth Limit */}
        <div>
          <div className="flex justify-between text-slate-600 mb-1.5 font-medium">
            <span>Autonomous Pre-Auth Limit (UAP):</span>
            <span className="font-bold text-[#0c2340] font-mono text-sm">₹{policy.auto_approve_limit.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={500}
            max={6000}
            step={500}
            value={policy.auto_approve_limit}
            onChange={(e) => onUpdatePolicy({ ...policy, auto_approve_limit: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Hard Spending Ceiling */}
        <div>
          <div className="flex justify-between text-slate-600 mb-1.5 font-medium">
            <span>Hard Spending Ceiling (Max Allowed):</span>
            <span className="font-bold text-[#0c2340] font-mono text-sm">₹{policy.max_single_transaction_limit.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={5000}
            max={25000}
            step={1000}
            value={policy.max_single_transaction_limit}
            onChange={(e) => onUpdatePolicy({ ...policy, max_single_transaction_limit: Number(e.target.value) })}
            className="w-full accent-[#0c83ff] cursor-pointer"
          />
        </div>

        {/* Enforce HITL Toggle */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
          <label htmlFor="hitl-toggle" className="cursor-pointer">
            Always Require Human Sign-off
          </label>
          <input
            id="hitl-toggle"
            type="checkbox"
            checked={policy.require_human_approval_always}
            onChange={(e) => onUpdatePolicy({ ...policy, require_human_approval_always: e.target.checked })}
            className="accent-[#0c83ff] cursor-pointer h-4 w-4 rounded"
          />
        </div>
      </div>
    </div>
  );
};
