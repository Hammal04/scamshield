import { Phone, ShieldAlert, ShieldCheck, RotateCcw, Database, MapPin, Radio, Globe, ExternalLink } from 'lucide-react';
import type { NumberAnalysisResult } from '../types';
import RiskScore from './RiskScore';

interface Props { result: NumberAnalysisResult; onReset: () => void; }

export default function NumberResultCard({ result, onReset }: Props) {
  const matched = result.database_match;
  // Keep the headline badge aligned with the final risk decision. Internet reputation
  // evidence can raise the risk even when there is no local blocklist match.
  const strongSignals = matched ||
    result.risk_score >= 61 ||
    result.risk_level === 'HIGH' ||
    result.risk_level === 'CRITICAL' ||
    result.status === 'likely_malicious' ||
    result.internet_status === 'reported_suspicious';
  const badgeLabel = matched
    ? '🚨 Reported Scam Number'
    : strongSignals
      ? '🚨 Strong Signals Detected'
      : result.internet_status === 'weak_reports'
        ? '⚠️ Suspicious Signals'
        : '✅ No Strong Signals';
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Phone Number Analysis</span>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${matched || strongSignals ? 'text-red-300 bg-red-500/10 border-red-500/30' : result.internet_status === 'weak_reports' ? 'text-orange-300 bg-orange-500/10 border-orange-500/30' : 'text-accent-300 bg-accent-500/10 border-accent-500/30'}`}>
            {badgeLabel}
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
        <p className="text-sm text-navy-200 leading-relaxed">{result.internet_status === 'reported_suspicious' ? `Public web sources contain scam/spam reports for this exact number. ScamShield uses those reports as reputation evidence, not as proof of who currently controls the number.` : result.internet_status === 'weak_reports' ? 'Public web search found some potentially relevant warnings, but the evidence is limited. Review the sources before deciding how much to trust the caller.' : result.internet_status === 'no_reports_found' ? 'The live web search found no strong public scam reports for this exact number. This does not prove the number is safe; new or unreported scam numbers can have no online history.' : result.internet_status === 'unable_to_verify' ? 'ScamShield could not complete the live internet reputation check. The number should be treated as unverified rather than safe.' : 'Configure a live search provider to check this number against current public internet reports.'}</p>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">⚠️ Why This Was Flagged</h3>
        {result.indicators.length ? <ul className="space-y-2">{result.indicators.map((item, i) => <li key={`${item.title}-${i}`} className="flex gap-2 text-sm text-navy-200"><span className="text-orange-400">•</span><span><strong className="text-white">{item.title}:</strong> {item.explanation}</span></li>)}</ul> : <p className="text-sm text-navy-300">No major number-specific warning signals were detected.</p>}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3"><Globe className="w-5 h-5 text-accent-400" /><h3 className="text-lg font-semibold text-white">Internet Reputation Check</h3></div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${result.internet_status === 'reported_suspicious' ? 'text-red-300 bg-red-500/10 border-red-500/30' : result.internet_status === 'weak_reports' ? 'text-orange-300 bg-orange-500/10 border-orange-500/30' : result.internet_status === 'no_reports_found' ? 'text-accent-300 bg-accent-500/10 border-accent-500/30' : 'text-navy-300 bg-navy-800 border-navy-700'}`}>
            {result.internet_status === 'reported_suspicious' ? '🚨 Online reports found' : result.internet_status === 'weak_reports' ? '⚠️ Weak reports found' : result.internet_status === 'no_reports_found' ? 'ℹ️ No strong reports found' : result.internet_status === 'unable_to_verify' ? '❓ Unable to verify' : '⚙️ Internet lookup not configured'}
          </span>
          {result.internet_checked && <span className="text-xs text-navy-300 px-2.5 py-1 rounded-full bg-navy-900 border border-navy-700">{result.internet_report_count} strong result(s)</span>}
        </div>
        <p className="text-sm text-navy-300 leading-relaxed">{result.internet_message || 'No live internet reputation provider is configured.'}</p>
        {result.internet_sources.length > 0 && <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Public web evidence</p>
          {result.internet_sources.map((source, i) => <div key={`${source.url}-${i}`} className="rounded-xl bg-navy-900/50 border border-navy-700/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-white">{source.title || source.domain}</p><p className="text-xs text-navy-400 mt-0.5">{source.domain}</p></div>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-accent-400 hover:text-accent-300" aria-label="Open source"><ExternalLink className="w-4 h-4" /></a>
            </div>
            <p className="text-xs text-navy-300 mt-2 leading-relaxed">{source.snippet}</p>
            {source.matched_terms.length > 0 && <p className="text-[11px] text-orange-300 mt-2">Signals: {source.matched_terms.join(', ')}</p>}
          </div>)}
        </div>}
        {matched && <div className="mt-4 flex items-center gap-2 text-xs text-red-300"><Database className="w-4 h-4" /> Also matched the optional administrator blocklist.</div>}
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
