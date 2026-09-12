import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Users, IndianRupee, Sparkles, 
  ShieldCheck, Heart, Compass, Coffee, Mountain, Landmark, ShoppingBag
} from 'lucide-react';

const STYLE_OPTIONS = [
  { id: 'Heritage', label: 'Heritage & History', icon: Landmark },
  { id: 'Relaxation', label: 'Relaxed & Leisure', icon: Coffee },
  { id: 'Food', label: 'Local Food & Dining', icon: Heart },
  { id: 'Nature', label: 'Nature & Scenery', icon: Mountain },
  { id: 'Shopping', label: 'Artisans & Shopping', icon: ShoppingBag },
  { id: 'Adventure', label: 'Active Exploration', icon: Compass },
];

export default function TripPlanningForm({
  formData,
  onChange,
  onSubmit,
  loading = false
}) {
  const toggleStyle = (styleId) => {
    const current = formData.preferences || [];
    if (current.includes(styleId)) {
      onChange('preferences', current.filter(s => s !== styleId));
    } else {
      onChange('preferences', [...current, styleId]);
    }
  };

  return (
    <section id="trip-planner" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-3.5 py-1 rounded-full inline-block mb-3">
          Custom Journey Creator
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-travel-dark tracking-tight">
          Where will your next journey take you?
        </h2>
        <p className="text-sm sm:text-base text-travel-body mt-3">
          Tell us a little about your trip and TripMind will build the rest.
        </p>
      </motion.div>

      {/* Main Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="rounded-4xl bg-white border border-cream-300 p-8 sm:p-12 shadow-travel-card"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }} 
          className="space-y-8"
        >
          {/* Section 1: Route & Dates (2-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Origin */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Starting Point (From)
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.origin || ''}
                  onChange={(e) => onChange('origin', e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none placeholder:text-stone-400"
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Destination (To)
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.destination || ''}
                  onChange={(e) => onChange('destination', e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none placeholder:text-stone-400"
                  required
                />
              </div>
            </div>

            {/* Departure Date */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={formData.departure_date || ''}
                  onChange={(e) => onChange('departure_date', e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Return Date */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Return Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={formData.return_date || ''}
                  onChange={(e) => onChange('return_date', e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none"
                  required
                />
              </div>
            </div>

          </div>

          {/* Section 2: Party Size & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cream-200">
            
            {/* Travelers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Number of Travelers
              </label>
              <div className="relative">
                <Users className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formData.travelers || 4}
                  onChange={(e) => onChange('travelers', parseInt(e.target.value, 10))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none cursor-pointer"
                >
                  <option value="1">1 Traveler (Solo Journey)</option>
                  <option value="2">2 Travelers (Couple / Duo)</option>
                  <option value="3">3 Travelers (Small Group)</option>
                  <option value="4">4 Travelers (Family / Friends)</option>
                  <option value="5">5 Travelers (Group)</option>
                  <option value="6">6+ Travelers (Large Party)</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Total Estimated Budget (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-5 h-5 text-forest-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) => onChange('budget', e.target.value)}
                  placeholder="e.g. 60,000"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-semibold text-sm transition-all focus:outline-none placeholder:text-stone-400"
                  required
                />
              </div>
            </div>

          </div>

          {/* Section 3: Travel Styles & Interests */}
          <div className="space-y-3 pt-4 border-t border-cream-200">
            <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
              Travel Styles & Interests
            </label>
            <p className="text-xs text-travel-muted">Select what excites you most about this journey.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLE_OPTIONS.map((style) => {
                const Icon = style.icon;
                const isSelected = (formData.preferences || []).includes(style.id);
                return (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    key={style.id}
                    type="button"
                    onClick={() => toggleStyle(style.id)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                        : 'bg-cream-50 hover:bg-cream-100 text-travel-body border-cream-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-forest-200' : 'text-forest-700'}`} />
                    <span>{style.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Accessibility & Special Desires */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div>
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider mb-1">
                Accessibility & Pace Preferences
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'Avoid excessive walking',
                  'Relaxed pace with afternoon rest',
                  'Wheelchair / elevator accessible',
                  'Family-friendly activities'
                ].map((pref, i) => {
                  const hasPref = (formData.additional_instructions || '').toLowerCase().includes(pref.toLowerCase());
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const current = formData.additional_instructions || '';
                        if (hasPref) {
                          onChange('additional_instructions', current.replace(pref, '').trim());
                        } else {
                          onChange('additional_instructions', current ? `${current}. ${pref}` : pref);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        hasPref
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-cream-50 text-travel-body border-cream-300 hover:bg-cream-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-forest-700" />
                      <span>{pref}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-travel-dark uppercase tracking-wider">
                Special Desires or Notes (Optional)
              </label>
              <textarea
                value={formData.additional_instructions || ''}
                onChange={(e) => onChange('additional_instructions', e.target.value)}
                placeholder="e.g. Luxury heritage stays preferred. We love sunset views and relaxed evenings without long walking."
                rows={3}
                className="w-full p-4 rounded-2xl bg-cream-50 border border-cream-300 focus:border-forest-600 focus:bg-white text-travel-dark font-medium text-xs sm:text-sm transition-all focus:outline-none placeholder:text-stone-400 leading-relaxed"
              />
            </div>
          </div>

          {/* Primary CTA Submit */}
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-forest-700 hover:bg-forest-800 active:scale-[0.99] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Building your custom journey...</span>
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-forest-200" />
                  <span>Create My Trip</span>
                </>
              )}
            </motion.button>
          </div>

        </form>
      </motion.div>

    </section>
  );
}
