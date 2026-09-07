import React from 'react';
import { motion } from 'framer-motion';
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
  Tag
} from 'lucide-react';

const BUDGET_BADGES = {
  Budget: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Moderate: 'bg-blue-50 text-blue-700 border-blue-200',
  Premium: 'bg-purple-50 text-purple-700 border-purple-200',
  Luxury: 'bg-amber-50 text-amber-800 border-amber-200'
};

export default function TripAnalysis({ analysis, originalTrip }) {
  if (!analysis) return null;

  const budgetStyle = BUDGET_BADGES[analysis.budget_level] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pt-8 border-t border-slate-200"
    >
      <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card">
        
        {/* Header with AI Badge & Tier */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                AI Trip Goal Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Powered by Groq LLM Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${budgetStyle} flex items-center gap-1.5 shadow-sm`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {analysis.budget_level} Tier
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {analysis.duration_days} Day{analysis.duration_days > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-6 p-4 rounded-xl bg-brand-50/60 border border-brand-100 text-slate-800 text-sm leading-relaxed">
          <span className="font-semibold text-brand-900 block mb-1">Executive Summary</span>
          {analysis.trip_summary}
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Duration */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Duration</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {analysis.duration_days} <span className="text-xs font-normal text-slate-500">Days Total</span>
            </p>
          </div>

          {/* Travel Style */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Compass className="w-4 h-4 text-purple-500" />
              <span>Travel Style</span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate" title={analysis.travel_style}>
              {analysis.travel_style}
            </p>
          </div>

          {/* Budget Per Traveler */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Per Traveler</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ${Number(analysis.budget_per_traveler).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
            </p>
          </div>

          {/* Budget Per Day */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <DollarSign className="w-4 h-4 text-cyan-500" />
              <span>Per Day Budget</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ${Number(analysis.budget_per_day).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD/day</span>
            </p>
          </div>

        </div>

        {/* Two Columns: Priorities & Activities */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Priority Preferences */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold mb-3">
              <Tag className="w-4 h-4 text-brand-600" />
              <span>Priority Preferences</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.priority_preferences?.length > 0 ? (
                analysis.priority_preferences.map((pref, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                  >
                    {pref}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Standard leisure exploration</span>
              )}
            </div>
          </div>

          {/* Suggested Activities */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-soft">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold mb-3">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Suggested Activity Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.suggested_activity_categories?.length > 0 ? (
                analysis.suggested_activity_categories.map((act, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200/80"
                  >
                    {act}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Custom activities to be refined</span>
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
            {analysis.accommodation_expectation}
          </p>
        </div>

        {/* Planning Constraints */}
        {analysis.planning_constraints && analysis.planning_constraints.length > 0 && (
          <div className="mt-6 p-5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Identified Planning Constraints</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-amber-800">
              {analysis.planning_constraints.map((constraint, i) => (
                <li key={i}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Notes */}
        {analysis.notes && (
          <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">AI Planning Notes: </span>
              {analysis.notes}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Goal Requirements Structured
          </span>
          <span>Phase 2 Verified</span>
        </div>

      </div>
    </motion.div>
  );
}
