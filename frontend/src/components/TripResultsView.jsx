import React, { useState } from 'react';
import TripResultsHero from './results/TripResultsHero';
import TripResultsNav from './results/TripResultsNav';
import OverviewSection from './results/OverviewSection';
import StaySection from './results/StaySection';
import ExploreSection from './results/ExploreSection';
import FoodSection from './results/FoodSection';
import TransportSection from './results/TransportSection';
import ItinerarySection from './results/ItinerarySection';
import PackingSection from './results/PackingSection';
import BudgetSection from './results/BudgetSection';
import MapSection from './results/MapSection';
import DeveloperModeModal from './results/DeveloperModeModal';
import PrintBrochureView from './results/PrintBrochureView';
import TripCopilotDrawer from './results/TripCopilotDrawer';
import { Terminal } from 'lucide-react';

export default function TripResultsView({
  planResponse,
  tripProfile,
  onNewTrip,
  sessionId
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [devModeOpen, setDevModeOpen] = useState(false);

  const req = tripProfile?.trip_request || {};
  const destination = req.destination || 'Jaipur';
  const origin = req.origin || 'Mumbai';
  const departureDate = req.departure_date || '2026-09-11';
  const returnDate = req.return_date || '2026-09-16';
  const travelers = req.travelers || 4;
  const budget = req.budget || 60000;
  const styles = req.preferences || ['Heritage', 'Relaxed'];
  const totalDays = planResponse?.itinerary_context?.total_days || 6;

  const hotels = planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || [];
  const rawTopHotel = hotels[0];
  const topHotel = rawTopHotel?.hotel || rawTopHotel;
  const places = planResponse?.ranked_attractions || planResponse?.places_context?.places || [];
  const foodContext = planResponse?.food_context;
  const transportationData = planResponse?.transportation_context;
  const itineraryData = planResponse?.itinerary_context;
  const weatherContext = planResponse?.weather_context;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Star Destination Hero */}
      <TripResultsHero
        destination={destination}
        origin={origin}
        departureDate={departureDate}
        returnDate={returnDate}
        travelers={travelers}
        budget={budget}
        styles={styles}
        totalDays={totalDays}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          const el = document.getElementById('results-content');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onNewTrip={onNewTrip}
      />

      {/* 2. Sticky Horizontal Travel Navigation */}
      <TripResultsNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* 3. Main Content Views */}
      <div id="results-content" className="pt-4 min-h-[500px]">
        {activeTab === 'overview' && (
          <OverviewSection
            destination={destination}
            origin={origin}
            departureDate={departureDate}
            returnDate={returnDate}
            travelers={travelers}
            budget={budget}
            planResponse={planResponse}
            tripProfile={tripProfile}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'stay' && (
          <StaySection
            hotels={hotels}
            destination={destination}
            departureDate={departureDate}
            returnDate={returnDate}
            travelers={travelers}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreSection
            places={places}
            destination={destination}
          />
        )}

        {activeTab === 'food' && (
          <FoodSection
            foodContext={foodContext}
            destination={destination}
          />
        )}

        {activeTab === 'transport' && (
          <TransportSection
            transportationData={transportationData}
            destination={destination}
            origin={origin}
            departureDate={departureDate}
            returnDate={returnDate}
            travelers={travelers}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItinerarySection
            itineraryData={itineraryData}
            weatherContext={weatherContext}
            destination={destination}
            topHotel={topHotel}
          />
        )}

        {activeTab === 'packing' && (
          <PackingSection
            destination={destination}
            departureDate={departureDate}
            returnDate={returnDate}
            weatherContext={weatherContext}
            itineraryData={itineraryData}
            travelers={travelers}
            styles={styles}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetSection
            destination={destination}
            origin={origin}
            budget={budget}
            travelers={travelers}
            totalDays={totalDays}
            tripProfile={tripProfile}
            planResponse={planResponse}
          />
        )}

        {activeTab === 'map' && (
          <MapSection
            planResponse={planResponse}
            destination={destination}
          />
        )}
      </div>

      {/* Printable Brochure View (visible during print/PDF) */}
      <PrintBrochureView
        destination={destination}
        origin={origin}
        departureDate={departureDate}
        returnDate={returnDate}
        travelers={travelers}
        budget={budget}
        topHotel={topHotel}
        itineraryData={itineraryData}
        weatherContext={weatherContext}
      />

      {/* Floating AI Trip Co-Pilot Concierge */}
      <TripCopilotDrawer
        destination={destination}
        origin={origin}
        departureDate={departureDate}
        returnDate={returnDate}
        travelers={travelers}
        budget={budget}
        topHotel={topHotel}
        itineraryData={itineraryData}
        weatherContext={weatherContext}
      />

      {/* Subtle Developer Mode Trigger at the bottom */}
      <div className="pt-12 border-t border-cream-300 flex items-center justify-between text-xs text-travel-muted print:hidden">
        <span>TripMind Intelligent Travel Engine</span>
        <button
          type="button"
          onClick={() => setDevModeOpen(true)}
          className="hover:text-forest-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Developer Mode</span>
        </button>
      </div>

      {/* Developer Mode Diagnostics Modal */}
      <DeveloperModeModal
        isOpen={devModeOpen}
        onClose={() => setDevModeOpen(false)}
        planResponse={planResponse}
        sessionId={sessionId}
      />

    </section>
  );
}
