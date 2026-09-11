import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { RiskLevel } from '../types';

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
  verdict: string;
}

const levelConfig: Record<RiskLevel, {
  color: string;
  bg: string;
  border: string;
  text: string;
  icon: typeof Shield;
  label: string;
}> = {
  LOW: {
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
    text: 'text-accent-300',
    icon: ShieldCheck,
    label: 'LOW RISK',
  },
  MEDIUM: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-300',
    icon: Shield,
    label: 'MEDIUM RISK',
  },
  HIGH: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    icon: ShieldAlert,
    label: 'HIGH RISK',
  },
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: ShieldX,
    label: 'CRITICAL RISK',
  },
};

export default function RiskScore({ score, level, verdict }: RiskScoreProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`card ${config.border} p-6 sm:p-8 animate-slide-up`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular score gauge */}
        <div className="relative flex-shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-navy-700/50"
            />
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${config.color} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${config.color}`}>{score}</span>
            <span className="text-sm text-navy-400">/ 100</span>
          </div>
        </div>

        {/* Level and verdict */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Icon className={`w-6 h-6 ${config.color}`} />
            <span className={`text-xl font-bold ${config.text}`}>{config.label}</span>
          </div>
          <p className="text-lg text-white font-semibold mb-1">{verdict}</p>
          <p className="text-sm text-navy-300">
            This score is based on detected red flags and a transparent risk engine — not a guaranteed probability.
          </p>
        </div>
      </div>
    </div>
  );
}
