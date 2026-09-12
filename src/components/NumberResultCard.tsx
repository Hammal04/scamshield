import { Phone, ShieldAlert, ShieldCheck, RotateCcw, Database, MapPin, Radio } from 'lucide-react';
import type { NumberAnalysisResult } from '../types';
import RiskScore from './RiskScore';

interface Props { result: NumberAnalysisResult; onReset: () => void; }

export default function NumberResultCard({ result, onReset }: Props) {
  const matched = result.database_match;
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Phone Number Analysis</span>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${matched ? 'text-red-300 bg-red-500/10 border-red-500/30' : result.status === 'suspicious' ? 'text-orange-300 bg-orange-500/10 border-orange-500/30' : 'text-accent-300 bg-accent-500/10 border-accent-500/30'}`}>
            {matched ? '🚨 Reported Scam Number' : result.status === 'suspicious' ? '⚠️ Suspicious' : '✅ No Strong Signals'}
          </span>
        </div>
        <button onClick={onReset} className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-white transition-colors"><RotateCcw className="w-4 h-4" />New Analysis</button>
      </div>

      <RiskScore score={result.risk_score} level={result.risk_level} verdict={result.verdict} />

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center"><Phone className="w-5 h-5 text-accent-400" /></div>
          <div><p className="text-xs text-navy-400">Number checked</p><p className="text-lg font-semibold text-white break-all">{result.normalized_number}</p></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Info icon={<MapPin className="w-4 h-4" />} label="Country / Region" value={result.country} />
          <Info icon={<Radio className="w-4 h-4" />} label="Number Type" value={result.number_type} />
          <Info icon={<Phone className="w-4 h-4" />} label="Carrier" value={result.carrier} />
          <Info icon={result.valid ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />} label="Number Validity" value={result.valid ? 'Valid number format' : 'Not confirmed valid'} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Final Overview</h3>
        <p className="text-sm text-navy-200 leading-relaxed">{matched ? 'This exact phone number matches the ScamShield scam-number blocklist configured by the administrator.' : 'This check evaluates phone-number intelligence and warning signals. A clean result does not prove that the caller is trustworthy because scammers can spoof or rotate phone numbers.'}</p>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">⚠️ Why This Was Flagged</h3>
        {result.indicators.length ? <ul className="space-y-2">{result.indicators.map((item, i) => <li key={`${item.title}-${i}`} className="flex gap-2 text-sm text-navy-200"><span className="text-orange-400">•</span><span><strong className="text-white">{item.title}:</strong> {item.explanation}</span></li>)}</ul> : <p className="text-sm text-navy-300">No major number-specific warning signals were detected.</p>}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3"><Database className="w-5 h-5 text-accent-400" /><h3 className="text-lg font-semibold text-white">Number Reputation</h3></div>
        <p className="text-sm text-navy-300">{matched ? 'Exact match found in the configured scam-number blocklist.' : 'No exact match was found in the configured scam-number blocklist.'}</p>
      </div>

      <div className="card p-6 border-accent-500/20">
        <h3 className="text-lg font-semibold text-white mb-3">🛡️ Recommended Action</h3>
        <p className="text-sm text-navy-200 leading-relaxed">{result.recommendation}</p>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-3"><div className="flex items-center gap-2 text-navy-400 text-xs mb-1">{icon}{label}</div><p className="text-sm text-white">{value}</p></div>;
}
