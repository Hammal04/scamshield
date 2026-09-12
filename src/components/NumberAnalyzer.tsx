import { useState } from 'react';
import type { NumberAnalysisResult } from '../types';
import { Phone, Search, Loader2, ShieldAlert } from 'lucide-react';
import { analyzeNumber } from '../api';

interface NumberAnalyzerProps {
  onResult: (result: NumberAnalysisResult) => void;
}

export default function NumberAnalyzer({ onResult }: NumberAnalyzerProps) {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!number.trim()) {
      setError('Please enter a phone number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeNumber(number);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Number analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="number-input" className="block text-sm font-medium text-navy-200 mb-2">
          Enter a suspicious phone number
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            id="number-input"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="e.g. +923001234567 or 03001234567"
            className="input-field pl-12"
            disabled={loading}
            inputMode="tel"
          />
        </div>
        <p className="text-xs text-navy-400 mt-2">International format is recommended. Local numbers are interpreted using Pakistan (+92) by default.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}

      <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-900/50 border border-navy-700/50">
        <ShieldAlert className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-navy-300 leading-relaxed">
          A phone number alone cannot prove that someone is a scammer. ScamShield checks number validity, type, carrier/region information, unusual patterns, and any exact match in your configured scam-number blocklist.
        </p>
      </div>

      <button onClick={handleAnalyze} disabled={loading || !number.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Checking number...</> : <><Search className="w-5 h-5" />Check Number</>}
      </button>
    </div>
  );
}
