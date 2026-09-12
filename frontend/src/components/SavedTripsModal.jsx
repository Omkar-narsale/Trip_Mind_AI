import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, IndianRupee, ArrowRight, Loader2, Bookmark, MapPin, Compass } from 'lucide-react';
import { getDestinationImage } from '../utils/travelImages';

export default function SavedTripsModal({
  isOpen,
  onClose,
  onSelectTrip
}) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/trips`
      : 'http://127.0.0.1:8000/api/trips';

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Unable to fetch saved trips');
        return res.json();
      })
      .then((data) => {
        setTrips(data.trips || []);
      })
      .catch((err) => {
        console.warn('Failed to load saved trips from API:', err);
        setError('No previous trips found or database offline.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenTrip = async (sessionId) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/session/${sessionId}`
        : `http://127.0.0.1:8000/api/session/${sessionId}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Session details could not be retrieved');
      const data = await res.json();
      onSelectTrip(data);
      onClose();
    } catch (err) {
      setError(`Failed to open trip: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-cream-300 rounded-4xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-travel-dark">My Saved Trips</h3>
              <p className="text-xs text-travel-muted">Retrieve and continue your previously planned travel journeys.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-travel-muted hover:text-travel-dark hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trips List */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
          {loading && trips.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-forest-700 animate-spin mx-auto" />
              <p className="text-xs text-travel-body">Loading your saved journeys...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 text-center text-xs text-travel-muted">
              {error}
            </div>
          )}

          {!loading && trips.length === 0 && !error && (
            <div className="text-center py-12 space-y-3">
              <Compass className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-serif font-bold text-travel-dark">No saved trips found</p>
              <p className="text-xs text-travel-muted">Plan your first journey and it will automatically appear here.</p>
            </div>
          )}

          {trips.map((trip) => {
            const dest = trip.destination || 'Jaipur';
            const origin = trip.origin || 'Mumbai';
            const dep = trip.departure_date;
            const ret = trip.return_date;
            const travelers = trip.travelers || 4;
            const budget = trip.budget || 60000;
            const img = getDestinationImage(dest);

            return (
              <div
                key={trip.id}
                onClick={() => handleOpenTrip(trip.id)}
                className="rounded-3xl border border-cream-300 bg-white hover:bg-cream-50/50 shadow-subtle hover:shadow-travel-card transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={img}
                    alt={dest}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-lg font-serif font-bold text-travel-dark group-hover:text-forest-700 transition-colors">
                      {dest}
                    </h4>
                    <span className="text-xs text-travel-muted block">
                      {origin} → {dest}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-travel-body">
                      <span>{travelers} travelers</span>
                      <span>•</span>
                      <span>₹{Number(budget).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-bold text-forest-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open Trip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-cream-200 bg-cream-50 flex items-center justify-between text-xs text-travel-muted">
          <span>{trips.length} saved travel journeys</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white border border-cream-300 text-travel-dark font-bold text-xs hover:bg-cream-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
