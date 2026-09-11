import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { analyzeUrl } from '../api';
import type { AnalysisResult } from '../types';
import { addToHistory } from '../history';

interface URLAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

const loadingMessages = [
  'AI is analyzing the URL...',
  'Checking domain indicators...',
  'Preparing risk assessment...',
];

export default function URLAnalyzer({ onResult }: URLAnalyzerProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingIdx, setLoadingIdx] = useState(0);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze.');
      return;
    }

    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'http://' + normalized;
    }

    try {
      new URL(normalized);
    } catch {
      setError('Invalid URL format. Please enter a valid URL.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingIdx(0);

    const interval = setInterval(() => {
      setLoadingIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    try {
      const result = await analyzeUrl(normalized);
      addToHistory('url', result);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-navy-200 mb-2">
          Enter suspicious URL
        </label>
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400 pointer-events-none" />
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter suspicious URL..."
            className="input-field pl-12"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
            aria-describedby={error ? 'url-error' : undefined}
          />
        </div>
      </div>

      {error && (
        <div id="url-error" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || !url.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {loadingMessages[loadingIdx]}
          </>
        ) : (
          <>
            <Link2 className="w-5 h-5" />
            Check URL
          </>
        )}
      </button>

      <div className="px-4 py-3 rounded-xl bg-cyber-500/10 border border-cyber-500/20">
        <p className="text-xs text-cyber-300 leading-relaxed">
          URL analysis is an indicator-based assessment. It checks for suspicious domain patterns, shorteners, and impersonation — but cannot definitively prove a URL is malicious.
        </p>
      </div>
    </div>
  );
}
