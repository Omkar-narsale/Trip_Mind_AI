import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Compass, 
  DollarSign, 
  Users, 
  Layers, 
  Home, 
  AlertTriangle, 
  Info,
  CheckCircle2, 
  Tag, 
  FileText, 
  AlertCircle,
  Bot,
  ArrowRight,
  Loader2
} from 'lucide-react';
import TravelPreferences from './TravelPreferences';
import AgentPlanning from './AgentPlanning';

const BUDGET_BADGES = {
  Budget: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Moderate: 'bg-blue-50 text-blue-700 border-blue-200',
  Premium: 'bg-purple-50 text-purple-700 border-purple-200',
  Luxury: 'bg-amber-50 text-amber-800 border-amber-200'
};

const AGENT_LOADING_STEPS = [
  "TripMind is analyzing your travel requirements...",
  "Identifying planning priorities...",
  "Building your autonomous planning workflow...",
  "Validating task dependencies..."
];

export default function EnhancedTripProfile({ profile, warning }) {
  if (!profile) return null;

  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [planningError, setPlanningError] = useState(null);
  const [planningResult, setPlanningResult] = useState(null);
  const [planningExecution, setPlanningExecution] = useState(null);

  // Cycle loading messages during agent planning
  useEffect(() => {
    let interval = null;
    if (planningLoading) {
      setPlanningStep(0);
      interval = setInterval(() => {
        setPlanningStep((prev) => (prev + 1) % AGENT_LOADING_STEPS.length);
      }, 2000);
    } else {
      setPlanningStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [planningLoading]);

  const handleStartPlanning = async () => {
    setPlanningLoading(true);
    setPlanningError(null);
    setPlanningResult(null);
    setPlanningExecution(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/trip/plan` 
        : 'http://127.0.0.1:8000/api/trip/plan';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const data = await res.json();

      if (!res.ok) {
        let errMessage = 'Autonomous planning agent failed to construct workflow.';
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errMessage = data.detail.map((d) => d.msg || d.message).join(', ');
          } else {
            errMessage = data.detail;
          }
        }
        throw new Error(errMessage);
      }

      if (data.planning_result) {
        setPlanningResult(data.planning_result);
        setPlanningExecution(data.execution);
      } else {
        throw new Error('Incomplete planning workflow received from server.');
      }
    } catch (err) {
      console.error(err);
      setPlanningError(err.message || 'Unable to execute planning workflow. Please try again.');
    } finally {
      setPlanningLoading(false);
    }
  };

  const { trip_request, trip_analysis, travel_preferences, combined_constraints } = profile;
  const budgetStyle = BUDGET_BADGES[trip_analysis?.budget_level] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pt-8 border-t border-slate-200"
    >
      <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card">
        
        {/* Warning Banner if any partial degradation occurred */}
        {warning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice: </span>
              {warning}
            </div>
          </div>
        )}

        {/* Header with Title & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Enhanced Trip Profile
              </h3>
              <p className="text-xs text-slate-500">
                Natural-Language Travel Requirement Analysis & Synthesis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${budgetStyle} flex items-center gap-1.5 shadow-sm`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {trip_analysis?.budget_level} Tier
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {trip_analysis?.duration_days} Day{trip_analysis?.duration_days > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-6 p-4 rounded-xl bg-brand-50/60 border border-brand-100 text-slate-800 text-sm leading-relaxed">
          <span className="font-semibold text-brand-900 block mb-1">Executive Summary</span>
          {trip_analysis?.trip_summary}
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Duration</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {trip_analysis?.duration_days} <span className="text-xs font-normal text-slate-500">Days</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Compass className="w-4 h-4 text-purple-500" />
              <span>Travel Style</span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate" title={trip_analysis?.travel_style}>
              {trip_analysis?.travel_style}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Per Traveler</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ${Number(trip_analysis?.budget_per_traveler).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <DollarSign className="w-4 h-4 text-cyan-500" />
              <span>Daily Budget</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ${Number(trip_analysis?.budget_per_day).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD/day</span>
            </p>
          </div>
        </div>

        {/* Form Explicit Preferences & Suggested Categories */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold mb-3">
              <Tag className="w-4 h-4 text-brand-600" />
              <span>Form Explicit Preferences</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trip_request?.preferences?.length > 0 ? (
                trip_request.preferences.map((pref, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                  >
                    {pref}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No category checkboxes chosen</span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold mb-3">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Suggested Activity Themes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trip_analysis?.suggested_activity_categories?.length > 0 ? (
                trip_analysis.suggested_activity_categories.map((act, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200/80"
                  >
                    {act}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Custom activities to be calibrated</span>
              )}
            </div>
          </div>
        </div>

        {/* Accommodation Expectations */}
        <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold mb-2">
            <Home className="w-4 h-4 text-brand-600" />
            <span>Accommodation Expectations</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {trip_analysis?.accommodation_expectation}
          </p>
        </div>

        {/* Extracted Natural Language Travel Preferences Component */}
        {travel_preferences && (
          <TravelPreferences preferences={travel_preferences} />
        )}

        {/* Consolidated Planning Constraints */}
        {combined_constraints && combined_constraints.length > 0 && (
          <div className="mt-6 p-5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Consolidated Planning Constraints & Nuances</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-800">
              {combined_constraints.map((constraint, i) => (
                <li key={i}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Notes */}
        {trip_analysis?.notes && (
          <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">AI Planning Notes: </span>
              {trip_analysis.notes}
            </div>
          </div>
        )}

        {/* Phase 4: Create AI Planning Workflow CTA Box */}
        <div className="mt-8 pt-6 border-t border-slate-200/90">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5" />
                <span>Phase 4 Autonomous Agent</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Ready to generate the autonomous planning workflow?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Let the TripMind LangGraph agent decompose your trip parameters, sequence dependency-aware planning tasks, and validate the workflow structure.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartPlanning}
              disabled={planningLoading}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all flex items-center justify-center gap-2.5 flex-shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {planningLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-200" />
                  <span className="animate-pulse">{AGENT_LOADING_STEPS[planningStep]}</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Create AI Planning Workflow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Planning Error Display */}
          {planningError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-semibold">Planning Agent Error: </span>
                {planningError}
              </div>
            </motion.div>
          )}
        </div>

        {/* Phase 4 LangGraph Agent Planning Result Component */}
        <AnimatePresence>
          {planningResult && (
            <AgentPlanning 
              planningResult={planningResult} 
              execution={planningExecution} 
            />
          )}
        </AnimatePresence>

        {/* Footer info badge */}
        <div className="mt-8 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Enhanced Profile Ready for LangGraph Agent
          </span>
          <span>Phase 4 Autonomous Workflow Engine</span>
        </div>

      </div>
    </motion.div>
  );
}
