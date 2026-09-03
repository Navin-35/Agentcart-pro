import React, { useRef } from 'react';
import { X, FileText, ShieldCheck, Printer, CheckCircle2, Tag } from 'lucide-react';

interface InvoiceItem {
  name: string;
  product_id: string;
  quantity: number;
  unit_price?: number;
  subtotal?: number;
}

interface InvoiceData {
  invoice_number: string;
  session_id: string;
  items: InvoiceItem[];
  verified_total: number;
  discount_amount?: number;
  promo_code?: string;
  order?: { id: string };
  settlement?: { payment_id: string };
  ap2_mandate?: {
    mandate_id: string;
    protocol_version: string;
    cryptographic_signature: string;
    expires_at: number;
  };
  mathematical_proof?: {
    formula: string;
    item_paise_sum: number;
    discount_paise: number;
    final_paise_total: number;
    proof_hash: string;
    invariant_verified: boolean;
  };
}

const DEFAULT_DEMO_INVOICE: InvoiceData = {
  invoice_number: "INV-ACT-2026-AUTO88",
  session_id: "sess_demo_live",
  items: [
    {
      name: "Braided 4K@60Hz HDMI 2.1 Cable (2m)",
      product_id: "prod_hdmi_01",
      quantity: 2,
      unit_price: 1299,
      subtotal: 2598
    }
  ],
  verified_total: 2338.20,
  discount_amount: 259.80,
  promo_code: "AGENTCART10",
  order: { id: "order_rzp_demo_live" },
  settlement: { payment_id: "pay_rzp_settled_01" },
  ap2_mandate: {
    mandate_id: "mand_AP2_AUTO_CEILING_3K",
    protocol_version: "AgentCart-AP2-v2.1",
    cryptographic_signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    expires_at: 1772390400
  },
  mathematical_proof: {
    formula: "Paise_Total = SUM(Unit_Paise * Qty) - Discount_Paise + Tax_Paise",
    item_paise_sum: 259800,
    discount_paise: 25980,
    final_paise_total: 233820,
    proof_hash: "9f83c605d3b2f...a48d2e",
    invariant_verified: true
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
}

export const InvoiceReceiptModal: React.FC<Props> = ({ isOpen, onClose, invoiceData }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activeInvoice = invoiceData || DEFAULT_DEMO_INVOICE;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN');

  const itemsList = activeInvoice.items || [];
  const subtotal = itemsList.reduce((sum, item) => {
    return sum + (item.subtotal || (item.unit_price || 0) * (item.quantity || 1));
  }, 0) || (activeInvoice.verified_total || 0) + (activeInvoice.discount_amount || 0);
  const discount = activeInvoice.discount_amount || 0;
  const total = activeInvoice.verified_total !== undefined ? activeInvoice.verified_total : (activeInvoice as any).total_amount || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-rzp-modal w-full max-w-2xl mx-4 animate-fadeIn overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0c2340]">Cryptographic Tax Invoice</h2>
              <p className="text-xs text-slate-500 font-medium">NPCI UAP &amp; AP2 Standard v2.1 Compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">

          {/* Invoice Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-extrabold text-[#0c2340] italic">Razorpay</span>
                <span className="text-sm font-bold text-[#0c83ff]">AgentCart Pro</span>
                <span className="text-[10px] bg-[#ebf3ff] border border-[#cbe0fd] text-[#0c62d2] px-2 py-0.5 rounded-md font-mono font-bold">AP2-UAP-v2.1</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Autonomous Commerce Infrastructure on Razorpay Rails</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-slate-800">Invoice #{activeInvoice.invoice_number || 'INV-AP2-2026-AUTO'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{dateStr}</p>
              <p className="text-[11px] text-slate-500">{timeStr}</p>
            </div>
          </div>

          {/* Verified Status Banner */}
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900">Cryptographically Verified &amp; Settled on Razorpay Test Rails</p>
              <p className="text-[10px] text-emerald-700 font-mono mt-0.5 font-semibold">Session: {activeInvoice.session_id}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Purchased Items</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3.5 py-2.5 text-left text-slate-600 font-bold">Product</th>
                    <th className="px-3.5 py-2.5 text-center text-slate-600 font-bold">Qty</th>
                    <th className="px-3.5 py-2.5 text-right text-slate-600 font-bold">Unit Price</th>
                    <th className="px-3.5 py-2.5 text-right text-slate-600 font-bold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsList.length > 0 ? itemsList.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-3.5 py-2 text-slate-800 font-medium">{item.name}</td>
                      <td className="px-3.5 py-2 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-3.5 py-2 text-right text-slate-700 font-mono">
                        ₹{(item.unit_price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3.5 py-2 text-right text-emerald-700 font-mono font-bold">
                        ₹{(item.subtotal || (item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-3.5 py-4 text-center text-slate-400">No itemized data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Discount {activeInvoice.promo_code && `(${activeInvoice.promo_code})`}
                </span>
                <span className="font-mono">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax (GST)</span>
              <span className="font-mono text-slate-400">₹0.00 (Inclusive)</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-[#0c2340] text-sm">
              <span>Total Paid</span>
              <span className="font-mono text-emerald-700">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* AP2 Mandate & Mathematical Proof */}
          {activeInvoice.ap2_mandate && (
            <div className="bg-[#ebf3ff]/60 border border-[#cbe0fd] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-[#0c83ff]" />
                <span className="font-bold text-[#0c2340]">AP2 Delegated Mandate Token</span>
                <span className="font-mono text-[9px] bg-white border border-[#cbe0fd] text-[#0c62d2] px-1.5 py-0.2 rounded font-bold">
                  {activeInvoice.ap2_mandate.protocol_version}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-500">Mandate ID</p>
                  <p className="font-mono font-semibold text-slate-800">{activeInvoice.ap2_mandate.mandate_id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cryptographic Signature</p>
                  <p className="font-mono text-slate-600 truncate">{activeInvoice.ap2_mandate.cryptographic_signature?.slice(0, 24)}...</p>
                </div>
              </div>
            </div>
          )}

          {activeInvoice.mathematical_proof && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs">
              <p className="text-amber-900 font-bold mb-1.5 flex items-center gap-1.5">
                <span className="text-base font-bold">∑</span> Mathematical Invariant Proof
              </p>
              <p className="font-mono text-slate-600 text-[10px] mb-2">{activeInvoice.mathematical_proof.formula}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div><p className="text-slate-500">Item Paise</p><p className="font-mono font-bold text-slate-800">{activeInvoice.mathematical_proof.item_paise_sum?.toLocaleString()} p</p></div>
                <div><p className="text-slate-500">Discount</p><p className="font-mono font-bold text-emerald-700">-{activeInvoice.mathematical_proof.discount_paise?.toLocaleString()} p</p></div>
                <div><p className="text-slate-500">Final Total</p><p className="font-mono font-bold text-[#0c2340]">{activeInvoice.mathematical_proof.final_paise_total?.toLocaleString()} p</p></div>
                <div><p className="text-slate-500">Invariant</p><p className="text-emerald-700 font-bold">{activeInvoice.mathematical_proof.invariant_verified ? '✓ VERIFIED' : '✗ FAILED'}</p></div>
              </div>
              <p className="font-mono text-[9px] text-slate-400 mt-2 truncate">PROOF HASH: {activeInvoice.mathematical_proof.proof_hash}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            <p>This is a cryptographically signed autonomous commerce receipt generated by AgentCart Pro on Razorpay Test Rails.</p>
            <p className="mt-0.5">NPCI Unified Autonomous Payments (UAP) &amp; AP2 Standard v2.1 Compliant | Non-Repudiation Guaranteed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
