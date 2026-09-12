import { CheckCircle2, Info, Lightbulb } from 'lucide-react';

interface RecommendationsProps {
  recommendations: string[];
  summary: string;
  recommendation?: string;
}

export default function Recommendations({ recommendations, summary, recommendation }: RecommendationsProps) {
  const items = recommendations.length ? recommendations : (recommendation ? [recommendation] : []);
  return (
    <div className="space-y-4">
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-cyber-400" />
          Final Overview
        </h3>
        <p className="text-navy-200 leading-relaxed text-sm">{summary}</p>
      </div>

      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent-400" />
          🛡️ Recommended Action
        </h3>
        <ul className="space-y-2.5">
          {items.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-navy-200">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-navy-800/40 border border-navy-700/40">
        <Info className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-navy-400 leading-relaxed">AI-generated assessment. A reachable website, HTTPS, SSL certificate, or HTTP 200 response does not by itself prove a link is safe.</p>
      </div>
    </div>
  );
}
