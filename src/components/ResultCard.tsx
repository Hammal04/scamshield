import { Languages, RotateCcw } from 'lucide-react';
import type { AnalysisResult } from '../types';
import RiskScore from './RiskScore';
import RedFlags from './RedFlags';
import Recommendations from './Recommendations';

interface ResultCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-400">
            Scam Analysis
          </span>
          {result.detected_language && result.detected_language !== 'Unknown' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/20 text-xs text-cyber-300">
              <Languages className="w-3.5 h-3.5" />
              {result.detected_language}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Risk score gauge */}
      <RiskScore score={result.risk_score} level={result.risk_level} verdict={result.verdict} />

      {/* Red flags */}
      <RedFlags flags={result.red_flags} />

      {/* Summary + recommendations */}
      <Recommendations recommendations={result.recommendations} summary={result.summary} />
    </div>
  );
}
