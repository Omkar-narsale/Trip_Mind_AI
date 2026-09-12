import React from 'react';
import { MapPin, Calendar, Users, IndianRupee, ArrowRight, Sparkles, ArrowRightLeft } from 'lucide-react';

export default function TripSearchWidget({
  formData,
  onChange,
  onSubmit,
  loading = false,
  className = ""
}) {
  return (
    <div className={`w-full max-w-6xl mx-auto rounded-3xl bg-white/95 backdrop-blur-xl p-4 sm:p-6 shadow-hero-search border border-cream-300 transition-all duration-300 ${className}`}>
      {/* Top Meta Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-forest-600" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
            Where are you going?
          </span>
        </div>
        <span className="text-xs font-medium text-travel-muted">
          Personalized journeys powered by live intelligence
        </span>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch"
      >
        {/* 1. Origin (Col 2) */}
        <div className="lg:col-span-2 p-3 sm:px-3.5 rounded-2xl bg-cream-100/90 hover:bg-cream-200/90 border border-cream-300/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between">
          <label className="text-[11px] font-bold text-travel-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
            <span>From</span>
          </label>
          <input
            type="text"
            value={formData.origin || ''}
            onChange={(e) => onChange('origin', e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full bg-transparent text-travel-dark font-bold text-sm focus:outline-none placeholder:text-stone-400 truncate"
            required
          />
        </div>

        {/* 2. Destination (Col 2) */}
        <div className="lg:col-span-2 p-3 sm:px-3.5 rounded-2xl bg-cream-100/90 hover:bg-cream-200/90 border border-cream-300/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between">
          <label className="text-[11px] font-bold text-travel-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
            <span>Destination</span>
          </label>
          <input
            type="text"
            value={formData.destination || ''}
            onChange={(e) => onChange('destination', e.target.value)}
            placeholder="e.g. Jaipur"
            className="w-full bg-transparent text-travel-dark font-bold text-sm focus:outline-none placeholder:text-stone-400 truncate"
            required
          />
        </div>

        {/* 3. Dates (Col 3 - Expanded to prevent date clipping) */}
        <div className="lg:col-span-3 p-3 sm:px-3.5 rounded-2xl bg-cream-100/90 hover:bg-cream-200/90 border border-cream-300/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between">
          <label className="text-[11px] font-bold text-travel-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-forest-600 shrink-0" />
            <span>Travel Dates</span>
          </label>
          <div className="grid grid-cols-2 gap-2 items-center">
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase text-travel-muted block leading-none mb-0.5">Depart</span>
              <input
                type="date"
                value={formData.departure_date || ''}
                onChange={(e) => onChange('departure_date', e.target.value)}
                className="w-full bg-transparent text-travel-dark font-bold text-xs focus:outline-none cursor-pointer"
                required
              />
            </div>
            <div className="min-w-0 border-l border-cream-300 pl-2">
              <span className="text-[9px] font-bold uppercase text-travel-muted block leading-none mb-0.5">Return</span>
              <input
                type="date"
                value={formData.return_date || ''}
                onChange={(e) => onChange('return_date', e.target.value)}
                className="w-full bg-transparent text-travel-dark font-bold text-xs focus:outline-none cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        {/* 4. Party & Budget (Col 3 - Expanded for comfortable spacing) */}
        <div className="lg:col-span-3 p-3 sm:px-3.5 rounded-2xl bg-cream-100/90 hover:bg-cream-200/90 border border-cream-300/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between">
          <label className="text-[11px] font-bold text-travel-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-forest-600 shrink-0" />
            <span>Party & Budget</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <select
                value={formData.travelers || 4}
                onChange={(e) => onChange('travelers', parseInt(e.target.value, 10))}
                className="w-full bg-transparent text-travel-dark font-bold text-xs focus:outline-none cursor-pointer truncate"
              >
                <option value="1">1 Solo</option>
                <option value="2">2 Couple</option>
                <option value="3">3 Small Group</option>
                <option value="4">4 Family/Group</option>
                <option value="6">6 Group</option>
              </select>
            </div>
            <span className="text-cream-400 font-bold">|</span>
            <div className="flex-1 min-w-0 flex items-center text-xs font-bold text-travel-dark">
              <span className="text-forest-700 font-extrabold mr-0.5">₹</span>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => onChange('budget', e.target.value)}
                placeholder="60,000"
                className="w-full bg-transparent text-travel-dark font-bold text-xs focus:outline-none placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>

        {/* 5. Submit Action Button (Col 2) */}
        <div className="lg:col-span-2 flex items-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-full min-h-[54px] rounded-2xl bg-forest-700 hover:bg-forest-800 active:scale-[0.98] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Crafting Plan...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-forest-200 group-hover:rotate-12 transition-transform" />
                <span className="whitespace-nowrap">Plan My Trip</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
