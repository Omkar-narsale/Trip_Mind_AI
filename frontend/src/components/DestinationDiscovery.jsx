import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MapPin,
  Landmark,
  Trees,
  Eye,
  Palette,
  Sparkles,
  Smile,
  Utensils,
  Navigation,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Layers,
  CloudSun
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Museum & Heritage': Landmark,
  'Historical & Landmark': Landmark,
  'Nature & Outdoors': Trees,
  'Viewpoint & Scenic': Eye,
  'Culture & Arts': Palette,
  'Entertainment & Family': Smile,
  'Dining & Culinary': Utensils,
  'Attraction & Sightseeing': MapPin
};

function getCategoryIcon(category) {
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (category?.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return Icon;
    }
  }
  return MapPin;
}

function getMatchBadge(score) {
  if (score >= 85) {
    return {
      text: `${score}% Match`,
      badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      glowStyle: 'shadow-glow-brand'
    };
  } else if (score >= 70) {
    return {
      text: `${score}% Match`,
      badgeStyle: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
      glowStyle: ''
    };
  } else {
    return {
      text: `${score}% Match`,
      badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      glowStyle: ''
    };
  }
}

export default function DestinationDiscovery({ placesContext, rankedAttractions }) {
  const [showAll, setShowAll] = useState(false);

  if (!placesContext && (!rankedAttractions || rankedAttractions.length === 0)) {
    return null;
  }

  const { destination, total_found, source_status, message, latitude, longitude } = placesContext || {};
  const isError = source_status === 'error';
  const isNoResults = source_status === 'no_results' || (!rankedAttractions || rankedAttractions.length === 0);

  // Group into Top Matches (top 3) and Other Recommendations
  const topMatches = (rankedAttractions || []).slice(0, 3);
  const otherRecommendations = (rankedAttractions || []).slice(3);
  const displayedOther = showAll ? otherRecommendations : otherRecommendations.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>OpenStreetMap & Overpass POI Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Destination Discovery</span>
            {destination && <span className="text-brand-400 font-normal">· {destination}</span>}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Real geographical points of interest curated & ranked against your travel profile
          </p>
        </div>

        {/* Source Badge & Lat/Long Info */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {latitude && longitude && (
            <span className="px-3 py-1 rounded-xl bg-white/[0.02] border border-white/10 text-slate-400 text-xs font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>{latitude.toFixed(3)}°, {longitude.toFixed(3)}°</span>
            </span>
          )}
          <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            {total_found || (rankedAttractions ? rankedAttractions.length : 0)} Verified POIs
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Destination Discovery Advisory: </span>
            {message || 'Destination places could not be retrieved right now.'}
          </div>
        </div>
      )}

      {/* No Results Notice */}
      {!isError && isNoResults && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
          <Compass className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No matching attractions were found.</p>
          <p className="text-xs text-slate-500">
            {message || 'Try widening the search destination query or adjusting constraint filters.'}
          </p>
        </div>
      )}

      {/* Top Matches Section */}
      {!isError && topMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Top Matches for Your Travel Style</span>
            </h4>
            <span className="text-xs text-slate-400 font-medium">Ranked by Groq AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMatches.map((item, idx) => {
              const { place, relevance_score, matched_preferences, suitability_reason, potential_considerations } = item;
              const IconComponent = getCategoryIcon(place.category);
              const badge = getMatchBadge(relevance_score);

              return (
                <motion.div
                  key={place.place_id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-brand-500/40 p-5 flex flex-col justify-between transition-all duration-300 group shadow-soft"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Category & Match Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">
                          {place.category}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.badgeStyle}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Name & Distance */}
                    <div>
                      <h5 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                        {place.name}
                      </h5>
                      {place.distance_km !== null && place.distance_km !== undefined && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Navigation className="w-3 h-3 text-slate-500" />
                          <span>{place.distance_km} km from destination center</span>
                        </div>
                      )}
                    </div>

                    {/* Matched Preferences Chips */}
                    {matched_preferences && matched_preferences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {matched_preferences.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suitability Reason */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                      "{suitability_reason}"
                    </p>
                  </div>

                  {/* Potential Considerations / Caveats */}
                  {potential_considerations && potential_considerations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                      {potential_considerations.map((note, nIdx) => (
                        <div key={nIdx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Recommendations Section */}
      {!isError && otherRecommendations.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Other Recommended Attractions ({otherRecommendations.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayedOther.map((item, idx) => {
              const { place, relevance_score, suitability_reason } = item;
              const IconComponent = getCategoryIcon(place.category);
              const badge = getMatchBadge(relevance_score);

              return (
                <motion.div
                  key={place.place_id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-300 group-hover:bg-brand-500/10 transition-colors">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.badgeStyle}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div>
                    <h6 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {place.name}
                    </h6>
                    <p className="text-[11px] text-slate-400">
                      {place.category}
                      {place.distance_km !== null && ` · ${place.distance_km}km`}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {suitability_reason}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Show More / Less Button */}
          {otherRecommendations.length > 4 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                {showAll ? (
                  <>
                    <span>Show Fewer Places</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>View All {otherRecommendations.length} Recommendations</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Honest Attribution Footer */}
      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real geographical data provided by OpenStreetMap contributors & Overpass API.</span>
        </div>
        <span>No synthetic or fabricated attractions generated.</span>
      </div>
    </motion.div>
  );
}
