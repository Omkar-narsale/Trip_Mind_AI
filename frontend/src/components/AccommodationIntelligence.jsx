import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel as HotelIcon,
  Building,
  Home,
  Compass,
  MapPin,
  Sparkles,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
  ShieldCheck,
  BedDouble,
  Navigation
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../utils/osm';

const ACCOMMODATION_ICONS = {
  'Hotel': HotelIcon,
  'Boutique Hotel': Building,
  'Resort': Sparkles,
  'Hostel': BedDouble,
  'Guest House / B&B': Home,
  'Apartment / Suite': Building,
  'Motel': HotelIcon
};

function getAccommodationIcon(type) {
  for (const [key, Icon] of Object.entries(ACCOMMODATION_ICONS)) {
    if (type?.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return Icon;
    }
  }
  return HotelIcon;
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
      badgeStyle: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
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

export default function AccommodationIntelligence({ hotelContext, rankedHotels }) {
  const [showAll, setShowAll] = useState(false);

  if (!hotelContext && (!rankedHotels || rankedHotels.length === 0)) {
    return null;
  }

  const { destination, total_found, source_status, message } = hotelContext || {};
  const isError = source_status === 'error';
  const isNoResults = source_status === 'no_results' || (!rankedHotels || rankedHotels.length === 0);

  // Group into Top Match (first 1-2) and Other Options
  const topMatch = rankedHotels && rankedHotels.length > 0 ? rankedHotels[0] : null;
  const secondaryTop = rankedHotels && rankedHotels.length > 1 ? rankedHotels[1] : null;
  const otherOptions = rankedHotels && rankedHotels.length > 2 ? rankedHotels.slice(2) : [];
  const displayedOther = showAll ? otherOptions : otherOptions.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <HotelIcon className="w-3.5 h-3.5" />
            <span>Accommodation Intelligence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Stay Recommendations</span>
            {destination && <span className="text-purple-400 font-normal">· {destination}</span>}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            AI-selected accommodation options based on your budget and travel style.
          </p>
        </div>

        {total_found > 0 && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{total_found} verified stays discovered</span>
            </div>
          </div>
        )}
      </div>

      {/* Error or Empty State */}
      {isError && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Accommodation Data Advisory: </span>
            {message || "Could not retrieve live accommodation data for this location."}
          </div>
        </div>
      )}

      {isNoResults && !isError && (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <HotelIcon className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No accommodation data is currently available.</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No verified properties were located within the standard radius of this destination.
          </p>
        </div>
      )}

      {/* TOP MATCH CARD */}
      {topMatch && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Top Match
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Rank #1 Pick
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-950/40 via-dark-850 to-dark-900 border border-purple-500/30 shadow-card space-y-5">
            {/* Top Match Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                    {React.createElement(getAccommodationIcon(topMatch.hotel.accommodation_type), { className: 'w-3 h-3' })}
                    <span>{topMatch.hotel.accommodation_type || 'Hotel'}</span>
                  </span>

                  {topMatch.hotel.rating && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{topMatch.hotel.rating} Stars</span>
                    </span>
                  )}

                  {topMatch.hotel.distance_km !== null && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-500" />
                      <span>{topMatch.hotel.distance_km} km from center</span>
                    </span>
                  )}
                </div>

                <h4 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {topMatch.hotel.name}
                </h4>

                {topMatch.hotel.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>{topMatch.hotel.address}</span>
                  </p>
                )}
              </div>

              {/* Match Score & Price info */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                <div className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-extrabold border ${getMatchBadge(topMatch.relevance_score).badgeStyle} ${getMatchBadge(topMatch.relevance_score).glowStyle}`}>
                  {topMatch.relevance_score}% Match
                </div>

                <div className="text-right">
                  {topMatch.hotel.price ? (
                    <div className="text-sm font-bold text-emerald-400">
                      {topMatch.hotel.currency || '$'}{topMatch.hotel.price} <span className="text-[10px] text-slate-500 font-normal">/ night</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Check venue for live rates
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Why it matches & Considerations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block">
                  Why it matches:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {topMatch.suitability_reason}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                  Considerations:
                </span>
                <ul className="text-xs text-slate-300 space-y-0.5 leading-relaxed">
                  {topMatch.potential_considerations.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">·</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Matched preference chips & Official link */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {topMatch.matched_preferences.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1"
                  >
                    <Tag className="w-2.5 h-2.5 text-purple-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {topMatch.hotel.latitude && topMatch.hotel.longitude && (
                  <a
                    href={getOpenStreetMapUrl(topMatch.hotel.latitude, topMatch.hotel.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open in OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {topMatch.hotel.booking_url && (
                  <a
                    href={topMatch.hotel.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
                  >
                    <span>Official Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY TOP PICK (IF AVAILABLE) */}
      {secondaryTop && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/20 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                  {secondaryTop.hotel.accommodation_type || 'Hotel'}
                </span>
                {secondaryTop.hotel.rating && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{secondaryTop.hotel.rating} Stars</span>
                  </span>
                )}
                {secondaryTop.hotel.distance_km !== null && (
                  <span className="text-[11px] text-slate-500">
                    {secondaryTop.hotel.distance_km} km from center
                  </span>
                )}
              </div>
              <h5 className="text-base font-bold text-white">{secondaryTop.hotel.name}</h5>
              {secondaryTop.hotel.address && (
                <p className="text-xs text-slate-400 mt-0.5">{secondaryTop.hotel.address}</p>
              )}
            </div>

            <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex-shrink-0 ${getMatchBadge(secondaryTop.relevance_score).badgeStyle}`}>
              {secondaryTop.relevance_score}% Match
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {secondaryTop.suitability_reason}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
            <span>{secondaryTop.potential_considerations[0]}</span>
            {secondaryTop.hotel.booking_url && (
              <a
                href={secondaryTop.hotel.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-300 hover:text-white"
              >
                <span>Venue Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* OTHER OPTIONS SECTION */}
      {otherOptions.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Other Recommended Options ({otherOptions.length})</span>
            <span>Budget & Proximity Sorted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedOther.map((item, idx) => {
              const { hotel, relevance_score, suitability_reason, potential_considerations } = item;
              const badge = getMatchBadge(relevance_score);

              return (
                <div
                  key={hotel.hotel_id || idx}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
                          {hotel.accommodation_type || 'Hotel'}
                        </span>
                        {hotel.rating && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{hotel.rating}</span>
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${badge.badgeStyle}`}>
                        {badge.text}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-white leading-snug">
                      {hotel.name}
                    </h5>

                    {hotel.address && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {hotel.address}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {suitability_reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {hotel.distance_km !== null ? `${hotel.distance_km} km away` : 'Central'}
                    </span>
                    <div className="flex items-center gap-2">
                      {hotel.latitude && hotel.longitude && (
                        <a
                          href={getOpenStreetMapUrl(hotel.latitude, hotel.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                          title="View on OpenStreetMap"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Map</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {hotel.booking_url && (
                        <a
                          href={hotel.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {otherOptions.length > 4 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 transition-all"
              >
                <span>{showAll ? 'Show Fewer Options' : `View All ${otherOptions.length} Options`}</span>
                {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Honest Data Source Footer */}
      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Real accommodation data sourced via OpenStreetMap; ranked by TripMind AI.</span>
        </div>
        <div>
          <span>Live room booking & payment is not supported in this planning phase.</span>
        </div>
      </div>
    </motion.div>
  );
}
