import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeartHandshake, 
  Smile, 
  Gauge, 
  Users2, 
  BedDouble, 
  Utensils, 
  Car, 
  Ban, 
  Sparkles, 
  ShieldAlert,
  Info,
  Tag
} from 'lucide-react';

export default function TravelPreferences({ preferences }) {
  if (!preferences) return null;

  const hasAnyPreference = 
    preferences.travel_mood ||
    preferences.pace ||
    preferences.traveler_context ||
    preferences.accommodation_preferences ||
    preferences.food_preferences ||
    preferences.transportation_preferences ||
    (preferences.preferred_activities && preferences.preferred_activities.length > 0) ||
    (preferences.avoided_activities && preferences.avoided_activities.length > 0) ||
    preferences.accessibility_or_special_constraints;

  if (!hasAnyPreference) return null;

  return (
    <div className="mt-6 pt-6 border-t border-slate-200/80">
      
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
          <HeartHandshake className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">
            Natural-Language Travel Preferences
          </h4>
          <p className="text-xs text-slate-500">
            Extracted from your custom trip instructions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        
        {/* Travel Mood */}
        {preferences.travel_mood && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <Smile className="w-4 h-4 text-purple-600" />
              <span>Travel Mood</span>
            </div>
            <p className="font-semibold text-slate-900 capitalize">
              {preferences.travel_mood}
            </p>
          </div>
        )}

        {/* Trip Pace */}
        {preferences.pace && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <Gauge className="w-4 h-4 text-brand-600" />
              <span>Trip Pace</span>
            </div>
            <p className="font-semibold text-slate-900 capitalize">
              {preferences.pace}
            </p>
          </div>
        )}

        {/* Traveler Context */}
        {preferences.traveler_context && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <Users2 className="w-4 h-4 text-emerald-600" />
              <span>Traveler Context</span>
            </div>
            <p className="font-semibold text-slate-900">
              {preferences.traveler_context}
            </p>
          </div>
        )}

        {/* Accommodation Preference */}
        {preferences.accommodation_preferences && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <BedDouble className="w-4 h-4 text-blue-600" />
              <span>Accommodation Style</span>
            </div>
            <p className="font-semibold text-slate-900">
              {preferences.accommodation_preferences}
            </p>
          </div>
        )}

        {/* Food Preferences */}
        {preferences.food_preferences && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Food & Dining</span>
            </div>
            <p className="font-semibold text-slate-900">
              {preferences.food_preferences}
            </p>
          </div>
        )}

        {/* Transportation Preferences */}
        {preferences.transportation_preferences && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
              <Car className="w-4 h-4 text-cyan-600" />
              <span>Transit & Logistics</span>
            </div>
            <p className="font-semibold text-slate-900">
              {preferences.transportation_preferences}
            </p>
          </div>
        )}

      </div>

      {/* Preferred vs Avoided Activities */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Preferred Activities */}
        {preferences.preferred_activities && preferences.preferred_activities.length > 0 && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Preferred Activities (Extracted)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.preferred_activities.map((act, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                >
                  + {act}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Avoided Activities */}
        {preferences.avoided_activities && preferences.avoided_activities.length > 0 && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold mb-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Activities to Avoid</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferences.avoided_activities.map((avoid, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium"
                >
                  ✕ {avoid}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Accessibility / Special Constraints */}
      {preferences.accessibility_or_special_constraints && (
        <div className="mt-4 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-950">Special Needs / Accessibility: </span>
            {preferences.accessibility_or_special_constraints}
          </div>
        </div>
      )}

      {/* Confidence Notes */}
      {preferences.confidence_notes && (
        <div className="mt-3 p-3 rounded-lg bg-slate-100 text-slate-600 text-xs flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>{preferences.confidence_notes}</span>
        </div>
      )}

    </div>
  );
}
