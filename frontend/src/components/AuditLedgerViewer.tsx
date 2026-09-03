import React from 'react';
import { FileText, ShieldCheck, Trash2 } from 'lucide-react';
import { AuditLog } from '../types';

interface Props {
  logs: AuditLog[];
  isChainIntact: boolean;
  onVerifyChain: () => void;
  onClear: () => void;
}

export const AuditLedgerViewer: React.FC<Props> = ({
  logs,
  isChainIntact,
  onVerifyChain,
  onClear
}) => {
  return (
    <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col overflow-hidden shadow-rzp-card min-h-[300px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider">
            Audit Ledger
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isChainIntact ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {isChainIntact ? 'CHAIN INTACT ✓' : 'TAMPER DETECTED ✗'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onVerifyChain}
            className="text-[11px] font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verify SHA-256</span>
          </button>
          <button
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            title="Clear audit ledger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-xs font-medium">No audit events recorded yet.</p>
        ) : (
          logs.slice(0, 30).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-[11px] space-y-1 hover:bg-white transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{log.event_type}</span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    log.status === 'SUCCESS' ? 'text-emerald-800 bg-emerald-100 border border-emerald-200' :
                    log.status === 'REJECTED' ? 'text-rose-800 bg-rose-100 border border-rose-200' :
                    log.status === 'PENDING_APPROVAL' ? 'text-amber-900 bg-amber-100 border border-amber-200' :
                    log.status === 'WARNING' ? 'text-amber-900 bg-amber-100 border border-amber-200' :
                    'text-[#0c62d2] bg-blue-50 border border-blue-200'
                  }`}
                >
                  {log.status}
                </span>
              </div>
              <p className="text-slate-600 font-sans leading-relaxed">{log.summary}</p>
              <div className="text-[9px] font-mono text-slate-400 truncate pt-0.5">
                HASH: {log.cryptographic_hash}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
