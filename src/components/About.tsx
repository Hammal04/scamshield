import { Shield, AlertTriangle, Brain, Code2, Server, Cloud, Lock, Globe } from 'lucide-react';

export default function About() {
  const techStack = [
    { name: 'React + Vite', icon: Code2, desc: 'Frontend framework' },
    { name: 'Tailwind CSS', icon: Code2, desc: 'Styling system' },
    { name: 'Python FastAPI', icon: Server, desc: 'Backend API' },
    { name: 'Groq AI', icon: Brain, desc: 'AI analysis engine' },
    { name: 'Supabase / PostgreSQL', icon: Cloud, desc: 'Optional database' },
    { name: 'Vercel + Render', icon: Globe, desc: 'Deployment' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Problem */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">The Problem</h2>
        </div>
        <p className="text-navy-200 leading-relaxed">
          Scams are increasingly delivered through everyday messages — SMS, WhatsApp, social media, email, and fake links.
          Ordinary users often cannot tell the difference between a legitimate notification and a carefully crafted scam.
          Most scam detectors only give a yes/no answer, leaving people without understanding of the manipulation tactics used against them.
        </p>
      </div>

      {/* Solution */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-400" />
          </div>
          <h2 className="text-xl font-bold text-white">The Solution</h2>
        </div>
        <p className="text-navy-200 leading-relaxed mb-4">
          AI ScamShield analyzes suspicious content — text messages, screenshots, and URLs — and explains the warning signs behind each assessment.
          Instead of just saying "scam" or "not scam," it breaks down exactly which red flags were detected, why they matter, and what you should do next.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-navy-900/40 border border-navy-700/40">
            <p className="text-sm font-medium text-accent-300 mb-1">Detect</p>
            <p className="text-xs text-navy-300">Identify red flags in messages, screenshots, and URLs</p>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/40 border border-navy-700/40">
            <p className="text-sm font-medium text-cyber-300 mb-1">Understand</p>
            <p className="text-xs text-navy-300">Learn why each red flag matters through plain-language explanations</p>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/40 border border-navy-700/40">
            <p className="text-sm font-medium text-white mb-1">Stay Safe</p>
            <p className="text-xs text-navy-300">Get clear recommendations on what to do next</p>
          </div>
        </div>
      </div>

      {/* Technology */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-500/10 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-cyber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Technology</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {techStack.map((tech) => {
            const Icon = tech.icon;
            return (
              <div key={tech.name} className="p-4 rounded-xl bg-navy-900/40 border border-navy-700/40 card-hover">
                <Icon className="w-5 h-5 text-accent-400 mb-2" />
                <p className="text-sm font-medium text-white">{tech.name}</p>
                <p className="text-xs text-navy-400">{tech.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Privacy & Security</h2>
        </div>
        <ul className="space-y-2 text-navy-200 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-accent-400 mt-0.5">✓</span>
            Your messages are analyzed securely and not stored permanently on the server.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-400 mt-0.5">✓</span>
            API keys are kept on the backend only — never exposed to the frontend.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-400 mt-0.5">✓</span>
            Analysis history is stored locally in your browser.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-400 mt-0.5">✓</span>
            The AI never requests or reproduces your passwords, OTPs, or credentials.
          </li>
        </ul>
      </div>
    </div>
  );
}
