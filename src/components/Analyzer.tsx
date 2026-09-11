import { useState } from 'react';
import { MessageSquare, Image, Link2, Shield } from 'lucide-react';
import type { AnalysisTab, AnalysisResult } from '../types';
import MessageAnalyzer from './MessageAnalyzer';
import ScreenshotAnalyzer from './ScreenshotAnalyzer';
import URLAnalyzer from './URLAnalyzer';

interface AnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

const tabs: { id: AnalysisTab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'message', label: 'Message', icon: MessageSquare },
  { id: 'screenshot', label: 'Screenshot', icon: Image },
  { id: 'url', label: 'URL', icon: Link2 },
];

export default function Analyzer({ onResult }: AnalyzerProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('message');

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      {/* Tab buttons */}
      <div className="flex gap-2 mb-6 p-1 bg-navy-900/50 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'tab-active' : 'tab-inactive'
              }`}
              aria-pressed={isActive}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'message' && <MessageAnalyzer onResult={onResult} />}
        {activeTab === 'screenshot' && <ScreenshotAnalyzer onResult={onResult} />}
        {activeTab === 'url' && <URLAnalyzer onResult={onResult} />}
      </div>

      {/* Shield watermark */}
      <div className="mt-6 pt-5 border-t border-navy-700/40 flex items-center justify-center gap-2 text-xs text-navy-500">
        <Shield className="w-3.5 h-3.5" />
        <span>Your messages are analyzed securely and not stored permanently</span>
      </div>
    </div>
  );
}
