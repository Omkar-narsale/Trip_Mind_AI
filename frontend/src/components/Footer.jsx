import React from 'react';
import { Compass } from 'lucide-react';

export default function Footer() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-dark-950 text-slate-400 py-12 md:py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/5">
          
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-brand">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight">
                TripMind <span className="text-brand-400">AI</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 max-w-sm">
              Autonomous Travel Intelligence Powered by LangGraph, Open-Meteo, & Groq LLMs.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-7 text-xs font-semibold">
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Home
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Features
            </a>
          </nav>
        </div>

        {/* Bottom copyright and notes */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} TripMind AI. Autonomous Agent Project.</p>
          <div className="flex items-center gap-1 font-mono">
            <span>React · Tailwind CSS · FastAPI · LangGraph · Open-Meteo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
