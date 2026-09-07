import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Compass, TrendingDown, CloudSun } from 'lucide-react';

const FEATURES_DATA = [
  {
    icon: Bot,
    title: 'LangGraph Agent Engine',
    description: 'Autonomous multi-step planning that breaks down complex travel desires into sequenced, validated tasks.',
    tag: 'Orchestration'
  },
  {
    icon: CloudSun,
    title: 'Live Weather Intelligence',
    description: 'Direct integration with Open-Meteo meteorological API for live forecasts, temperatures, and truthful AI packing advice.',
    tag: 'Real Tool Tooling'
  },
  {
    icon: Compass,
    title: 'Natural Language Synthesis',
    description: 'Analyzes subtle travel moods, custom pacing, dietary restrictions, and party dynamics.',
    tag: 'Few-Shot Groq'
  },
  {
    icon: TrendingDown,
    title: 'Budget Calibration',
    description: 'Category-wise spending distribution mapped across lodging, dining, experiences, and transit.',
    tag: 'Optimization'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            AI Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Engineered for Modern Travelers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Intelligent architecture designed to simplify complex trips, check real weather metrics, and tailor every experience.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_DATA.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative p-7 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 shadow-card hover:shadow-glow-brand transition-all duration-300 flex flex-col justify-between backdrop-blur-xl"
              >
                <div>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 mb-6 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Tag */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-md mb-3 inline-block">
                    {feature.tag}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-slate-500 group-hover:text-brand-400 transition-colors">
                  <span>Explore module &rarr;</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
