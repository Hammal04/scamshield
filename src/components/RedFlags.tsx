import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { RedFlag } from '../types';

interface RedFlagsProps {
  flags: RedFlag[];
}

const severityConfig = {
  HIGH: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300',
  label: 'HIGH',
  emoji: '⚠',
  money: '💰',
    link: '🔗',
    lock: '🔐',
    user: '👤',
    clock: '⏰',
    building: '🏦',
    envelope: '✉',
    briefcase: '💼',
    shield: '🛡',
    phone: '📱',
    gift: '🎁',
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300',
    label: 'MEDIUM',
  },
  LOW: {
    icon: Info,
    color: 'text-cyber-400',
    bg: 'bg-cyber-500/10',
    border: 'border-cyber-500/30',
    badge: 'bg-cyber-500/20 text-cyber-300',
    label: 'LOW',
  },
};

function getFlagIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('urgency') || t.includes('time')) return '⏰';
  if (t.includes('financial') || t.includes('money') || t.includes('payment')) return '💰';
  if (t.includes('link') || t.includes('url')) return '🔗';
  if (t.includes('credential') || t.includes('otp') || t.includes('password')) return '🔐';
  if (t.includes('personal') || t.includes('information')) return '👤';
  if (t.includes('imperson') || t.includes('brand')) return '🎭';
  if (t.includes('prize') || t.includes('reward') || t.includes('bait')) return '🎁';
  if (t.includes('threat') || t.includes('block') || t.includes('suspend')) return '⛔';
  if (t.includes('bank')) return '🏦';
  if (t.includes('job')) return '💼';
  if (t.includes('government') || t.includes('notice')) return '🏛';
  if (t.includes('courier') || t.includes('delivery')) return '📦';
  if (t.includes('social')) return '👥';
  if (t.includes('scholarship')) return '🎓';
  return '⚠';
}

export default function RedFlags({ flags }: RedFlagsProps) {
  if (flags.length === 0) {
    return (
      <div className="card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-accent-400" />
          Red Flags
        </h3>
        <p className="text-navy-300 text-sm">
          No significant red flags were detected. The content does not show clear scam indicators, but always remain cautious.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        Red Flags Detected
      </h3>
      <div className="space-y-3">
        {flags.map((flag, idx) => {
          const config = severityConfig[flag.severity as keyof typeof severityConfig] || severityConfig.MEDIUM;
          const Icon = config.icon;
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-xl ${config.bg} border ${config.border} transition-all hover:scale-[1.01]`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-xl block leading-none">{getFlagIcon(flag.title)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-white text-sm">{flag.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-navy-300 leading-relaxed">{flag.explanation}</p>
              </div>
              <Icon className={`w-4 h-4 flex-shrink-0 mt-1 ${config.color}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
