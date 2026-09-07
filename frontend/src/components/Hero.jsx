import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, MapPin, Compass, CloudSun } from 'lucide-react';

export default function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-brand-600/15 to-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs sm:text-sm font-semibold mb-6 shadow-glow-brand"
          >
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>Autonomous AI Travel Planning with Live Weather Tools</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]"
          >
            Plan Smarter.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
              Travel Better.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-normal"
          >
            TripMind AI decomposes your travel desires into autonomous workflows, evaluates real destination weather, and calibrates your journey.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => scrollToSection('trip-form')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-brand transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Planning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-white/[0.03] text-slate-300 hover:text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-all"
            >
              Explore Agent Capabilities
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 text-slate-400 text-xs sm:text-sm font-medium"
          >
            <div className="flex items-center justify-center gap-2">
              <CloudSun className="w-4 h-4 text-brand-400" />
              <span>Live Weather Tools</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autonomous LangGraph</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Nuanced Pacing</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
