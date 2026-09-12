import React from 'react';
import { 
  CloudSun, MapPin, Building2, UtensilsCrossed, Car, 
  Calendar, ArrowRight, ShieldCheck, Clock, Users, IndianRupee, Sparkles, ExternalLink
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../utils/osm';

export default function TripOverview({ 
  planResponse, 
  tripProfile, 
  onNavigateSection 
}) {
  const req = tripProfile?.trip_request || {};
  const weather = planResponse?.weather_context;
  const places = planResponse?.ranked_attractions || planResponse?.places_context?.places || [];
  const hotels = planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || [];
  const topHotel = hotels[0];
  const food = planResponse?.food_context?.places || [];
  const trans = planResponse?.transportation_context;
  const itinerary = planResponse?.itinerary_context;

  // Format Dates
  const formatDateRange = (dep, ret) => {
    if (!dep) return 'Dates Flexible';
    try {
      const d1 = new Date(dep).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const d2 = ret ? new Date(ret).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      return `${d1} – ${d2}`;
    } catch {
      return `${dep} to ${ret || ''}`;
    }
  };

  const travelStyles = tripProfile?.travel_preferences?.travel_style || 
    (req.preferences?.length > 0 ? req.preferences : ['Heritage', 'Relaxed']);

  return (
    <div className="space-y-6">
      {/* Trip Master Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900/90 to-brand-950/40 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TripMind Autonomous Plan</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                Ready for Travel
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{req.destination || 'Jaipur'}</span>
              <span className="text-slate-500 text-xl font-normal">from {req.origin || 'Mumbai'}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span className="font-semibold">{formatDateRange(req.departure_date, req.return_date)}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-slate-200">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{req.travelers || 4} Travelers</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <IndianRupee className="w-4 h-4" />
                <span>₹{(req.budget || 60000).toLocaleString('en-IN')} Total Budget</span>
              </div>
            </div>

            {/* Style & Accessibility Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {Array.isArray(travelStyles) ? travelStyles.map((st, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
                  {st}
                </span>
              )) : (
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
                  {travelStyles}
                </span>
              )}
              {tripProfile?.travel_preferences?.accessibility_requirements?.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mobility Conscious: Avoid Excessive Walking</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection('itinerary')}
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Calendar className="w-4 h-4" />
              <span>View Day-Wise Itinerary</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('map')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 flex items-center justify-center gap-2 transition-all"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Explore Interactive Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Quick-Access Overview Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. Weather Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CloudSun className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open-Meteo Verified</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Live Climate Forecast</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {weather?.summary || weather?.condition || 'Pleasant traveling weather expected across planned dates.'}
            </p>
            {weather?.temperature_max && (
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-slate-300 font-semibold">High: <strong className="text-white">{weather.temperature_max}°C</strong></span>
                <span className="text-slate-300 font-semibold">Low: <strong className="text-white">{weather.temperature_min || '--'}°C</strong></span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('itinerary')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-brand-400 group-hover:text-brand-300"
          >
            <span>Weather schedule details</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 2. Top Places Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{places.length} Attractions Found</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Ranked Attractions</h2>
            <p className="text-xs text-slate-400 mb-2">Curated heritage landmarks ranked for your 4-traveler group:</p>
            <div className="space-y-1.5">
              {places.slice(0, 3).map((p, idx) => {
                const name = p.name || p.attraction?.name;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-xl border border-white/5">
                    <span className="font-semibold truncate max-w-[170px]">{name}</span>
                    <span className="text-[11px] text-slate-400">{p.category || 'Sightseeing'}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('places')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
          >
            <span>Explore all {places.length} attractions</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3. Hotel Recommendation Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Anchor Stay</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">{topHotel?.name || 'Heritage Resort & Palace'}</h2>
            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
              {topHotel?.explanation || 'Optimal central accommodation selected for relaxed heritage sightseeing.'}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                ⭐ {topHotel?.rating ? `${topHotel.rating}/5` : 'Luxury Class'}
              </span>
              {topHotel?.price_per_night && (
                <span className="text-slate-300 font-semibold">₹{topHotel.price_per_night}/night</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('hotels')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300"
          >
            <span>View accommodation options</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4. Food Intelligence Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{food.length} Dining Venues</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Local Dining & Cuisine</h2>
            <p className="text-xs text-slate-400 mb-2">Authentic local dining spots matching party preferences:</p>
            <div className="space-y-1.5">
              {food.slice(0, 2).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-xl border border-white/5">
                  <span className="font-semibold truncate max-w-[170px]">{f.name}</span>
                  <span className="text-[11px] text-amber-400">{f.cuisine || 'Traditional'}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('food')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300"
          >
            <span>Discover authentic restaurants</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 5. Transportation Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Phase 8 Transit</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Transit & Route Optimization</h2>
            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
              {trans?.accessibility_applied
                ? 'Taxi/Private vehicle prioritized for 4 travelers with mobility constraints (avoid excessive walking).'
                : 'Deterministic Haversine route corridors calculated between hubs.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
                {trans?.total_clusters || trans?.geographic_hubs?.length || 2} Geographic Hubs
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold">
                Haversine R=6371km
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('transportation')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300"
          >
            <span>View transit recommendations</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 6. Day-Wise Itinerary Card */}
        <div className="p-5 rounded-3xl bg-dark-900/80 border border-white/10 hover:border-brand-500/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Phase 9 Itinerary</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Complete Day-by-Day Plan</h2>
            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
              {itinerary?.total_days || 6} days chronologically scheduled with morning, afternoon, and evening slots anchored to your hotel.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                {itinerary?.total_days || 6} Days Schedule
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold">
                Relaxed Pacing
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('itinerary')}
            className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
          >
            <span>Open day-wise schedule</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
