import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ShieldCheck, Tag, ShoppingCart, Loader2, Lock } from 'lucide-react';
import { HitlPendingState } from '../types';
import { api } from '../services/api';

interface Props {
  pendingHitl: HitlPendingState | null;
  autoApproveLimit: number;
  onApprove: () => void;
  onReject: () => void;
}

export const HitlApprovalModal: React.FC<Props> = ({
  pendingHitl,
  autoApproveLimit,
  onApprove,
  onReject
}) => {
  const [serverDetails, setServerDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pendingHitl?.approvalId) return;
    setLoading(true);
    api.getApprovalDetails(pendingHitl.approvalId)
      .then(d => { setServerDetails(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [pendingHitl?.approvalId]);

  if (!pendingHitl) return null;

  const displayAmount = serverDetails?.amount ?? pendingHitl.verifiedTotal;
  const items = pendingHitl.proposal?.items || [];
  const discount = pendingHitl.proposal?.discount_amount || 0;
  const promoCode = pendingHitl.proposal?.promo_code;

  return (
    <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 shadow-lg mb-4 animate-fadeIn">
      <div className="flex items-center justify-between text-amber-900 mb-2 pb-2 border-b border-amber-200">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-sm">Human-in-the-Loop Sign-off Required</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-amber-800" />
          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-900 border border-amber-300">
            Razorpay HITL Gate
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-700 mb-2 leading-relaxed">
        Order total (<strong className="text-slate-900 font-bold">₹{displayAmount.toLocaleString('en-IN')}</strong>) exceeds the autonomous pre-authorization
        ceiling of <strong className="text-slate-900 font-bold">₹{autoApproveLimit.toLocaleString('en-IN')}</strong>. Explicit human sign-off required before settling on Razorpay rails.
      </p>

      {/* Server-verified badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3 text-emerald-700" />
          {loading ? 'Fetching server-verified details...' : `Approval ID: ${pendingHitl.approvalId.slice(0, 20)}…`}
        </span>
        {serverDetails && (
          <span className="text-[10px] font-bold text-emerald-700">✓ Server-Verified</span>
        )}
      </div>

      {/* Itemized Table */}
      <div className="bg-white rounded-xl p-3.5 mb-3.5 border border-slate-200 text-xs space-y-2 font-sans shadow-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1.5 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5 text-[#0c83ff]" /> Line Items ({items.length})
          </span>
          <span>Verified Subtotal</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            <span className="text-[11px] text-slate-500 ml-2">Loading server-verified proposal…</span>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 divide-y divide-slate-50">
            {items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-slate-800 text-[11px] pt-1">
                <span className="truncate pr-2 font-medium">{it.quantity}x {it.name}</span>
                <span className="font-mono font-bold text-slate-900 shrink-0">₹{(it.unit_price * it.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-emerald-700 text-[11px] pt-1.5 border-t border-slate-100 font-semibold">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> Applied Coupon ({promoCode})
            </span>
            <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between font-extrabold text-[#0c2340] text-sm pt-2 border-t border-slate-200">
          <span>Net Verified Total:</span>
          <span className="text-emerald-700 font-mono">₹{displayAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Security note */}
      <p className="text-[10px] text-slate-500 mb-3 font-mono">
        ⚡ Approving transmits only your cryptographically signed session token. No payment amount is trusted from the client.
      </p>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Authorize &amp; Settle on Razorpay</span>
        </button>
        <button
          onClick={onReject}
          className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};
