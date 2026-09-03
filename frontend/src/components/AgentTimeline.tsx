import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock, ShieldCheck, XCircle, Activity } from 'lucide-react';
import { AgentStep } from '../types';

interface Props {
  steps: AgentStep[];
  isRunning: boolean;
}

const STATE_COLORS: Record<string, string> = {
  IN_PROGRESS:      'text-[#0c62d2] border-blue-200 bg-blue-50/60',
  COMPLETED:        'text-emerald-700 border-emerald-200 bg-emerald-50/60',
  SUCCESS:          'text-emerald-700 border-emerald-200 bg-emerald-50/60',
  PENDING_APPROVAL: 'text-amber-800 border-amber-200 bg-amber-50/60',
  RECOVERING:       'text-purple-700 border-purple-200 bg-purple-50/60',
  REJECTED:         'text-red-700 border-red-200 bg-red-50/60',
  ERROR:            'text-red-700 border-red-200 bg-red-50/60',
};

const StatusIcon: React.FC<{ status: string; size?: string }> = ({ status, size = 'h-3.5 w-3.5' }) => {
  switch (status) {
    case 'IN_PROGRESS':      return <Loader2 className={`${size} animate-spin text-[#0c83ff]`} />;
    case 'COMPLETED':
    case 'SUCCESS':          return <CheckCircle2 className={`${size} text-emerald-600`} />;
    case 'PENDING_APPROVAL': return <Clock className={`${size} text-amber-600`} />;
    case 'RECOVERING':       return <Activity className={`${size} text-purple-600`} />;
    case 'REJECTED':         return <XCircle className={`${size} text-red-600`} />;
    case 'ERROR':            return <AlertCircle className={`${size} text-red-600`} />;
    default:                  return <ShieldCheck className={`${size} text-slate-400`} />;
  }
};

const TIMELINE_STATES = [
  'INTENT',
  'DISCOVERY',
  'QUOTED',
  'VERIFY',
  'AUTH',
  'SETTLE',
  'PAID',
];

function mapStepToState(step: AgentStep): string {
  const action = step.action?.toLowerCase() || '';
  const title = step.title?.toLowerCase() || '';
  if (action.includes('parse_intent') || title.includes('decomposition')) return 'INTENT';
  if (action.includes('search') || title.includes('catalog') || title.includes('discovery')) return 'DISCOVERY';
  if (action.includes('quote') || action.includes('select') || action.includes('comparison')) return 'QUOTED';
  if (action.includes('guardrail') || action.includes('policy') || action.includes('verify')) return 'VERIFY';
  if (step.status === 'PENDING_APPROVAL') return 'AUTH';
  if (action.includes('razorpay') || action.includes('payment') || action.includes('create')) return 'SETTLE';
  if (action.includes('fulfilled') || action.includes('success') || step.status === 'SUCCESS') return 'PAID';
  return '';
}

export const AgentTimeline: React.FC<Props> = ({ steps, isRunning }) => {
  if (steps.length === 0) return null;

  const lastStep = steps[steps.length - 1];
  const currentState = mapStepToState(lastStep);
  const currentIdx = TIMELINE_STATES.indexOf(currentState);
  const isHITL = lastStep.status === 'PENDING_APPROVAL';
  const isFailed = lastStep.status === 'REJECTED' || lastStep.status === 'ERROR';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-rzp-card">
      {/* Transaction flow header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#0c83ff]" /> Transaction Pipeline
        </span>
        {isRunning && (
          <span className="flex items-center gap-1 text-[11px] text-[#0c62d2] font-semibold bg-[#ebf3ff] px-2 py-0.5 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </span>
        )}
      </div>

      {/* State machine progress */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {TIMELINE_STATES.map((state, i) => {
          const isDone = currentIdx > i && !isFailed;
          const isCurrent = currentIdx === i;
          return (
            <React.Fragment key={state}>
              <div className={`flex flex-col items-center min-w-[48px] ${
                isDone || isCurrent ? 'opacity-100' : 'opacity-40'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  isDone ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : isCurrent && isRunning ? 'bg-[#0c83ff] border-[#0c83ff] text-white animate-pulse shadow-xs'
                  : isCurrent ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-[8px] mt-1 text-center font-semibold uppercase tracking-tight max-w-[48px] ${
                  isDone ? 'text-emerald-700' : isCurrent ? 'text-[#0c83ff]' : 'text-slate-400'
                }`}>
                  {state}
                </span>
              </div>
              {i < TIMELINE_STATES.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-[8px] transition-all ${
                  isDone ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
        {isHITL && (
          <>
            <div className="flex-1 h-0.5 bg-amber-400 min-w-[8px]" />
            <div className="flex flex-col items-center min-w-[48px]">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500 border border-amber-600 text-white animate-pulse">
                <Clock className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[8px] text-amber-700 mt-1 text-center font-bold uppercase">HITL</span>
            </div>
          </>
        )}
      </div>

      {/* Step log */}
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-xl px-2.5 py-1.5 border text-[11px] transition-all shadow-xs ${STATE_COLORS[step.status] || 'text-slate-600 border-slate-200 bg-slate-50'}`}
          >
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={step.status} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[11px] leading-tight truncate">{step.title}</div>
              <div className="text-[10px] opacity-80 leading-tight mt-0.5 line-clamp-2">{step.thought}</div>
            </div>
            <span className="text-[9px] font-mono opacity-50 shrink-0">#{step.step_number}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
