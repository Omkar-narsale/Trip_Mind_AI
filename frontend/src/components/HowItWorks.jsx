import React from 'react';
import { motion } from 'framer-motion';
import { Target, Sliders, CloudSun, Compass } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Target,
    title: 'Define Trip Parameters',
    description: 'Provide origin, destination, travel dates, party size, and total budget.'
  },
  {
    step: '02',
    icon: Sliders,
    title: 'Extract Natural Desires',
    description: 'TripMind few-shot Groq models interpret travel mood, pacing, and group dynamics.'
  },
  {
    step: '03',
    icon: CloudSun,
    title: 'Execute Weather Tool',
    description: 'LangGraph queries Open-Meteo for live destination forecast and truthful AI packing advice.'
  },
  {
    step: '04',
    icon: Compass,
    title: 'Synthesize Agent Graph',
    description: 'Autonomous planning tasks are sequenced and validated across constraints.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-dark-900 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Autonomous Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            How TripMind Operates
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            From initial parameters to meteorological intelligence and autonomous graph validation.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.12 }}
                  className="bg-dark-850 p-7 rounded-3xl border border-white/10 hover:border-brand-500/40 shadow-card hover:shadow-glow-brand transition-all flex flex-col items-start"
                >
                  <div className="w-full flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-700 font-mono">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
