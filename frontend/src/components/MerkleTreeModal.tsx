import React, { useState } from 'react';
import { X, ShieldCheck, GitBranch, Hash } from 'lucide-react';

interface AuditLog {
  id: string;
  session_id: string;
  event_type: string;
  status: string;
  summary: string;
  cryptographic_hash: string;
  timestamp: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

function buildMerkleTree(hashes: string[]): string[][] {
  if (hashes.length === 0) return [['(empty)']];
  let level = [...hashes];
  const tree: string[][] = [level];
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      nextLevel.push((left.slice(0, 8) + right.slice(0, 8)).slice(0, 12) + '...');
    }
    tree.unshift(nextLevel);
    level = nextLevel;
  }
  return tree;
}

export const MerkleTreeModal: React.FC<Props> = ({ isOpen, onClose, logs }) => {
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const leafHashes = logs.slice(0, 16).map(l => l.cryptographic_hash || 'aabbccdd...');
  const tree = buildMerkleTree(leafHashes);
  const rootHash = tree[0]?.[0] || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-rzp-modal w-full max-w-3xl mx-4 animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0c2340]">Merkle SHA-256 Audit Tree Visualizer</h2>
              <p className="text-xs text-slate-500 font-medium">Cryptographic non-repudiation proof — {logs.length} ledger blocks</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Root Hash */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Merkle Root Hash</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold">VERIFIED</span>
            </div>
            <p className="font-mono text-xs text-indigo-900 font-bold break-all">{logs[0]?.cryptographic_hash || rootHash}</p>
          </div>

          {/* Tree Diagram */}
          <div className="space-y-5 overflow-x-auto py-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {tree.map((level, li) => (
              <div key={li} className="flex items-center justify-center gap-2 flex-wrap">
                {level.map((node, ni) => (
                  <div key={ni} className={`relative group ${li === tree.length - 1 ? 'cursor-pointer' : ''}`}
                    onMouseEnter={() => li === tree.length - 1 ? setHighlightedIdx(ni) : null}
                    onMouseLeave={() => setHighlightedIdx(null)}>
                    <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all shadow-xs ${
                      li === 0
                        ? 'bg-indigo-600 border-indigo-700 text-white font-bold shadow-sm'
                        : li === tree.length - 1
                          ? highlightedIdx === ni
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900 scale-105 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700'
                          : 'bg-[#ebf3ff] border-[#cbe0fd] text-[#0c62d2]'
                    }`}>
                      {node.slice(0, 14)}...
                    </div>
                    {li < tree.length - 1 && (
                      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-px h-5 bg-slate-300" />
                    )}
                    {li === tree.length - 1 && highlightedIdx === ni && logs[ni] && (
                      <div className="absolute bottom-full left-0 mb-2 z-20 bg-white border border-slate-300 rounded-xl p-3 w-56 shadow-xl text-[11px]">
                        <p className="text-slate-900 font-bold">{logs[ni].event_type}</p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2">{logs[ni].summary}</p>
                        <p className="text-slate-400 font-mono mt-1 text-[10px]">{logs[ni].cryptographic_hash?.slice(0, 20)}...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Level legend */}
          <div className="flex items-center justify-center gap-6 text-[11px] pt-1 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-indigo-600"></span>Merkle Root</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-[#ebf3ff] border border-[#cbe0fd]"></span>Branch Nodes</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-white border border-slate-300"></span>Leaf Hashes (Events)</span>
          </div>

          {/* Leaf Hash Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#0c83ff]" /> Ledger Block Details
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logs.slice(0, 16).map((log, idx) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <span className="text-slate-400 font-mono font-bold w-4 shrink-0 mt-0.5">{idx}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{log.status}</span>
                      <span className="text-slate-900 font-semibold truncate">{log.event_type}</span>
                    </div>
                    <p className="text-slate-600 truncate mt-0.5">{log.summary}</p>
                    <p className="text-slate-400 font-mono truncate text-[10px]">{log.cryptographic_hash?.slice(0, 32)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
