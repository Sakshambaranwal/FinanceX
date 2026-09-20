import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Layers, 
  BarChart3, 
  Repeat, 
  DollarSign, 
  Percent,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sliders,
  Award
} from 'lucide-react';

const LandingDashboard = () => {
  const [activeTab, setActiveTab] = useState('cards');

  // Interactive Credit Card Advisor Simulator State
  const [simAmount, setSimAmount] = useState(25000);
  const [simMerchant, setSimMerchant] = useState('Amazon');

  // Simulate reward calculation for interactive demo
  const calculateSimulatedRewards = () => {
    const amount = Number(simAmount) || 0;
    const cards = [
      {
        name: 'HDFC Millennia',
        bank: 'HDFC Bank',
        rate: simMerchant === 'Amazon' || simMerchant === 'Flipkart' || simMerchant === 'Swiggy' || simMerchant === 'Zomato' ? 5 : 1,
        cap: 1000,
        capType: 'Calendar Month',
        color: 'from-blue-600 to-indigo-700'
      },
      {
        name: 'Swiggy HDFC Bank',
        bank: 'HDFC Bank',
        rate: simMerchant === 'Swiggy' ? 10 : (simMerchant === 'Amazon' || simMerchant === 'Flipkart' ? 5 : 1),
        cap: 1500,
        capType: 'Statement Cycle',
        color: 'from-orange-500 to-amber-600'
      },
      {
        name: 'Amazon Pay ICICI',
        bank: 'ICICI Bank',
        rate: simMerchant === 'Amazon' ? 5 : 1,
        cap: null, // uncapped
        capType: 'No Ceiling (Uncapped)',
        color: 'from-amber-600 to-yellow-600'
      },
      {
        name: 'SimplyCLICK SBI',
        bank: 'SBI Card',
        rate: simMerchant === 'Amazon' || simMerchant === 'BookMyShow' ? 2.5 : 1,
        cap: 2500,
        capType: 'Calendar Month',
        color: 'from-blue-700 to-cyan-700'
      }
    ];

    const evaluated = cards.map(c => {
      const rawReward = (amount * c.rate) / 100;
      const actualReward = c.cap !== null ? Math.min(rawReward, c.cap) : rawReward;
      const wasCapped = c.cap !== null && rawReward > c.cap;
      return {
        ...c,
        rawReward,
        actualReward,
        wasCapped
      };
    });

    evaluated.sort((a, b) => b.actualReward - a.actualReward);
    return evaluated;
  };

  const simulatedCards = calculateSimulatedRewards();
  const bestCard = simulatedCards[0];

  return (
    <div className="space-y-16 pb-12 max-w-7xl mx-auto overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[400px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -top-10 right-10 w-72 h-72 bg-pink-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs mb-6 animate-float">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Next-Generation Personal Finance Ecosystem</span>
          <span className="text-blue-300">|</span>
          <span className="text-blue-600 font-mono">v2.0 Gateway</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto">
          Master Your Wealth.{' '}
          <span className="shimmer-text block mt-2 sm:inline sm:mt-0">
            Maximize Every Rupee.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one financial operating system. Intelligently optimize credit card cashbacks, monitor live multi-currency investments, balance shared Khatabook debts, and manage recurring expenses behind a bank-grade API gateway.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm border border-gray-300 dark:border-gray-700 shadow-xs hover:border-gray-400 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Sign In to Your Vault</span>
          </Link>
        </div>

        {/* Demo Credentials Pill */}
        <div className="mt-5 inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-lg">
          <Sparkles size={14} className="text-amber-500" />
          <span>Instant Demo Login:</span>
          <code className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold border border-gray-200 dark:border-gray-600">admin</code>
          <span>/</span>
          <code className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold border border-gray-200 dark:border-gray-600">admin</code>
        </div>
      </section>

      {/* 2. INTERACTIVE FEATURE SANDBOX / LIVE TABBED DEMO */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg">
                  <Sliders size={18} />
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100">
                  Interactive Platform Sandbox
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Explore how FinanceX supercharges each pillar of your financial life.
              </p>
            </div>

            {/* Tab Controls */}
            <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'cards'
                    ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <CreditCard size={14} />
                <span>Card Advisor</span>
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'expenses'
                    ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <TrendingDown size={14} />
                <span>Smart Expenses</span>
              </button>
              <button
                onClick={() => setActiveTab('investments')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'investments'
                    ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <TrendingUp size={14} />
                <span>Investments & FDs</span>
              </button>
              <button
                onClick={() => setActiveTab('p2p')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'p2p'
                    ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Users size={14} />
                <span>P2P Khatabook</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CREDIT CARD ADVISOR LIVE SIMULATOR */}
          {activeTab === 'cards' && (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 px-2.5 py-1 rounded-full">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Live Reward Optimizer Engine</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Know the Exact Card to Swipe Before Checkout
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Different cards enforce different 5% vs 1% reward rates, monthly caps (₹1,000 vs ₹1,500), and reset on different cycles (Statement date vs Calendar month). FinanceX calculates the optimal card in real time.
                  </p>

                  {/* Interactive Controls */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Simulate Spend Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={simAmount}
                        onChange={(e) => setSimAmount(e.target.value)}
                        className="w-full text-base font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Select Merchant
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Amazon', 'Swiggy', 'Flipkart', 'Zomato', 'Travel', 'Local Store'].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSimMerchant(m)}
                            className={`py-1.5 px-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                              simMerchant === m
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Simulation Output Cards */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Top Winning Card Recommendation */}
                  {bestCard && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wide">
                            🏆 Recommended Swipe
                          </span>
                          <span className="text-xs text-emerald-100 font-medium">{bestCard.bank}</span>
                        </div>
                        <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                          {bestCard.rate}% Reward Rate
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <h4 className="text-xl font-extrabold">{bestCard.name}</h4>
                          <p className="text-xs text-emerald-100 mt-0.5">
                            Highest return on ₹{Number(simAmount).toLocaleString('en-IN')} spend on {simMerchant}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">
                            +₹{bestCard.actualReward.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">
                            Cashback Value
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparison Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Live Comparison Across Saved Cards
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {simCardsDetails(simulatedCards)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART EXPENSE TRACKER */}
          {activeTab === 'expenses' && (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 px-2.5 py-1 rounded-full">
                    <Repeat size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Normalized Recurring Obligations</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Know Your Mandatory Monthly Living Costs
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Ever wondered what you actually spend to keep the lights on? FinanceX separates mandatory recurring bills (Rent, Utilities, Subscriptions) from discretionary spends with weekly, monthly, and yearly normalization.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Zero-friction UPI, Card, and Cash tagging</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Automated monthly expense budget tracking</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Instant conversion to any viewing currency</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mandatory Monthly Target</p>
                      <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5">₹42,500 <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ month</span></p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg flex items-center space-x-1">
                      <Repeat size={13} />
                      <span>4 Recurring Bills Active</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: 'Apartment Rent', amount: '₹30,000', freq: 'Monthly', tag: 'Housing', color: 'bg-blue-500' },
                      { title: 'Electricity & Fiber Bill', amount: '₹4,500', freq: 'Monthly', tag: 'Utilities', color: 'bg-emerald-500' },
                      { title: 'Groceries & Milk', amount: '₹1,500 / wk', freq: 'Weekly (x4.33)', tag: 'Essential', color: 'bg-amber-500' },
                      { title: 'Streaming & Cloud Storage', amount: '₹1,500', freq: 'Monthly', tag: 'Subscriptions', color: 'bg-purple-500' },
                    ].map((bill, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                        <div className="flex items-center space-x-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${bill.color}`} />
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{bill.title}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{bill.tag} • {bill.freq}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{bill.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVESTMENTS & COMPOUND INTEREST */}
          {activeTab === 'investments' && (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                    <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Multi-Asset Portfolio Engine</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Track Stocks, Crypto, and Precision FD/RD Accruals
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Combine your high-volatility holdings with safe-haven deposits. FinanceX calculates exact compound interest accrued to the current day for Fixed Deposits and Recurring Deposits with flexible compounding frequencies.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Live market prices for crypto and stock indices</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Accurate Quarterly compounding mathematical engine</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Portfolio Value</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹5,48,200</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accrued Returns</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">+₹48,200 (+9.6%)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'NIFTY 50 ETF', type: 'ETFs', invested: '₹1,50,000', current: '₹1,68,000', return: '+12.0%', isPos: true },
                      { name: 'HDFC 1-Year FD (7.1% p.a.)', type: 'Fixed Deposit (Quarterly)', invested: '₹2,00,000', current: '₹2,14,580', return: 'Accruing', isPos: true },
                      { name: 'Bitcoin (BTC)', type: 'Cryptocurrency', invested: '₹1,00,000', current: '₹1,14,200', return: '+14.2%', isPos: true },
                      { name: 'Monthly RD (₹5k/mo)', type: 'Recurring Deposit', invested: '₹50,000', current: '₹51,420', return: 'Accruing', isPos: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.current}</p>
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{item.return}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: P2P KHATABOOK */}
          {activeTab === 'p2p' && (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-900/60 px-2.5 py-1 rounded-full">
                    <Users size={13} className="text-purple-600 dark:text-purple-400" />
                    <span>Social Debt & Khatabook Ledger</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    Never Lose Track of Shared Bills or Loans
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Split dinners, track loans to friends, or manage housemate expenses. Real-time net balance calculations show who owes who at a glance, with single-tap zero-balance settlement.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Clear 'You Will Give' vs 'You Will Get' ledger</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>One-click settlement creates automatic balancing entries</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 text-center">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">You'll Get</p>
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">₹4,200</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-xl border border-red-100 dark:border-red-900/60">
                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">You'll Give</p>
                      <p className="text-base font-black text-red-700 dark:text-red-400 mt-0.5">₹1,500</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900/60">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Net Balance</p>
                      <p className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">+₹2,700</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Rohan Sharma', note: 'Trip AirBnB split', balance: '+₹3,200', get: true },
                      { name: 'Priya Verma', note: 'Dinner at Burma Burma', balance: '-₹1,500', get: false },
                      { name: 'Aman Gupta', note: 'Movie Tickets & Snacks', balance: '+₹1,000', get: true },
                    ].map((contact, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{contact.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{contact.note}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-extrabold ${contact.get ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {contact.balance}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors">
                            Settle
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. SIX CORE PILLARS OF FINANCEX */}
      <section className="px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Engineered for Serious Financial Clarity
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            Built as a modern microservices suite with zero tracking, bank-grade encryption, and seamless usability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Dual Reward Capping Rules</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Models individual 5% accelerated vs 1% base reward caps separately. Automatically resets on calendar month end or billing statement date.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Compound FD / RD Engine</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Live elapsed-time compound interest projection with support for Monthly, Quarterly, Half-Yearly, and Annually compounding schedules.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Social P2P Khatabook</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Track multi-currency debts across friends and housemates. Single-click settlement cleanly balances ledgers without manual math.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Live Multi-Currency Conversion</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Seamlessly toggle between USD, INR, EUR, GBP, JPY, and 8+ currencies. Live exchange rates update valuations across all modules instantly.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">financeX-core Gateway Security</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Single-port (:8080) reverse-proxy gateway enforcing stateless HMAC-SHA JWT bearer authentication with automatic unauthenticated rejection.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Repeat size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Normalized Living Cost Tracking</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Isolate mandatory survival bills from discretionary lifestyle spends so you always know your exact monthly financial freedom runway.
            </p>
          </div>
        </div>
      </section>

      {/* 4. MICROSERVICES ARCHITECTURE CALLOUT */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-gray-800">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono tracking-widest uppercase text-blue-400 font-bold">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Microservices Core with Unified Gateway Routing
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Unlike legacy monolithic finance apps, FinanceX is built on decoupled, scalable Spring Boot microservices coordinated through the <code>financeX-core</code> Gateway:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs font-mono text-blue-400 font-bold">:8080</p>
              <p className="text-sm font-bold text-white">financeX-core</p>
              <p className="text-[11px] text-gray-400">Gateway & JWT Guard</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs font-mono text-emerald-400 font-bold">:8081</p>
              <p className="text-sm font-bold text-white">user-service</p>
              <p className="text-[11px] text-gray-400">Auth & Profiles</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs font-mono text-purple-400 font-bold">:8082 / :8084</p>
              <p className="text-sm font-bold text-white">expense & p2p</p>
              <p className="text-[11px] text-gray-400">Ledger & Portfolios</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs font-mono text-amber-400 font-bold">:8086</p>
              <p className="text-sm font-bold text-white">creditcard-service</p>
              <p className="text-[11px] text-gray-400">Capping & Advisor</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-8 text-center pt-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Take Command of Your Financial Future?
            </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Join FinanceX today. Create your account in seconds, or sign in to experience the full personal finance suite.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition-all cursor-pointer"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700/80 hover:bg-blue-800 text-white font-bold text-sm border border-blue-400/40 transition-all cursor-pointer"
              >
                Sign In to Demo Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper to render simulated card comparison pills
function simCardsDetails(cards) {
  return cards.map((card, i) => (
    <div
      key={i}
      className={`p-3 rounded-xl border text-xs transition-all ${
        i === 0
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs font-semibold'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold truncate">{card.name}</span>
        <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
          ₹{card.actualReward.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
        <span>{card.rate}% rate</span>
        <span>{card.cap ? `Cap: ₹${card.cap}` : 'No cap'}</span>
      </div>
      {card.wasCapped && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
          ⚠️ Capped at monthly ceiling
        </p>
      )}
    </div>
  ));
}

export default LandingDashboard;

