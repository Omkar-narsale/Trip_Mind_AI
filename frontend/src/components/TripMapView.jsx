import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, Building2, UtensilsCrossed, Car, ExternalLink, ShieldCheck, 
  Navigation, Route, Footprints, Clock, ArrowRight, Compass, Search, 
  AlertTriangle, BookOpen, Sparkles, CheckCircle2 
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../utils/osm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Custom Marker HTML generator
function createCustomIcon(type, number = null) {
  let bgColor = '#10B981'; // emerald for place
  let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  if (type === 'hotel') {
    bgColor = '#A855F7'; // purple
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/></svg>';
  } else if (type === 'food') {
    bgColor = '#F59E0B'; // amber
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3"/><path d="m2.1 21.9 6.4-6.4"/></svg>';
  } else if (type === 'hub') {
    bgColor = '#3B82F6'; // blue
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
  }

  const badgeHtml = number !== null ? `<span style="position:absolute;top:-6px;right:-6px;background:#1E293B;color:#FFF;font-size:10px;font-weight:bold;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid white;">${number}</span>` : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative;width:34px;height:34px;background:${bgColor};border:2.5px solid #FFFFFF;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s ease;">
        ${iconSvg}
        ${badgeHtml}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
}

export default function TripMapView({ planResponse, tripProfile }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);

  // Routing State
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [transitMode, setTransitMode] = useState('driving'); // 'driving' | 'walking'
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routingError, setRoutingError] = useState(null);

  // RAG Knowledge Base State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragActiveTab, setRagActiveTab] = useState('all');

  const req = tripProfile?.trip_request || {};
  const destination = req.destination || 'Jaipur';

  // Gather verified coordinates from hotels, attractions, food, and transit hubs
  const hotels = (planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || []).map((h, i) => ({
    id: `hotel-${i}`,
    type: 'hotel',
    name: h.name,
    category: 'Accommodation',
    latitude: h.latitude,
    longitude: h.longitude,
    price: h.price_per_night ? `₹${h.price_per_night}/night` : 'Luxury Stay',
    rating: h.rating ? `⭐ ${h.rating}` : 'Anchor Stay',
    description: h.explanation || 'Selected central hotel'
  })).filter(h => h.latitude && h.longitude);

  const places = (planResponse?.ranked_attractions || planResponse?.places_context?.places || []).map((p, i) => {
    const lat = p.latitude ?? p.attraction?.latitude;
    const lon = p.longitude ?? p.attraction?.longitude;
    const name = p.name ?? p.attraction?.name;
    return {
      id: `place-${i}`,
      type: 'place',
      name: name,
      category: p.category || 'Sightseeing',
      latitude: lat,
      longitude: lon,
      price: null,
      rating: `Rank #${i + 1}`,
      description: p.description || p.ranking_explanation || 'Top rated heritage attraction'
    };
  }).filter(p => p.latitude && p.longitude);

  const food = (planResponse?.food_context?.places || []).map((f, i) => ({
    id: `food-${i}`,
    type: 'food',
    name: f.name,
    category: f.cuisine || 'Dining',
    latitude: f.latitude,
    longitude: f.longitude,
    price: f.price_range || 'Budget Friendly',
    rating: f.rating ? `⭐ ${f.rating}` : 'Authentic Cuisine',
    description: f.description || f.reason || 'Verified local dining recommendation'
  })).filter(f => f.latitude && f.longitude);

  const hubs = (planResponse?.transportation_context?.geographic_hubs || []).map((h, i) => ({
    id: `hub-${i}`,
    type: 'hub',
    name: h.hub_name || `Transit Hub ${i + 1}`,
    category: 'Transportation Cluster',
    latitude: h.centroid_lat,
    longitude: h.centroid_lon,
    price: null,
    rating: `${h.attraction_count || h.attractions?.length || 0} Places`,
    description: `Centroid radius ~${h.approximate_radius_km ? h.approximate_radius_km.toFixed(1) : '1.5'} km`
  })).filter(h => h.latitude && h.longitude);

  const allPins = [...hotels, ...places, ...food, ...hubs];

  const filteredPins = allPins.filter(pin => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'hotels') return pin.type === 'hotel';
    if (activeCategory === 'places') return pin.type === 'place';
    if (activeCategory === 'food') return pin.type === 'food';
    if (activeCategory === 'hubs') return pin.type === 'hub';
    return true;
  });

  const itineraryDays = planResponse?.itinerary_context?.days || [];

  // Extract sequential waypoints for the chosen day
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
        // match attraction or dining
        const matchedPlace = places.find(p => p.name.toLowerCase().includes(act.title?.toLowerCase().slice(0, 8)));
        const matchedFood = food.find(f => f.name.toLowerCase().includes(act.title?.toLowerCase().slice(0, 8)));
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

    // If day didn't match enough coordinates, pick top 3 available places
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

    // Return to anchor hotel at end of day
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

  // Sync Markers on Category or Pin change
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
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #10B981; margin-bottom: 2px;">
            ${pin.category}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">
            ${pin.name}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            ${pin.description}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 600;">${pin.rating || ''}</span>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}" 
               target="_blank" 
               style="color: #2563EB; font-size: 11px; font-weight: 700; text-decoration: none;">
              Navigate ↗
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

  // Request Turn-by-Turn Route Preview via OSRM
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
      const destination = waypoints[waypoints.length - 1];
      const intermediate = waypoints.slice(1, -1);

      const res = await fetch(`${API_BASE}/api/routes/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          waypoints: intermediate,
          mode: transitMode
        })
      });

      if (!res.ok) {
        throw new Error(`Routing service returned ${res.status}`);
      }

      const data = await res.json();
      setRouteResult(data);

      // Draw Polyline on Leaflet Map
      const map = mapInstanceRef.current;
      if (map && data.polyline_coords && data.polyline_coords.length > 0) {
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }

        const polyline = L.polyline(data.polyline_coords, {
          color: transitMode === 'driving' ? '#3B82F6' : '#10B981',
          weight: 5,
          opacity: 0.85,
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

  // Perform RAG Vector Search
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
          top_k: 4
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

  // Auto-search default destination safety guidelines on mount
  useEffect(() => {
    handleRAGSearch(`Safety and transit rules for ${destination}`);
  }, [destination]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900/90 border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Navigation className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Interactive Leaflet & Turn-by-Turn Navigation</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real OSRM road corridors & Leaflet geographic engine with {allPins.length} verified coordinates in {destination}.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'all', label: `All (${allPins.length})` },
            { key: 'hotels', label: `Stays (${hotels.length})` },
            { key: 'places', label: `Places (${places.length})` },
            { key: 'food', label: `Dining (${food.length})` },
            { key: 'hubs', label: `Hubs (${hubs.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map & Turn-by-Turn Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Map Box (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-dark-950 shadow-2xl relative min-h-[500px]">
            {/* Interactive Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-[500px] z-0" />

            {/* Quick Route Control Floating Bar */}
            <div className="absolute top-4 left-4 right-4 z-[500] p-3 rounded-2xl bg-dark-900/90 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Day Corridor:</span>
                <select
                  value={selectedDayIndex}
                  onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                  className="bg-dark-800 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-brand-500"
                >
                  {itineraryDays.length > 0 ? (
                    itineraryDays.map((d, i) => (
                      <option key={i} value={i}>Day {d.day || i + 1}: {d.theme || `Route ${i + 1}`}</option>
                    ))
                  ) : (
                    <option value={0}>Day 1: Highlights Corridor</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {/* Transit Mode Toggle */}
                <div className="flex items-center p-0.5 rounded-xl bg-dark-800 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTransitMode('driving')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      transitMode === 'driving' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-3 h-3" />
                    <span>Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransitMode('walking')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      transitMode === 'walking' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Footprints className="w-3 h-3" />
                    <span>Walk</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={routingLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {routingLoading ? (
                    <span>Calculating OSRM...</span>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Preview Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom active pin bar */}
            {selectedPin && (
              <div className="absolute bottom-4 left-4 right-4 z-[500] p-3.5 rounded-2xl bg-dark-900/95 border border-white/10 backdrop-blur-xl flex items-center justify-between gap-3 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{selectedPin.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                      {selectedPin.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{selectedPin.description}</p>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.latitude},${selectedPin.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Turn-by-Turn Navigation Steps Panel */}
          {routeResult && (
            <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>Turn-by-Turn Route Guidance</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 uppercase">
                        {routeResult.source === 'osrm' ? 'OSRM Live Routing' : 'Interpolated Corridor'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      From {routeResult.origin.name} to {routeResult.destination.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Road Distance</span>
                    <span className="text-sm font-extrabold text-emerald-400">{routeResult.total_distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Est. Duration</span>
                    <span className="text-sm font-extrabold text-brand-400">{routeResult.total_duration_min} mins</span>
                  </div>
                </div>
              </div>

              {/* Maneuver Steps List */}
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {routeResult.steps.map((step, sIdx) => (
                  <div key={sIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs">
                    <div className="w-5 h-5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {sIdx + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="text-slate-200 font-medium">{step.instruction}</p>
                      {step.road_name && <span className="text-[10px] text-slate-400 font-mono">{step.road_name}</span>}
                    </div>
                    {step.distance_km > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                        {step.distance_km} km
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Destination Knowledge Base (Vector RAG) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-5 backdrop-blur-xl flex flex-col flex-grow shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Destination Vector Knowledge</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Vector RAG
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Query grounded safety advisories, transit protocols, and visa guidelines retrieved via Cosine Similarity.
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
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
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* RAG Search Results */}
            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin flex-grow">
              {ragLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse mx-auto mb-2" />
                  Calculating Cosine Similarity embeddings...
                </div>
              ) : ragResults.length > 0 ? (
                ragResults.map((chunk, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {chunk.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Score: {(chunk.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{chunk.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{chunk.text}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Enter a question above to retrieve vector-indexed destination guidelines.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
