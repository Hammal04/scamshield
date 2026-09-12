import { ExternalLink, ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';
import type { LinkAnalysis as LinkInfo } from '../types';

interface Props { links: LinkInfo[] }

const statusConfig = {
  likely_safe: { label: 'Likely Safe', icon: ShieldCheck, cls: 'text-accent-300 bg-accent-500/10 border-accent-500/30' },
  suspicious: { label: 'Suspicious', icon: AlertTriangle, cls: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' },
  likely_malicious: { label: 'Likely Malicious', icon: ShieldAlert, cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  unable_to_verify: { label: 'Unable to Verify', icon: HelpCircle, cls: 'text-navy-200 bg-navy-800/60 border-navy-700' },
} as const;

export default function LinkAnalysis({ links }: Props) {
  if (!links.length) return null;
  return (
    <section className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">🔗 Link Analysis</h3>
      <div className="space-y-4">
        {links.map((link, i) => {
          const cfg = statusConfig[link.status];
          const Icon = cfg.icon;
          return (
            <div key={`${link.url}-${i}`} className="rounded-xl border border-navy-700/60 bg-navy-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-white">🔗 Link {i + 1}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.cls}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-navy-500 mb-1">Original URL</p><p className="text-navy-200 break-all">{link.url}</p></div>
                <div><p className="text-xs text-navy-500 mb-1">Final Destination</p><p className="text-navy-200 break-all">{link.final_url || 'Not reached'}</p></div>
                <div><p className="text-xs text-navy-500 mb-1">Original Domain</p><p className="text-navy-300 break-all">{link.original_domain || '—'}</p></div>
                <div><p className="text-xs text-navy-500 mb-1">Final Domain</p><p className="text-navy-300 break-all">{link.final_domain || '—'}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-navy-800 text-navy-200">Website Visited: {link.visited ? '✓ Yes' : '✗ No'}</span>
                <span className="px-2.5 py-1 rounded-lg bg-navy-800 text-navy-200">Redirected: {link.redirected ? `✓ Yes (${link.redirect_count})` : 'No'}</span>
                <span className="px-2.5 py-1 rounded-lg bg-navy-800 text-navy-200">Domain Match: {link.domain_match === true ? '✓ Yes' : link.domain_match === false ? '✗ No' : 'Not established'}</span>
              </div>
              {link.website_title && <p className="text-sm text-navy-200"><span className="text-navy-500">Page title:</span> {link.website_title}</p>}
              {link.page_indicators.length > 0 && <div><p className="text-xs text-navy-500 mb-1">Website findings</p><ul className="list-disc list-inside text-sm text-navy-200 space-y-1">{link.page_indicators.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              <p className="text-sm text-navy-300">{link.reason}</p>
              {link.final_url && <a href={link.final_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-xs text-cyber-300 hover:text-cyber-200"><ExternalLink className="w-3.5 h-3.5" />Open destination</a>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
