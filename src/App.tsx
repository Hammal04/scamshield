import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import type { View, AnalysisResult } from './types';
import Header from './components/Header';
import Analyzer from './components/Analyzer';
import ResultCard from './components/ResultCard';
import History from './components/History';
import About from './components/About';
import { checkHealth } from './api';

export default function App() {
  const [view, setView] = useState<View>('analyze');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleResult = (r: AnalysisResult) => {
    setResult(r);
  };

  const handleReset = () => {
    setResult(null);
  };

  const handleViewResult = (r: AnalysisResult) => {
    setResult(r);
    setView('analyze');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,120,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header view={view} onNavigate={(v) => { setView(v); setResult(null); }} />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {view === 'analyze' && (
            <>
              {/* Hero section */}
              {!result && (
                <div className="text-center mb-8 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 mb-4">
                    <Shield className="w-8 h-8 text-accent-400" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                    Detect scams before they hurt you.
                  </h1>
                  <p className="text-navy-300 max-w-2xl mx-auto text-base sm:text-lg">
                    Analyze suspicious messages and screenshots and understand the red flags behind them.
                  </p>

                  {/* Backend status indicator */}
                  <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-navy-800/60 border border-navy-700/40">
                    {backendStatus === 'checking' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-xs text-navy-300">Connecting to backend...</span>
                      </>
                    )}
                    {backendStatus === 'online' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-accent-400" />
                        <span className="text-xs text-accent-300">Backend online · AI ready</span>
                      </>
                    )}
                    {backendStatus === 'offline' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-xs text-red-300">Backend offline — start the FastAPI server</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Result or Analyzer */}
              {result ? (
                <ResultCard result={result} onReset={handleReset} />
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Analyzer onResult={handleResult} />
                  </div>

                  {/* Side panel */}
                  <div className="space-y-4">
                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-cyber-400" />
                        <h3 className="text-sm font-semibold text-white">How It Works</h3>
                      </div>
                      <ol className="space-y-3">
                        {[
                          { icon: '1', title: 'Paste or upload', desc: 'Add a message, screenshot, or URL' },
                          { icon: '2', title: 'AI analyzes', desc: 'Groq AI identifies red flags and patterns' },
                          { icon: '3', title: 'Visit & inspect links', desc: 'Safely follow redirects and inspect destination pages' },
                          { icon: '4', title: 'Risk engine scores', desc: 'Combine message and website evidence' },
                          { icon: '5', title: 'Understand & act', desc: 'Learn why and what to do next' },
                                                  ].map((step) => (
                          <li key={step.icon} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-500/15 text-accent-300 text-xs font-bold flex items-center justify-center">
                              {step.icon}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-white">{step.title}</p>
                              <p className="text-xs text-navy-400">{step.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-accent-400" />
                        <h3 className="text-sm font-semibold text-white">Risk Levels</h3>
                      </div>
                      <div className="space-y-2">
                        {[
                          { level: 'VERY LOW', color: 'text-accent-400', bg: 'bg-accent-500/10', range: '0–20' },
                          { level: 'LOW', color: 'text-accent-300', bg: 'bg-accent-500/10', range: '21–40' },
                          { level: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10', range: '41–60' },
                          { level: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', range: '61–80' },
                          { level: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', range: '81–100' },
                        ].map((r) => (
                          <div key={r.level} className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.bg}`}>
                            <span className={`text-sm font-medium ${r.color}`}>{r.level}</span>
                            <span className="text-xs text-navy-400">{r.range}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-5 h-5 text-orange-400" />
                        <h3 className="text-sm font-semibold text-white">Languages</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['English', 'Urdu', 'Roman Urdu'].map((lang) => (
                          <span key={lang} className="px-2.5 py-1 rounded-full bg-navy-900/50 border border-navy-700/50 text-xs text-navy-200">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {view === 'history' && <History onNavigate={setView} onViewResult={handleViewResult} />}
          {view === 'about' && <About />}
        </main>

        {/* Footer */}
        <footer className="border-t border-navy-700/40 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-navy-400">
                <Shield className="w-4 h-4 text-accent-400" />
                <span>AI ScamShield</span>
                <span className="text-navy-600">·</span>
                <span>Detect. Understand. Stay Safe.</span>
              </div>
              <span className="text-xs text-navy-500">AI Powered by Groq</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
