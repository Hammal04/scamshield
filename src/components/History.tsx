import { Trash2, History as HistoryIcon, X, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { HistoryRecord, View, AnalysisResult } from '../types';
import { loadHistory, deleteHistoryRecord, clearAllHistory } from '../history';

interface HistoryProps {
  onNavigate: (view: View) => void;
  onViewResult: (result: AnalysisResult) => void;
}

const levelColors: Record<string, string> = {
  LOW: 'text-accent-400 bg-accent-500/10 border-accent-500/30',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const typeIcons: Record<string, string> = {
  text: '💬',
  image: '📸',
  url: '🔗',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function History({ onNavigate, onViewResult }: HistoryProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  const handleDelete = (id: string) => {
    setRecords(deleteHistoryRecord(id));
  };

  const handleClearAll = () => {
    clearAllHistory();
    setRecords([]);
    setConfirmClear(false);
  };

  const stats = {
    total: records.length,
    critical: records.filter((r) => r.risk_level === 'CRITICAL').length,
    high: records.filter((r) => r.risk_level === 'HIGH').length,
    medium: records.filter((r) => r.risk_level === 'MEDIUM').length,
    low: records.filter((r) => r.risk_level === 'LOW').length,
  };

  if (records.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-navy-700/50 flex items-center justify-center mb-4">
          <HistoryIcon className="w-8 h-8 text-navy-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No analysis history yet</h3>
        <p className="text-sm text-navy-300 mb-4">Your past analyses will appear here for quick reference.</p>
        <button onClick={() => onNavigate('analyze')} className="btn-primary">
          Start Analyzing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyber-400" />
            <span className="text-xs text-navy-400 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-navy-400 uppercase tracking-wide">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs text-navy-400 uppercase tracking-wide">High</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-400" />
            <span className="text-xs text-navy-400 uppercase tracking-wide">Low/Med</span>
          </div>
          <p className="text-2xl font-bold text-accent-400">{stats.medium + stats.low}</p>
        </div>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-300">Confirm?</span>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition-all"
            >
              Yes, clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="p-1.5 rounded-lg text-navy-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Records */}
      <div className="space-y-2.5">
        {records.map((record) => (
          <div
            key={record.id}
            className="card card-hover p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => onViewResult(record.result)}
          >
            <span className="text-xl flex-shrink-0">{typeIcons[record.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{record.title}</p>
              <p className="text-xs text-navy-400">{formatDate(record.timestamp)} · {record.verdict}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg font-bold text-white">{record.risk_score}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${levelColors[record.risk_level]}`}>
                {record.risk_level}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
              className="p-2 rounded-lg text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              aria-label="Delete record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
