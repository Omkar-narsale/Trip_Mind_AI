import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PopularDestinations from '../components/PopularDestinations';
import TripPlanningForm from '../components/TripPlanningForm';
import WhyTripMind from '../components/WhyTripMind';
import TripResultsView from '../components/TripResultsView';
import LoadingExperience from '../components/LoadingExperience';
import SavedTripsModal from '../components/SavedTripsModal';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const [isSavedTripsOpen, setIsSavedTripsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State initialized clean (empty by default)
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_date: '',
    return_date: '',
    travelers: 2,
    budget: '',
    preferences: [],
    additional_instructions: ''
  });

  const [tripProfile, setTripProfile] = useState(null);
  const [planResponse, setPlanResponse] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Handle Form Change
  const handleFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Scroll to Planning Form
  const scrollToPlanner = () => {
    const el = document.getElementById('trip-planner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  // Select Popular Destination card
  const handleSelectPopularDestination = (destName) => {
    handleFormChange('destination', destName);
    scrollToPlanner();
  };

  // Execute End-to-End Planning
  const handleExecutePlanning = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Synthesize Enhanced Trip Profile
      const profilePayload = {
        origin: formData.origin,
        destination: formData.destination,
        departure_date: formData.departure_date,
        return_date: formData.return_date,
        travelers: Number(formData.travelers),
        budget: Number(formData.budget),
        preferences: formData.preferences,
        additional_instructions: formData.additional_instructions
      };

      const profRes = await fetch(`${API_BASE}/api/trip/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });

      if (!profRes.ok) {
        const errText = await profRes.text();
        throw new Error(`Profile creation failed: ${errText}`);
      }

      const profData = await profRes.json();
      const profile = profData.profile;
      setTripProfile(profile);

      // Step 2: Execute Autonomous LangGraph Trip Planner
      const planRes = await fetch(`${API_BASE}/api/trip/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profile,
          session_id: sessionId || null
        })
      });

      if (!planRes.ok) {
        const errText = await planRes.text();
        throw new Error(`Trip planning failed: ${errText}`);
      }

      const planData = await planRes.json();
      setPlanResponse(planData);

      if (planData.session_id) {
        setSessionId(planData.session_id);
        localStorage.setItem('tripmind_active_session_id', planData.session_id);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Trip planning failed:', err);
      setError(err.message || 'Unable to build trip at this moment.');
    } finally {
      setLoading(false);
    }
  };

  // Restore Session Helper
  const restoreSessionData = (sessionData) => {
    if (!sessionData) return;

    const sId = sessionData.session?.id;
    if (sId) {
      setSessionId(sId);
      localStorage.setItem('tripmind_active_session_id', sId);
    }

    const req = sessionData.trip_request || {};
    if (req.destination) {
      setFormData({
        origin: req.origin || 'Mumbai',
        destination: req.destination,
        departure_date: req.departure_date || '2026-09-11',
        return_date: req.return_date || '2026-09-16',
        travelers: req.travelers || 4,
        budget: req.budget || 59990,
        preferences: req.preferences || ['Heritage', 'Relaxation'],
        additional_instructions: req.additional_instructions || ''
      });
    }

    const prof = sessionData.trip_profile;
    if (prof) setTripProfile(prof);

    // Reconstruct planResponse
    const reconstructedPlan = {
      session_id: sId,
      weather_context: sessionData.weather_result,
      places_context: sessionData.places_result,
      ranked_attractions: sessionData.places_result?.ranked_attractions || [],
      hotel_context: sessionData.hotel_result,
      ranked_hotels: sessionData.hotel_result?.ranked_hotels || [],
      food_context: sessionData.food_result,
      transportation_context: sessionData.transportation_result,
      itinerary_context: sessionData.itinerary_result,
      persistence: { supabase: true, local_fallback: false, status: 'cloud_confirmed' }
    };

    setPlanResponse(reconstructedPlan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Saved trips can be loaded on-demand via the SavedTripsModal
  // Initial page load always starts clean with an empty form

  // Handle New Trip Reset
  const handleNewTrip = () => {
    localStorage.removeItem('tripmind_active_session_id');
    setPlanResponse(null);
    setSessionId(null);
    setTripProfile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-travel-dark selection:bg-forest-600 selection:text-white">
      
      {/* 1. Modern Travel Navigation */}
      <Navbar
        onOpenSavedTrips={() => setIsSavedTripsOpen(true)}
        onScrollToPlanner={scrollToPlanner}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Loading Experience */}
        {loading ? (
          <LoadingExperience destination={formData.destination || 'your destination'} />
        ) : planResponse ? (
          /* Star Screen: Results Experience */
          <TripResultsView
            planResponse={planResponse}
            tripProfile={tripProfile}
            onNewTrip={handleNewTrip}
            sessionId={sessionId}
          />
        ) : (
          /* Landing & Booking Flow */
          <>
            {/* Hero with Integrated Floating Search */}
            <HeroSection
              formData={formData}
              onFormChange={handleFormChange}
              onStartPlanning={handleExecutePlanning}
              loading={loading}
              onExploreClick={() => {
                const el = document.getElementById('popular-destinations');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Error Notification if any */}
            {error && (
              <div className="max-w-4xl mx-auto px-4 my-6">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  {error}
                </div>
              </div>
            )}

            {/* Popular Destinations Grid */}
            <PopularDestinations
              onSelectDestination={handleSelectPopularDestination}
            />

            {/* Editorial Travel Planning Form */}
            <TripPlanningForm
              formData={formData}
              onChange={handleFormChange}
              onSubmit={handleExecutePlanning}
              loading={loading}
            />

            {/* Why TripMind Feature Narrative */}
            <WhyTripMind />
          </>
        )}

      </main>

      {/* Footer */}
      <Footer
        onOpenSavedTrips={() => setIsSavedTripsOpen(true)}
        onScrollToPlanner={scrollToPlanner}
      />

      {/* Saved Trips Drawer / Modal */}
      <SavedTripsModal
        isOpen={isSavedTripsOpen}
        onClose={() => setIsSavedTripsOpen(false)}
        onSelectTrip={(sessionData) => restoreSessionData(sessionData)}
      />

    </div>
  );
}
