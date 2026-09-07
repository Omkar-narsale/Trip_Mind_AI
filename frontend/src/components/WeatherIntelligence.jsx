import React from 'react';
import { motion } from 'framer-motion';
import { 
  CloudSun, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Thermometer, 
  Wind, 
  Droplets,
  Info,
  Compass,
  Lightbulb
} from 'lucide-react';
import WeatherForecast from './WeatherForecast';

export default function WeatherIntelligence({ weatherContext, weatherInsight }) {
  if (!weatherContext) return null;

  const { location, forecast_available, weather_days, source_status, planning_notes } = weatherContext;
  const { summary, recommendations } = weatherInsight || {};

  // Compute average temp or grab top day temp
  let currentTemp = null;
  let currentCondition = 'Weather Data Available';
  let tempMin = null;
  let tempMax = null;

  if (weather_days && weather_days.length > 0) {
    const first = weather_days[0];
    currentTemp = first.temperature;
    currentCondition = first.condition;
    tempMin = first.temperature_min;
    tempMax = first.temperature_max;
  }

  const isLive = forecast_available && source_status === 'live_forecast';
  const isOutOfRange = source_status === 'out_of_range';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-3xl bg-gradient-to-b from-dark-900 via-dark-850 to-dark-900 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card space-y-6 overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-brand">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Destination Weather Intelligence
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Real API Tool
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live meteorological observations via Open-Meteo & Groq Intelligence
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Forecast Active
            </span>
          ) : isOutOfRange ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Seasonal Context (Date &gt; 16 Days)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-white/10 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              Advisory Notice
            </span>
          )}
        </div>
      </div>

      {/* Main Weather Overview (if forecast is live) */}
      {isLive && currentTemp !== null && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {Math.round(currentTemp)}°<span className="text-lg text-slate-400 font-normal">C</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">
                {currentCondition}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-brand-400" />
                {location}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300 md:justify-center">
            {tempMin !== null && tempMax !== null && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Range</span>
                <span className="font-semibold text-white">{Math.round(tempMin)}°C – {Math.round(tempMax)}°C</span>
              </div>
            )}
            {weather_days?.[0]?.precipitation_probability !== null && weather_days?.[0]?.precipitation_probability !== undefined && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Rain Chance</span>
                <span className="font-semibold text-cyan-300">{weather_days[0].precipitation_probability}%</span>
              </div>
            )}
            {weather_days?.[0]?.wind_speed !== null && weather_days?.[0]?.wind_speed !== undefined && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Wind</span>
                <span className="font-semibold text-slate-200">{Math.round(weather_days[0].wind_speed)} km/h</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 md:text-right">
            <span>{planning_notes || `Forecast verified for ${location}.`}</span>
          </div>
        </div>
      )}

      {/* Out of Range Notice if travel dates > 16 days */}
      {!forecast_available && (
        <div className="relative z-10 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm text-amber-200 leading-relaxed flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-1">Forecast Range Notice</span>
            {planning_notes || "Detailed day-by-day forecast is not available for these future travel dates yet (meteorological forecast horizon is up to 16 days). Live conditions will activate closer to departure."}
          </div>
        </div>
      )}

      {/* Daily Forecast Grid */}
      {weather_days && weather_days.length > 0 && (
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Trip Dates Daily Forecast</span>
            <span>Real Meteorological Metrics</span>
          </div>
          <WeatherForecast weatherDays={weather_days} />
        </div>
      )}

      {/* AI Travel Weather Insight Card */}
      {summary && (
        <div className="relative z-10 p-5 rounded-2xl bg-gradient-to-r from-brand-950/70 via-indigo-950/50 to-dark-850 border border-brand-500/30 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>AI Travel Weather Insight</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {summary}
          </p>

          {recommendations && recommendations.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Travel Recommendations:
              </span>
              <ul className="space-y-1">
                {recommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Honest Data Source Disclaimer */}
      <div className="relative z-10 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <span>Provider: Open-Meteo Open Weather API</span>
        <span>Zero AI Weather Fabrication Policy</span>
      </div>

    </motion.div>
  );
}
