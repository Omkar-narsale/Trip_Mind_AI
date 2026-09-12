import React from 'react';
import { Calendar, MapPin, Building2, Utensils, Car, Sparkles } from 'lucide-react';

export default function PrintBrochureView({
  destination = 'Destination',
  origin = 'Origin',
  departureDate = '2026-10-01',
  returnDate = '2026-10-05',
  travelers = 2,
  budget = 60000,
  topHotel,
  itineraryData,
  weatherContext
}) {
  const days = itineraryData?.days || [];
  const hotelName = topHotel?.name || 'Selected Destination Hotel';
  const hotelAddress = topHotel?.address || topHotel?.city || `${destination} Central Area`;

  return (
    <div id="print-brochure-container" className="hidden print:block print:p-8 print:bg-white print:text-gray-900 font-sans">
      
      {/* 1. Brochure Cover Header */}
      <div className="border-b-2 border-forest-800 pb-6 mb-8 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-forest-700 block mb-1">
            TripMind AI Travel Journeys • Official Travel Document
          </span>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">
            {destination} Itinerary
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Autonomous Journey Planning Anchored for {origin} to {destination}
          </p>
        </div>

        <div className="text-right text-xs text-gray-500">
          <p className="font-bold text-gray-800">TripMind Verified</p>
          <p>Generated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 2. Key Parameters Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Travel Dates</span>
          <span className="text-sm font-bold text-gray-900 block mt-0.5">{departureDate} — {returnDate}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Travelers</span>
          <span className="text-sm font-bold text-gray-900 block mt-0.5">{travelers} Guests</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Budget Allocation</span>
          <span className="text-sm font-bold text-gray-900 block mt-0.5">₹{budget ? budget.toLocaleString('en-IN') : 'Optimized'}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Weather Outlook</span>
          <span className="text-sm font-bold text-gray-900 block mt-0.5">{weatherContext?.temperature_max ? `${weatherContext.temperature_max}°C Max` : 'Pleasant'}</span>
        </div>
      </div>

      {/* 3. Accommodation Anchor */}
      <div className="mb-8 p-5 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-2 text-forest-800 font-bold text-sm">
          <Building2 className="w-4 h-4" />
          <span>Anchor Accommodation</span>
        </div>
        <h3 className="text-lg font-serif font-bold text-gray-900">{hotelName}</h3>
        <p className="text-xs text-gray-600 mt-0.5">{hotelAddress}</p>
        {topHotel?.suitability_reason && (
          <p className="text-xs text-gray-700 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <strong>Selection Rationale:</strong> {topHotel.suitability_reason}
          </p>
        )}
      </div>

      {/* 4. Day-by-Day Schedule */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-gray-900 border-b border-gray-200 pb-2">
          Scheduled Day-by-Day Journey
        </h2>

        {days.map((day) => (
          <div key={day.day_number} className="break-inside-avoid border border-gray-200 rounded-2xl p-5 bg-white mb-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
              <div>
                <span className="text-xs font-bold text-forest-700 uppercase tracking-wider">Day {day.day_number} • {day.date}</span>
                <h4 className="text-base font-serif font-bold text-gray-900">{day.title || `Day ${day.day_number} Journey`}</h4>
              </div>
              {day.weather_summary && (
                <span className="text-xs text-gray-500">{day.weather_summary}</span>
              )}
            </div>

            <div className="space-y-2.5">
              {(day.activities || []).map((act, aIdx) => (
                <div key={aIdx} className="flex items-start gap-3 text-xs">
                  <span className="font-mono font-bold text-forest-800 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                    {act.time}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900">{act.title}</span>
                    {act.place_name && (
                      <span className="text-gray-500 ml-1.5">• {act.place_name}</span>
                    )}
                    {act.description && (
                      <p className="text-gray-600 mt-0.5 leading-relaxed">{act.description}</p>
                    )}
                    {act.transport_mode && (
                      <span className="inline-block mt-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        Transit: {act.transport_mode} {act.distance_km ? `(~${act.distance_km} km)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Footer Advisory */}
      <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500">
        <p>TripMind Autonomous Travel Engine • Grounded with Live OpenStreetMap & Weather Intelligence.</p>
        <p className="mt-0.5">Please confirm venue timings and ticket bookings directly prior to arrival.</p>
      </div>

    </div>
  );
}
