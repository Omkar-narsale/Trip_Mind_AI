import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Sparkles, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';

const BUDGET_TIER_STYLES = {
  Budget: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Moderate: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Premium: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Luxury: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
};

export default function TripHero({ tripRequest, tripAnalysis }) {
  if (!tripRequest) return null;

  const origin = tripRequest.origin;
  const destination = tripRequest.destination;
  const departure = tripRequest.departure_date;
  const returnDate = tripRequest.return_date;
  const travelers = tripRequest.travelers;
  const budget = tripRequest.budget;
  const duration = tripAnalysis?.duration_days || 1;
  const budgetTier = tripAnalysis?.budget_level || 'Moderate';
  const tierStyle = BUDGET_TIER_STYLES[budgetTier] || BUDGET_TIER_STYLES.Moderate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-dark-900 via-dark-850 to-dark-900 border border-white/10 p-6 sm:p-8 md:p-10 shadow-card"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        
        {/* Top Mini Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Trip Intelligence Profile</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierStyle}`}>
              {budgetTier} Tier
            </span>
          </div>
        </div>

        {/* Hero Origin -> Destination Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
              Journey Route
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              <span className="text-slate-300 font-semibold">{origin}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Plane className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-45" />
              </div>
              <span className="bg-gradient-to-r from-brand-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                {destination}
              </span>
            </div>
          </div>

          {/* Quick Summary Capsule */}
          {tripAnalysis?.trip_summary && (
            <div className="max-w-md p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed backdrop-blur-md">
              <span className="text-brand-400 font-semibold block mb-0.5">Executive Summary</span>
              {tripAnalysis.trip_summary}
            </div>
          )}
        </div>

        {/* Compact Metadata Row */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>Dates</span>
            </div>
            <p className="text-sm font-bold text-white truncate">
              {departure} <span className="text-slate-500 font-normal">to</span> {returnDate}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duration</span>
            </div>
            <p className="text-sm font-bold text-white">
              {duration} <span className="text-slate-400 text-xs font-normal">Days</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Party Size</span>
            </div>
            <p className="text-sm font-bold text-white">
              {travelers} <span className="text-slate-400 text-xs font-normal">Traveler{travelers > 1 ? 's' : ''}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Budget</span>
            </div>
            <p className="text-sm font-bold text-white">
              ${Number(budget).toLocaleString()} <span className="text-slate-400 text-xs font-normal">USD</span>
            </p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
