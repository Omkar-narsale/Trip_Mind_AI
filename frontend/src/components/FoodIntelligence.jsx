import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Utensils,
   Coffee,
   MapPin,
   ExternalLink,
   Sparkles,
   ChevronDown,
   ChevronUp,
   DollarSign,
   ShieldCheck,
   Tag,
   Clock
 } from 'lucide-react';
import { getOpenStreetMapUrl } from '../utils/osm';

export default function FoodIntelligence({ foodContext, destination }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  if (!foodContext || !foodContext.venues || foodContext.venues.length === 0) {
    return null;
  }

  const { venues, total_found, message, source_status } = foodContext;

  const categories = ['All', ...new Set(venues.map(v => v.cuisine || 'Local Cuisine'))].slice(0, 6);

  const filteredVenues = selectedFilter === 'All'
    ? venues
    : venues.filter(v => (v.cuisine || 'Local Cuisine') === selectedFilter);

  const displayedVenues = showAll ? filteredVenues : filteredVenues.slice(0, 6);

  return (
    <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-6 sm:p-8 shadow-card backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Utensils className="w-3.5 h-3.5" />
            <span>Culinary & Dining Intelligence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Verified Dining in {destination || 'Destination'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {total_found} authentic dining venues discovered via OpenStreetMap, matched with your dietary preferences and budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OSM Verified</span>
          </span>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedFilter === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5 hover:bg-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedVenues.map((venue, idx) => {
          const osmUrl = getOpenStreetMapUrl(venue.latitude, venue.longitude);
          return (
            <motion.div
              key={venue.name + idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    {venue.cuisine?.toLowerCase().includes('cafe') ? (
                      <Coffee className="w-4 h-4" />
                    ) : (
                      <Utensils className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {venue.price_level && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                        {venue.price_level}
                      </span>
                    )}
                    {venue.relevance_score && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {venue.relevance_score}% Match
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {venue.name}
                  </h4>
                  <p className="text-xs text-amber-400/90 font-medium">
                    {venue.cuisine || 'Local Cuisine'}
                  </p>
                </div>

                {venue.address && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {venue.address}
                  </p>
                )}

                {venue.suitability_reason && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
                    "{venue.suitability_reason}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {venue.distance_km !== null && venue.distance_km !== undefined
                    ? `${venue.distance_km} km away`
                    : 'Destination center'}
                </span>

                {osmUrl && (
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[11px] font-medium transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span>OpenStreetMap</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {filteredVenues.length > 6 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {showAll ? (
              <>
                <span>Show Fewer Venues</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View All {filteredVenues.length} Venues</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
