import React from 'react';
import { 
  Calendar, Users, IndianRupee, Sparkles, Building2, 
  MapPin, Utensils, Car, ArrowRight, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { getDestinationImage } from '../../utils/travelImages';

export default function OverviewSection({
  destination = 'Jaipur',
  origin = 'Mumbai',
  departureDate,
  returnDate,
  travelers = 4,
  budget = 60000,
  planResponse,
  tripProfile,
  onNavigateTab
}) {
  const rawTopHotel = (planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || [])[0];
  const topHotel = rawTopHotel?.hotel || rawTopHotel;
  const topHotelReason = rawTopHotel?.suitability_reason || rawTopHotel?.explanation || 'Selected central hotel offering authentic heritage ambiance and convenient access to landmarks.';
  const places = planResponse?.ranked_attractions || planResponse?.places_context?.places || [];
  const food = planResponse?.food_context?.venues || planResponse?.food_context?.places || [];
  const itinerary = planResponse?.itinerary_context;
  const trans = planResponse?.transportation_context;
  const weather = planResponse?.weather_context;

  const totalDays = itinerary?.total_days || 6;
  const travelStyle = tripProfile?.travel_preferences?.travel_style 
    ? (Array.isArray(tripProfile.travel_preferences.travel_style) 
        ? tripProfile.travel_preferences.travel_style.join(' & ') 
        : tripProfile.travel_preferences.travel_style)
    : 'Luxury Cultural Immersion';

  // Natural language why this trip works explanation
  const reasoning = tripProfile?.trip_analysis?.trip_summary || 
    planResponse?.planning_result?.planning_strategy ||
    `Your plan balances ${destination}'s grand historic fortresses and heritage landmarks with unhurried afternoons, comfortable accommodations, and authentic local dining. Activities are grouped geographically to eliminate cross-city traffic, while transit recommendations prioritize taxis to ensure comfortable travel without exhausting walking sequences.`;

  return (
    <div className="space-y-12">
      
      {/* Editorial Header & 4 Key Stat Cards */}
      <div>
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
            Trip Summary
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
            Your {destination} escape
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2">
            A thoughtfully curated itinerary blending history, relaxation, and local culinary discoveries.
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block">Duration</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark mt-1 block">
                {totalDays} days
              </span>
              <span className="text-[11px] text-travel-body mt-0.5 block">Full itinerary scheduled</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block">Travelers</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark mt-1 block">
                {travelers} guests
              </span>
              <span className="text-[11px] text-travel-body mt-0.5 block">Custom group transit</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block">Budget</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark mt-1 block">
                ₹{budget.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Optimized stays & transit</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block">Travel Style</span>
              <span className="text-lg sm:text-xl font-serif font-bold text-travel-dark mt-1 block truncate">
                {travelStyle}
              </span>
              <span className="text-[11px] text-travel-body mt-0.5 block">Paced for relaxation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why This Trip Works (Editorial Narrative Card) */}
      <div className="rounded-3xl bg-white border border-cream-300 p-8 sm:p-10 shadow-travel-card relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold uppercase tracking-wider mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Why this trip works</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark tracking-tight mb-4">
            Thoughtfully balanced for effortless exploration.
          </h3>

          <p className="text-sm sm:text-base text-travel-body leading-relaxed mb-6">
            {reasoning}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-cream-200 text-xs text-travel-body">
            <div>
              <strong className="text-travel-dark block font-bold mb-1">Geographic Efficiency</strong>
              <span>Nearby attractions are clustered by day, minimizing driving time across {destination}.</span>
            </div>
            <div>
              <strong className="text-travel-dark block font-bold mb-1">Climate Responsive</strong>
              <span>Sightseeing shifts to cooler morning slots when warmer weather is forecasted.</span>
            </div>
            <div>
              <strong className="text-travel-dark block font-bold mb-1">Comfortable Transit</strong>
              <span>Direct private vehicles and taxis recommended for your party of {travelers} to minimize walking strain.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Jump Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stay Highlight */}
        <div 
          onClick={() => onNavigateTab('stay')}
          className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle hover:shadow-travel-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block mb-1">Anchor Stay</span>
            <h4 className="text-lg font-serif font-bold text-travel-dark mb-1">
              {topHotel?.name || 'Selected Destination Hotel'}
            </h4>
            <p className="text-xs text-travel-body line-clamp-2">
              {topHotelReason}
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-cream-200 flex items-center justify-between text-xs font-bold text-forest-700">
            <span>View selected stay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Explore Highlight */}
        <div 
          onClick={() => onNavigateTab('explore')}
          className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle hover:shadow-travel-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block mb-1">Key Attractions</span>
            <h4 className="text-lg font-serif font-bold text-travel-dark mb-1">
              {places.length} Places to Discover
            </h4>
            <p className="text-xs text-travel-body line-clamp-2">
              Top curated cultural monuments, scenic sights, and heritage landmarks in {destination}.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-cream-200 flex items-center justify-between text-xs font-bold text-forest-700">
            <span>Explore all places</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Day-by-Day Itinerary Highlight */}
        <div 
          onClick={() => onNavigateTab('itinerary')}
          className="p-6 rounded-3xl bg-white border border-cream-300 shadow-subtle hover:shadow-travel-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-forest-700 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block mb-1">Day-Wise Plan</span>
            <h4 className="text-lg font-serif font-bold text-travel-dark mb-1">
              {totalDays} Days of Experiences
            </h4>
            <p className="text-xs text-travel-body line-clamp-2">
              Morning, afternoon, and evening activities with transit tips and weather considerations.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-cream-200 flex items-center justify-between text-xs font-bold text-forest-700">
            <span>Open daily timeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
}
