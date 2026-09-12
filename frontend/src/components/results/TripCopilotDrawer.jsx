import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, X, Send, Bot, User, 
  ChevronRight, RefreshCw, Compass, ShieldCheck, ThermometerSun 
} from 'lucide-react';

export default function TripCopilotDrawer({
  destination = 'Destination',
  origin = 'Origin',
  departureDate,
  returnDate,
  travelers = 2,
  budget,
  topHotel,
  itineraryData,
  weatherContext
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Welcome! I am your **TripMind Concierge** for your upcoming journey to **${destination}** staying at **${topHotel?.name || 'your hotel'}**. Ask me anything about packing, authentic dining near your stay, or itinerary pacing adjustments!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    `🎒 What should I pack for ${destination}?`,
    `🍲 Authentic dining near ${topHotel?.name || 'hotel'}`,
    `🚶 Pacing & walking advice for our group`,
    `☕ Best morning cafes & tea spots`
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // Gather top activities summary for grounding
      const activitiesSummary = [];
      if (itineraryData?.days) {
        itineraryData.days.forEach((d) => {
          (d.activities || []).slice(0, 3).forEach((a) => {
            if (a.title) activitiesSummary.push(a.title);
          });
        });
      }

      const payload = {
        message: text,
        destination,
        origin,
        departure_date: departureDate,
        return_date: returnDate,
        travelers,
        budget,
        hotel_name: topHotel?.name || 'Selected Stay',
        trip_summary: `Trip to ${destination} with ${travelers} guests`,
        activities_summary: activitiesSummary.slice(0, 8),
        weather_summary: weatherContext?.summary || 'Pleasant traveling weather'
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.status}`);
      }

      const data = await res.json();
      const aiReply = data.reply || `I have verified your request for ${destination}. Let me know how else I can assist!`;
      
      setMessages((prev) => [...prev, { role: 'assistant', text: aiReply }]);

      if (data.suggested_followups && data.suggested_followups.length > 0) {
        setSuggestions(data.suggested_followups);
      }
    } catch (err) {
      console.error('Co-pilot chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I'm on duty to help you navigate **${destination}**! If you're staying near ${topHotel?.name || 'your lodging'}, allow comfortable travel buffer between stops. Feel free to ask about nearby food specialties or packing tips!`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-forest-800 text-white shadow-travel-hover hover:bg-forest-900 transition-all transform hover:-translate-y-0.5 border border-forest-700/50"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            Trip Co-Pilot
          </span>
          <span className="hidden sm:inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
            AI
          </span>
        </button>
      </div>

      {/* Slide-out Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-cream-300">
              
              {/* Header */}
              <div className="p-4 sm:p-5 bg-forest-900 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base flex items-center gap-1.5">
                      <span>TripMind Concierge</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </h3>
                    <p className="text-[11px] text-white/70">
                      Grounded in {destination} • {topHotel?.name || 'Stay'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-cream-50/40">
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div 
                      key={idx}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div 
                        className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser 
                            ? 'bg-forest-800 text-white rounded-tr-none shadow-sm' 
                            : 'bg-white text-travel-dark border border-cream-200 shadow-subtle rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-cream-200 text-travel-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-cream-200 p-3 rounded-2xl rounded-tl-none shadow-subtle text-xs text-travel-muted flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-forest-600 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-forest-600 animate-bounce delay-150" />
                      <div className="w-2 h-2 rounded-full bg-forest-600 animate-bounce delay-300" />
                      <span className="ml-1 text-[11px]">Consulting local intelligence...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 bg-white border-t border-cream-200">
                  <span className="text-[10px] font-bold text-travel-muted uppercase tracking-wider block mb-1.5">
                    Quick suggestions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 3).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(s)}
                        disabled={loading}
                        className="text-[11px] font-medium text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200/60 px-2.5 py-1 rounded-full text-left transition-colors truncate max-w-full"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Box */}
              <div className="p-4 bg-white border-t border-cream-200">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Ask about ${destination}, food, packing...`}
                    disabled={loading}
                    className="flex-1 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-xl px-3.5 py-2.5 text-travel-dark placeholder:text-travel-muted focus:outline-none focus:border-forest-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
