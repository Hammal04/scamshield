import { Languages, RotateCcw } from 'lucide-react';
import type { AnalysisResult } from '../types';
import RiskScore from './RiskScore';
import RedFlags from './RedFlags';
import Recommendations from './Recommendations';
import LinkAnalysis from './LinkAnalysis';

interface ResultCardProps { result: AnalysisResult; onReset: () => void }

const categoryConfig = {
  scam: { label: '🚨 Scam / Fraud', cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  promotional: { label: '📢 Promotional', cls: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' },
  general: { label: 'ℹ️ General', cls: 'text-navy-200 bg-navy-800 border-navy-700' },
} as const;

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const category = categoryConfig[result.category] || categoryConfig.general;
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Scam Analysis</span>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${category.cls}`}>{category.label}</span>
          {result.detected_language && result.detected_language !== 'Unknown' && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/20 text-xs text-cyber-300"><Languages className="w-3.5 h-3.5" />{result.detected_language}</span>}
        </div>
        <button onClick={onReset} className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-white transition-colors"><RotateCcw className="w-4 h-4" />New Analysis</button>
      </div>
      <RiskScore score={result.risk_score} level={result.risk_level} verdict={result.verdict} />
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-3">Final Overview</h3>
        <p className="text-sm text-navy-200 leading-relaxed">{result.overview || result.summary}</p>
      </div>
      <RedFlags flags={result.red_flags} />
      {(result.links || []).length > 0 && <LinkAnalysis links={result.links || []} />}
      <Recommendations recommendations={result.recommendations} summary={result.overview} recommendation={result.recommendation} />
    </div>
  );
}
