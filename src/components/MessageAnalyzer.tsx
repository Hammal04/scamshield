import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { analyzeText } from '../api';
import type { AnalysisResult } from '../types';
import { demoExamples } from '../demoData';
import { addToHistory } from '../history';

interface MessageAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

const loadingMessages = [
  'AI is analyzing the content...',
  'Detecting manipulation patterns...',
  'Checking for red flags...',
  'Preparing risk assessment...',
];

export default function MessageAnalyzer({ onResult }: MessageAnalyzerProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingIdx, setLoadingIdx] = useState(0);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please paste a message to analyze.');
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingIdx(0);

    const interval = setInterval(() => {
      setLoadingIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    try {
      const result = await analyzeText(text);
      addToHistory('text', result);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const loadDemo = (demoText: string) => {
    setText(demoText);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="message-input" className="block text-sm font-medium text-navy-200 mb-2">
          Paste a suspicious message
        </label>
        <textarea
          id="message-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a suspicious message here..."
          rows={6}
          className="input-field resize-y min-h-[150px]"
          disabled={loading}
          aria-describedby={error ? 'message-error' : undefined}
        />
      </div>

      {error && (
        <div id="message-error" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {loadingMessages[loadingIdx]}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Analyze Message
          </>
        )}
      </button>

      {/* Demo examples */}
      <div className="pt-2">
        <p className="text-xs font-medium text-navy-400 mb-2.5 uppercase tracking-wide">Try a demo example</p>
        <div className="flex flex-wrap gap-2">
          {demoExamples.map((demo) => (
            <button
              key={demo.label}
              onClick={() => loadDemo(demo.text)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-xs font-medium text-navy-200 hover:border-accent-500/40 hover:text-accent-300 transition-all disabled:opacity-50"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
