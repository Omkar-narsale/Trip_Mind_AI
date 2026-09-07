import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Target, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  ListOrdered, 
  Sparkles, 
  Activity, 
  Terminal,
  Info
} from 'lucide-react';
import PlanningTaskList from './PlanningTaskList';

export default function AgentPlanning({ planningResult, execution }) {
  if (!planningResult) return null;

  const { overall_goal, planning_strategy, key_constraints, tasks } = planningResult;
  const { status, completed_tasks, messages } = execution || {};

  const displayedTasks = tasks && tasks.length > 0 ? tasks : (completed_tasks || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pt-8 border-t border-slate-200"
    >
      <div className="bg-gradient-to-b from-white to-slate-50/70 rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-8">
        
        {/* Header with Title & Agent Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  LangGraph Autonomous Travel Planning Agent
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  Phase 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Autonomous Task Decomposition & Dependency Execution Graph
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Planning Workflow Ready</span>
            </span>
          </div>
        </div>

        {/* Overall Goal Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50/90 to-indigo-50/50 border border-brand-100/90 shadow-soft">
          <div className="flex items-center gap-2 text-brand-900 text-sm font-bold mb-2">
            <Target className="w-4 h-4 text-brand-600" />
            <span>High-Level Planning Objective</span>
          </div>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {overall_goal}
          </p>
        </div>

        {/* Planning Strategy & Key Constraints Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Autonomous Planning Strategy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft">
            <div className="flex items-center gap-2 text-slate-900 text-sm font-bold mb-3">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Autonomous Planning Strategy</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {planning_strategy}
            </p>
          </div>

          {/* Key Constraints Factored In */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft">
            <div className="flex items-center gap-2 text-slate-900 text-sm font-bold mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Key Constraints Factored In</span>
            </div>
            {key_constraints && key_constraints.length > 0 ? (
              <ul className="space-y-1.5">
                {key_constraints.map((constraint, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Standard trip constraints applied.</p>
            )}
          </div>
        </div>

        {/* Sequenced Tasks Workflow List */}
        <PlanningTaskList tasks={displayedTasks} />

        {/* Agent Execution Trace Log */}
        {messages && messages.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 shadow-card">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-brand-300 mb-3 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-brand-400" />
              <span>Agent Execution Trace</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs text-slate-300">
              {messages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-brand-400 select-none">›</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notice for Future Phase Integration */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Autonomous Execution Note: </span>
            Planning workflow simulation completed. Live travel API data retrieval (weather, accommodations, attractions) and itinerary day-by-day generation will take place in subsequent phases.
          </div>
        </div>

      </div>
    </motion.div>
  );
}
