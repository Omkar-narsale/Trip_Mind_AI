import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { POPULAR_DESTINATIONS } from '../utils/travelImages';

export default function PopularDestinations({ onSelectDestination }) {
  return (
    <section id="popular-destinations" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Featured Journeys</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-travel-dark tracking-tight">
            Popular destinations
          </h2>
          <p className="text-base text-travel-body mt-2 max-w-xl">
            Places worth adding to your next journey, with intelligent day-by-day itineraries tailored to your style.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-travel-muted">
          <span>Click any card to start planning</span>
        </div>
      </motion.div>

      {/* Destination Grid: 6 Large Rounded Visual Cards with Staggered Entrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {POPULAR_DESTINATIONS.map((dest, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onSelectDestination(dest.name)}
            className="group relative rounded-3xl overflow-hidden bg-white border border-cream-300 shadow-travel-card hover:shadow-travel-hover transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            {/* Image Container with Hover Scale */}
            <div className="relative h-72 w-full overflow-hidden">
              <img
                src={dest.image}
                alt={dest.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Tag Pill */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-travel-dark text-xs font-bold shadow-sm">
                  {dest.tag}
                </span>
              </div>

              {/* Floating Arrow Icon on Hover */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-travel-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-md">
                <ArrowUpRight className="w-4 h-4 text-forest-700" />
              </div>

              {/* Bottom Card Image Overlay Text */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-semibold text-cream-200 uppercase tracking-wider block">
                  {dest.state}
                </span>
                <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
                  {dest.name}
                </h3>
              </div>
            </div>

            {/* Card Body Description */}
            <div className="p-6 bg-white flex flex-col justify-between flex-grow">
              <p className="text-xs sm:text-sm text-travel-body leading-relaxed mb-4 line-clamp-2">
                {dest.description}
              </p>

              <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs font-semibold text-travel-muted">
                <span>Ideal: <strong className="text-travel-dark font-bold">{dest.days}</strong></span>
                <div className="flex items-center gap-1 text-forest-700 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Plan Trip</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
