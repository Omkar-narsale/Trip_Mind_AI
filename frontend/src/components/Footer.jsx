import React from 'react';
import { Compass, Heart, ArrowUp } from 'lucide-react';

export default function Footer({ onOpenSavedTrips, onScrollToPlanner }) {
  return (
    <footer className="bg-white border-t border-cream-300 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-cream-200">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-travel-dark font-sans tracking-tight">
                TripMind
              </span>
            </div>

            <p className="text-sm text-travel-body max-w-md leading-relaxed">
              TripMind creates personalized journeys using live weather intelligence, OpenStreetMap verified destinations, and intelligent day-by-day scheduling.
            </p>

            <div className="pt-2 text-xs text-travel-muted">
              <span>Designed with an editorial travel agency aesthetic.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-travel-dark">
              Explore
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-travel-body">
              <li>
                <button 
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-forest-700 transition-colors"
                >
                  Featured Journeys
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('popular-destinations');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-forest-700 transition-colors"
                >
                  Popular Destinations
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('why-tripmind');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-forest-700 transition-colors"
                >
                  The TripMind Standard
                </button>
              </li>
            </ul>
          </div>

          {/* Account / Trips */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-travel-dark">
              Journeys
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-travel-body">
              <li>
                <button 
                  type="button"
                  onClick={onScrollToPlanner}
                  className="hover:text-forest-700 transition-colors"
                >
                  Plan a New Trip
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={onOpenSavedTrips}
                  className="hover:text-forest-700 transition-colors"
                >
                  My Saved Trips
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-travel-muted">
          <p>© {new Date().getFullYear()} TripMind. All rights reserved.</p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 hover:text-travel-dark transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
