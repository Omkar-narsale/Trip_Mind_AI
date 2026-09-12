import React from 'react';
import { motion } from 'framer-motion';
import { Sun, MapPin, Car, Calendar, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export default function WhyTripMind() {
  const features = [
    {
      icon: Sun,
      title: 'Live Climate Intelligence',
      description: 'TripMind adapts daily plans based on Open-Meteo weather forecasts, shifting outdoor heritage visits away from peak heat and rain.'
    },
    {
      icon: MapPin,
      title: 'Real Verified Landmarks',
      description: 'Direct integration with OpenStreetMap ensures authentic coordinates for historic palaces, hilltop fortresses, and local dining.'
    },
    {
      icon: Car,
      title: 'Effortless Transportation',
      description: 'Intelligent transit recommendations match your group size and pace—prioritizing comfortable rides whenever walking is unfeasible.'
    },
    {
      icon: Calendar,
      title: 'Balanced Day-by-Day Flow',
      description: 'Your itinerary is carefully anchored to your hotel, grouping nearby attractions to eliminate backtracking across city traffic.'
    }
  ];

  return (
    <section id="why-tripmind" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="rounded-4xl bg-white border border-cream-300 p-8 sm:p-14 shadow-travel-card"
      >
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
            The TripMind Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-travel-dark tracking-tight mt-3">
            Intelligent travel, crafted for you.
          </h2>
          <p className="text-sm sm:text-base text-travel-body mt-2 leading-relaxed">
            Unlike static travel blogs or cookie-cutter packages, TripMind builds dynamic, realistic itineraries that account for weather, geography, and your travel style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="space-y-3 group p-2 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 group-hover:bg-forest-700 group-hover:text-white transition-colors duration-300 shadow-xs">
                  <Icon className="w-6 h-6 transition-transform group-hover:scale-110 duration-300" />
                </div>
                <h3 className="text-base font-bold text-travel-dark group-hover:text-forest-800 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-travel-body leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </motion.div>
    </section>
  );
}
