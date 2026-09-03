import React, { useState, useRef, useCallback } from 'react';
import { Bot, Play, RefreshCw, Sparkles, Tag, Mic, MicOff, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Props {
  goal: string;
  setGoal: (g: string) => void;
  maxBudget: number;
  setMaxBudget: (b: number) => void;
  isRunning: boolean;
  onExecute: (customGoal?: string, customBudget?: number) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'unsupported';

export const AgentCommandCenter: React.FC<Props> = ({
  goal,
  setGoal,
  maxBudget,
  setMaxBudget,
  isRunning,
  onExecute
}) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
      ? 'idle'
      : 'unsupported'
  );
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const insertPromo = (code: string) => {
    if (!goal.includes(code)) {
      setGoal(`${goal.trim()} with coupon ${code}`);
    }
  };

  const startVoiceInput = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
      setVoiceStatus('idle');
      setInterimText('');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setVoiceStatus('listening');
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);
      if (final) {
        setGoal(final.trim());
        setInterimText('');
      }
    };

    recognition.onend = () => {
      setVoiceStatus('idle');
      setInterimText('');
    };

    recognition.onerror = (event: any) => {
      console.warn('Voice error:', event.error);
      setVoiceStatus('idle');
      setInterimText('');
    };

    recognition.start();
  }, [voiceStatus, setGoal]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-rzp-card hover:shadow-rzp transition-shadow">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#ebf3ff] text-[#0c83ff] flex items-center justify-center">
            <Bot className="h-3.5 w-3.5" />
          </div>
          AI Buyer Agent Command Center
        </span>
        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" /> High-Accuracy Reasoner
        </span>
      </div>

      {/* Goal Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Purchase Intent / Natural Language Prompt
          </label>
          <div className="relative">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={
                voiceStatus === 'listening'
                  ? '🎤 Speak your purchase goal now...'
                  : 'e.g. Buy 2 braided 4K HDMI cables and 1 Keychron mechanical keyboard under ₹8,000 with coupon AGENTCART10...'
              }
              rows={3}
              className={`w-full bg-slate-50/70 border rounded-xl p-3 pr-12 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-all resize-none font-sans leading-relaxed ${
                voiceStatus === 'listening'
                  ? 'border-red-400 ring-2 ring-red-400/20'
                  : 'border-slate-200 focus:border-[#0c83ff] focus:ring-3 focus:ring-[#0c83ff]/10'
              }`}
            />
            {/* Voice Mic Button */}
            {voiceStatus !== 'unsupported' && (
              <button
                type="button"
                onClick={startVoiceInput}
                title={voiceStatus === 'listening' ? 'Stop recording' : 'Speak your goal (Voice Delegation)'}
                className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-all cursor-pointer ${
                  voiceStatus === 'listening'
                    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                    : 'bg-white border border-slate-200 text-slate-500 hover:text-[#0c83ff] hover:border-[#0c83ff]/50 shadow-xs'
                }`}
              >
                {voiceStatus === 'listening' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Voice status banner */}
        {voiceStatus === 'listening' && (
          <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 animate-fadeIn">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Listening… <em className="text-slate-600 not-italic font-medium">{interimText || 'Speak your purchase request'}</em></span>
          </div>
        )}
        {voiceStatus === 'unsupported' && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md border border-amber-200">
            <AlertCircle className="h-3 w-3" /> Voice input not supported in this browser
          </div>
        )}

        {/* Promo Code Quick Chips */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
          <Tag className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">Active Promos:</span>
          <button
            type="button"
            onClick={() => insertPromo("AGENTCART10")}
            className="px-2 py-0.5 rounded-md bg-[#ebf3ff] hover:bg-[#d5e6fe] text-[#0c62d2] border border-[#cbe0fd] transition-colors font-mono font-semibold cursor-pointer shadow-xs"
          >
            AGENTCART10 (-10%)
          </button>
          <button
            type="button"
            onClick={() => insertPromo("DEVPROMO15")}
            className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors font-mono font-semibold cursor-pointer shadow-xs"
          >
            DEVPROMO15 (-15%)
          </button>
        </div>

        {/* Budget Cap Slider */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          <label className="flex items-center space-x-1.5">
            <span className="font-medium">User Budget Cap:</span>
            <span className="font-bold text-[#0c2340] font-mono text-sm">₹{maxBudget.toLocaleString('en-IN')}</span>
          </label>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            className="w-32 sm:w-40 accent-[#0c83ff] cursor-pointer"
          />
        </div>

        {/* Submit Execution Button */}
        <button
          onClick={() => onExecute()}
          disabled={isRunning || !goal.trim()}
          className="w-full py-2.5 px-4 bg-[#0c83ff] hover:bg-[#0062d2] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-[#0c83ff]/20 transition-all cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Agent Reasoning on Razorpay Rails...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white text-white" />
              <span>Execute Autonomous Purchase</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Evaluation Scenarios */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Evaluation Scenarios &amp; Live Demos:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              const g = "Buy 2 braided 4K HDMI cables for developer workstation";
              setGoal(g);
              setMaxBudget(3000);
              onExecute(g, 3000);
            }}
            className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700 block mb-0.5">Scenario 1: Pre-Auth</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-normal">Autonomous (under ₹3k limit)</span>
          </button>

          <button
            onClick={() => {
              const g = "Buy 2 braided 4K HDMI cables and 1 Keychron K2 mechanical keyboard with brown switches";
              setGoal(g);
              setMaxBudget(9000);
              onExecute(g, 9000);
            }}
            className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 block mb-0.5">Scenario 2: HITL Gate</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-amber-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-normal">Multi-item compound sign-off</span>
          </button>

          <button
            onClick={() => {
              const g = "Restock 2kg dark roast specialty coffee beans and 1 100W GaN fast charger with coupon AGENTCART10";
              setGoal(g);
              setMaxBudget(6000);
              onExecute(g, 6000);
            }}
            className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0c62d2] block mb-0.5">Scenario 3: Promo Rails</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-[#0c83ff]" />
            </div>
            <span className="text-[11px] text-slate-500 font-normal">Verified discount calculation</span>
          </button>

          <button
            onClick={() => {
              const g = "Order 2 Sony WH-1000XM5 headphones";
              setGoal(g);
              setMaxBudget(25000);
              onExecute(g, 25000);
            }}
            className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-700 block mb-0.5">Scenario 4: Hard Ceiling</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-rose-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-normal">Spending limit rejection (&gt; ₹20k)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
