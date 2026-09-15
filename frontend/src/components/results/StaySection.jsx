import React from 'react';
import { Building2, Star, MapPin, ExternalLink, ShieldCheck, Bookmark, BedDouble, CheckCircle2 } from 'lucide-react';
import { getHotelImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/travelImages';
import { getOpenStreetMapUrl } from '../../utils/osm';
import { getBookingComUrl, getAgodaUrl, getGoogleHotelsUrl } from '../../utils/bookingAffiliates';

export default function StaySection({ 
  hotels = [], 
  destination = 'Jaipur',
  departureDate,
  returnDate,
  travelers = 2
}) {
  const displayHotels = hotels.length > 0 ? hotels : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
            Accommodations & Live Booking
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
            Where you'll stay in {destination}
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
            Curated hotels selected for proximity to heritage landmarks, comfort, and group suitability. Compare live rates across official booking partners.
          </p>
        </div>

        {/* Live Booking Guarantee Tag */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-forest-50 border border-forest-200 text-forest-800 text-xs font-medium self-start md:self-auto">
          <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
          <span>Pre-filled for {travelers} guest{travelers > 1 ? 's' : ''} • Live rate check</span>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      {displayHotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayHotels.map((hotel, idx) => {
            const actualHotel = hotel.hotel || hotel;
            const name = actualHotel.name || hotel.name || `Accommodation ${idx + 1}`;
            const image = getHotelImage(idx);
            const lat = actualHotel.latitude ?? hotel.latitude;
            const lon = actualHotel.longitude ?? hotel.longitude;
            const hasCoords = lat != null && lon != null;
            const rating = actualHotel.rating || hotel.rating;
            const ratingText = rating ? `${rating} / 5` : 'Handpicked Stay';
            const price = actualHotel.price || hotel.price || hotel.price_per_night;
            const location = actualHotel.address || actualHotel.location || hotel.location || `${destination}`;
            const reason = hotel.suitability_reason || hotel.explanation || 'Strategically located with excellent access to historic monuments and comfortable amenities for group travel.';
            const amenities = actualHotel.amenities || hotel.amenities || [];

            // Generate verified deep links
            const bookingComUrl = getBookingComUrl(name, destination, departureDate, returnDate, travelers);
            const agodaUrl = getAgodaUrl(name, destination, departureDate, returnDate, travelers);
            const googleHotelsUrl = getGoogleHotelsUrl(name, destination, departureDate, returnDate);

            return (
              <div 
                key={idx}
                className="rounded-3xl overflow-hidden bg-white border border-cream-300 shadow-travel-card hover:shadow-travel-hover transition-all flex flex-col justify-between"
              >
                {/* Hotel Image with Overlay */}
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Luxury Class / Rating Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-travel-dark text-xs font-bold shadow-sm flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{ratingText}</span>
                    </span>
                    {idx === 0 && (
                      <span className="px-3 py-1 rounded-full bg-forest-700 text-white text-xs font-bold shadow-sm">
                        Recommended Stay
                      </span>
                    )}
                  </div>

                  {/* Price Tag if available */}
                  {price && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white font-bold text-xs">
                      ₹{typeof price === 'number' ? Math.round(price).toLocaleString() : price} <span className="font-normal text-white/80">/ night</span>
                    </div>
                  )}
                </div>

                {/* Hotel Content */}
                <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow space-y-5">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-travel-dark tracking-tight mb-2">
                      {name}
                    </h3>

                    {/* Location String */}
                    <div className="flex items-center gap-1.5 text-xs text-travel-muted mb-4">
                      <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>

                    {/* Why TripMind Selected It */}
                    <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                      <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider block mb-1">
                        Why TripMind Selected This
                      </span>
                      <p className="text-xs sm:text-sm text-travel-body leading-relaxed">
                        {reason}
                      </p>
                    </div>

                    {/* Amenities if present */}
                    {amenities && amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {amenities.slice(0, 4).map((am, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-lg bg-cream-100 text-[11px] font-semibold text-travel-body">
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Booking & Check Rates Section */}
                  <div className="pt-4 border-t border-cream-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-travel-muted flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-forest-700" />
                        <span>Live Booking & Availability</span>
                      </span>
                      {hasCoords && (
                        <a
                          href={getOpenStreetMapUrl(lat, lon)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-forest-700 hover:text-forest-900 transition-colors flex items-center gap-1"
                        >
                          <span>OpenStreetMap</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Deep-link Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={bookingComUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-[#003580] hover:bg-[#00224f] text-white font-bold text-xs flex items-center justify-center gap-1 transition-all text-center shadow-xs"
                        title={`Check live rates for ${name} on Booking.com`}
                      >
                        <span>Booking.com</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>

                      <a
                        href={agodaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all text-center shadow-xs"
                        title={`Check live availability on Agoda`}
                      >
                        <span>Agoda</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>

                      <a
                        href={googleHotelsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-travel-dark border border-cream-300 font-bold text-xs flex items-center justify-center gap-1 transition-all text-center"
                        title={`Compare all rates on Google Hotels`}
                      >
                        <span>Google Hotels</span>
                        <ExternalLink className="w-3 h-3 text-travel-muted" />
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-cream-300 text-center text-sm text-travel-muted">
          No accommodation records found for this destination yet.
        </div>
      )}
    </div>
  );
}
