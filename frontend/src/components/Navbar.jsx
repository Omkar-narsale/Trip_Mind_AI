import React, { useState } from 'react';
import { Compass, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-950/85 backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo */}
          <a 
            href="#" 
            className="flex items-center gap-2.5 text-white group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-all">
              <Compass className="w-5 h-5 transform group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white">
              TripMind <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Home
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => scrollToSection('trip-form')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-200" />
              <span>Plan Trip</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-dark-900 px-4 pt-2 pb-5 space-y-2">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Home
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Features
          </a>
          <button
            onClick={() => scrollToSection('trip-form')}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-glow-brand"
          >
            <span>Plan Trip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
