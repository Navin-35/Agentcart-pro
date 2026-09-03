import React, { useEffect, useState } from 'react';
import { BookLock, RefreshCw, CheckCircle2, AlertCircle, Loader2, Tags } from 'lucide-react';
import { AgentSpendMandate } from '../types';
import { api } from '../services/api';

interface Props {
  onMandateUpdated?: (mandate: AgentSpendMandate) => void;
}

export const SpendMandatePanel: React.FC<Props> = ({ onMandateUpdated }) => {
  const [mandate, setMandate] = useState<AgentSpendMandate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local edit state
  const [perTx, setPerTx] = useState(5000);
  const [daily, setDaily] = useState(15000);
  const [autoApprove, setAutoApprove] = useState(3000);
  const [requireHuman, setRequireHuman] = useState(false);

  useEffect(() => {
    fetchMandate();
  }, []);

  const fetchMandate = async () => {
    setLoading(true);
    try {
      const m = await api.getMandate();
      setMandate(m);
      setPerTx(m.per_transaction_limit);
      setDaily(m.daily_limit);
      setAutoApprove(m.auto_approve_ceiling);
      setRequireHuman(m.require_human_always);
    } catch (e) {
      console.error('Failed to fetch mandate', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.setMandate({
        per_transaction_limit: perTx,
        daily_limit: daily,
        auto_approve_ceiling: autoApprove,
        require_human_always: requireHuman,
        allowed_categories: mandate?.allowed_categories || [],
        blocked_categories: mandate?.blocked_categories || [],
        min_merchant_trust: mandate?.min_merchant_trust || 0.85,
      });
      if (result.mandate) {
        setMandate(result.mandate);
        onMandateUpdated?.(result.mandate);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to save mandate', e);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-rzp-card">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookLock className="h-3.5 w-3.5" />
          </div>
          Agent Spend Mandate (AP2)
        </span>
        <button
          onClick={fetchMandate}
          disabled={loading}
          className="text-slate-400 hover:text-[#0c83ff] transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh mandate"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 text-[#0c83ff] animate-spin" />
        </div>
      ) : (
        <div className="space-y-3.5 text-xs">
          {/* Mandate ID badge */}
          {mandate && (
            <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Mandate Token</span>
                <span className="text-[10px] font-mono font-bold text-purple-700 truncate max-w-[160px]">
                  {mandate.mandate_id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {mandate.is_active
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  : <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                }
                <span className="text-[10px] font-medium text-slate-600">
                  {mandate.is_active ? 'Active & Signed' : 'Inactive'}
                  {mandate.expires_at ? ` · Expires ${new Date(mandate.expires_at * 1000).toLocaleDateString()}` : ' · Standing Token'}
                </span>
              </div>
            </div>
          )}

          {/* Per-tx limit */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1 font-medium">
              <span>Per-Transaction Limit:</span>
              <span className="font-bold text-[#0c2340] font-mono text-sm">₹{perTx.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" min={1000} max={20000} step={500}
              value={perTx}
              onChange={e => setPerTx(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Auto-approve ceiling */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1 font-medium">
              <span>Auto-Approve Ceiling:</span>
              <span className="font-bold text-[#0c2340] font-mono text-sm">₹{autoApprove.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" min={500} max={6000} step={500}
              value={autoApprove}
              onChange={e => setAutoApprove(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Daily limit */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1 font-medium">
              <span>Daily Spend Limit:</span>
              <span className="font-bold text-[#0c2340] font-mono text-sm">₹{daily.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" min={5000} max={50000} step={1000}
              value={daily}
              onChange={e => setDaily(Number(e.target.value))}
              className="w-full accent-[#0c83ff] cursor-pointer"
            />
          </div>

          {/* Allowed categories */}
          {mandate?.allowed_categories && mandate.allowed_categories.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 mb-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <Tags className="h-3 w-3" /> Allowed Whitelist Categories
              </div>
              <div className="flex flex-wrap gap-1">
                {mandate.allowed_categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HITL always toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
            <span>Always Require Human Sign-off</span>
            <input
              type="checkbox"
              checked={requireHuman}
              onChange={e => setRequireHuman(e.target.checked)}
              className="accent-[#0c83ff] cursor-pointer h-4 w-4 rounded"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0c83ff] hover:bg-[#0062d2] text-white shadow-sm'
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookLock className="h-4 w-4" />}
            {saved ? 'Mandate Signed & Saved' : saving ? 'Signing mandate…' : 'Sign & Apply Mandate Token'}
          </button>

          {mandate && (
            <p className="text-[10px] text-slate-400 text-center font-mono">
              Sig: {mandate.signature.slice(0, 24)}…
            </p>
          )}
        </div>
      )}
    </div>
  );
};
