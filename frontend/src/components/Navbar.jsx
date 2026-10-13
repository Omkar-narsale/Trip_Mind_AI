import React, { useState } from 'react';
import { Compass, Menu, X, Bookmark, Sparkles, MapPin, Scan } from 'lucide-react';

export default function Navbar({ onOpenSavedTrips, onScrollToPlanner, onOpenScanner }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-300 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center shadow-sm group-hover:bg-forest-600 transition-colors">
              <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-travel-dark tracking-tight block font-sans">
                TripMind
              </span>
              <span className="text-[11px] font-semibold text-forest-700 tracking-wider uppercase block -mt-1">
                Travel Journeys
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-travel-body">
            <button 
              type="button" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-travel-dark hover:text-forest-700 transition-colors"
            >
              Home
            </button>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('popular-destinations');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-forest-700 transition-colors"
            >
              Destinations
            </button>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('why-tripmind');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-forest-700 transition-colors"
            >
              Experience
            </button>
            <button 
              type="button" 
              onClick={onOpenSavedTrips}
              className="hover:text-forest-700 transition-colors flex items-center gap-1.5"
            >
              <Bookmark className="w-4 h-4 text-forest-600" />
              <span>My Trips</span>
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-full text-xs font-bold text-forest-800 bg-forest-100 hover:bg-forest-200 border border-forest-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Scan travel ticket or voucher with Groq Vision AI"
            >
              <Scan className="w-3.5 h-3.5 text-forest-700" />
              <span>Scan Ticket 📷</span>
            </button>
            <button
              type="button"
              onClick={onOpenSavedTrips}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-travel-body hover:text-travel-dark hover:bg-cream-200/70 transition-colors"
            >
              Saved Trips
            </button>
            <button
              type="button"
              onClick={onScrollToPlanner}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-forest-200" />
              <span>Plan a Trip</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-travel-dark hover:bg-cream-200 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-cream-300 px-6 py-5 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-travel-body">
            <button 
              type="button" 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 text-travel-dark"
            >
              Home
            </button>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('popular-destinations');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="text-left py-1"
            >
              Destinations
            </button>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('why-tripmind');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              className="text-left py-1"
            >
              Experience
            </button>
            <button 
              type="button" 
              onClick={() => {
                onOpenSavedTrips();
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 flex items-center gap-2 text-forest-700"
            >
              <Bookmark className="w-4 h-4" />
              <span>My Trips</span>
            </button>
          </nav>
          
          <div className="pt-3 border-t border-cream-200">
            <button
              type="button"
              onClick={() => {
                onScrollToPlanner();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-full text-center text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 shadow-sm transition-all"
            >
              Plan a Trip
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
