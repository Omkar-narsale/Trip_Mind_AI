import React from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Gauge, 
  Users, 
  Tag, 
  ShieldAlert, 
  Home, 
  Utensils, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export default function TripIntelligence({ profile }) {
  if (!profile) return null;

  const { trip_request, trip_analysis, travel_preferences, combined_constraints } = profile;

  const travelStyle = trip_analysis?.travel_style || 'Cultural exploration';
  const pace = travel_preferences?.pace || 'Moderate';
  const mood = travel_preferences?.travel_mood || 'Balanced';
  const groupContext = travel_preferences?.traveler_context || `${trip_request?.travelers || 1} traveler(s)`;
  const food = travel_preferences?.food_preferences;
  const accommodation = trip_analysis?.accommodation_expectation;
  const preferences = trip_request?.preferences || [];
  const activityThemes = trip_analysis?.suggested_activity_categories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Trip Intelligence & Nuances
            </h3>
            <p className="text-xs text-slate-400">
              Synthesized travel preferences, pacing, and group constraints
            </p>
          </div>
        </div>
      </div>

      {/* High-Signal Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>Travel Style</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white truncate" title={travelStyle}>
            {travelStyle}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pacing & Mood</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white truncate">
            {pace} · {mood}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Group Context</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white truncate" title={groupContext}>
            {groupContext}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lodging Tier</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white truncate" title={accommodation}>
            {accommodation || 'Standard'}
          </p>
        </div>
      </div>

      {/* Interest Tags & Culinary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Curated Themes */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
            <Tag className="w-3.5 h-3.5 text-brand-400" />
            <span>Prioritized Interests & Themes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {preferences.concat(activityThemes).slice(0, 8).map((theme, i) => (
              <span 
                key={i}
                className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Food & Preferences */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
            <Utensils className="w-3.5 h-3.5 text-cyan-400" />
            <span>Culinary & Transit Style</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {food ? `Food: ${food}. ` : ''}
            {travel_preferences?.transportation_preferences ? `Transit: ${travel_preferences.transportation_preferences}.` : 'Standard local mobility.'}
          </p>
        </div>

      </div>

      {/* Consolidated Planning Constraints */}
      {combined_constraints && combined_constraints.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Consolidated Planning Constraints</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {combined_constraints.map((c, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
