import React from 'react';
import { 
  LayoutDashboard, Building2, Compass, Utensils, Car, Calendar, Luggage, Wallet, Map as MapIcon
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stay', label: 'Stay', icon: Building2 },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'packing', label: 'Packing & Prep', icon: Luggage },
  { id: 'budget', label: 'Budget & Expenses', icon: Wallet },
  { id: 'map', label: 'Map', icon: MapIcon },
];

export default function TripResultsNav({ activeTab, onTabChange }) {
  return (
    <div className="sticky top-20 z-30 bg-cream-100/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all border-b border-cream-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max p-1 bg-white rounded-full border border-cream-300 shadow-subtle">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'text-travel-body hover:text-travel-dark hover:bg-cream-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-forest-200' : 'text-forest-700'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
