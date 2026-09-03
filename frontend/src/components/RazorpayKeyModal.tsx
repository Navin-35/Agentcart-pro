import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { RazorpayStatus, ConnectionTestResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const RazorpayKeyModal: React.FC<Props> = ({ isOpen, onClose, onConfigSaved }) => {
  const [keyId, setKeyId] = useState<string>("rzp_test_TVQr6C3It4AWiR");
  const [keySecret, setKeySecret] = useState<string>("");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [status, setStatus] = useState<RazorpayStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const s = await api.getRazorpayStatus();
      setStatus(s);
      if (s.key_id) setKeyId(s.key_id);
      setMockMode(s.mock_mode);
    } catch (e) {
      console.error("Failed to load Razorpay status", e);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testRazorpayConnection(keyId, keySecret);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || "Failed to reach Razorpay API endpoint."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateRazorpayConfig(keyId, keySecret, mockMode);
      await loadStatus();
      onConfigSaved();
      onClose();
    } catch (e) {
      console.error("Failed to save config", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-rzp-modal overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#ebf3ff]/60 to-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#0c83ff] text-white shadow-xs">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0c2340]">Razorpay API &amp; Rails Credentials</h2>
              <p className="text-xs text-slate-500 font-medium">Manage live test credentials and settlement modes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {/* Active Status Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status?.live_client_ready ? 'bg-emerald-500 animate-pulse' : 'bg-[#0c83ff]'}`} />
              <span className="text-xs font-semibold text-slate-700">
                Mode: <strong className="text-[#0c62d2]">{mockMode ? 'Autonomous Simulation' : 'Live Razorpay Test Rails'}</strong>
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#ebf3ff] border border-[#cbe0fd] text-[#0c62d2] font-mono font-bold">
              v2.0 AP2
            </span>
          </div>

          {/* Test Key ID Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Razorpay Key ID (Test Mode)
            </label>
            <input
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-[#0c83ff] focus:ring-3 focus:ring-[#0c83ff]/10 transition-all font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your test key starting with <code className="text-[#0c62d2] font-bold">rzp_test_...</code>
            </p>
          </div>

          {/* Test Key Secret Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Razorpay Key Secret (Test Mode)
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder="Enter secret from downloaded key file..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-10 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-[#0c83ff] focus:ring-3 focus:ring-[#0c83ff]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used to create genuine orders on <code className="text-slate-700 font-semibold">api.razorpay.com</code> and verify HMAC-SHA256 signatures.
            </p>
          </div>

          {/* Mode Switch Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Force Autonomous Sandbox Simulation</p>
              <p className="text-[11px] text-slate-500">Instantly settles test transactions without requiring full secret</p>
            </div>
            <button
              type="button"
              onClick={() => setMockMode(!mockMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                mockMode ? 'bg-[#0c83ff]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mockMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Test Connection Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div>
                <p className="font-bold">{testResult.success ? 'Connected Successfully' : 'Connection Failed'}</p>
                <p className="text-[11px] opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Test Mode Hints */}
          <div className="p-3.5 rounded-xl bg-[#ebf3ff]/70 border border-[#cbe0fd] text-[11px] text-[#0c2340] space-y-1">
            <p className="font-bold flex items-center gap-1 text-[#0c62d2]">
              <ShieldCheck className="h-4 w-4 text-[#0c83ff]" /> Razorpay Test Cards &amp; UPI
            </p>
            <p>• <strong>Card:</strong> <code className="font-bold text-slate-800">4111 1111 1111 1111</code> | Exp: <code className="font-bold text-slate-800">12/28</code> | CVV: <code className="font-bold text-slate-800">123</code> | OTP: <code className="font-bold text-slate-800">123456</code></p>
            <p>• <strong>UPI:</strong> <code className="font-bold text-slate-800">success@razorpay</code></p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Pinging Razorpay...</span>
              </>
            ) : (
              <>
                <Key className="h-3.5 w-3.5 text-[#0c83ff]" />
                <span>Test Live Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-[#0c83ff] hover:bg-[#0062d2] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
