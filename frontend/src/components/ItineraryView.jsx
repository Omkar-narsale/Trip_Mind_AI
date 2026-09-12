import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Sun,
  CloudSun,
  Utensils,
  Car,
  Footprints,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Navigation,
  Info
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../utils/osm';

const TIME_SLOT_COLORS = {
  morning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
  afternoon: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
  evening: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
  night: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300'
};

export default function ItineraryView({ itineraryData, destination }) {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!itineraryData || !itineraryData.days || itineraryData.days.length === 0) {
    return null;
  }

  const { days, total_days, total_activities, trip_summary, validation } = itineraryData;
  const currentDay = days.find((d) => d.day_number === selectedDay) || days[0];

  return (
    <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-6 sm:p-8 shadow-card backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Phase 9 · Optimized Day-Wise Itinerary</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {total_days}-Day Curated Journey in {destination || 'Destination'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Synthesized with live weather, verified accommodations, attraction clustering, transit modes, and dining anchors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold">
            {total_activities} Scheduled Stops
          </span>
          {validation?.is_valid && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validated</span>
            </span>
          )}
        </div>
      </div>

      {/* Pacing & Summary Banner */}
      {trip_summary && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Pace: <strong className="text-white capitalize">{trip_summary.pacing || 'Balanced'}</strong></span>
          </div>
          {trip_summary.accessibility_notes && (
            <div className="flex items-center gap-2 text-amber-300/90">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{trip_summary.accessibility_notes}</span>
            </div>
          )}
          {trip_summary.hotel_hub && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>Anchor Stay: <strong className="text-white">{trip_summary.hotel_hub}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day) => {
          const isSelected = day.day_number === selectedDay;
          return (
            <button
              key={day.day_number}
              type="button"
              onClick={() => setSelectedDay(day.day_number)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-glow-brand'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5 hover:bg-white/[0.06]'
              }`}
            >
              <span>Day {day.day_number}</span>
              {day.theme && (
                <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {day.theme}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Day Subheader */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Day {currentDay.day_number}: {currentDay.theme || 'Exploration & Culture'}</span>
              </h4>
              {currentDay.date && (
                <p className="text-xs text-slate-400 mt-0.5">{currentDay.date}</p>
              )}
            </div>

            {currentDay.weather_advisory && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-amber-300">
                <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{currentDay.weather_advisory}</span>
              </div>
            )}
          </div>

          {/* Activities Timeline */}
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-white/5 before:hidden sm:before:block">
            {currentDay.activities && currentDay.activities.map((act, aIdx) => {
              const osmUrl = getOpenStreetMapUrl(act.latitude, act.longitude);
              const slotStyle = TIME_SLOT_COLORS[act.time_slot?.toLowerCase()] || TIME_SLOT_COLORS.morning;

              return (
                <motion.div
                  key={act.title + aIdx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: aIdx * 0.05 }}
                  className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all space-y-3 relative sm:ml-12"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${slotStyle}`}>
                        {act.time_slot || `Stop ${aIdx + 1}`}
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-white">
                        {act.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {act.estimated_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{act.estimated_duration}</span>
                        </span>
                      )}
                      {act.activity_type && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/10 capitalize">
                          {act.activity_type}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {act.description}
                  </p>

                  {/* Transit & Mobility Note */}
                  {act.transport_mode && (
                    <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Transit Recommendation: <strong className="text-white">{act.transport_mode}</strong></span>
                      </div>
                      {act.transit_notes && (
                        <span className="text-[11px] text-slate-400 hidden md:inline">{act.transit_notes}</span>
                      )}
                    </div>
                  )}

                  {/* Footer: Location & OpenStreetMap Button */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="line-clamp-1">{act.location_name || destination}</span>
                    </div>

                    {osmUrl && (
                      <a
                        href={osmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                      >
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span>Open in OpenStreetMap</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
