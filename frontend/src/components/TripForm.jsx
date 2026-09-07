import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Tag, 
  Compass, 
  MessageSquareText,
  Bot,
  ArrowRight
} from 'lucide-react';
import TripHero from './TripHero';
import TripIntelligence from './TripIntelligence';
import PlanningTimeline from './PlanningTimeline';
import WeatherIntelligence from './WeatherIntelligence';
import DestinationDiscovery from './DestinationDiscovery';
import AgentActivity from './AgentActivity';

const PREFERENCE_OPTIONS = [
  'Adventure',
  'Beaches',
  'Food',
  'Nature',
  'History',
  'Shopping',
  'Nightlife',
  'Relaxation'
];

const PROFILE_LOADING_STEPS = [
  "Understanding your trip parameters...",
  "Extracting natural-language travel desires...",
  "Synthesizing your Enhanced Trip Profile..."
];

const PLANNING_LOADING_STEPS = [
  "Decomposing trip requirements into LangGraph graph...",
  "Querying Open-Meteo live weather tool...",
  "Discovering real POIs via OpenStreetMap Overpass API...",
  "Ranking attractions with preference-aware AI...",
  "Validating workflow task dependencies..."
];

export default function TripForm() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_date: '',
    return_date: '',
    travelers: 1,
    budget: '',
    preferences: [],
    additional_instructions: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileStep, setProfileStep] = useState(0);
  const [error, setError] = useState(null);
  const [profileResult, setProfileResult] = useState(null);
  const [profileWarning, setProfileWarning] = useState(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planStep, setPlanStep] = useState(0);
  const [planError, setPlanError] = useState(null);
  const [planResponse, setPlanResponse] = useState(null);

  // Profile loading message ticker
  useEffect(() => {
    let interval = null;
    if (loadingProfile) {
      setProfileStep(0);
      interval = setInterval(() => {
        setProfileStep((prev) => (prev + 1) % PROFILE_LOADING_STEPS.length);
      }, 1800);
    } else {
      setProfileStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingProfile]);

  // Planning loading message ticker
  useEffect(() => {
    let interval = null;
    if (loadingPlan) {
      setPlanStep(0);
      interval = setInterval(() => {
        setPlanStep((prev) => (prev + 1) % PLANNING_LOADING_STEPS.length);
      }, 2000);
    } else {
      setPlanStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingPlan]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const togglePreference = (pref) => {
    setFormData((prev) => {
      const exists = prev.preferences.includes(pref);
      return {
        ...prev,
        preferences: exists
          ? prev.preferences.filter((item) => item !== pref)
          : [...prev.preferences, pref]
      };
    });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setProfileResult(null);
    setProfileWarning(null);
    setPlanResponse(null);
    setPlanError(null);

    // Validation
    if (!formData.origin.trim() || !formData.destination.trim()) {
      setError('Please provide both starting location and destination.');
      return;
    }

    if (formData.origin.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      setError('Starting location and destination cannot be the same place.');
      return;
    }

    if (!formData.departure_date || !formData.return_date) {
      setError('Please select both departure and return dates.');
      return;
    }

    if (new Date(formData.return_date) < new Date(formData.departure_date)) {
      setError('Return date cannot be earlier than departure date.');
      return;
    }

    if (Number(formData.travelers) < 1) {
      setError('Number of travelers must be at least 1.');
      return;
    }

    if (Number(formData.budget) <= 0 || isNaN(Number(formData.budget))) {
      setError('Budget must be a positive number.');
      return;
    }

    setLoadingProfile(true);

    try {
      const payload = {
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        departure_date: formData.departure_date,
        return_date: formData.return_date,
        travelers: parseInt(formData.travelers, 10),
        budget: parseFloat(formData.budget),
        preferences: formData.preferences,
        additional_instructions: formData.additional_instructions.trim() || null
      };

      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/trip/profile` 
        : 'http://127.0.0.1:8000/api/trip/profile';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        let errMessage = 'Failed to analyze travel requirements.';
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errMessage = data.detail.map((d) => d.msg || d.message).join(', ');
          } else {
            errMessage = data.detail;
          }
        }
        throw new Error(errMessage);
      }

      if (data.profile) {
        setProfileResult(data.profile);
        if (data.warning) setProfileWarning(data.warning);
      } else {
        throw new Error('Profile data not received from server.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to backend server. Make sure FastAPI is running on port 8000.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleStartPlanning = async () => {
    if (!profileResult) return;
    setLoadingPlan(true);
    setPlanError(null);
    setPlanResponse(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/trip/plan` 
        : 'http://127.0.0.1:8000/api/trip/plan';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileResult)
      });

      const data = await res.json();

      if (!res.ok) {
        let errMessage = 'Autonomous planning agent failed to construct workflow.';
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errMessage = data.detail.map((d) => d.msg || d.message).join(', ');
          } else {
            errMessage = data.detail;
          }
        }
        throw new Error(errMessage);
      }

      setPlanResponse(data);
    } catch (err) {
      console.error(err);
      setPlanError(err.message || 'Unable to execute planning workflow. Please try again.');
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <section id="trip-form" className="py-12 md:py-20 bg-dark-950 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Travel Blueprint</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Design Your Next Journey
          </h2>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Provide your itinerary details and natural-language instructions to launch the autonomous agent.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-dark-900/90 border border-white/10 p-6 sm:p-10 shadow-card backdrop-blur-xl">
          <form onSubmit={handleSubmitProfile} className="space-y-6 sm:space-y-8">
            
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Starting Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="origin"
                    id="origin"
                    required
                    placeholder="e.g. San Francisco, CA"
                    value={formData.origin}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Destination
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="destination"
                    id="destination"
                    required
                    placeholder="e.g. Tokyo, Japan"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Departure & Return */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Departure Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="departure_date"
                    id="departure_date"
                    required
                    value={formData.departure_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Return Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="return_date"
                    id="return_date"
                    required
                    value={formData.return_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Travelers & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Travelers
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    name="travelers"
                    id="travelers"
                    min="1"
                    required
                    placeholder="1"
                    value={formData.travelers}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Total Budget (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    name="budget"
                    id="budget"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 3500"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Travel Preferences Chips */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2.5">
                Primary Interests <span className="text-slate-500 font-normal">(Select multiple)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((pref) => {
                  const isSelected = formData.preferences.includes(pref);
                  return (
                    <button
                      type="button"
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white shadow-glow-brand'
                          : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <Tag className={`w-3 h-3 ${isSelected ? 'text-brand-200' : 'text-slate-500'}`} />
                      <span>{pref}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Natural Language Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-brand-400" />
                  <span>Tell TripMind More About Your Journey</span>
                </label>
                <span className="text-[11px] text-slate-500">Optional</span>
              </div>
              <textarea
                name="additional_instructions"
                id="additional_instructions"
                rows={3}
                value={formData.additional_instructions}
                onChange={handleInputChange}
                placeholder="Example: We want a relaxed cultural trip with local food, comfortable central hotels, and not too much walking. We are traveling with kids."
                className="w-full p-3.5 bg-dark-850 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all leading-relaxed"
              />
            </div>

            {/* Form Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs sm:text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <span className="font-bold">Validation Notice: </span>
                  {error}
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingProfile}
              className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-glow-brand transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loadingProfile ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-200" />
                  <span className="animate-pulse">{PROFILE_LOADING_STEPS[profileStep]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Synthesize Travel Profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Narrative Post-Submission Experience */}
        <AnimatePresence>
          {profileResult && (
            <div className="space-y-8 pt-4">
              
              {/* Section 1: Trip Hero Overview */}
              <TripHero 
                tripRequest={profileResult.trip_request} 
                tripAnalysis={profileResult.trip_analysis} 
              />

              {/* Section 2: Trip Intelligence */}
              <TripIntelligence profile={profileResult} />

              {/* Phase 6 CTA: Create AI Planning Workflow */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dark-900 via-indigo-950 to-dark-900 border border-brand-500/30 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Phase 6 Autonomous Agent</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Launch Autonomous LangGraph Planning & Discovery
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    TripMind will autonomously decompose your travel workflow, query real-time Open-Meteo weather data, discover real POIs via OpenStreetMap, and rank tailored experiences.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartPlanning}
                  disabled={loadingPlan}
                  className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow-brand transition-all flex items-center justify-center gap-2.5 flex-shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loadingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-200" />
                      <span className="animate-pulse">{PLANNING_LOADING_STEPS[planStep]}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      <span>Execute Autonomous Agent</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Planning Error Notice */}
              {planError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Agent Execution Error: </span>
                    {planError}
                  </div>
                </div>
              )}

              {/* Planning Results (Weather, Discovery, Timeline, Activity) */}
              {planResponse && (
                <div className="space-y-8">
                  
                  {/* Section 4: Weather Experience (Real Open-Meteo Tool & Groq Insight) */}
                  {planResponse.weather_context && (
                    <WeatherIntelligence 
                      weatherContext={planResponse.weather_context}
                      weatherInsight={planResponse.weather_insight}
                    />
                  )}

                  {/* Section 5: Destination Discovery (Real OpenStreetMap POIs & AI Ranking) */}
                  {(planResponse.places_context || (planResponse.ranked_attractions && planResponse.ranked_attractions.length > 0)) && (
                    <DestinationDiscovery 
                      placesContext={planResponse.places_context}
                      rankedAttractions={planResponse.ranked_attractions}
                    />
                  )}

                  {/* Section 6: AI Planning Timeline */}
                  {planResponse.planning_result && (
                    <PlanningTimeline 
                      tasks={planResponse.planning_result.tasks}
                      planningStrategy={planResponse.planning_result.planning_strategy}
                    />
                  )}

                  {/* Section 7: Agent Activity */}
                  {planResponse.execution?.messages && (
                    <AgentActivity 
                      messages={planResponse.execution.messages}
                      status={planResponse.execution.status}
                    />
                  )}

                </div>
              )}

            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
