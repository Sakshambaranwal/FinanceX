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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Balance Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-medium text-blue-100 uppercase tracking-wider">Estimated Net Worth</h2>
            <p className="text-xs text-blue-200 mt-0.5">Holdings minus recorded expenses</p>
          </div>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {showBalance ? formatCurrency(netBalance) : '••••••••'}
        </p>
        <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-white/10 text-xs text-blue-100">
          <span>Logged in as: <strong className="text-white">@{username || 'guest'}</strong></span>
        </div>
      </div>

      {/* Metrics Row (Including Mandatory Monthly Expenses) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-bold text-red-600 mt-1">
              {formatCurrency(totalExpenses)}
            </p>
            <Link to="/expenses" className="text-xs text-blue-600 font-medium hover:underline mt-1 inline-block">
              Manage expenses &rarr;
            </Link>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <ArrowDownRight size={22} />
          </div>
        </div>

        {/* Mandatory Monthly Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Mandatory Monthly</p>
            <p className="text-xl font-bold text-indigo-700 mt-1">
              {formatCurrency(mandatoryMonthlyExpenses)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Rent, Bills, Subscriptions</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Repeat size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Investments</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {formatCurrency(totalInvestments)}
            </p>
            <Link to="/investments" className="text-xs text-green-600 font-medium hover:underline mt-1 inline-block">
              View portfolio &rarr;
            </Link>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Quick Actions</p>
            <div className="flex space-x-2 mt-2">
              <Link
                to="/expenses"
                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                + Expense
              </Link>
              <Link
                to="/investments"
                className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors"
              >
                + Investment
              </Link>
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <PlusCircle size={22} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
          <Link to="/expenses" className="text-xs text-blue-600 font-medium hover:underline">
            View all
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No transactions recorded yet. Go to <Link to="/expenses" className="text-blue-600 underline">Expenses</Link> to add your first transaction!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentExpenses.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 text-sm">{tx.description || tx.category}</p>
                      {tx.recurring && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                          🔁 Monthly
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{tx.date} &bull; {tx.category}</p>
                  </div>
                </div>
                <p className="font-bold text-red-600 text-sm">
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