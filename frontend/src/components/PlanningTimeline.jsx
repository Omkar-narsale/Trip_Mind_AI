import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  CloudSun, 
  Compass, 
  Hotel, 
  Navigation, 
  CalendarDays, 
  Sparkles, 
  Loader2, 
  Check, 
  Layers,
  ArrowRight,
  Cpu
} from 'lucide-react';

const STANDARD_STAGES = [
  { id: 'profile', label: 'Understand Trip Parameters', done: true, phase: 'Phase 1-2' },
  { id: 'prefs', label: 'Analyze Natural Preferences', done: true, phase: 'Phase 3' },
  { id: 'strategy', label: 'Build Autonomous Strategy', done: true, phase: 'Phase 4' },
  { id: 'weather', label: 'Check Live Weather', done: true, icon: CloudSun, phase: 'Phase 5 (Live Tool)' },
  { id: 'attractions', label: 'Discover Experiences', done: true, icon: Compass, phase: 'Phase 6 (Live Tool)' },
  { id: 'hotels', label: 'Find Accommodation', done: true, icon: Hotel, phase: 'Phase 7 (Live Tool)' },
  { id: 'transit', label: 'Optimize Transportation', active: true, done: true, icon: Navigation, phase: 'Phase 8 (Live Engine)' },
  { id: 'itinerary', label: 'Build Final Itinerary', future: true, icon: CalendarDays, phase: 'Future Stage' }
];

const PRIORITY_BADGES = {
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
};

export default function PlanningTimeline({ tasks, planningStrategy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Autonomous AI Planning Timeline
            </h3>
            <p className="text-xs text-slate-400">
              LangGraph orchestration pipeline & real tool execution stages
            </p>
          </div>
        </div>

        {planningStrategy && (
          <div className="max-w-md text-xs text-slate-300 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-brand-400 font-semibold block mb-0.5">Strategy:</span>
            {planningStrategy}
          </div>
        )}
      </div>

      {/* Stage Progression Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STANDARD_STAGES.map((stage) => {
          const isDone = stage.done;
          const isFuture = stage.future;
          const isActive = stage.active;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-indigo-500/10 border-indigo-500/40 shadow-glow-brand'
                  : isDone
                  ? 'bg-white/[0.03] border-white/10'
                  : 'bg-white/[0.01] border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  {stage.phase}
                </span>
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                ) : isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className={`text-xs font-semibold ${isActive ? 'text-indigo-300' : isDone ? 'text-white' : 'text-slate-500'}`}>
                {stage.label}
              </p>
              {isFuture && (
                <span className="inline-block mt-1 text-[10px] text-slate-500 font-medium">
                  Planned for future agent stages
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sequenced Task Execution List */}
      {tasks && tasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Decomposed Agent Tasks ({tasks.length})</span>
            <span>Dependency Sequenced</span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task, idx) => {
              const pStyle = PRIORITY_BADGES[task.priority?.toLowerCase()] || PRIORITY_BADGES.medium;
              const isWeather = task.task_type === 'weather' || task.task_id?.includes('weather');
              const isAttraction = task.task_type === 'attraction' || task.task_id?.includes('attraction') || task.task_id?.includes('sightseeing');
              const isAccommodation = task.task_type === 'accommodation' || task.task_id?.includes('accommodation') || task.task_id?.includes('hotel') || task.task_id?.includes('lodging') || task.task_id?.includes('stay');

              return (
                <motion.div
                  key={task.task_id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className={`p-4 rounded-2xl border transition-all ${
                    isAccommodation
                      ? 'bg-gradient-to-r from-purple-950/60 to-dark-850 border-purple-500/30'
                      : isAttraction
                      ? 'bg-gradient-to-r from-indigo-950/60 to-dark-850 border-indigo-500/30'
                      : isWeather
                      ? 'bg-gradient-to-r from-brand-950/60 to-dark-850 border-brand-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        isAccommodation
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : isAttraction
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isWeather 
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' 
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white">
                            {task.task_name}
                          </h4>
                          {isWeather && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                              Live Open-Meteo Tool
                            </span>
                          )}
                          {isAttraction && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Live OpenStreetMap Tool
                            </span>
                          )}
                          {isAccommodation && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Live Accommodation Tool
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${pStyle}`}>
                        {task.priority || 'medium'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Done
                      </span>
                    </div>
                  </div>

                  {/* Task Execution Output */}
                  {task.execution_output && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs flex items-start gap-2 text-slate-300">
                      <Cpu className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{task.execution_output}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
