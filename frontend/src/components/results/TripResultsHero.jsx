import React from 'react';
import { MapPin, Calendar, Users, IndianRupee, ArrowRight, Sparkles, Navigation, RotateCcw } from 'lucide-react';
import { getDestinationImage } from '../../utils/travelImages';

export default function TripResultsHero({
  destination,
  origin,
  departureDate,
  returnDate,
  travelers,
  budget,
  styles,
  totalDays = 6,
  onNavigateTab,
  onNewTrip
}) {
  const heroImage = getDestinationImage(destination);

  const formatDateRange = (dep, ret) => {
    if (!dep) return '11 Sep — 16 Sep 2026';
    try {
      const d1 = new Date(dep).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const d2 = ret ? new Date(ret).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return `${d1} — ${d2}`;
    } catch {
      return `${dep} — ${ret || ''}`;
    }
  };

  const styleText = Array.isArray(styles) && styles.length > 0 
    ? styles.join(', ').toLowerCase() 
    : 'heritage, food and relaxation';

  return (
    <div className="relative rounded-4xl overflow-hidden shadow-2xl border border-cream-300 min-h-[460px] sm:min-h-[500px] flex flex-col justify-between p-8 sm:p-12 text-white mb-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Top Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
          <Sparkles className="w-3.5 h-3.5 text-forest-200" />
          <span>Curated Journey</span>
        </div>

        {onNewTrip && (
          <button
            type="button"
            onClick={onNewTrip}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Plan another trip</span>
          </button>
        )}
      </div>

      {/* Center Heading & Subtitle */}
      <div className="relative z-10 max-w-3xl my-auto py-6">
        <span className="text-xs sm:text-sm font-semibold text-cream-200 uppercase tracking-wider block mb-1">
          {origin || 'Mumbai'} → {destination || 'Jaipur'}
        </span>
        <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight mb-3">
          Your {destination || 'Jaipur'} journey
        </h1>
        <p className="text-sm sm:text-base text-white/90 max-w-xl font-normal leading-relaxed">
          {totalDays} days of {styleText} thoughtfully paced with comfortable transit and handpicked stays.
        </p>

        {/* Quick Jump Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => onNavigateTab('itinerary')}
            className="px-6 py-3 rounded-full bg-white text-forest-800 hover:bg-cream-100 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-forest-700" />
            <span>View itinerary</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('map')}
            className="px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Explore map</span>
          </button>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-white/90">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>{formatDateRange(departureDate, returnDate)}</span>
          </div>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-300" />
            <span>{travelers || 4} travelers</span>
          </div>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <IndianRupee className="w-4 h-4" />
            <span>₹{(budget || 60000).toLocaleString('en-IN')} total budget</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-white/70 text-[11px]">
          <span>Verified live weather & OpenStreetMap locations</span>
        </div>
      </div>
    </div>
  );
}
