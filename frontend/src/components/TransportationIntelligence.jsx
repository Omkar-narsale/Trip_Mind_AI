import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Route,
  Car,
  Footprints,
  Bus,
  MapPin,
  Compass,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

const MODE_CONFIG = {
  walking: {
    label: 'Walking',
    icon: Footprints,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  'taxi / cab': {
    label: 'Taxi / Cab',
    icon: Car,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  'public transport': {
    label: 'Public Transit',
    icon: Bus,
    color: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  },
  'private vehicle': {
    label: 'Private Vehicle',
    icon: Car,
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  mixed: {
    label: 'Flexible Transit',
    icon: Route,
    color: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  }
};

export default function TransportationIntelligence({ transportationData, destination }) {
  const [selectedCluster, setSelectedCluster] = useState(null);

  if (!transportationData) return null;

  const {
    clusters = [],
    recommendations = [],
    route_optimization_insights = [],
    optimization_insights = [],
    accessibility_applied = false,
    accessibility_notes,
    summary,
    notes,
    data_honesty_disclaimer
  } = transportationData;

  const insightsList = route_optimization_insights.length > 0 
    ? route_optimization_insights 
    : optimization_insights;

  const disclaimerText = data_honesty_disclaimer || notes || (
    "Approximate straight-line geographic distance using the Haversine formula. Actual road travel distance, transit routes, and driving durations vary with local road layout and traffic conditions."
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Header Container */}
      <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Phase 8 Active Engine
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Haversine Geographic Routing
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Transportation Intelligence & Route Optimization
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>
              <strong className="text-white font-semibold">{clusters.length}</strong> Geographic Hubs Identified
            </span>
          </div>
        </div>

        {/* Summary Description */}
        {summary && (
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Accessibility Override Notice Banner */}
        {accessibility_applied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Accessibility & Mobility Mode Override Active
              </h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Walking recommendations for segments exceeding 500 meters have been automatically replaced with cab, taxi, or arranged vehicle transit to prevent physical strain and honor your mobility requirements.
              </p>
              {accessibility_notes && (
                <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                  Profile constraint: {accessibility_notes}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Data Honesty Disclaimer */}
        <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong className="text-slate-300">Data Transparency:</strong> {disclaimerText} No booking transactions or payments are conducted here.
          </span>
        </div>
      </div>

      {/* Two Column Section: Geographic Hubs & Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Geographic Hubs & Movement Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Geographic Attraction Clusters */}
          <div className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Geographic Attraction Hubs
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Cluster radius &lt; 3.0 km
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Visiting proximate sights within the same hub sequentially eliminates wasteful cross-city transit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {clusters.map((cluster, idx) => {
                const isSelected = selectedCluster === cluster.cluster_id;
                const locNames = cluster.locations ? cluster.locations.map(l => l.name) : (cluster.attraction_names || []);

                return (
                  <div
                    key={cluster.cluster_id || idx}
                    onClick={() => setSelectedCluster(isSelected ? null : cluster.cluster_id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-glow-cyan' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {cluster.cluster_name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300/80 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap">
                        ~{cluster.approximate_span_km || Math.round(cluster.cluster_radius_km * 2 || 1)} km span
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {cluster.proximity_note || "Cluster of geographically grouped attractions."}
                    </p>

                    <div className="space-y-1 border-t border-white/5 pt-2.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                        Included Sights ({locNames.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {locNames.map((name, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movement Corridor Recommendations */}
          <div className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Movement Corridors & Mode Recommendations
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {recommendations.length} Evaluated Routes
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, idx) => {
                const modeKey = (rec.recommended_mode || '').toLowerCase();
                const config = MODE_CONFIG[modeKey] || MODE_CONFIG.mixed;
                const ModeIcon = config.icon;
                const origin = rec.origin_name || rec.from_location;
                const dest = rec.destination_name || rec.to_location;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="text-slate-300">{origin}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-cyan-300">{dest}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          {rec.distance_km} km (straight-line)
                        </span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.badgeClass}`}>
                          <ModeIcon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.suitability_reason}
                    </p>

                    {rec.practical_transit_tips && rec.practical_transit_tips.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rec.practical_transit_tips.map((tip, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[11px] text-slate-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            {tip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Strategic Insights & Pacing Guidelines */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-dark-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-card space-y-4 sticky top-24">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Route Optimization Insights
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Strategic spatial guidance synthesized to maximize sightseeing time and minimize commute friction.
            </p>

            <div className="space-y-3 pt-2">
              {insightsList.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))}
            </div>

            {/* Practical Travel Rules Card */}
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2.5">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Transit Efficiency Rules
              </h4>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Explore all sights in a cluster before moving to another area.</li>
                <li>Leave lodging early for distant fort or perimeter hubs.</li>
                <li>Avoid cross-town taxi hailing during peak local rush hours.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
