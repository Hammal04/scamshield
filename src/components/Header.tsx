import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { View } from '../types';

interface HeaderProps {
  view: View;
  onNavigate: (view: View) => void;
}

export default function Header({ view, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: View; label: string }[] = [
    { id: 'analyze', label: 'Analyze' },
    { id: 'history', label: 'History' },
    { id: 'about', label: 'About' },
  ];

  const handleNav = (v: View) => {
    onNavigate(v);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-navy-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => handleNav('analyze')}
            className="flex items-center gap-2.5 group"
            aria-label="AI ScamShield home"
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-accent-400 group-hover:text-accent-300 transition-colors" />
              <div className="absolute inset-0 bg-accent-400/20 rounded-full blur-md group-hover:bg-accent-400/30 transition-all" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-white leading-none block">AI ScamShield</span>
              <span className="text-xs text-navy-300 leading-none">AI Powered by Groq</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === item.id
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-navy-300 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/50"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  view === item.id
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-navy-300 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
