import React, { useState, useEffect } from 'react';
import { Compass, Check, Sparkles, CloudSun, MapPin, Building2, Car, Calendar } from 'lucide-react';

const STEPS = [
  { label: "Checking the destination climate & weather", icon: CloudSun },
  { label: "Finding historic places & landmarks you'll love", icon: MapPin },
  { label: "Selecting comfortable accommodations for your group", icon: Building2 },
  { label: "Planning seamless routes & transportation", icon: Car },
  { label: "Building your personalized day-by-day itinerary", icon: Calendar },
];

export default function LoadingExperience({ destination = 'your destination' }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full rounded-4xl bg-white border border-cream-300 p-8 sm:p-12 shadow-travel-card text-center relative overflow-hidden">
        
        {/* Decorative Compass Animation */}
        <div className="w-20 h-20 rounded-3xl bg-forest-50 border border-forest-100 mx-auto flex items-center justify-center text-forest-700 mb-6 shadow-sm">
          <Compass className="w-10 h-10 animate-spin [animation-duration:8s]" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark tracking-tight mb-2">
          Planning your journey...
        </h3>
        <p className="text-xs sm:text-sm text-travel-body mb-8">
          Crafting a personalized escape to <strong className="text-travel-dark">{destination}</strong> tailored to your travel style and pacing.
        </p>

        {/* Travel Steps Checklist */}
        <div className="space-y-3.5 text-left max-w-sm mx-auto">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const Icon = step.icon;

            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  isCurrent 
                    ? 'bg-forest-50 border border-forest-200 text-forest-800 font-bold' 
                    : isCompleted 
                    ? 'text-travel-body opacity-80' 
                    : 'text-stone-400 opacity-40'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                  isCompleted 
                    ? 'bg-forest-600 text-white' 
                    : isCurrent 
                    ? 'bg-forest-700 text-white animate-pulse' 
                    : 'bg-cream-200 text-stone-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>

                <span className="text-xs">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Reassurance Footer */}
        <div className="mt-8 pt-6 border-t border-cream-200 flex items-center justify-center gap-2 text-xs text-travel-muted">
          <Sparkles className="w-3.5 h-3.5 text-forest-600" />
          <span>Using live weather, OpenStreetMap data & smart scheduling</span>
        </div>

      </div>
    </div>
  );
}
