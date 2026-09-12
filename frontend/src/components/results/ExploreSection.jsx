import React from 'react';
import { MapPin, ExternalLink, Compass, Landmark, Sparkles } from 'lucide-react';
import { getAttractionImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/travelImages';
import { getOpenStreetMapUrl } from '../../utils/osm';

export default function ExploreSection({ places = [], destination = 'Jaipur' }) {
  const displayPlaces = places.length > 0 ? places : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-2">
          Landmarks & Sights
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight">
          Places worth discovering
        </h2>
        <p className="text-sm sm:text-base text-travel-body mt-2 max-w-2xl">
          Historic fortresses, royal palaces, and vibrant cultural landmarks in {destination} ranked for your journey.
        </p>
      </div>

      {/* Places Cards Grid */}
      {displayPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPlaces.map((place, idx) => {
            const actualPlace = place.place || place.attraction || place;
            const name = actualPlace.name || place.name || `Landmark ${idx + 1}`;
            const category = actualPlace.category || place.category || 'Heritage Sight';
            const lat = actualPlace.latitude ?? place.latitude;
            const lon = actualPlace.longitude ?? place.longitude;
            const hasCoords = lat != null && lon != null;
            const image = getAttractionImage(name, idx);

            const description = actualPlace.description || 
              place.description || 
              'Iconic cultural landmark offering rich architecture, sweeping views, and profound historic significance.';

            const reason = place.suitability_reason || 
              place.ranking_explanation || 
              place.reason || 
              'Selected for its historic prestige and proximity to your daily itinerary route.';

            return (
              <div
                key={idx}
                className="rounded-3xl overflow-hidden bg-white border border-cream-300 shadow-travel-card hover:shadow-travel-hover transition-all flex flex-col justify-between group"
              >
                {/* Visual Image */}
                <div className="relative h-60 w-full overflow-hidden">
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-travel-dark text-xs font-bold shadow-sm">
                      Rank #{idx + 1}
                    </span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold">
                      {category}
                    </span>
                  </div>

                  {/* Place Name on Image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                      {name}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-travel-body leading-relaxed line-clamp-3">
                      {description}
                    </p>

                    {/* AI Recommendation Reason */}
                    <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
                      <span className="font-bold text-forest-700 block mb-1">
                        Why We Recommend It
                      </span>
                      <span className="text-travel-body leading-relaxed">
                        {reason}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Map Link */}
                  <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-travel-muted">
                      <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                      <span>{hasCoords ? 'Verified Location' : 'Central Area'}</span>
                    </div>

                    {hasCoords ? (
                      <a
                        href={getOpenStreetMapUrl(lat, lon)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-forest-700 text-travel-dark hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>View location</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">Location unavailable</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-cream-300 text-center text-sm text-travel-muted">
          No verified attractions found yet for this destination.
        </div>
      )}
    </div>
  );
}
