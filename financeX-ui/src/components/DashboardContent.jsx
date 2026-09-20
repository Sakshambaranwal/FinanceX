import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';  
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, TrendingUp, PlusCircle, Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';
import LandingDashboard from './LandingDashboard';

const DashboardContent = () => {
  const { showBalance, setShowBalance, username, formatCurrency, convertAmount, homeCurrency, currency, isAuthenticated } = useContext(AppContext);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [mandatoryMonthlyExpenses, setMandatoryMonthlyExpenses] = useState(0);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch expenses
        const expRes = await authFetch(API_ENDPOINTS.EXPENSE_USER(username));
        if (expRes.ok) {
          const expData = await expRes.json();
          const expList = Array.isArray(expData) ? expData : [];
          const expTotal = expList.reduce((sum, item) => {
            const rawAmt = Number(item.amount) || 0;
            return sum + convertAmount(rawAmt, currency, item.currency || homeCurrency);
          }, 0);
          setTotalExpenses(expTotal);

          const mandatoryTotal = expList.filter(e => e.recurring).reduce((sum, e) => {
            const amt = Number(e.amount) || 0;
            const converted = convertAmount(amt, currency, e.currency || homeCurrency);
            const freq = e.recurrenceFrequency || 'MONTHLY';
            if (freq === 'WEEKLY') return sum + (converted * 4.333);
            if (freq === 'YEARLY') return sum + (converted / 12);
            return sum + converted;
          }, 0);
          setMandatoryMonthlyExpenses(mandatoryTotal);

          setRecentExpenses(expList.slice(-5).reverse());
        }

        // Fetch investments
        const invRes = await authFetch(API_ENDPOINTS.INVESTMENT_USER(username));
        if (invRes.ok) {
          const invData = await invRes.json();
          const invList = Array.isArray(invData) ? invData : [];
          const invTotal = invList.reduce((sum, item) => {
            const itemCurr = item.currency || homeCurrency;
            const categoryLower = (item.category || '').toLowerCase();
            const isDeposit = categoryLower.includes('fixed deposit') ||
                              categoryLower.includes('recurring deposit') ||
                              categoryLower === 'fd' ||
                              categoryLower === 'rd';
            let itemValue = 0;
            if (isDeposit) {
              const isRD = categoryLower.includes('recurring') || categoryLower === 'rd';
              const startStr = item.investmentDate || new Date().toISOString().split('T')[0];
              const startDate = new Date(startStr);
              const today = new Date();
              let maturityDate = item.maturityDate;
              let maturityAmount = Number(item.maturityAmount) || 0;
              let parsedRoi = 7.0;
              let parsedDuration = 12;
              let parsedDurationUnit = 'Months';
              let parsedCompounding = 'Quarterly';
              let parsedFrequency = 'Monthly';

              if (item.tags) {
                try {
                  const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
                  if (tags.maturityDate) maturityDate = tags.maturityDate;
                  if (tags.maturityAmount) maturityAmount = Number(tags.maturityAmount);
                  if (tags.roi) parsedRoi = parseFloat(tags.roi) || parsedRoi;
                  if (tags.duration) parsedDuration = parseFloat(tags.duration) || parsedDuration;
                  if (tags.durationUnit) parsedDurationUnit = tags.durationUnit;
                  if (tags.compoundingFrequency) parsedCompounding = tags.compoundingFrequency;
                  if (tags.frequency) parsedFrequency = tags.frequency;
                } catch (e) {}
              }

              if (item.description) {
                if (!maturityDate) {
                  const matDateMatch = item.description.match(/Maturity Date:\s*([0-9-]+)/i);
                  if (matDateMatch) maturityDate = matDateMatch[1];
                }
                if (!parsedRoi) {
                  const roiMatch = item.description.match(/ROI:\s*([0-9.]+)%/i);
                  if (roiMatch) parsedRoi = parseFloat(roiMatch[1]) || parsedRoi;
                }
                if (!parsedDuration) {
                  const tenureMatch = item.description.match(/Tenure:\s*([0-9.]+)\s*([a-zA-Z]+)/i);
                  if (tenureMatch) {
                    parsedDuration = parseFloat(tenureMatch[1]) || parsedDuration;
                    parsedDurationUnit = tenureMatch[2];
                  }
                }
                if (!parsedCompounding) {
                  const compMatch = item.description.match(/Compounding:\s*([a-zA-Z-]+)/i);
                  if (compMatch) parsedCompounding = compMatch[1];
                }
              }

              if (isRD) {
                const r = (parseFloat(parsedRoi) || 7.0) / 100;
                let n = parsedCompounding === 'Monthly' ? 12 : parsedCompounding === 'Half-Yearly' ? 2 : parsedCompounding === 'Annually' ? 1 : 4;
                const stepMonths = parsedFrequency === 'Quarterly' ? 3 : parsedFrequency === 'Half-Yearly' ? 6 : 1;
                const totalMonths = parsedDurationUnit === 'Years' ? parsedDuration * 12 : parsedDuration;
                const totalInstallments = Math.max(1, Math.floor(totalMonths / stepMonths));

                let instBase = item.unitPrice ? Number(item.unitPrice) : (Number(item.principalAmount) / totalInstallments);
                if (!instBase || instBase <= 0) instBase = Number(item.principalAmount) || 0;

                const matDate = maturityDate ? new Date(maturityDate) : null;
                if (matDate && today >= matDate && maturityAmount > 0) {
                  itemValue = maturityAmount;
                } else if (today < startDate) {
                  itemValue = 0;
                } else {
                  let elapsedMonths = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                  if (today.getDate() < startDate.getDate()) elapsedMonths--;
                  elapsedMonths = Math.max(0, elapsedMonths);
                  const installmentsPaid = Math.min(totalInstallments, Math.floor(elapsedMonths / stepMonths) + 1);

                  let currentAccrued = 0;
                  for (let k = 1; k <= installmentsPaid; k++) {
                    const depDate = new Date(startDate);
                    depDate.setMonth(depDate.getMonth() + Math.round((k - 1) * stepMonths));
                    const elapsedInstMs = Math.max(0, today.getTime() - depDate.getTime());
                    const tElapsed = elapsedInstMs / (365.25 * 24 * 3600 * 1000);
                    if (parsedCompounding === 'Simple') {
                      currentAccrued += instBase + (instBase * r * tElapsed);
                    } else {
                      currentAccrued += instBase * Math.pow(1 + (r / n), n * tElapsed);
                    }
                  }
                  itemValue = currentAccrued;
                }
              } else {
                // Fixed Deposit
                const principal = Number(item.principalAmount) || 0;
                const matDate = maturityDate ? new Date(maturityDate) : null;
                let currentAccrued = principal;
                if (matDate && !isNaN(matDate.getTime()) && !isNaN(startDate.getTime()) && maturityAmount > principal) {
                  const totalMs = matDate.getTime() - startDate.getTime();
                  const elapsedMs = Math.max(0, Math.min(today.getTime() - startDate.getTime(), totalMs));
                  const r = (parseFloat(parsedRoi) || 7.1) / 100;
                  let n = parsedCompounding === 'Monthly' ? 12 : parsedCompounding === 'Half-Yearly' ? 2 : parsedCompounding === 'Annually' ? 1 : 4;
                  if (parsedCompounding === 'Simple') {
                    const tElapsed = elapsedMs / (365 * 24 * 3600 * 1000);
                    currentAccrued = principal + (principal * r * tElapsed);
                  } else {
                    const durInYears = totalMs / (365.25 * 24 * 3600 * 1000);
                    const tElapsed = (elapsedMs / totalMs) * durInYears;
                    currentAccrued = principal * Math.pow(1 + (r / n), n * tElapsed);
                  }
                }
                itemValue = currentAccrued;
              }
            } else {
              itemValue = Number(item.currentAmount ?? item.principalAmount) || 0;
            }
            return sum + convertAmount(itemValue, currency, itemCurr);
          }, 0);
          setTotalInvestments(invTotal);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username, currency]);

  if (!isAuthenticated && !username) {
    return <LandingDashboard />;
  }

  // Overall net balance estimated from portfolio minus expenses
  const netBalance = totalInvestments - totalExpenses;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Balance Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-md relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-medium text-blue-100 uppercase tracking-wider">Estimated Net Worth</h2>
            <p className="text-[11px] sm:text-xs text-blue-200 mt-0.5">Holdings minus recorded expenses</p>
          </div>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <p className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          {showBalance ? formatCurrency(netBalance) : '••••••••'}
        </p>
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-white/15 text-xs text-blue-100">
          <span>Logged in as: <strong className="text-white">@{username || 'guest'}</strong></span>
        </div>
      </div>

      {/* Metrics Row: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Expenses</p>
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 truncate">
              {formatCurrency(totalExpenses)}
            </p>
            <Link to="/expenses" className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline mt-1 inline-block">
              Manage &rarr;
            </Link>
          </div>
        </div>

        {/* Mandatory Monthly Card */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Mandatory</p>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Repeat size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
              {formatCurrency(mandatoryMonthlyExpenses)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">Monthly Bills & Rent</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Investments</p>
            <div className="p-2 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-extrabold text-green-600 dark:text-green-400 truncate">
              {formatCurrency(totalInvestments)}
            </p>
            <Link to="/investments" className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 font-medium hover:underline mt-1 inline-block">
              Portfolio &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Quick Add</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <PlusCircle size={18} />
            </div>
          </div>
          <div className="flex space-x-1.5 mt-3">
            <Link
              to="/expenses"
              className="flex-1 text-center py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-[11px] font-semibold transition-colors"
            >
              + Expense
            </Link>
            <Link
              to="/investments"
              className="flex-1 text-center py-1 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 rounded-lg text-[11px] font-semibold transition-colors"
            >
              + Invest
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Recent Transactions</h3>
          <Link to="/expenses" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            View all
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            No transactions recorded yet. Go to <Link to="/expenses" className="text-blue-600 dark:text-blue-400 underline">Expenses</Link> to add your first transaction!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentExpenses.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{tx.description || tx.category}</p>
                      {tx.recurring && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                          Monthly
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{tx.date} &bull; {tx.category}</p>
                  </div>
                </div>
                <p className="font-bold text-red-600 dark:text-red-400 text-sm flex-shrink-0">
                  -{formatCurrency(tx.amount, tx.currency || homeCurrency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;