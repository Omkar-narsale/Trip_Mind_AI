import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, Building2, Utensils, Navigation, ExternalLink, ShieldCheck, 
  Route, Footprints, Compass, Search, Sparkles, BookOpen, Car
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../../utils/osm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Custom Marker HTML generator
function createCustomIcon(type, number = null) {
  let bgColor = '#1B4332'; // forest dark green for place
  let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  if (type === 'stay') {
    bgColor = '#7C3AED'; // purple for stay
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/></svg>';
  } else if (type === 'food') {
    bgColor = '#D97706'; // amber for food
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3"/><path d="m2.1 21.9 6.4-6.4"/></svg>';
  }

  const badgeHtml = number !== null 
    ? `<span style="position:absolute;top:-6px;right:-6px;background:#111827;color:#FFF;font-size:10px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid white;">${number}</span>` 
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative;width:34px;height:34px;background:${bgColor};border:2.5px solid #FFFFFF;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s ease;">
        ${iconSvg}
        ${badgeHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
}

export default function MapSection({ planResponse, destination = 'Jaipur', tripProfile }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);

  // Routing State (OSRM Live Turn-by-Turn)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [transitMode, setTransitMode] = useState('driving'); // 'driving' | 'walking'
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routingError, setRoutingError] = useState(null);

  // Vector RAG State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);

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
  const itineraryDays = planResponse?.itinerary_context?.days || [];

  // Extract sequential waypoints for chosen day
  const getDayWaypoints = (dayIdx) => {
    const waypoints = [];
    const anchorHotel = hotels[0];
    if (anchorHotel) {
      waypoints.push({
        name: `${anchorHotel.name} (Start)`,
        latitude: anchorHotel.latitude,
        longitude: anchorHotel.longitude,
        type: 'hotel'
      });
    }

    const currentDay = itineraryDays[dayIdx];
    if (currentDay && currentDay.activities) {
      currentDay.activities.forEach(act => {
        const titleLower = act.title?.toLowerCase() || '';
        const matchedPlace = places.find(p => p.name.toLowerCase().includes(titleLower.slice(0, 8)));
        const matchedFood = food.find(f => f.name.toLowerCase().includes(titleLower.slice(0, 8)));
        const item = matchedPlace || matchedFood;

        if (item && item.latitude && item.longitude) {
          waypoints.push({
            name: act.title || item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            type: item.type
          });
        }
      });
    }

    if (waypoints.length < 2 && places.length > 0) {
      places.slice(0, 3).forEach(p => {
        waypoints.push({
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          type: 'place'
        });
      });
    }

    if (anchorHotel && waypoints.length > 1) {
      waypoints.push({
        name: `${anchorHotel.name} (Return)`,
        latitude: anchorHotel.latitude,
        longitude: anchorHotel.longitude,
        type: 'hotel'
      });
    }

    return waypoints;
  };

  // Initialize Interactive Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultLat = allPins[0]?.latitude || 26.9124;
      const defaultLon = allPins[0]?.longitude || 75.7873;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // Standard OpenStreetMap tiles (100% free, full roads & landmarks, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Markers on Filter or Pins change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (filteredPins.length === 0) return;

    const bounds = L.latLngBounds();

    filteredPins.forEach((pin, idx) => {
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createCustomIcon(pin.type, pin.type === 'place' ? idx + 1 : null)
      });

      // Hover Tooltip: Show place name and category immediately on mouse hover
      marker.bindTooltip(`
        <div style="font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 800; font-size: 13px; color: #111827; letter-spacing: -0.01em;">
            ${pin.name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; margin-top: 2px;">
            ${pin.category}
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -18],
        opacity: 0.98,
        className: 'custom-hover-tooltip'
      });

      marker.bindPopup(`
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #1B4332; margin-bottom: 2px;">
            ${pin.category}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 4px;">
            ${pin.name}
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 8px;">
            ${pin.description}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E5E7EB; padding-top: 6px;">
            <span style="font-size: 11px; color: #6B7280; font-weight: 600;">Verified GPS</span>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}" 
               target="_blank" 
               style="color: #2563EB; font-size: 11px; font-weight: 700; text-decoration: none;">
              Directions ↗
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedPin(pin);
      });

      marker.addTo(markersLayer);
      bounds.extend([pin.latitude, pin.longitude]);
    });

    if (bounds.isValid() && !routePolylineRef.current) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredPins]);

  // Handle Route Calculation via OSRM Live Road Routing
  const handleCalculateRoute = async () => {
    setRoutingLoading(true);
    setRoutingError(null);

    const waypoints = getDayWaypoints(selectedDayIndex);
    if (waypoints.length < 2) {
      setRoutingError('Not enough coordinates found for this day to generate a route.');
      setRoutingLoading(false);
      return;
    }

    try {
      const origin = waypoints[0];
      const destinationPt = waypoints[waypoints.length - 1];
      const intermediate = waypoints.slice(1, -1);

      const res = await fetch(`${API_BASE}/api/routes/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: destinationPt,
          waypoints: intermediate,
          mode: transitMode
        })
      });

      if (!res.ok) {
        throw new Error(`Routing service returned ${res.status}`);
      }

      const data = await res.json();
      setRouteResult(data);

      // Draw Polyline on Leaflet
      const map = mapInstanceRef.current;
      if (map && data.polyline_coords && data.polyline_coords.length > 0) {
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }

        const polyline = L.polyline(data.polyline_coords, {
          color: transitMode === 'driving' ? '#2563EB' : '#10B981',
          weight: 5,
          opacity: 0.88,
          smoothFactor: 1
        }).addTo(map);

        routePolylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
      }

    } catch (err) {
      console.error('Route calculation error:', err);
      setRoutingError('Failed to retrieve live routing corridor. Try a different transit mode.');
    } finally {
      setRoutingLoading(false);
    }
  };

  // Perform Vector RAG Knowledge Search
  const handleRAGSearch = async (queryText = null) => {
    const q = queryText || ragQuery;
    if (!q || !q.trim()) return;

    setRagLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination,
          query: q,
          top_k: 3
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRagResults(data.results || []);
      }
    } catch (e) {
      console.error('Vector DB search failed:', e);
    } finally {
      setRagLoading(false);
    }
  };

  // Auto-search default destination guidelines
  useEffect(() => {
    handleRAGSearch(`Safety and transit rules for ${destination}`);
  }, [destination]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'stay': return <Building2 className="w-4 h-4 text-purple-700" />;
      case 'place': return <MapPin className="w-4 h-4 text-forest-700" />;
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
            Geographic Exploration & Live Routing
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
            Explore your trip
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
            Interactive Leaflet map displaying verified stays, historic landmarks, dining venues, and live OSRM turn-by-turn road navigation across {destination}.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-full border border-cream-300 shadow-subtle min-w-max">
          {[
            { id: 'all', label: `All (${allPins.length})` },
            { id: 'stay', label: `Stay (${hotels.length})` },
            { id: 'places', label: `Places (${places.length})` },
            { id: 'food', label: `Food (${food.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-travel-body hover:text-travel-dark hover:bg-cream-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Box with Floating OSRM Route Bar */}
      <div className="rounded-3xl border border-cream-300 bg-white overflow-hidden shadow-card relative">
        
        {/* Floating Route Control Toolbar */}
        <div className="p-4 bg-cream-50/95 border-b border-cream-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800 block">Live Road Route:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedDayIndex}
                  onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                  className="bg-white border border-cream-300 rounded-xl px-3 py-1.5 text-xs text-travel-dark font-bold focus:outline-none focus:border-forest-600 shadow-sm"
                >
                  {itineraryDays.length > 0 ? (
                    itineraryDays.map((d, i) => (
                      <option key={i} value={i}>Day {d.day || i + 1}: {d.theme || `Corridor ${i + 1}`}</option>
                    ))
                  ) : (
                    <option value={0}>Day 1: Highlights Corridor</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Driving vs Walking Mode Toggle */}
            <div className="flex items-center p-1 rounded-full bg-cream-200/80 border border-cream-300">
              <button
                type="button"
                onClick={() => setTransitMode('driving')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  transitMode === 'driving' ? 'bg-forest-700 text-white shadow-sm' : 'text-travel-body hover:text-travel-dark'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setTransitMode('walking')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  transitMode === 'walking' ? 'bg-forest-700 text-white shadow-sm' : 'text-travel-body hover:text-travel-dark'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk</span>
              </button>
            </div>

            {/* Calculate Button */}
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={routingLoading}
              className="px-5 py-2 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-subtle cursor-pointer disabled:opacity-50"
            >
              {routingLoading ? (
                <span>Routing OSRM...</span>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Preview Road Route</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-[520px] z-0" />

        {/* Turn-by-Turn Navigation Steps Drawer (Shows when route calculated) */}
        {routeResult && (
          <div className="p-6 bg-cream-50 border-t border-cream-300 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest-100 flex items-center justify-center text-forest-700">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-travel-dark flex items-center gap-2">
                    <span>Turn-by-Turn Route Guidance</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-200 text-forest-800 uppercase">
                      {routeResult.source === 'osrm' ? 'OSRM Live Road Corridors' : 'Interpolated Corridor'}
                    </span>
                  </h3>
                  <p className="text-xs text-travel-body">
                    From {routeResult.origin.name} to {routeResult.destination.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs text-travel-muted block font-medium">Road Distance</span>
                  <span className="text-base font-extrabold text-forest-800">{routeResult.total_distance_km} km</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-travel-muted block font-medium">Est. Travel Time</span>
                  <span className="text-base font-extrabold text-forest-800">{routeResult.total_duration_min} mins</span>
                </div>
              </div>
            </div>

            {/* Step Maneuvers List */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {routeResult.steps.map((step, sIdx) => (
                <div key={sIdx} className="p-3 rounded-2xl bg-white border border-cream-200 flex items-start gap-3 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                    {sIdx + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs text-travel-dark font-medium leading-snug">{step.instruction}</p>
                    {step.distance_km > 0 && (
                      <span className="text-[10px] text-travel-muted block mt-1 font-mono font-semibold">
                        Segment: {step.distance_km} km
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Bottom Grid: Verified Pins (Left) & Vector RAG Explorer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left (7 cols): Verified Pin Directory */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-cream-300 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-travel-muted">
              LOCATIONS ({filteredPins.length})
            </span>
            <span className="text-xs font-bold text-forest-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Pins</span>
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {filteredPins.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  onClick={() => {
                    setSelectedPin(pin);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([pin.latitude, pin.longitude], 15, { duration: 1 });
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-forest-700 bg-forest-50/50 shadow-subtle'
                      : 'border-cream-200 hover:border-cream-300 hover:bg-cream-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">{getTypeIcon(pin.type)}</div>
                    <div>
                      <h4 className="text-sm font-bold text-travel-dark">{pin.name}</h4>
                      <p className="text-xs text-travel-muted mt-0.5">{pin.category}</p>
                    </div>
                  </div>

                  <a
                    href={getOpenStreetMapUrl(pin.latitude, pin.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-travel-muted hover:text-forest-700 hover:bg-cream-100 transition-colors flex-shrink-0"
                    title="Open on OpenStreetMap"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Destination Vector Knowledge Base (RAG) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-cream-300 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-forest-700" />
              <h3 className="text-sm font-bold text-travel-dark">Destination Vector Knowledge</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800">
              Vector RAG
            </span>
          </div>

          <p className="text-xs text-travel-muted mb-3">
            Query grounded safety advisories, transit protocols, and visa guidelines retrieved via Cosine Similarity embeddings.
          </p>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {[
              { label: 'Safety & Scams', q: 'emergency police and safety scams' },
              { label: 'Transit Rules', q: 'local transport metro and taxi rules' },
              { label: 'Visa & Entry', q: 'visa regulations and tourist entry permits' },
              { label: 'Etiquette', q: 'cultural dress code and tipping norms' }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRagQuery(chip.q);
                  handleRAGSearch(chip.q);
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cream-100 hover:bg-cream-200 text-travel-body border border-cream-200 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Ask travel guidelines or transit rules..."
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRAGSearch()}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 pl-9 text-xs text-travel-dark placeholder-travel-muted focus:outline-none focus:border-forest-600"
            />
            <Search className="w-3.5 h-3.5 text-travel-muted absolute left-3 top-2.5" />
          </div>

          {/* RAG Results List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 flex-grow">
            {ragLoading ? (
              <div className="py-8 text-center text-xs text-travel-muted">
                <Sparkles className="w-5 h-5 text-forest-600 animate-pulse mx-auto mb-2" />
                Calculating Cosine Similarity embeddings...
              </div>
            ) : ragResults.length > 0 ? (
              ragResults.map((chunk, cIdx) => (
                <div key={cIdx} className="p-3 rounded-2xl bg-cream-50/70 border border-cream-200">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                      {chunk.category}
                    </span>
                    <span className="text-[10px] font-mono text-travel-muted font-bold">
                      Match: {(chunk.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-travel-dark mb-0.5">{chunk.title}</h4>
                  <p className="text-[11px] text-travel-body leading-relaxed">{chunk.text}</p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-travel-muted">
                Enter a question or click a chip above to query the vector database.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
