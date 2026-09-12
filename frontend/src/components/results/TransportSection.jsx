import React from 'react';
import { Car, Navigation, ShieldCheck, MapPin, Clock, Users, ArrowRight } from 'lucide-react';

export default function TransportSection({ transportationData, destination = 'Jaipur' }) {
  const routes = transportationData?.recommendations || transportationData?.evaluated_routes || [];
  const hubs = transportationData?.clusters || transportationData?.geographic_hubs || [];
  const isAccessible = transportationData?.accessibility_applied;
  const transitSummary = transportationData?.summary;
  const routeInsights = transportationData?.route_optimization_insights || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
          Route Intelligence
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
          Getting around {destination}
        </h2>
        <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
          {transitSummary || 'Practical transit guidance designed for smooth journeys between your hotel and key sightseeing hubs.'}
        </p>
      </div>

      {/* Accessibility / Travel Advice Banner */}
      {isAccessible && (
        <div className="p-6 rounded-3xl bg-forest-50 border border-forest-200 text-forest-900 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-forest-900 mb-1">
              Mobility & Pacing Consideration Applied
            </h4>
            <p className="text-xs text-forest-800 leading-relaxed">
              {transportationData?.accessibility_notes || 'Based on your preference to avoid excessive walking, we have prioritized pre-booked cabs, taxis, and private vehicle transit across all sightseeing legs exceeding 500 meters.'}
            </p>
          </div>
        </div>
      )}

      {/* Route Corridors Grid */}
      {routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routes.map((route, idx) => {
            const fromName = route.origin_name || route.from || 'Hotel';
            const toName = route.destination_name || route.to || 'Sightseeing Stop';
            const distance = typeof route.distance_km === 'number' 
              ? `${route.distance_km.toFixed(1)} km` 
              : 'Direct connection';

            const mode = route.recommended_mode 
              ? route.recommended_mode.replace('_', ' ') 
              : 'Taxi / Cab';

            const duration = route.estimated_duration_min ? ` • ~${route.estimated_duration_min} mins` : '';
            const reason = route.suitability_reason || route.reasoning || route.reason || route.accessibility_notes || 'Comfortable and direct for group travel without exhausting walking sequences.';
            const tips = route.practical_transit_tips || [];

            return (
              <div 
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-cream-300 shadow-travel-card flex flex-col justify-between"
              >
                <div>
                  {/* Origin to Destination Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1 rounded-full">
                      Leg #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-travel-dark bg-cream-100 px-3 py-1 rounded-full">
                      Approx. {distance}{duration}
                    </span>
                  </div>

                  {/* Route Visual Path */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-forest-600" />
                      <span className="text-sm font-bold text-travel-dark">{fromName}</span>
                    </div>

                    <div className="border-l-2 border-dashed border-cream-300 ml-1.5 h-6" />

                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm font-bold text-travel-dark">{toName}</span>
                    </div>
                  </div>

                  {/* Transit Mode Card */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-travel-muted uppercase tracking-wider">
                        Recommended Way to Travel
                      </span>
                      <span className="text-xs font-bold text-forest-700 capitalize">
                        {mode}
                      </span>
                    </div>
                    <p className="text-xs text-travel-body leading-relaxed mt-1">
                      {reason}
                    </p>
                    {tips.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-cream-200/80 text-[11px] text-travel-muted flex flex-wrap gap-1.5">
                        {tips.map((t, ti) => (
                          <span key={ti} className="bg-white/80 px-2 py-0.5 rounded-md border border-cream-200">
                            💡 {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Practical Advice Tip */}
                <div className="pt-4 mt-6 border-t border-cream-200 text-xs text-travel-muted flex items-center justify-between">
                  <span>Rideshare or hotel taxi hailing recommended</span>
                  <Car className="w-4 h-4 text-forest-700" />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-cream-300 text-center text-sm text-travel-muted">
          All key landmarks are clustered centrally within comfortable short-distance transfers.
        </div>
      )}

      {/* Destination Geographic Hubs Summary */}
      {hubs.length > 0 && (
        <div className="rounded-3xl bg-white border border-cream-300 p-8 shadow-subtle">
          <h3 className="text-lg font-serif font-bold text-travel-dark mb-4">
            Sightseeing Hubs in {destination}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map((hub, i) => {
              const clusterName = hub.cluster_name || hub.hub_name || `Exploration Area ${i + 1}`;
              const count = hub.attraction_names ? hub.attraction_names.length : (hub.attraction_count || hub.attractions?.length || 2);
              const radius = hub.cluster_radius_km ? ` (~${hub.cluster_radius_km.toFixed(1)} km radius)` : '';
              return (
                <div key={i} className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                  <span className="text-xs font-bold text-travel-dark block mb-1">
                    {clusterName}
                  </span>
                  <span className="text-xs text-travel-body block">
                    {count} grouped heritage landmarks{radius}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route Optimization Insights */}
      {routeInsights.length > 0 && (
        <div className="rounded-3xl bg-forest-900 text-white p-8 shadow-travel-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold">Route Sequencing Insights</h3>
              <p className="text-xs text-white/70">AI-optimized transit sequencing for your itinerary</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {routeInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-white/90">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
