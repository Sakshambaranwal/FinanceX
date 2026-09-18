import React, { useState, useEffect, useContext } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  X, 
  AlertCircle,
  TrendingDown,
  PieChart,
  Filter,
  Search,
  Repeat,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const CATEGORIES = [
  'Rent & Housing',
  'Utilities & Bills',
  'Subscriptions & Memberships',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Health & Medical',
  'Education',
  'Insurance',
  'Other'
];

const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Net Banking',
  'Auto-Debit',
  'Other'
];

const Expense = () => {
  const { username, formatCurrency, convertAmount, toStorageAmount, homeCurrency, currency, currencySymbol } = useContext(AppContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterRecurring, setFilterRecurring] = useState('ALL'); // ALL, RECURRING, ONE_TIME

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Rent & Housing',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payementMethod: 'UPI',
    tags: '',
    recurring: false,
    recurrenceFrequency: 'MONTHLY'
  });

  const fetchExpenses = async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await authFetch(API_ENDPOINTS.EXPENSE_USER(username));
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load expenses.');
      }
    } catch (err) {
      setError('Cannot connect to expense service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [username]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setModalError('Please enter a valid expense amount.');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const amountToSave = toStorageAmount ? toStorageAmount(parseFloat(formData.amount)) : parseFloat(formData.amount);
      const res = await authFetch(API_ENDPOINTS.EXPENSE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          category: formData.category,
          amount: amountToSave,
          currency: homeCurrency || 'USD',
          description: formData.description.trim() || formData.category,
          date: formData.date,
          payementMethod: formData.payementMethod,
          tags: formData.tags.trim(),
          recurring: formData.recurring,
          recurrenceFrequency: formData.recurrenceFrequency
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          amount: '',
          category: 'Rent & Housing',
          description: '',
          date: new Date().toISOString().split('T')[0],
          payementMethod: 'UPI',
          tags: '',
          recurring: false,
          recurrenceFrequency: 'MONTHLY'
        });
        fetchExpenses();
        setSuccessMsg(formData.recurring ? 'Recurring expense recorded!' : 'Expense added!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setModalError('Failed to save expense.');
      }
    } catch (err) {
      setModalError('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await authFetch(API_ENDPOINTS.EXPENSE_BY_ID(id), {
        method: 'DELETE'
      });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
      } else {
        setError('Failed to delete expense.');
      }
    } catch (err) {
      setError('Error deleting expense: ' + err.message);
    }
  };

  // Calculations normalized to active viewing currency
  const totalAmount = expenses.reduce((sum, item) => {
    const rawAmt = Number(item.amount) || 0;
    const amt = convertAmount ? convertAmount(rawAmt, currency, item.currency || homeCurrency) : rawAmt;
    return sum + amt;
  }, 0);

  // Mandatory recurring expenses normalized to monthly commitment in active viewing currency
  const recurringExpenses = expenses.filter(e => e.recurring);
  const mandatoryMonthlyTotal = recurringExpenses.reduce((sum, e) => {
    const rawAmt = Number(e.amount) || 0;
    const amt = convertAmount ? convertAmount(rawAmt, currency, e.currency || homeCurrency) : rawAmt;
    const freq = e.recurrenceFrequency || 'MONTHLY';
    if (freq === 'WEEKLY') return sum + (amt * 4.333);
    if (freq === 'YEARLY') return sum + (amt / 12);
    return sum + amt;
  }, 0);

  const categoryTotals = expenses.reduce((acc, item) => {
    const rawAmt = Number(item.amount) || 0;
    const amt = convertAmount ? convertAmount(rawAmt, currency, item.currency || homeCurrency) : rawAmt;
    acc[item.category] = (acc[item.category] || 0) + amt;
    return acc;
  }, {});

  // Detailed mandatory monthly breakdown — each recurring expense normalized to monthly
  const mandatoryBreakdown = recurringExpenses.map(e => {
    const rawAmt = Number(e.amount) || 0;
    const amt = convertAmount ? convertAmount(rawAmt, currency, e.currency || homeCurrency) : rawAmt;
    const freq = e.recurrenceFrequency || 'MONTHLY';
    let monthlyAmt = amt;
    if (freq === 'WEEKLY') monthlyAmt = amt * 4.333;
    else if (freq === 'YEARLY') monthlyAmt = amt / 12;
    return {
      id: e.id,
      description: e.description || e.category,
      category: e.category,
      frequency: freq,
      rawAmount: amt,
      monthlyAmount: monthlyAmt
    };
  }).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  // Calculate month span from earliest to latest expense for avg monthly computation
  const monthSpan = (() => {
    if (expenses.length === 0) return 1;
    const dates = expenses
      .map(e => e.date ? new Date(e.date) : null)
      .filter(d => d && !isNaN(d.getTime()));
    if (dates.length === 0) return 1;
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    const months = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth()) + 1;
    return Math.max(1, months);
  })();

  // Average monthly expense by category
  const avgMonthlyByCategory = Object.entries(categoryTotals)
    .map(([cat, total]) => ({ category: cat, total, avgMonthly: total / monthSpan }))
    .sort((a, b) => b.avgMonthly - a.avgMonthly);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;
    const matchesRecurring = filterRecurring === 'ALL' || 
                             (filterRecurring === 'RECURRING' && exp.recurring) ||
                             (filterRecurring === 'ONE_TIME' && !exp.recurring);
    return matchesSearch && matchesCategory && matchesRecurring;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses & Outflows</h2>
          <p className="text-gray-500 text-sm">Track daily expenses and fixed mandatory monthly commitments</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm"
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Cards (Including Mandatory Monthly Expense) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outflows</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{expenses.length} transaction(s)</p>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <TrendingDown size={28} />
          </div>
        </div>

        {/* Mandatory Monthly Expenses View */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Repeat size={14} className="text-indigo-600" />
              Mandatory Monthly Expenses
            </p>
            <p className="text-3xl font-extrabold text-indigo-900 mt-1">
              {formatCurrency(mandatoryMonthlyTotal)}
              <span className="text-xs text-gray-500 font-normal"> / mo</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {recurringExpenses.length} recurring bill(s) (Rent, Bills, Subs)
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Repeat size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average per Expense</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(expenses.length > 0 ? (totalAmount / expenses.length) : 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Overall transaction average</p>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <DollarSign size={28} />
          </div>
        </div>
      </div>

      {/* Mandatory Monthly Expenses — Detailed Breakdown */}
      {mandatoryBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Repeat size={18} className="text-indigo-600" />
            Mandatory Monthly Breakdown
          </h3>
          <p className="text-xs text-gray-400 mb-4">Fixed recurring commitments normalized to monthly cost</p>
          <div className="divide-y divide-gray-100">
            {mandatoryBreakdown.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.category}</span>
                      {item.frequency !== 'MONTHLY' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
                          {item.frequency === 'WEEKLY' ? 'Weekly' : item.frequency === 'YEARLY' ? 'Yearly' : item.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-700">{formatCurrency(item.monthlyAmount)}<span className="text-[10px] text-gray-400 font-normal"> /mo</span></p>
                  {item.frequency !== 'MONTHLY' && (
                    <p className="text-[10px] text-gray-400">{formatCurrency(item.rawAmount)} per {item.frequency === 'WEEKLY' ? 'week' : 'year'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">Total Monthly Commitment</span>
            <span className="text-lg font-extrabold text-indigo-900">{formatCurrency(mandatoryMonthlyTotal)}</span>
          </div>
        </div>
      )}

      {/* Average Monthly Expense by Category */}
      {avgMonthlyByCategory.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart3 size={18} className="text-teal-600" />
            Average Monthly by Category
          </h3>
          <p className="text-xs text-gray-400 mb-4">Based on {monthSpan} month{monthSpan > 1 ? 's' : ''} of expense data</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {avgMonthlyByCategory.map(({ category, total, avgMonthly }) => {
              const maxAvg = avgMonthlyByCategory[0]?.avgMonthly || 1;
              const barPct = (avgMonthly / maxAvg) * 100;
              return (
                <div key={category} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700">{category}</span>
                    <span className="text-teal-700 font-bold">{formatCurrency(avgMonthly)}<span className="text-[10px] text-gray-400 font-normal"> /mo</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, barPct))}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-[10px] text-gray-400">Total: {formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-blue-600" />
            Spending by Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
              return (
                <div key={cat} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between text-sm font-medium mb-1.5">
                    <span className="text-gray-700">{cat}</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-[11px] text-gray-400 mt-1">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar with Mandatory Recurring Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search description, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Recurring Filter Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'RECURRING', label: 'Mandatory Monthly' },
              { id: 'ONE_TIME', label: 'One-time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterRecurring(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterRecurring === tab.id 
                    ? 'bg-white text-indigo-700 font-bold shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Expense History</h3>
          <span className="text-xs text-gray-500 font-medium">{filteredExpenses.length} found</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No expenses found matching the criteria. Click "Add Expense" to record one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{exp.description}</span>
                        {exp.recurring && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Repeat size={10} className="mr-1 text-indigo-600" />
                            {exp.recurrenceFrequency === 'YEARLY' ? 'Yearly' : exp.recurrenceFrequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                          </span>
                        )}
                        {exp.tags && (
                          <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            #{exp.tags}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {exp.payementMethod || 'UPI'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600 whitespace-nowrap">
                      -{formatCurrency(exp.amount, exp.currency || homeCurrency)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Plus size={18} />
                </div>
                Add New Expense
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({currency} {currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Apartment Rent, Netflix, Wifi Bill"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Recurring Mandatory Expense Option */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-indigo-900">
                    Recurring Mandatory Expense (Rent, Bills, Subscriptions)
                  </span>
                </label>
                
                {formData.recurring && (
                  <div className="pt-2 pl-6 flex items-center space-x-3 text-xs">
                    <label className="font-semibold text-indigo-800">Billing Frequency:</label>
                    <select
                      value={formData.recurrenceFrequency}
                      onChange={(e) => setFormData({ ...formData, recurrenceFrequency: e.target.value })}
                      className="px-2.5 py-1 border border-indigo-200 rounded-lg text-xs bg-white text-indigo-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MONTHLY">Monthly (e.g. Rent, Internet, OTT)</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="YEARLY">Yearly (e.g. Insurance)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payementMethod}
                    onChange={(e) => setFormData({ ...formData, payementMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. rent, bills, subs"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;