import React, { useState } from 'react';
import { 
  Calendar, Sun, CloudRain, Clock, MapPin, Car, 
  ExternalLink, ChevronDown, ChevronUp, Sparkles, Utensils, Building2,
  Printer, Download, Plus
} from 'lucide-react';
import { getOpenStreetMapUrl } from '../../utils/osm';
import { downloadIcsCalendar, buildGoogleCalendarUrl } from '../../utils/exportCalendar';

export default function ItinerarySection({ 
  itineraryData, 
  weatherContext,
  destination = 'Jaipur',
  topHotel
}) {
  const days = itineraryData?.days || [];
  const [expandedDay, setExpandedDay] = useState(1);
  const hotelName = topHotel?.name || 'Selected Stay';

  // Weather lookup helper
  const weatherSummary = weatherContext?.summary || weatherContext?.condition || 'Pleasant traveling weather';
  const maxTemp = weatherContext?.temperature_max ? `${weatherContext.temperature_max}°C` : '31°C';

  const getActivityIcon = (type) => {
    switch (type) {
      case 'food':
      case 'dining': return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'hotel':
      case 'check_in':
      case 'arrival': return <Building2 className="w-4 h-4 text-forest-700" />;
      case 'transit': return <Car className="w-4 h-4 text-blue-600" />;
      default: return <MapPin className="w-4 h-4 text-forest-700" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
            Day-by-Day Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
            Your day-by-day journey
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
            Carefully sequenced days anchored to your stay, pairing morning sightseeing with relaxed afternoons and local dinners.
          </p>
        </div>

        {/* Calendar Sync & PDF Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden flex-shrink-0">
          <button
            type="button"
            onClick={() => downloadIcsCalendar(itineraryData, destination, hotelName)}
            className="px-4 py-2.5 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-travel-card transition-all flex items-center gap-2 cursor-pointer"
            title="Download iCalendar file for Apple, Google, and Outlook Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Calendar (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-white border border-cream-300 hover:bg-cream-100 text-travel-dark font-bold text-xs shadow-subtle transition-all flex items-center gap-2 cursor-pointer"
            title="Print or save travel brochure as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-forest-700" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Days Stack */}
      {days.length > 0 ? (
        <div className="space-y-6">
          {days.map((day) => {
            const isExpanded = expandedDay === day.day_number;
            const activities = day.activities || [];
            const dayTheme = day.theme || day.title || `Day ${day.day_number} Exploration`;

            return (
              <div 
                key={day.day_number}
                className="rounded-3xl bg-white border border-cream-300 shadow-travel-card overflow-hidden transition-all"
              >
                {/* Day Header Bar (Collapsible Toggle) */}
                <div 
                  onClick={() => setExpandedDay(isExpanded ? null : day.day_number)}
                  className="p-6 sm:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream-50/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Day Number Pill */}
                    <div className="w-14 h-14 rounded-2xl bg-forest-700 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Day</span>
                      <span className="text-xl font-bold font-serif leading-none">{day.day_number}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-forest-700 uppercase tracking-wider">
                          {day.date || `Day ${day.day_number}`}
                        </span>
                        <span className="text-cream-300">•</span>
                        <span className="text-xs text-travel-muted font-medium">
                          {activities.length} activities
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-travel-dark tracking-tight">
                        {dayTheme}
                      </h3>
                    </div>
                  </div>

                  {/* Weather Snippet for Day */}
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-100 text-xs font-semibold text-travel-dark border border-cream-200">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{maxTemp} • {weatherSummary}</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-travel-dark">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Day Expanded Activity Timeline */}
                {isExpanded && (
                  <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-cream-200 space-y-6">
                    
                    {/* Daily Travel Tip Banner */}
                    <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-travel-body flex items-start gap-3">
                      <Sun className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-travel-dark block font-bold mb-0.5">
                          Daily Sightseeing Advice
                        </strong>
                        <span>
                          Best time for outdoor photography and fort walks: 8:30 AM – 11:30 AM before afternoon peak temperatures.
                        </span>
                      </div>
                    </div>

                    {/* Timeline Activities */}
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-cream-200 space-y-6 mt-6">
                      {activities.map((act, aIdx) => {
                        const time = act.time || '10:00';
                        const name = act.title || act.place_name || act.name || act.activity || 'Sightseeing Stop';
                        const desc = act.description || act.notes || '';
                        const transit = act.transport_mode || act.transport_tip || act.transportation_mode;
                        const lat = act.latitude;
                        const lon = act.longitude;
                        const hasCoords = lat != null && lon != null;

                        return (
                          <div key={aIdx} className="relative group">
                            
                            {/* Timeline Node Dot */}
                            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-7 h-7 rounded-full bg-white border-2 border-forest-700 flex items-center justify-center shadow-sm">
                              {getActivityIcon(act.type)}
                            </div>

                            {/* Activity Card */}
                            <div className="p-5 rounded-2xl bg-cream-50/70 hover:bg-cream-100/70 border border-cream-200/80 transition-all space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-md bg-white text-xs font-bold text-forest-800 border border-cream-200">
                                    {time}
                                  </span>
                                  <h4 className="text-base font-serif font-bold text-travel-dark">
                                    {name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3">
                                  {hasCoords && (
                                    <a
                                      href={getOpenStreetMapUrl(lat, lon)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                                    >
                                      <span>View on Map</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  <a
                                    href={buildGoogleCalendarUrl({
                                      title: `${name} (${destination})`,
                                      date: day.date || '2026-10-01',
                                      time: time,
                                      description: `${desc}${transit ? `\nTransit: ${transit}` : ''}`,
                                      location: act.place_name ? `${act.place_name}, ${destination}` : destination
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-travel-muted hover:text-forest-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-cream-200"
                                    title="Add to Google Calendar"
                                  >
                                    <Calendar className="w-3 h-3 text-amber-600" />
                                    <span>+ Cal</span>
                                  </a>
                                </div>
                              </div>

                              {desc && (
                                <p className="text-xs sm:text-sm text-travel-body leading-relaxed">
                                  {desc}
                                </p>
                              )}

                              {transit && (
                                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-travel-muted">
                                  <Car className="w-3.5 h-3.5 text-forest-700" />
                                  <span>Transit: {transit}</span>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-cream-300 text-center text-sm text-travel-muted">
          Your day-wise itinerary will appear here upon trip planning completion.
        </div>
      )}
    </div>
  );
}
