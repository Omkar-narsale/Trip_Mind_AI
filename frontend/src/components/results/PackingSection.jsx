import React, { useState, useEffect, useMemo } from 'react';
import {
  Luggage, CheckCircle2, Circle, AlertCircle, Info, ShieldAlert,
  Sparkles, Plus, Trash2, Printer, RotateCcw, CloudSnow, Sun,
  CloudRain, Shirt, Smartphone, FileText, HeartPulse, Layers,
  Compass, Check, AlertTriangle, ExternalLink
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'All': { label: 'All Items', icon: Luggage },
  'Clothing': { label: 'Clothing', icon: Shirt },
  'Footwear': { label: 'Footwear', icon: Layers },
  'Health & Toiletries': { label: 'Health & Toiletries', icon: HeartPulse },
  'Electronics': { label: 'Electronics', icon: Smartphone },
  'Documents': { label: 'Documents', icon: FileText },
  'Custom': { label: 'Custom Added', icon: Plus },
};

export default function PackingSection({
  destination = 'Destination',
  departureDate,
  returnDate,
  weatherContext,
  itineraryData,
  travelers = 2,
  styles = []
}) {
  const [packingData, setPackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // Persistence keys
  const storageKeyChecks = `tripmind_packing_checks_${destination.toLowerCase().replace(/\s+/g, '_')}`;
  const storageKeyCustom = `tripmind_packing_custom_${destination.toLowerCase().replace(/\s+/g, '_')}`;

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeyChecks);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customItems, setCustomItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeyCustom);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // New custom item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Clothing');
  const [newItemEssential, setNewItemEssential] = useState(false);

  // Sync checks with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyChecks, JSON.stringify(checkedItems));
    } catch (e) {
      console.error('Failed to save packing checks:', e);
    }
  }, [checkedItems, storageKeyChecks]);

  // Sync custom items with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyCustom, JSON.stringify(customItems));
    } catch (e) {
      console.error('Failed to save custom items:', e);
    }
  }, [customItems, storageKeyCustom]);

  // Fetch packing checklist from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchPacking() {
      setLoading(true);
      setError(null);

      // Extract activities
      const activities = [];
      if (itineraryData?.days) {
        itineraryData.days.forEach(day => {
          (day.activities || []).slice(0, 3).forEach(act => {
            if (act.title) activities.push(act.title);
          });
        });
      }

      // Estimate season from weather context or departure date
      let season = 'Standard';
      const wSummary = weatherContext?.summary || '';
      if (wSummary.toLowerCase().includes('snow') || wSummary.toLowerCase().includes('sub-zero') || wSummary.toLowerCase().includes('chill')) {
        season = 'Winter / Snow';
      } else if (wSummary.toLowerCase().includes('rain') || wSummary.toLowerCase().includes('monsoon')) {
        season = 'Monsoon / Wet';
      } else if (wSummary.toLowerCase().includes('hot') || wSummary.toLowerCase().includes('warm')) {
        season = 'Summer / Warm';
      }

      try {
        const res = await fetch('/api/packing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination,
            season,
            weather_summary: wSummary || `Trip to ${destination}`,
            activities: activities.slice(0, 8),
            duration_days: itineraryData?.total_days || 4
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to generate packing checklist (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setPackingData(data);
        }
      } catch (err) {
        console.error('Packing fetch error:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load packing recommendations');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPacking();
    return () => { isMounted = false; };
  }, [destination, weatherContext, itineraryData]);

  // Combine backend items with user's custom items
  const allItems = useMemo(() => {
    const baseItems = packingData?.items || [];
    return [...baseItems, ...customItems];
  }, [packingData, customItems]);

  // Calculate completion progress
  const totalCount = allItems.length;
  const packedCount = useMemo(() => {
    return allItems.filter(item => checkedItems[item.id]).length;
  }, [allItems, checkedItems]);
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return allItems;
    if (activeCategory === 'Custom') return customItems;
    return allItems.filter(item => item.category === activeCategory);
  }, [allItems, customItems, activeCategory]);

  // Group items by category when 'All' is selected
  const categoriesList = ['Clothing', 'Footwear', 'Health & Toiletries', 'Electronics', 'Documents'];

  const toggleItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      category: newItemCategory,
      item: newItemName.trim(),
      reason: 'User added custom item',
      is_essential: newItemEssential,
      is_custom: true
    };

    setCustomItems(prev => [newItem, ...prev]);
    setNewItemName('');
    setNewItemEssential(false);
  };

  const handleDeleteCustomItem = (id, e) => {
    e.stopPropagation();
    setCustomItems(prev => prev.filter(item => item.id !== id));
    setCheckedItems(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleResetChecks = () => {
    if (window.confirm('Are you sure you want to uncheck all items?')) {
      setCheckedItems({});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Advisory badge colors
  const getAdvisoryBadge = (type) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: ShieldAlert,
          iconColor: 'text-rose-600'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          icon: Info,
          iconColor: 'text-sky-600'
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Climate Context Banner */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-900 to-travel-dark text-white rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Travel Readiness Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Weather-Aware Packing for {destination}
            </h2>
            <p className="text-cream-200 text-sm sm:text-base leading-relaxed">
              {packingData?.climate_summary || weatherContext?.summary || `Tailored checklist calibrated for your upcoming trip to ${destination}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 backdrop-blur-md cursor-pointer"
              title="Print checklist"
            >
              <Printer className="w-4 h-4 text-cream-200" />
              <span>Print List</span>
            </button>
            <button
              onClick={handleResetChecks}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 backdrop-blur-md cursor-pointer"
              title="Reset all checkboxes"
            >
              <RotateCcw className="w-4 h-4 text-cream-200" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Packing Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
            <span className="text-cream-100 flex items-center gap-2">
              <Luggage className="w-4 h-4 text-emerald-400" />
              <span>Pack Readiness: <strong className="text-white">{packedCount}</strong> of <strong className="text-white">{totalCount}</strong> items checked</span>
            </span>
            <span className={`font-bold ${progressPercent === 100 ? 'text-emerald-400' : 'text-amber-300'}`}>
              {progressPercent}% Packed {progressPercent === 100 && '🎉 All Ready!'}
            </span>
          </div>
          <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Regional Travel Advisories & Readiness Notice */}
      {packingData?.travel_advisories && packingData.travel_advisories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-forest-700" />
            <h3 className="font-display font-bold text-travel-dark text-lg">
              Regional Travel Advisories & Vital Tips
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packingData.travel_advisories.map((adv, idx) => {
              const style = getAdvisoryBadge(adv.type);
              const AdvIcon = style.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${style.bg} flex flex-col justify-between shadow-subtle`}
                >
                  <div className="flex items-start gap-3">
                    <AdvIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-current/20">
                          {adv.category}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed mt-1">
                        {adv.advice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {Object.entries(CATEGORY_CONFIG).map(([catKey, config]) => {
          const Icon = config.icon;
          const isActive = activeCategory === catKey;
          const count = catKey === 'All' 
            ? allItems.length 
            : catKey === 'Custom' 
              ? customItems.length 
              : allItems.filter(i => i.category === catKey).length;

          return (
            <button
              key={catKey}
              onClick={() => setActiveCategory(catKey)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-forest-700 text-white border-forest-800 shadow-sm'
                  : 'bg-white text-travel-body hover:bg-cream-100 border-cream-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-forest-700'}`} />
              <span>{config.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-forest-800 text-emerald-300' : 'bg-cream-200 text-travel-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Loading Skeleton / Error States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="p-4 rounded-xl bg-white border border-cream-300 shadow-subtle animate-pulse flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-cream-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-cream-200 rounded w-1/2" />
                <div className="h-3 bg-cream-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Checklist Items Section */}
      {!loading && (
        <div className="space-y-6">
          {/* Quick Add Custom Item Card */}
          <form
            onSubmit={handleAddCustomItem}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-cream-300 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-cream-50 border border-cream-200 focus-within:border-forest-500 focus-within:bg-white transition-all">
              <Plus className="w-4 h-4 text-forest-700 flex-shrink-0" />
              <input
                type="text"
                placeholder="Add your own custom packing item (e.g. Polaroid camera, special meds)..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-travel-dark focus:outline-none placeholder:text-travel-muted"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-cream-50 border border-cream-200 text-xs font-semibold text-travel-dark focus:outline-none focus:border-forest-500"
              >
                <option value="Clothing">Clothing</option>
                <option value="Footwear">Footwear</option>
                <option value="Health & Toiletries">Health & Toiletries</option>
                <option value="Electronics">Electronics</option>
                <option value="Documents">Documents</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-travel-body cursor-pointer select-none px-2">
                <input
                  type="checkbox"
                  checked={newItemEssential}
                  onChange={(e) => setNewItemEssential(e.target.checked)}
                  className="rounded text-forest-700 focus:ring-forest-500"
                />
                <span>Essential</span>
              </label>

              <button
                type="submit"
                disabled={!newItemName.trim()}
                className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </form>

          {/* Render Items by Group if 'All', else Flat List */}
          {activeCategory === 'All' ? (
            <div className="space-y-8">
              {categoriesList.map(catName => {
                const catItems = allItems.filter(i => i.category === catName);
                if (catItems.length === 0) return null;
                const CatIcon = CATEGORY_CONFIG[catName]?.icon || Luggage;
                const catPacked = catItems.filter(i => checkedItems[i.id]).length;

                return (
                  <div key={catName} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-forest-700" />
                        <h4 className="font-display font-bold text-travel-dark text-base">
                          {catName}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-travel-muted">
                        {catPacked} / {catItems.length} packed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catItems.map(item => (
                        <ChecklistItemCard
                          key={item.id}
                          item={item}
                          isChecked={!!checkedItems[item.id]}
                          onToggle={() => toggleItem(item.id)}
                          onDelete={item.is_custom ? (e) => handleDeleteCustomItem(item.id, e) : null}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Custom Items Section if any */}
              {customItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-forest-700" />
                      <h4 className="font-display font-bold text-travel-dark text-base">
                        Personal & Custom Items
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-travel-muted">
                      {customItems.filter(i => checkedItems[i.id]).length} / {customItems.length} packed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customItems.map(item => (
                      <ChecklistItemCard
                        key={item.id}
                        item={item}
                        isChecked={!!checkedItems[item.id]}
                        onToggle={() => toggleItem(item.id)}
                        onDelete={(e) => handleDeleteCustomItem(item.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map(item => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  isChecked={!!checkedItems[item.id]}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={item.is_custom ? (e) => handleDeleteCustomItem(item.id, e) : null}
                />
              ))}

              {filteredItems.length === 0 && (
                <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-cream-300 text-travel-muted text-sm">
                  No items in this category yet. You can add one using the input above!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Single checklist item component
function ChecklistItemCard({ item, isChecked, onToggle, onDelete }) {
  return (
    <div
      onClick={onToggle}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none group ${
        isChecked
          ? 'bg-cream-100/70 border-cream-300/80 opacity-75'
          : 'bg-white border-cream-300 hover:border-forest-300 hover:shadow-subtle shadow-xs'
      }`}
    >
      <div className="pt-0.5 flex-shrink-0">
        {isChecked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 transition-transform scale-110" />
        ) : (
          <Circle className="w-5 h-5 text-travel-muted group-hover:text-forest-700 transition-colors" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs sm:text-sm font-bold transition-all ${
            isChecked ? 'line-through text-travel-muted' : 'text-travel-dark'
          }`}>
            {item.item}
          </span>

          {item.is_essential && (
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
              Essential
            </span>
          )}

          {item.is_custom && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-forest-100 text-forest-800">
              Custom
            </span>
          )}
        </div>

        {item.reason && (
          <p className={`text-xs mt-0.5 leading-relaxed transition-all ${
            isChecked ? 'line-through text-travel-muted/80' : 'text-travel-muted'
          }`}>
            {item.reason}
          </p>
        )}
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-lg text-travel-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
          title="Delete custom item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
