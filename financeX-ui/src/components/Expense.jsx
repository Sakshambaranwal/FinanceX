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

  // Detailed mandatory monthly breakdown
  const mandatoryBreakdown = recurringExpenses.map(e => {
    const rawAmt = Number(e.amount) || 0;
    const amt = convertAmount ? convertAmount(rawAmt, currency, e.currency || homeCurrency) : rawAmt;
    const freq = e.recurrenceFrequency || 'MONTHLY';
    let monthlyAmount = amt;
    if (freq === 'WEEKLY') monthlyAmount = amt * 4.333;
    if (freq === 'YEARLY') monthlyAmount = amt / 12;
    return {
      id: e.id,
      description: e.description,
      category: e.category,
      rawAmount: amt,
      monthlyAmount,
      frequency: freq,
      paymentMethod: e.payementMethod
    };
  });

  // Calculate actual date span (in months) across recorded expenses
  const calculateMonthSpan = () => {
    if (expenses.length === 0) return 1;
    const dates = expenses.map(e => new Date(e.date).getTime()).filter(t => !isNaN(t));
    if (dates.length === 0) return 1;
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const months = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
    return Math.max(1, months);
  };

  const monthSpan = calculateMonthSpan();

  const avgMonthlyByCategory = Object.entries(categoryTotals).map(([category, total]) => {
    const isRecurringCat = recurringExpenses.some(r => r.category === category);
    const avgMonthly = isRecurringCat 
      ? (mandatoryBreakdown.filter(m => m.category === category).reduce((s, m) => s + m.monthlyAmount, 0) || (total / monthSpan))
      : (total / monthSpan);

    return {
      category,
      total,
      avgMonthly
    };
  }).filter(c => c.total > 0)
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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses & Outflows</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Track daily expenses and fixed mandatory commitments</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-xs text-sm"
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Outflows</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{expenses.length} transaction(s)</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Mandatory Monthly Expenses View */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Repeat size={13} />
              Mandatory Monthly
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
              {formatCurrency(mandatoryMonthlyTotal)}
              <span className="text-xs text-gray-400 font-normal"> / mo</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {recurringExpenses.length} recurring bill(s)
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Repeat size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Average per Expense</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(expenses.length > 0 ? (totalAmount / expenses.length) : 0)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Overall transaction average</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search description, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recurring Filter Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold flex-1 sm:flex-none justify-center">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'RECURRING', label: 'Mandatory' },
              { id: 'ONE_TIME', label: 'One-time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterRecurring(tab.id)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center ${
                  filterRecurring === tab.id 
                    ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 flex-1 sm:flex-none">
            <Filter size={15} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Content: Mobile Card-List (< md) + Desktop Table (>= md) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Expense History</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{filteredExpenses.length} found</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No expenses found matching the criteria. Click "Add Expense" to record one!
          </div>
        ) : (
          <>
            {/* --- Mobile Card-List View (Shown on phone screens, clean and modern) --- */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {exp.description}
                      </p>
                      {exp.recurring && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {exp.recurrenceFrequency === 'YEARLY' ? 'Yearly' : exp.recurrenceFrequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                        </span>
                      )}
                      {exp.tags && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          #{exp.tags}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <span>{exp.date}</span>
                      <span>&bull;</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {exp.category}
                      </span>
                      <span>&bull;</span>
                      <span>{exp.payementMethod || 'UPI'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">
                      -{formatCurrency(exp.amount, exp.currency || homeCurrency)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Desktop Table View (Shown on md and up) --- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Payment</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{exp.description}</span>
                          {exp.recurring && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                              <Repeat size={10} className="mr-1 text-indigo-600 dark:text-indigo-400" />
                              {exp.recurrenceFrequency === 'YEARLY' ? 'Yearly' : exp.recurrenceFrequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                            </span>
                          )}
                          {exp.tags && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              #{exp.tags}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {exp.payementMethod || 'UPI'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        -{formatCurrency(exp.amount, exp.currency || homeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Plus size={18} />
                </div>
                Add New Expense
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount ({currency} {currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Apartment Rent, Netflix, Wifi Bill"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Recurring Mandatory Expense Option */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    Recurring Mandatory Expense (Rent, Bills, Subscriptions)
                  </span>
                </label>
                
                {formData.recurring && (
                  <div className="pt-2 pl-6 flex items-center space-x-3 text-xs">
                    <label className="font-semibold text-indigo-800 dark:text-indigo-300">Billing Frequency:</label>
                    <select
                      value={formData.recurrenceFrequency}
                      onChange={(e) => setFormData({ ...formData, recurrenceFrequency: e.target.value })}
                      className="px-2.5 py-1 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-indigo-900 dark:text-indigo-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                  <select
                    value={formData.payementMethod}
                    onChange={(e) => setFormData({ ...formData, payementMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. rent, bills, subs"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
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