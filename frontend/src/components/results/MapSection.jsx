import React, { useState } from 'react';
import { MapPin, Building2, Utensils, Navigation, ExternalLink, ShieldCheck } from 'lucide-react';
import { getOpenStreetMapUrl } from '../../utils/osm';

export default function MapSection({ planResponse, destination = 'Jaipur' }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);

  // Extract real coordinates
  const hotels = (planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || []).map((h, i) => {
    const actual = h.hotel || h;
    return {
      id: `hotel-${i}`,
      type: 'stay',
      name: actual.name || h.name || `Hotel ${i + 1}`,
      category: actual.accommodation_type || 'Accommodation',
      latitude: actual.latitude ?? h.latitude,
      longitude: actual.longitude ?? h.longitude,
      description: h.suitability_reason || h.explanation || 'Selected stay for your journey'
    };
  }).filter(h => h.latitude != null && h.longitude != null);

  const places = (planResponse?.ranked_attractions || planResponse?.places_context?.places || []).map((p, i) => {
    const actual = p.place || p.attraction || p;
    const lat = actual.latitude ?? p.latitude;
    const lon = actual.longitude ?? p.longitude;
    const name = actual.name || p.name || `Landmark ${i + 1}`;
    return {
      id: `place-${i}`,
      type: 'place',
      name: name,
      category: actual.category || p.category || 'Sightseeing',
      latitude: lat,
      longitude: lon,
      description: actual.description || p.suitability_reason || p.ranking_explanation || 'Top rated landmark'
    };
  }).filter(p => p.latitude != null && p.longitude != null);

  const foodVenues = planResponse?.food_context?.venues || planResponse?.food_context?.places || [];
  const food = foodVenues.map((f, i) => {
    const actual = f.venue || f.place || f;
    return {
      id: `food-${i}`,
      type: 'food',
      name: actual.name || f.name || `Dining Venue ${i + 1}`,
      category: actual.cuisine || f.cuisine || 'Dining',
      latitude: actual.latitude ?? f.latitude,
      longitude: actual.longitude ?? f.longitude,
      description: actual.suitability_reason || f.description || f.reason || 'Local dining discovery'
    };
  }).filter(f => f.latitude != null && f.longitude != null);

  const allPins = [...hotels, ...places, ...food];

  const filteredPins = allPins.filter(pin => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'stay') return pin.type === 'stay';
    if (activeFilter === 'places') return pin.type === 'place';
    if (activeFilter === 'food') return pin.type === 'food';
    return true;
  });

  const activePin = selectedPin || filteredPins[0] || allPins[0];

  // OSM Bounding box center
  const centerLat = activePin?.latitude || 26.9124;
  const centerLon = activePin?.longitude || 75.7873;
  const delta = 0.045;
  const bbox = `${centerLon - delta}%2C${centerLat - delta}%2C${centerLon + delta}%2C${centerLat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat}%2C${centerLon}`;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'stay': return <Building2 className="w-4 h-4 text-forest-700" />;
      case 'place': return <MapPin className="w-4 h-4 text-emerald-700" />;
      case 'food': return <Utensils className="w-4 h-4 text-amber-700" />;
      default: return <MapPin className="w-4 h-4 text-forest-700" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
            Geographic Exploration
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
            Explore your trip
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
            Interactive map displaying verified stays, historic landmarks, and dining venues across {destination}.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-full border border-cream-300 shadow-subtle min-w-max">
          {[
            { id: 'all', label: `All (${allPins.length})` },
            { id: 'stay', label: `Stay (${hotels.length})` },
            { id: 'places', label: `Places (${places.length})` },
            { id: 'food', label: `Food (${food.length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-travel-body hover:text-travel-dark hover:bg-cream-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Location Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Embedded OpenStreetMap Frame */}
        <div className="lg:col-span-8 rounded-4xl overflow-hidden bg-white border border-cream-300 shadow-travel-card relative flex flex-col min-h-[500px]">
          <iframe
            title={`Map of ${destination}`}
            src={embedUrl}
            className="w-full flex-grow min-h-[460px] border-none filter contrast-[1.03]"
            loading="lazy"
          />

          {/* Active Pin Overlay Banner */}
          {activePin && (
            <div className="p-5 bg-white/95 backdrop-blur-md border-t border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(activePin.type)}
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-travel-dark">
                    {activePin.name}
                  </h4>
                  <p className="text-xs text-travel-muted mt-0.5 line-clamp-1">
                    {activePin.description}
                  </p>
                </div>
              </div>

              <a
                href={getOpenStreetMapUrl(activePin.latitude, activePin.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm flex-shrink-0"
              >
                <span>Open in OpenStreetMap</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Right: Location Directory List */}
        <div className="lg:col-span-4 rounded-4xl bg-white border border-cream-300 p-6 shadow-travel-card flex flex-col max-h-[580px]">
          <div className="pb-3 border-b border-cream-200 mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-travel-dark uppercase tracking-wider">
              Locations ({filteredPins.length})
            </span>
            <span className="text-[11px] text-forest-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Pins</span>
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 scrollbar-none flex-grow">
            {filteredPins.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  onClick={() => setSelectedPin(pin)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-forest-50 border-forest-300 shadow-sm'
                      : 'bg-cream-50/50 hover:bg-cream-100/70 border-cream-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">
                        {getTypeIcon(pin.type)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-travel-dark line-clamp-1">{pin.name}</h5>
                        <span className="text-[11px] text-travel-muted block mt-0.5">{pin.category}</span>
                      </div>
                    </div>

                    <a
                      href={getOpenStreetMapUrl(pin.latitude, pin.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg text-travel-muted hover:text-forest-700 transition-colors"
                      title="Open in OpenStreetMap"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}

            {filteredPins.length === 0 && (
              <div className="text-center py-8 text-xs text-travel-muted">
                No pins found for this filter.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
