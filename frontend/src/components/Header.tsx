import React from 'react';
import { Key, Settings, GitBranch, FileText, Zap, Headphones, ChevronDown } from 'lucide-react';
import { RazorpayStatus } from '../types';

interface Props {
  razorpayStatus?: RazorpayStatus | null;
  onOpenKeyModal?: () => void;
  onOpenMerkle?: () => void;
  onOpenInvoice?: () => void;
  onOpenJudgeDemo?: () => void;
}

export const Header: React.FC<Props> = ({
  razorpayStatus,
  onOpenKeyModal,
  onOpenMerkle,
  onOpenInvoice,
  onOpenJudgeDemo
}) => {
  const isMock = razorpayStatus?.mock_mode ?? false;
  const keyDisplay = razorpayStatus?.key_id ? `${razorpayStatus.key_id.slice(0, 12)}...` : 'rzp_test_TVQr...';

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
      {/* Official Razorpay-style Top Announcement Banner */}
      <div className="bg-[#ebf3ff] border-b border-[#d8e7fe] px-4 sm:px-8 py-1.5 text-xs text-[#0c2340] flex items-center justify-between font-medium">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-semibold text-[#0c83ff] flex items-center gap-1">
            Accept Autonomous Payments
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[11px] text-slate-700 border border-[#cbe0fd] shadow-xs">
            <span className="text-sm">🇬🇧</span> United Kingdom
          </span>
          <span className="text-slate-600 hidden md:inline">
            Global cards, Apple Pay, UPI Autopay &amp; AP2 Delegated Mandates.
          </span>
          <a
            href="https://razorpay.com"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded bg-[#0c2340] hover:bg-[#0c83ff] text-white text-[10px] font-semibold transition-colors shadow-xs ml-1"
          >
            Know More
          </a>
        </div>

        <div className="flex items-center gap-2.5 text-[11px]">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 font-mono">
            <span className="px-1.5 py-0.2 rounded bg-[#ddecfe] text-[#0c62d2] font-semibold">£</span>
            <span className="px-1.5 py-0.2 rounded bg-[#ddecfe] text-[#0c62d2] font-semibold">$</span>
            <span className="px-1.5 py-0.2 rounded bg-[#ddecfe] text-[#0c62d2] font-semibold">₹</span>
            <span className="px-1.5 py-0.2 rounded bg-[#ddecfe] text-[#0c62d2] font-semibold">€</span>
            <span className="px-1.5 py-0.2 rounded bg-[#ddecfe] text-[#0c62d2] font-semibold">A$</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Razorpay Rails: Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            {/* Razorpay iconic lightning / slash logo */}
            <div className="flex items-center gap-1.5">
              <svg className="h-6 w-6 text-[#0c83ff]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.5 2L4 14h7.5l-2 8L20 10h-7.5l2-8z" />
              </svg>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-[#0c2340] italic font-sans">
                    Razorpay
                  </span>
                  <span className="font-bold text-sm text-[#0c83ff] tracking-tight not-italic">
                    AgentCart Pro
                  </span>
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#ebf3ff] text-[#0c62d2] border border-[#cbe0fd]">
              Agentic Stack
            </span>
          </div>

          {/* Navigation Links like Razorpay.com */}
          <nav className="hidden xl:flex items-center space-x-5 text-[13px] font-medium text-slate-600">
            <span className="text-[#0c83ff] font-semibold cursor-pointer flex items-center gap-1">
              Autonomous Stack <ChevronDown className="h-3 w-3" />
            </span>
            <span className="hover:text-[#0c83ff] transition-colors cursor-pointer flex items-center gap-1">
              Payments <ChevronDown className="h-3 w-3" />
            </span>
            <span className="hover:text-[#0c83ff] transition-colors cursor-pointer flex items-center gap-1">
              Banking+ <ChevronDown className="h-3 w-3" />
            </span>
            <span className="hover:text-[#0c83ff] transition-colors cursor-pointer">Mandates (AP2)</span>
            <span className="hover:text-[#0c83ff] transition-colors cursor-pointer">Risk Guardrails</span>
            <span className="hover:text-[#0c83ff] transition-colors cursor-pointer">Audit Ledger</span>
          </nav>
        </div>

        {/* Action Controls & Navigation Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Support / Help Icon */}
          <div className="hidden lg:flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer">
            <Headphones className="h-4 w-4" />
          </div>

          {/* Currency / Region Selector */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]">
            <span>🇮🇳</span>
            <span>INR (₹)</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          {/* Judge Demo showcase */}
          <button
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold transition-all cursor-pointer shadow-xs group"
            title="Open Judge Evaluation Showcase"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Judge Demo 🏆</span>
          </button>

          {/* Merkle Audit Tree */}
          <button
            onClick={onOpenMerkle}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-medium transition-all cursor-pointer shadow-xs group"
            title="View Merkle SHA-256 Audit Tree"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Merkle Tree</span>
          </button>

          {/* Invoice Receipt */}
          <button
            onClick={onOpenInvoice}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 font-medium transition-all cursor-pointer shadow-xs group"
            title="View Cryptographic AP2 Invoice"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Invoice</span>
          </button>

          {/* Razorpay Key Settings */}
          <button
            onClick={onOpenKeyModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0c83ff] font-medium transition-all cursor-pointer shadow-xs group"
            title="Configure Razorpay Test API Key & Secrets"
          >
            <Key className="h-3.5 w-3.5 text-[#0c83ff] group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-[11px] font-semibold text-slate-800">{keyDisplay}</span>
            <span className={`h-2 w-2 rounded-full ${isMock ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <Settings className="h-3 w-3 text-slate-400 opacity-60" />
          </button>

          {/* Sign Up / Action CTA */}
          <button
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#0c83ff] hover:bg-[#0062d2] text-white text-xs font-bold transition-all shadow-sm cursor-pointer ml-1"
          >
            <span>Run Agent</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </header>
  );
};
