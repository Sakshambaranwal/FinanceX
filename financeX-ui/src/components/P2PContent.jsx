import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Phone,
  PhoneCall,
  Clock, 
  DollarSign,
  ChevronRight,
  HandCoins,
  Check
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const P2PContent = () => {
  const { username, formatCurrency, convertAmount, toStorageAmount, homeCurrency, currency, currencySymbol } = useContext(AppContext);

  const [contacts, setContacts] = useState([]);
  const [summary, setSummary] = useState({
    totalYouWillGet: 0,
    totalYouWillGive: 0,
    netBalance: 0,
    totalContacts: 0,
    settledContacts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, GET, GIVE, SETTLED

  // Selected Contact State
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Add Contact Modal
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [contactModalError, setContactModalError] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Add Transaction Modal (YOU_GAVE or YOU_GOT)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState('YOU_GAVE'); // 'YOU_GAVE' or 'YOU_GOT'
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txPaymentMode, setTxPaymentMode] = useState('UPI');
  const [txModalError, setTxModalError] = useState('');
  const [submittingTx, setSubmittingTx] = useState(false);

  // Fetch contacts and overall summary
  const loadKhatabookData = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [summaryRes, contactsRes] = await Promise.all([
        authFetch(API_ENDPOINTS.P2P_SUMMARY(username)),
        authFetch(API_ENDPOINTS.P2P_CONTACTS_USER(username))
      ]);

      if (summaryRes.ok && contactsRes.ok) {
        const sumData = await summaryRes.json();
        const conData = await contactsRes.json();
        setSummary(sumData);
        setContacts(Array.isArray(conData) ? conData : []);

        // Auto select first contact if none selected or if selected was deleted
        if (Array.isArray(conData) && conData.length > 0) {
          if (!selectedContactId || !conData.some(c => c.contact.id === selectedContactId)) {
            setSelectedContactId(conData[0].contact.id);
          }
        } else {
          setSelectedContactId(null);
          setTransactions([]);
        }
      } else {
        setError('Failed to load P2P Khatabook ledger.');
      }
    } catch (err) {
      setError('Cannot connect to P2P service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKhatabookData();
  }, [username]);

  // Load transactions whenever selected contact changes
  const loadTransactions = async (contactId) => {
    if (!contactId) return;
    try {
      setLoadingTransactions(true);
      const res = await authFetch(API_ENDPOINTS.P2P_TRANSACTIONS_CONTACT(contactId));
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load contact transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedContactId) {
      loadTransactions(selectedContactId);
    }
  }, [selectedContactId]);

  // Add Contact Handler
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName.trim()) {
      setContactModalError('Please enter a contact name.');
      return;
    }

    setSubmittingContact(true);
    setContactModalError('');
    try {
      const res = await authFetch(API_ENDPOINTS.P2P_CONTACTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name: newContactName.trim(),
          phone: newContactPhone.trim() || null,
          notes: newContactNotes.trim() || null,
          currency: homeCurrency || 'USD'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setIsAddContactModalOpen(false);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactNotes('');
        setSelectedContactId(created.id);
        setSuccessMsg(`Added ${created.name} to your Khatabook!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        loadKhatabookData();
      } else {
        const msg = await res.text();
        setContactModalError(msg || 'Failed to add contact.');
      }
    } catch (err) {
      setContactModalError('Error: ' + err.message);
    } finally {
      setSubmittingContact(false);
    }
  };

  // Add Transaction Handler
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const rawAmount = parseFloat(txAmount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setTxModalError('Please enter a valid amount.');
      return;
    }
    if (!selectedContactId) return;

    const amount = toStorageAmount ? toStorageAmount(rawAmount) : rawAmount;

    setSubmittingTx(true);
    setTxModalError('');
    try {
      const res = await authFetch(API_ENDPOINTS.P2P_TRANSACTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContactId,
          username,
          type: txType,
          amount,
          date: txDate,
          currency: homeCurrency || 'USD',
          description: txDescription.trim() || (txType === 'YOU_GAVE' ? 'Amount Lent' : 'Payment Received'),
          paymentMode: txPaymentMode
        })
      });

      if (res.ok) {
        setIsTxModalOpen(false);
        setTxAmount('');
        setTxDescription('');
        setTxDate(new Date().toISOString().split('T')[0]);
        loadTransactions(selectedContactId);
        loadKhatabookData();
      } else {
        const msg = await res.text();
        setTxModalError(msg || 'Failed to record entry.');
      }
    } catch (err) {
      setTxModalError('Error: ' + err.message);
    } finally {
      setSubmittingTx(false);
    }
  };

  // Settle Up Handler
  const handleSettleUp = async () => {
    if (!selectedContactId) return;
    const activeContactSummary = contacts.find(c => c.contact.id === selectedContactId);
    if (!activeContactSummary) return;

    const net = activeContactSummary.netBalance;
    if (Math.abs(net) < 0.001) {
      alert('This account is already settled (balance is 0).');
      return;
    }

    const confirmMsg = net > 0 
      ? `Mark ${formatCurrency(net, activeContactSummary.contact.currency || homeCurrency)} received from ${activeContactSummary.contact.name} and settle account to ${formatCurrency(0)}?`
      : `Mark ${formatCurrency(Math.abs(net), activeContactSummary.contact.currency || homeCurrency)} paid to ${activeContactSummary.contact.name} and settle account to ${formatCurrency(0)}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await authFetch(API_ENDPOINTS.P2P_SETTLE(selectedContactId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          paymentMode: 'Cash'
        })
      });

      if (res.ok) {
        setSuccessMsg(`Account with ${activeContactSummary.contact.name} is now fully settled!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        loadTransactions(selectedContactId);
        loadKhatabookData();
      } else {
        const msg = await res.text();
        alert('Settlement failed: ' + msg);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = async (txId) => {
    if (!confirm('Are you sure you want to delete this ledger entry?')) return;
    try {
      const res = await authFetch(API_ENDPOINTS.P2P_TRANSACTION_BY_ID(txId), {
        method: 'DELETE'
      });
      if (res.ok) {
        loadTransactions(selectedContactId);
        loadKhatabookData();
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (cId, cName) => {
    if (!confirm(`Delete ${cName} and all associated ledger transactions?`)) return;
    try {
      const res = await authFetch(API_ENDPOINTS.P2P_CONTACT_BY_ID(cId), {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedContactId === cId) {
          setSelectedContactId(null);
        }
        loadKhatabookData();
      } else {
        alert('Failed to delete contact.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(item => {
    const matchesSearch = !searchTerm ||
      item.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.contact.phone && item.contact.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterType === 'GET') return item.netBalance > 0.001;
    if (filterType === 'GIVE') return item.netBalance < -0.001;
    if (filterType === 'SETTLED') return Math.abs(item.netBalance) <= 0.001;
    return true;
  });

  const selectedContactSummary = contacts.find(c => c.contact.id === selectedContactId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HandCoins className="text-blue-600" size={28} />
            P2P Khatabook Ledger
          </h2>
          <p className="text-gray-500 text-sm">Credit & debit digital ledger for friends, customers & personal lending</p>
        </div>
        <button 
          onClick={() => setIsAddContactModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          <span>Add Customer / Friend</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Khatabook Net Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">You will get (Receivable)</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">
              {formatCurrency(summary.totalYouWillGet, homeCurrency)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Lent to others &bull; Money to receive</p>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <ArrowUpRight size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">You will give (Payable)</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">
              {formatCurrency(summary.totalYouWillGive, homeCurrency)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Borrowed from others &bull; Money to pay</p>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <ArrowDownRight size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Position</p>
            <p className={`text-3xl font-extrabold mt-1 ${
              summary.netBalance > 0 ? 'text-green-600' : summary.netBalance < 0 ? 'text-red-600' : 'text-gray-800'
            }`}>
              {summary.netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.netBalance), homeCurrency)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.totalContacts} total party accounts</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <HandCoins size={28} />
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Column (Parties List) + Right Column (Statement Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Contacts / Parties Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Filter / Search inside Left Panel */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl text-xs font-medium">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'GET', label: 'You’ll Get' },
                { id: 'GIVE', label: 'You’ll Give' },
                { id: 'SETTLED', label: 'Settled' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    filterType === tab.id 
                      ? 'bg-white text-gray-900 font-bold shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Customers */}
          <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading parties...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 font-medium text-sm">No parties found</p>
                <p className="text-gray-400 text-xs mt-1">Click "Add Customer" to start a new ledger.</p>
              </div>
            ) : (
              filteredContacts.map(item => {
                const isSelected = selectedContactId === item.contact.id;
                const net = item.netBalance;
                return (
                  <div
                    key={item.contact.id}
                    onClick={() => setSelectedContactId(item.contact.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base flex-shrink-0 uppercase">
                        {item.contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.contact.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {item.contact.phone || (item.lastTransactionDate ? `Last: ${item.lastTransactionDate}` : 'No entries')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      {net > 0.001 ? (
                        <div>
                          <p className="text-xs text-green-700 font-medium">You will get</p>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(net, item.contact.currency || homeCurrency)}</p>
                        </div>
                      ) : net < -0.001 ? (
                        <div>
                          <p className="text-xs text-red-700 font-medium">You will give</p>
                          <p className="text-sm font-bold text-red-600">{formatCurrency(Math.abs(net), item.contact.currency || homeCurrency)}</p>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Statement / Ledger Detail Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {selectedContactSummary ? (
            <>
              {/* Active Contact Header */}
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-lg shadow-sm">
                    {selectedContactSummary.contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedContactSummary.contact.name}</h3>
                    {selectedContactSummary.contact.phone ? (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <PhoneCall size={12} /> {selectedContactSummary.contact.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No phone number</p>
                    )}
                  </div>
                </div>

                {/* Actions: Settle Up & Delete */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSettleUp}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="Mark completely settled (balance to 0)"
                  >
                    <CheckCircle2 size={15} />
                    <span>Settle Up</span>
                  </button>

                  <button
                    onClick={() => handleDeleteContact(selectedContactSummary.contact.id, selectedContactSummary.contact.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Balance Bar */}
              <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100/60 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-4">
                  <span>Total Gave: <strong className="text-red-600">{formatCurrency(selectedContactSummary.totalGave, selectedContactSummary.contact.currency || homeCurrency)}</strong></span>
                  <span>Total Got: <strong className="text-green-600">{formatCurrency(selectedContactSummary.totalGot, selectedContactSummary.contact.currency || homeCurrency)}</strong></span>
                </div>
                <div>
                  Net Balance:{' '}
                  <strong className={
                    selectedContactSummary.netBalance > 0.001 ? 'text-green-600 font-bold' :
                    selectedContactSummary.netBalance < -0.001 ? 'text-red-600 font-bold' :
                    'text-gray-600'
                  }>
                    {selectedContactSummary.netBalance > 0.001 ? `You'll get ${formatCurrency(selectedContactSummary.netBalance, selectedContactSummary.contact.currency || homeCurrency)}` :
                     selectedContactSummary.netBalance < -0.001 ? `You'll give ${formatCurrency(Math.abs(selectedContactSummary.netBalance), selectedContactSummary.contact.currency || homeCurrency)}` :
                     `Settled (${formatCurrency(0)})`}
                  </strong>
                </div>
              </div>

              {/* Transactions Ledger Timeline */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[420px] space-y-3">
                {loadingTransactions ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600 font-medium text-sm">No entries yet for {selectedContactSummary.contact.name}</p>
                    <p className="text-gray-400 text-xs mt-1">Use the buttons below to record "You Gave" or "You Got".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(tx => {
                      const isGave = tx.type === 'YOU_GAVE';
                      return (
                        <div 
                          key={tx.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                            isGave ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isGave ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isGave ? 'You Gave' : 'You Got'}
                              </span>
                              <span className="text-xs text-gray-400">{tx.date}</span>
                              {tx.paymentMode && (
                                <span className="text-[11px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                  {tx.paymentMode}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800">{tx.description || (isGave ? 'Money Lent' : 'Payment Received')}</p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <p className={`text-base font-extrabold ${isGave ? 'text-red-600' : 'text-green-600'}`}>
                              {isGave ? '-' : '+'}{formatCurrency(tx.amount, tx.currency || homeCurrency)}
                            </p>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-gray-300 hover:text-red-500 p-1"
                              title="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Khatabook Primary Action Buttons */}
              <div className="p-4 border-t border-gray-200 bg-gray-50/90 flex gap-4">
                <button
                  onClick={() => {
                    setTxType('YOU_GAVE');
                    setIsTxModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <ArrowDownRight size={18} />
                  <span>YOU GAVE ({currency} {currencySymbol})</span>
                </button>

                <button
                  onClick={() => {
                    setTxType('YOU_GOT');
                    setIsTxModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <ArrowUpRight size={18} />
                  <span>YOU GOT ({currency} {currencySymbol})</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <Users size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-700 font-semibold">No party selected</p>
              <p className="text-gray-400 text-sm mt-1">Select a contact from the left or click "Add Customer" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserPlus size={18} />
                </div>
                Add New Contact / Customer
              </h3>
              <button 
                onClick={() => setIsAddContactModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {contactModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{contactModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Roommate, Supplier, Office colleague"
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingContact ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${
                txType === 'YOU_GAVE' ? 'text-red-600' : 'text-green-600'
              }`}>
                <div className={`p-2 rounded-lg ${
                  txType === 'YOU_GAVE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {txType === 'YOU_GAVE' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                {txType === 'YOU_GAVE' ? 'Record Money Given (Lent)' : 'Record Money Received (Got)'}
              </h3>
              <button 
                onClick={() => setIsTxModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Recording transaction with <strong className="text-gray-800">{selectedContactSummary?.contact.name}</strong>
            </p>

            {txModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{txModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({currency} {currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={txPaymentMode}
                    onChange={(e) => setTxPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Reason</label>
                <input
                  type="text"
                  placeholder={txType === 'YOU_GAVE' ? 'e.g. Lunch split, Advance' : 'e.g. Returned advance, Partial repayment'}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTx}
                  className={`px-5 py-2 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                    txType === 'YOU_GAVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submittingTx ? 'Recording...' : `Record ${txType === 'YOU_GAVE' ? 'Debit' : 'Credit'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default P2PContent;