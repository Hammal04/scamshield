import { CheckCircle2, Info, Lightbulb } from 'lucide-react';

interface RecommendationsProps {
  recommendations: string[];
  summary: string;
}

export default function Recommendations({ recommendations, summary }: RecommendationsProps) {
  return (
    <div className="space-y-4">
      {/* Why is this suspicious? */}
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-cyber-400" />
          Why is this suspicious?
        </h3>
        <p className="text-navy-200 leading-relaxed text-sm">{summary}</p>
      </div>

      {/* What should you do? */}
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent-400" />
          What should you do?
        </h3>
        <ul className="space-y-2.5">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-navy-200">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-navy-800/40 border border-navy-700/40">
        <Info className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-navy-400 leading-relaxed">
          AI-generated assessment — verify important information independently. This tool is for educational purposes and does not guarantee accuracy.
        </p>
      </div>
    </div>
  );
}
