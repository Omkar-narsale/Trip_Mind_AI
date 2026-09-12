import React from 'react';
import { Utensils, MapPin, ExternalLink, Star } from 'lucide-react';
import { getFoodImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/travelImages';
import { getOpenStreetMapUrl } from '../../utils/osm';

export default function FoodSection({ foodContext, destination = 'Jaipur' }) {
  const places = foodContext?.venues || foodContext?.places || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
          Local Gastronomy
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
          Taste {destination}
        </h2>
        <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
          Authentic local eateries, traditional thali halls, and heritage rooftop cafes discovered for your journey.
        </p>
      </div>

      {/* Dining Cards Grid */}
      {places.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {places.map((place, idx) => {
            const actualPlace = place.venue || place.place || place;
            const name = actualPlace.name || place.name || `Dining Venue ${idx + 1}`;
            const image = getFoodImage(idx);
            const lat = actualPlace.latitude ?? place.latitude;
            const lon = actualPlace.longitude ?? place.longitude;
            const hasCoords = lat != null && lon != null;
            const cuisine = actualPlace.cuisine || place.cuisine || 'Local & Regional Cuisine';
            const description = actualPlace.suitability_reason || actualPlace.description || place.description || place.reason || 'Celebrated local establishment known for authentic culinary traditions and warm hospitality.';
            const specialty = actualPlace.dietary_notes || actualPlace.specialty || place.specialty;
            const priceRange = actualPlace.price_level || place.price_range || 'Mid-range dining';
            const rating = actualPlace.rating || place.rating;

            return (
              <div 
                key={idx}
                className="rounded-3xl overflow-hidden bg-white border border-cream-300 shadow-travel-card hover:shadow-travel-hover transition-all flex flex-col justify-between"
              >
                {/* Visual Image */}
                <div className="relative h-52 w-full overflow-hidden">
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

                  {/* Cuisine Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-travel-dark text-xs font-bold shadow-sm">
                      {cuisine}
                    </span>
                  </div>

                  {rating && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>{rating}</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                      {name}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-travel-body leading-relaxed line-clamp-3">
                      {description}
                    </p>

                    {specialty && (
                      <div className="text-xs text-forest-700 font-semibold">
                        Note: <span className="text-travel-dark font-normal">{specialty}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Map Link */}
                  <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
                    <span className="text-xs text-travel-muted">
                      {priceRange}
                    </span>

                    {hasCoords ? (
                      <a
                        href={getOpenStreetMapUrl(lat, lon)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-forest-700 text-travel-dark hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>View on map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">Map unavailable</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-cream-300 text-center text-sm text-travel-muted">
          No verified dining venues retrieved for this destination.
        </div>
      )}
    </div>
  );
}
