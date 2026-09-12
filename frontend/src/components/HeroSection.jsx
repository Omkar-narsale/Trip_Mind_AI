import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDown, Sparkles, Compass, ShieldCheck, Sun, Map, 
  ChevronLeft, ChevronRight, MapPin, Globe2, Play, Pause 
} from 'lucide-react';
import TripSearchWidget from './TripSearchWidget';
import { HERO_SLIDES } from '../utils/travelImages';

export default function HeroSection({
  formData,
  onFormChange,
  onStartPlanning,
  loading = false,
  onExploreClick
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Automatic slideshow rotation every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const activeSlide = HERO_SLIDES[currentSlide];

  // Quick select active slide destination into the form
  const handleApplySlideDestination = (destName) => {
    if (onFormChange && destName) {
      onFormChange('destination', destName);
    }
  };

  return (
    <section 
      className="relative pt-6 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* Ambient Decorative Blur Gradients */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-forest-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Visual Banner Frame */}
      <div className="max-w-7xl mx-auto w-full relative rounded-4xl overflow-hidden shadow-2xl border border-cream-300 min-h-[480px] sm:min-h-[540px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 text-white group">
        
        {/* Animated Background Image Slideshow with Ken Burns Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${activeSlide.image})` }}
            />
          </AnimatePresence>
        </div>

        {/* Cinematic Gradient Overlays for High Contrast & Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />

        {/* Top Header Tag & Dynamic Location Indicator + Slide Pagination */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold uppercase tracking-wider text-white shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-forest-200 animate-pulse" />
              <span>Intelligent Travel Journeys</span>
            </motion.div>

            {/* Quick Slide Dots in Header */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              {HERO_SLIDES.map((slide, index) => {
                const isActive = index === currentSlide;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Jump to slide ${index + 1}: ${slide.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'w-6 bg-white shadow-xs' 
                        : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Dynamic Location Badge linked to Active Slide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              onClick={() => handleApplySlideDestination(activeSlide.destination)}
              title="Click to set as current destination"
              className="flex items-center gap-2 text-xs font-semibold text-white/95 bg-black/45 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg cursor-pointer hover:bg-black/60 hover:border-white/40 transition-all group/badge"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>{activeSlide.title}</span>
              <span className="text-white/35 hidden sm:inline">•</span>
              <span className="text-cream-200 text-[11px] font-normal hidden sm:inline group-hover/badge:text-white transition-colors">
                {activeSlide.tag}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Center Hero Typography & Interactive CTAs */}
        <div className="relative z-10 max-w-3xl my-auto py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.08] mb-4 drop-shadow-sm">
              Explore the world. <br />
              <span className="italic font-normal text-cream-100">Your way.</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-white/90 font-sans font-normal max-w-2xl leading-relaxed mb-6 drop-shadow-xs">
              TripMind AI creates personalized journeys using live weather forecasts, verified local attractions, and intelligent day-wise scheduling.
            </p>

            {/* Slide Context Hook */}
            <div className="mb-6 flex items-center gap-2 text-xs text-cream-200/95 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-forest-200 shrink-0" />
              <span className="italic">"{activeSlide.description}"</span>
              <button
                type="button"
                onClick={() => handleApplySlideDestination(activeSlide.destination)}
                className="underline hover:text-white transition-colors font-bold ml-1 text-white cursor-pointer shrink-0"
              >
                Plan this →
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-7">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onStartPlanning}
                className="px-8 py-3.5 rounded-full bg-white text-forest-800 hover:bg-cream-100 font-bold text-sm shadow-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-forest-700" />
                <span>Plan your trip</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onExploreClick}
                className="px-7 py-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-sm border border-white/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore destinations</span>
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Feature Highlights Pills (Integrated under CTAs to eliminate any overlap) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/85 font-medium pt-2">
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Open-Meteo live climate</span>
              </div>
              <span className="text-white/30 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Map className="w-4 h-4 text-emerald-300" />
                <span>OpenStreetMap verified</span>
              </div>
              <span className="text-white/30 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>Pacing & style aware</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Slideshow Navigation Controls (Previous & Next Floating Buttons) */}
        <div className="absolute inset-y-0 left-3 sm:left-6 flex items-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all opacity-75 hover:opacity-100 hover:scale-110 pointer-events-auto cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-y-0 right-3 sm:right-6 flex items-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all opacity-75 hover:opacity-100 hover:scale-110 pointer-events-auto cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Planning Search Widget (Cleanly Positioned Below the Hero Image Banner) */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="relative z-20 mt-8 sm:mt-10 px-2 sm:px-4 w-full"
      >
        <TripSearchWidget
          formData={formData}
          onChange={onFormChange}
          onSubmit={onStartPlanning}
          loading={loading}
        />
      </motion.div>

    </section>
  );
}
