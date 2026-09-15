import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Building2, Utensils, Car, Ticket, ShieldAlert, 
  Plus, Trash2, ArrowRightLeft, TrendingUp, PiggyBank, 
  AlertCircle, CheckCircle2, Calculator, Printer, IndianRupee,
  RefreshCw, DollarSign, Euro, PoundSterling, Coins
} from 'lucide-react';

const DEFAULT_RATES = {
  INR: 1.0,
  USD: 0.0116,   // 1 USD ~ 86.2 INR
  EUR: 0.0107,   // 1 EUR ~ 93.4 INR
  GBP: 0.0091,   // 1 GBP ~ 109.8 INR
  AED: 0.0425,   // 1 AED ~ 23.5 INR
  JPY: 1.7300    // 1 JPY ~ 0.58 INR
};

const CURRENCY_META = {
  INR: { label: 'INR (₹)', symbol: '₹', name: 'Indian Rupee' },
  USD: { label: 'USD ($)', symbol: '$', name: 'US Dollar' },
  EUR: { label: 'EUR (€)', symbol: '€', name: 'Euro' },
  GBP: { label: 'GBP (£)', symbol: '£', name: 'British Pound' },
  AED: { label: 'AED (د.إ)', symbol: 'AED ', name: 'UAE Dirham' },
  JPY: { label: 'JPY (¥)', symbol: '¥', name: 'Japanese Yen' },
};

const CATEGORY_ICONS = {
  stay: Building2,
  food: Utensils,
  transit: Car,
  entry_fees: Ticket,
  contingency: ShieldAlert
};

const CATEGORY_THEMES = {
  stay: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    bar: 'bg-blue-500'
  },
  food: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-500'
  },
  transit: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    bar: 'bg-purple-500'
  },
  entry_fees: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500'
  },
  contingency: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
    bar: 'bg-rose-400'
  }
};

export default function BudgetSection({
  destination = 'Destination',
  origin = 'Mumbai',
  budget = 50000,
  travelers = 2,
  totalDays = 5,
  tripProfile,
  planResponse
}) {
  const [activeCurrency, setActiveCurrency] = useState('INR');
  const [budgetPlan, setBudgetPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Currency Converter calculator state
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcFrom, setCalcFrom] = useState('INR');
  const [calcTo, setCalcTo] = useState('USD');

  // Expense Logger persistence
  const storageKey = `tripmind_expenses_${destination.toLowerCase().replace(/\s+/g, '_')}`;
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // New Expense form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('food');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Persist expenses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to persist expenses:', e);
    }
  }, [expenses, storageKey]);

  // Fetch intelligent budget breakdown from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchBudget() {
      setLoading(true);
      setError(null);

      const rawHotel = (planResponse?.ranked_hotels || planResponse?.hotel_context?.hotels || [])[0];
      const hotelObj = rawHotel?.hotel || rawHotel;
      const hotelPrice = hotelObj?.price_per_night || 4500;
      const attractionsCount = (planResponse?.ranked_attractions || planResponse?.places_context?.places || []).length || 6;
      const budgetTier = tripProfile?.trip_analysis?.budget_level || 'Moderate';
      const travelStyle = tripProfile?.travel_preferences?.travel_style 
        ? (Array.isArray(tripProfile.travel_preferences.travel_style) ? tripProfile.travel_preferences.travel_style.join(', ') : tripProfile.travel_preferences.travel_style)
        : 'Balanced';

      try {
        const res = await fetch('/api/budget/allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination,
            origin,
            total_budget: budget,
            travelers: travelers || 2,
            duration_days: totalDays || 5,
            budget_tier: budgetTier,
            hotel_price_per_night: hotelPrice,
            attractions_count: attractionsCount,
            travel_style: travelStyle
          })
        });

        if (!res.ok) {
          throw new Error(`Budget breakdown request failed (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setBudgetPlan(data);
        }
      } catch (err) {
        console.error('Budget fetch error:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load dynamic budget allocation');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBudget();
    return () => { isMounted = false; };
  }, [destination, origin, budget, travelers, totalDays, planResponse, tripProfile]);

  // Exchange rates dictionary
  const exchangeRates = useMemo(() => {
    return budgetPlan?.rates_from_inr || DEFAULT_RATES;
  }, [budgetPlan]);

  // Format currency helper (converts INR to activeCurrency)
  const formatAmount = (inrAmount) => {
    if (inrAmount === null || inrAmount === undefined) return '0';
    const rate = exchangeRates[activeCurrency] || 1.0;
    const converted = inrAmount * rate;
    const symbol = CURRENCY_META[activeCurrency]?.symbol || '₹';

    if (activeCurrency === 'INR' || activeCurrency === 'JPY') {
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Convert any amount from one currency to another
  const convertCurrency = (amt, from, to) => {
    const numeric = parseFloat(amt) || 0;
    const fromRate = exchangeRates[from] || 1.0;
    const toRate = exchangeRates[to] || 1.0;
    // from currency -> INR -> to currency
    const inrValue = numeric / fromRate;
    return inrValue * toRate;
  };

  // Calculate total spent in INR from logged expenses
  const totalSpentINR = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (parseFloat(item.amountInINR) || 0), 0);
  }, [expenses]);

  // Calculate spent per category
  const categorySpentINR = useMemo(() => {
    const map = {};
    expenses.forEach((item) => {
      const cat = item.category || 'contingency';
      map[cat] = (map[cat] || 0) + (parseFloat(item.amountInINR) || 0);
    });
    return map;
  }, [expenses]);

  const remainingBudgetINR = budget - totalSpentINR;
  const percentSpent = budget > 0 ? Math.min(100, Math.round((totalSpentINR / budget) * 100)) : 0;
  const isOverBudget = totalSpentINR > budget;

  // Handle adding new expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    const entered = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(entered) || entered <= 0) return;

    // Convert entered amount to base INR
    const activeRate = exchangeRates[activeCurrency] || 1.0;
    const amountInINR = entered / activeRate;

    const newEntry = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      amountEntered: entered,
      currencyEntered: activeCurrency,
      amountInINR: amountInINR,
      date: newDate || new Date().toISOString().split('T')[0]
    };

    setExpenses(prev => [newEntry, ...prev]);
    setNewTitle('');
    setNewAmount('');
  };

  // Handle delete expense
  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  // Clear all logged expenses
  const handleClearExpenses = () => {
    if (window.confirm('Are you sure you want to clear all logged expenses for this trip?')) {
      setExpenses([]);
    }
  };

  const categories = budgetPlan?.categories || [
    { category_id: 'stay', category_name: 'Stay & Accommodations', allocated_amount: budget * 0.38, percentage: 38, daily_allocated: (budget * 0.38) / totalDays, per_traveler_allocated: (budget * 0.38) / travelers, description: 'Accommodations and boutique properties.' },
    { category_id: 'food', category_name: 'Dining & Culinary', allocated_amount: budget * 0.25, percentage: 25, daily_allocated: (budget * 0.25) / totalDays, per_traveler_allocated: (budget * 0.25) / travelers, description: '3 meals daily, cafes, and street food.' },
    { category_id: 'transit', category_name: 'Local Transit & Transfers', allocated_amount: budget * 0.15, percentage: 15, daily_allocated: (budget * 0.15) / totalDays, per_traveler_allocated: (budget * 0.15) / travelers, description: 'Private cabs, autos, and airport transfers.' },
    { category_id: 'entry_fees', category_name: 'Attractions & Entry Fees', allocated_amount: budget * 0.12, percentage: 12, daily_allocated: (budget * 0.12) / totalDays, per_traveler_allocated: (budget * 0.12) / travelers, description: 'Palace admissions and museum permits.' },
    { category_id: 'contingency', category_name: 'Contingency & Shopping', allocated_amount: budget * 0.10, percentage: 10, daily_allocated: (budget * 0.10) / totalDays, per_traveler_allocated: (budget * 0.10) / travelers, description: 'Emergency buffer and local artisan crafts.' }
  ];

  return (
    <div className="space-y-10">
      
      {/* 1. Header & Multi-Currency Switcher */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Smart Financial Optimizer</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-travel-dark tracking-tight">
            Smart Budget & Expense Tracker
          </h2>
          <p className="text-sm text-travel-body mt-1">
            Visual budget allocations, live multi-currency conversions, and active on-the-go trip expense tracking for {destination}.
          </p>
        </div>

        {/* Currency Switcher Pills */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-travel-muted flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-forest-700" />
            <span>Active Display Currency</span>
          </span>
          <div className="inline-flex flex-wrap p-1 bg-cream-100 rounded-2xl border border-cream-300">
            {Object.keys(CURRENCY_META).map((curr) => {
              const active = activeCurrency === curr;
              return (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setActiveCurrency(curr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-forest-700 text-white shadow-sm'
                      : 'text-travel-body hover:text-travel-dark hover:bg-cream-200'
                  }`}
                >
                  {CURRENCY_META[curr].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Financial Health Hero Banner (Budget vs. Spent) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Budget Health Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-travel-muted">
                Trip Budget Health
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                isOverBudget 
                  ? 'bg-rose-100 text-rose-800'
                  : percentSpent > 80 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isOverBudget ? '⚠️ Budget Exceeded' : percentSpent > 80 ? '⚡ Approaching Limit' : '✨ Spending On Track'}
              </span>
            </div>

            {/* Big Numbers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <span className="text-xs text-travel-muted block">Total Allocated</span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-travel-dark block mt-1">
                  {formatAmount(budget)}
                </span>
                <span className="text-[11px] text-travel-body mt-0.5 block">
                  For {travelers} guest{travelers > 1 ? 's' : ''} • {totalDays} days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200">
                <span className="text-xs text-travel-muted block">Total Spent</span>
                <span className={`text-2xl sm:text-3xl font-serif font-bold block mt-1 ${
                  isOverBudget ? 'text-rose-600' : 'text-travel-dark'
                }`}>
                  {formatAmount(totalSpentINR)}
                </span>
                <span className="text-[11px] text-travel-body mt-0.5 block">
                  {expenses.length} logged expense{expenses.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isOverBudget 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-xs text-travel-muted block">Remaining Balance</span>
                <span className="text-2xl sm:text-3xl font-serif font-bold block mt-1">
                  {isOverBudget ? `-${formatAmount(Math.abs(remainingBudgetINR))}` : formatAmount(remainingBudgetINR)}
                </span>
                <span className="text-[11px] mt-0.5 block">
                  {isOverBudget ? 'Over allocated budget' : 'Safe to spend'}
                </span>
              </div>
            </div>

            {/* Spent Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-travel-body">
                <span>Budget Consumed: {percentSpent}%</span>
                <span>{formatAmount(totalSpentINR)} of {formatAmount(budget)}</span>
              </div>
              <div className="w-full h-3 bg-cream-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverBudget ? 'bg-rose-500' : percentSpent > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, percentSpent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily & Per-Traveler averages */}
          <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-cream-200 text-xs">
            <div>
              <span className="text-travel-muted block font-semibold">Recommended Daily Target</span>
              <span className="text-base font-bold text-travel-dark mt-0.5 block">
                {formatAmount(budget / totalDays)} / day
              </span>
            </div>
            <div>
              <span className="text-travel-muted block font-semibold">Per-Traveler Share</span>
              <span className="text-base font-bold text-travel-dark mt-0.5 block">
                {formatAmount(budget / travelers)} / person
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Currency Live Calculator Widget */}
        <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-forest-700">
              <Calculator className="w-5 h-5" />
              <h3 className="text-lg font-serif font-bold text-travel-dark">Quick Currency Converter</h3>
            </div>
            <p className="text-xs text-travel-body mb-4">
              Instantly convert local prices or hotel quotes between benchmark international currencies.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-300 text-sm font-semibold text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
                  placeholder="Enter amount..."
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                    From
                  </label>
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs font-bold text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    {Object.keys(CURRENCY_META).map(c => (
                      <option key={c} value={c}>{c} ({CURRENCY_META[c].symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                    To
                  </label>
                  <select
                    value={calcTo}
                    onChange={(e) => setCalcTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs font-bold text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    {Object.keys(CURRENCY_META).map(c => (
                      <option key={c} value={c}>{c} ({CURRENCY_META[c].symbol})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-200 mt-3 text-center">
                <span className="text-xs text-forest-700 font-semibold block">Converted Value</span>
                <span className="text-2xl font-serif font-bold text-forest-900 block mt-1">
                  {CURRENCY_META[calcTo]?.symbol}
                  {convertCurrency(calcAmount, calcFrom, calcTo).toLocaleString(undefined, { 
                    minimumFractionDigits: calcTo === 'INR' || calcTo === 'JPY' ? 0 : 2,
                    maximumFractionDigits: calcTo === 'INR' || calcTo === 'JPY' ? 0 : 2
                  })}
                </span>
                <span className="text-[10px] text-forest-700/80 block mt-1">
                  1 {calcFrom} ≈ {(convertCurrency(1, calcFrom, calcTo)).toFixed(4)} {calcTo}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-cream-200 flex items-center justify-between text-[11px] text-travel-muted">
            <span>Rates grounded for {destination}</span>
            <span className="font-semibold text-forest-700">TripMind Multi-Rate</span>
          </div>
        </div>

      </div>

      {/* 3. Visual Budget Allocation (Prompt: Stay ₹X, Food ₹Y, Transit ₹Z, Entry fees ₹W) */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Realistic Allocation Formula</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-travel-dark">
              Visual Budget Allocation
            </h3>
            <p className="text-xs text-travel-body mt-1">
              Optimized distribution across stays, dining, transit, activities, and reserve buffer.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream-100 hover:bg-cream-200 text-travel-dark text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Financial Plan</span>
          </button>
        </div>

        {/* Stacked Segmented Distribution Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-cream-200 rounded-full flex overflow-hidden shadow-inner">
            {categories.map((cat) => {
              const theme = CATEGORY_THEMES[cat.category_id] || CATEGORY_THEMES.contingency;
              return (
                <div
                  key={cat.category_id}
                  className={`${theme.bar} transition-all relative group cursor-pointer`}
                  style={{ width: `${cat.percentage}%` }}
                  title={`${cat.category_name}: ${cat.percentage}% (${formatAmount(cat.allocated_amount)})`}
                />
              );
            })}
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {categories.map((cat) => {
              const theme = CATEGORY_THEMES[cat.category_id] || CATEGORY_THEMES.contingency;
              return (
                <div key={cat.category_id} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${theme.bar}`} />
                  <span className="font-semibold text-travel-dark">{cat.category_name}</span>
                  <span className="text-travel-muted">({cat.percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Allocation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.category_id] || Building2;
            const theme = CATEGORY_THEMES[cat.category_id] || CATEGORY_THEMES.contingency;
            const spentInCat = categorySpentINR[cat.category_id] || 0;
            const catSpentPct = cat.allocated_amount > 0 ? Math.round((spentInCat / cat.allocated_amount) * 100) : 0;
            const isCatOver = spentInCat > cat.allocated_amount;

            return (
              <div 
                key={cat.category_id} 
                className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} flex flex-col justify-between transition-all hover:shadow-subtle`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-xs ${theme.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                      {cat.percentage}%
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-travel-muted uppercase tracking-wider block">
                    {cat.category_name}
                  </span>

                  <span className="text-2xl font-serif font-bold text-travel-dark mt-1 block">
                    {formatAmount(cat.allocated_amount)}
                  </span>

                  <p className="text-xs text-travel-body mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Category Spent Progress */}
                <div className="mt-4 pt-4 border-t border-black/5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-travel-body">
                    <span>Spent: {formatAmount(spentInCat)}</span>
                    <span className={isCatOver ? 'text-rose-600 font-bold' : ''}>
                      {catSpentPct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isCatOver ? 'bg-rose-500' : theme.bar}`}
                      style={{ width: `${Math.min(100, catSpentPct)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-travel-muted pt-1">
                    <span>Daily: {formatAmount(cat.daily_allocated || cat.allocated_amount / totalDays)}/day</span>
                    <span>Per-Guest: {formatAmount(cat.per_traveler_allocated || cat.allocated_amount / travelers)}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive On-The-Go Expense Logger */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-Time Expense Logger</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-travel-dark">
              Log In-Trip Expenses
            </h3>
            <p className="text-xs text-travel-body mt-1">
              Record meals, cab rides, and tickets on the go. Expenses are automatically converted and saved to this browser.
            </p>
          </div>

          {expenses.length > 0 && (
            <button
              type="button"
              onClick={handleClearExpenses}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Expenses</span>
            </button>
          )}
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="p-5 rounded-2xl bg-cream-50 border border-cream-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            <div className="lg:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                Expense Description
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Dinner at Rooftop Cafe, Amber Fort tickets"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-300 text-xs font-medium text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="stay">🏨 Stay & Accommodations</option>
                <option value="food">🍽️ Food & Dining</option>
                <option value="transit">🚕 Transit & Cabs</option>
                <option value="entry_fees">🎟️ Entry Tickets & Sights</option>
                <option value="contingency">🛍️ Shopping & Extras</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-travel-muted block mb-1">
                Amount ({CURRENCY_META[activeCurrency]?.symbol})
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="any"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-travel-dark focus:outline-none focus:ring-2 focus:ring-forest-700"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>

          </div>
        </form>

        {/* Expenses Table / Log */}
        {expenses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-cream-300 rounded-2xl">
            <Wallet className="w-8 h-8 text-travel-muted mx-auto mb-2 opacity-50" />
            <span className="text-sm font-semibold text-travel-dark block">No expenses logged yet</span>
            <span className="text-xs text-travel-muted mt-0.5 block">
              Add meal receipts, taxi fares, or souvenir purchases above to track spending in real time.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cream-200 text-travel-muted uppercase font-bold text-[11px]">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Description</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2 text-right">Amount ({activeCurrency})</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {expenses.map((item) => {
                  const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES.contingency;
                  return (
                    <tr key={item.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3 px-2 text-travel-muted font-medium whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-2 font-bold text-travel-dark">
                        {item.title}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                          {item.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-serif font-bold text-travel-dark whitespace-nowrap">
                        {formatAmount(item.amountInINR)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(item.id)}
                          className="text-travel-muted hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 5. Destination Cost-Saving Strategies */}
      {budgetPlan?.saving_tips && budgetPlan.saving_tips.length > 0 && (
        <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-forest-700">
            <PiggyBank className="w-5 h-5" />
            <h3 className="text-xl font-serif font-bold text-travel-dark">
              Insider Money-Saving Tips for {destination}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgetPlan.saving_tips.map((tip, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-travel-dark">{tip.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tip.impact === 'High' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tip.impact} Savings
                    </span>
                  </div>
                  <p className="text-xs text-travel-body leading-relaxed">
                    {tip.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
