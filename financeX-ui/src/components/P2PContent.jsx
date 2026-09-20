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
  ChevronRight,
  HandCoins,
  Check,
  QrCode,
  Copy,
  ExternalLink,
  RefreshCw,
  Mail,
  CheckCheck
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const P2PContent = () => {
  const { username, userProfile, formatCurrency, convertAmount, toStorageAmount, homeCurrency, currency, currencySymbol } = useContext(AppContext);

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

  // Add Contact Modal State
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactUpi, setNewContactUpi] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [newContactIsSynced, setNewContactIsSynced] = useState(false);
  const [newContactLinkedUser, setNewContactLinkedUser] = useState(null);
  const [lookingUpUser, setLookingUpUser] = useState(false);
  const [contactModalError, setContactModalError] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Settle Up Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleContactSummary, setSettleContactSummary] = useState(null);
  const [settleCustomUpi, setSettleCustomUpi] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState('UPI');
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

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

  // Dynamic user lookup on typing phone or email
  const handleIdentifierChange = async (val, type = 'phone') => {
    if (type === 'phone') setNewContactPhone(val);
    if (type === 'email') setNewContactEmail(val);

    const query = val.trim();
    if (query.length >= 4) {
      try {
        setLookingUpUser(true);
        const res = await authFetch(`/user/lookup?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.found) {
            setNewContactLinkedUser(data);
            if (!newContactName.trim() && data.name) {
              setNewContactName(data.name);
            }
            // For registered users, strictly lock UPI ID to their registered profile
            setNewContactUpi(data.upiId || '');
            setNewContactIsSynced(true);
          } else {
            setNewContactLinkedUser(null);
          }
        }
      } catch (e) {
        // non-blocking lookup failure
      } finally {
        setLookingUpUser(false);
      }
    } else {
      setNewContactLinkedUser(null);
    }
  };

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
      const isSynced = Boolean(newContactIsSynced && newContactLinkedUser);
      const linkedUsername = isSynced ? newContactLinkedUser.username : null;
      // If user is already registered on FinanceX, strictly lock to their profile UPI ID (do not allow manual editing)
      const contactUpi = newContactLinkedUser 
        ? (newContactLinkedUser.upiId || null) 
        : (newContactUpi.trim() || null);

      const res = await authFetch(API_ENDPOINTS.P2P_CONTACTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name: newContactName.trim(),
          phone: newContactPhone.trim() || null,
          email: newContactEmail.trim() || null,
          upiId: contactUpi,
          isSynced,
          linkedUsername,
          notes: newContactNotes.trim() || null,
          currency: currency || 'USD'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setIsAddContactModalOpen(false);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactEmail('');
        setNewContactUpi('');
        setNewContactIsSynced(false);
        setNewContactLinkedUser(null);
        setNewContactNotes('');
        setSelectedContactId(created.id);
        const syncNotice = isSynced ? ` (Live synced with @${linkedUsername})` : '';
        setSuccessMsg(`Added ${created.name} to your Khatabook!${syncNotice}`);
        setTimeout(() => setSuccessMsg(''), 4000);
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

    const contactCurr = selectedContactSummary?.contact?.currency || currency || 'USD';
    const amount = (convertAmount && currency !== contactCurr)
      ? convertAmount(rawAmount, contactCurr, currency)
      : rawAmount;

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
          currency: contactCurr,
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

  // Open Settle Up Modal
  const openSettleModal = async () => {
    if (!selectedContactId) return;
    const activeContactSummary = contacts.find(c => c.contact.id === selectedContactId);
    if (!activeContactSummary) return;

    const net = activeContactSummary.netBalance;
    if (Math.abs(net) < 0.001) {
      alert('This account is already settled (balance is 0).');
      return;
    }

    setSettleContactSummary(activeContactSummary);
    let upi = activeContactSummary.contact?.upiId || '';

    // If contact record has no UPI ID, but is linked or has phone/email, fetch from user profile automatically
    const lookupQuery = activeContactSummary.contact?.linkedUsername || activeContactSummary.contact?.phone || activeContactSummary.contact?.email;
    if (!upi && lookupQuery) {
      try {
        const res = await authFetch(`/user/lookup?query=${encodeURIComponent(lookupQuery)}`);
        if (res.ok) {
          const udata = await res.json();
          if (udata && udata.found && udata.upiId) {
            upi = udata.upiId;
            // Persist retrieved UPI ID to the contact record so it's permanently stored
            authFetch(`${API_ENDPOINTS.P2P_CONTACTS}/${activeContactSummary.contact.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ upiId: upi })
            }).catch(() => {});
          }
        }
      } catch (e) {
        // non-blocking
      }
    }

    setSettleCustomUpi(upi);
    setSettlePaymentMode('UPI');
    setUpiCopied(false);
    setIsSettleModalOpen(true);
  };

  // Execute Settle Up
  const executeSettleUp = async () => {
    if (!settleContactSummary) return;

    setSubmittingSettle(true);
    try {
      // If user provided a custom UPI ID for this contact, persist it for future settlements
      if (settleCustomUpi && !settleContactSummary.contact?.upiId) {
        authFetch(`${API_ENDPOINTS.P2P_CONTACTS}/${settleContactSummary.contact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upiId: settleCustomUpi.trim() })
        }).catch(() => {});
      }

      const res = await authFetch(API_ENDPOINTS.P2P_SETTLE(settleContactSummary.contact.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          paymentMode: settlePaymentMode || 'UPI'
        })
      });

      if (res.ok) {
        setIsSettleModalOpen(false);
        setSuccessMsg(`Account with ${settleContactSummary.contact.name} is now fully settled!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        loadTransactions(settleContactSummary.contact.id);
        loadKhatabookData();
      } else {
        const msg = await res.text();
        alert('Settlement failed: ' + msg);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingSettle(false);
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

  // Compute converted Khatabook summary totals across all contacts in the user's active viewing currency
  const convertedKhatabookTotals = contacts.reduce((acc, item) => {
    const contactCurr = item.contact?.currency || 'USD';
    const net = Number(item.netBalance) || 0;
    const convertedNet = convertAmount ? convertAmount(net, currency, contactCurr) : net;
    if (convertedNet > 0.001) {
      acc.totalWillGet += convertedNet;
    } else if (convertedNet < -0.001) {
      acc.totalWillGive += Math.abs(convertedNet);
    }
    return acc;
  }, { totalWillGet: 0, totalWillGive: 0 });
  const convertedNetBalance = convertedKhatabookTotals.totalWillGet - convertedKhatabookTotals.totalWillGive;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HandCoins className="text-blue-600 dark:text-blue-400" size={28} />
            P2P Khatabook Ledger
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Credit & debit digital ledger for friends, customers & personal lending</p>
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
        <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Khatabook Net Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">You will get (Receivable)</p>
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(convertedKhatabookTotals.totalWillGet)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lent to others &bull; Money to receive</p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-xl">
            <ArrowUpRight size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">You will give (Payable)</p>
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(convertedKhatabookTotals.totalWillGive)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Borrowed from others &bull; Money to pay</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
            <ArrowDownRight size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Position</p>
            <p className={`text-3xl font-extrabold mt-1 ${
              convertedNetBalance > 0.001 ? 'text-green-600 dark:text-green-400' : convertedNetBalance < -0.001 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
            }`}>
              {convertedNetBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(convertedNetBalance))}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{summary.totalContacts} total party accounts</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <HandCoins size={28} />
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Column (Parties List) + Right Column (Statement Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Contacts / Parties Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          {/* Filter / Search inside Left Panel */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-medium">
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
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Customers */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Loading parties...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">No parties found</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Add Customer" to start a new ledger.</p>
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
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-base flex-shrink-0 uppercase">
                        {item.contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{item.contact.name}</p>
                          {item.contact.isSynced && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center gap-0.5" title={`Live synced with @${item.contact.linkedUsername}`}>
                              <RefreshCw size={9} /> Synced
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {item.contact.phone || (item.lastTransactionDate ? `Last: ${item.lastTransactionDate}` : 'No entries')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      {net > 0.001 ? (
                        <div>
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium">You will get</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(net, item.contact?.currency || 'USD')}</p>
                        </div>
                      ) : net < -0.001 ? (
                        <div>
                          <p className="text-xs text-red-700 dark:text-red-400 font-medium">You will give</p>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(Math.abs(net), item.contact?.currency || 'USD')}</p>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
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
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {selectedContactSummary ? (
            <>
              {/* Active Contact Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 dark:bg-gray-800/40">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-lg shadow-sm">
                    {selectedContactSummary.contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedContactSummary.contact.name}</h3>
                      {selectedContactSummary.contact.isSynced && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <RefreshCw size={10} />
                          Synced {selectedContactSummary.contact.linkedUsername && `(@${selectedContactSummary.contact.linkedUsername})`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                      {selectedContactSummary.contact.phone && (
                        <span className="flex items-center gap-1">
                          <PhoneCall size={12} /> {selectedContactSummary.contact.phone}
                        </span>
                      )}
                      {selectedContactSummary.contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {selectedContactSummary.contact.email}
                        </span>
                      )}
                      {selectedContactSummary.contact.upiId && (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                          <QrCode size={12} /> UPI: {selectedContactSummary.contact.upiId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Settle Up & Delete */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openSettleModal}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="Settle up via UPI or cash"
                  >
                    <CheckCircle2 size={15} />
                    <span>Settle Up</span>
                  </button>

                  <button
                    onClick={() => handleDeleteContact(selectedContactSummary.contact.id, selectedContactSummary.contact.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Balance Bar */}
              <div className="px-6 py-3 bg-blue-50/40 dark:bg-blue-950/30 border-b border-blue-100/60 dark:border-blue-900/40 flex justify-between items-center text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-4">
                  <span>Total Gave: <strong className="text-red-600 dark:text-red-400">{formatCurrency(selectedContactSummary.totalGave, selectedContactSummary.contact?.currency || 'USD')}</strong></span>
                  <span>Total Got: <strong className="text-green-600 dark:text-green-400">{formatCurrency(selectedContactSummary.totalGot, selectedContactSummary.contact?.currency || 'USD')}</strong></span>
                </div>
                <div>
                  Net Balance:{' '}
                  <strong className={
                    selectedContactSummary.netBalance > 0.001 ? 'text-green-600 dark:text-green-400 font-bold' :
                    selectedContactSummary.netBalance < -0.001 ? 'text-red-600 dark:text-red-400 font-bold' :
                    'text-gray-600 dark:text-gray-400'
                  }>
                    {selectedContactSummary.netBalance > 0.001 ? `You'll get ${formatCurrency(selectedContactSummary.netBalance, selectedContactSummary.contact?.currency || 'USD')}` :
                     selectedContactSummary.netBalance < -0.001 ? `You'll give ${formatCurrency(Math.abs(selectedContactSummary.netBalance), selectedContactSummary.contact?.currency || 'USD')}` :
                     `Settled (${formatCurrency(0)})`}
                  </strong>
                </div>
              </div>

              {/* Transactions Ledger Timeline */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[420px] space-y-3">
                {loadingTransactions ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">No entries yet for {selectedContactSummary.contact.name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Use the buttons below to record "You Gave" or "You Got".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(tx => {
                      const isGave = tx.type === 'YOU_GAVE';
                      return (
                        <div 
                          key={tx.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                            isGave ? 'bg-red-50/50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50' : 'bg-green-50/50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isGave ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200'
                              }`}>
                                {isGave ? 'You Gave' : 'You Got'}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{tx.date}</span>
                              {tx.paymentMode && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                  {tx.paymentMode}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.description || (isGave ? 'Money Lent' : 'Payment Received')}</p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <p className={`text-base font-extrabold ${isGave ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {isGave ? '-' : '+'}{formatCurrency(tx.amount, tx.currency || selectedContactSummary?.contact?.currency || 'USD')}
                            </p>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1"
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
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/80 flex gap-4">
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-gray-500">
              <Users size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-semibold">No party selected</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Select a contact from the left or click "Add Customer" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                  <UserPlus size={18} />
                </div>
                Add New Contact / Customer
              </h3>
              <button 
                onClick={() => setIsAddContactModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {contactModalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{contactModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={newContactPhone}
                      onChange={(e) => handleIdentifierChange(e.target.value, 'phone')}
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. user@example.com"
                      value={newContactEmail}
                      onChange={(e) => handleIdentifierChange(e.target.value, 'email')}
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Looking up status */}
              {lookingUpUser && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 py-1">
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Checking FinanceX registry for user...</span>
                </div>
              )}

              {/* Registered user matched */}
              {newContactLinkedUser && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        FinanceX User Found: @{newContactLinkedUser.username}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded font-medium">
                      Registered
                    </span>
                  </div>

                  <p className="text-xs text-blue-700 dark:text-blue-300/80">
                    {newContactLinkedUser.name} {newContactLinkedUser.phone ? `(${newContactLinkedUser.phone})` : ''}
                  </p>

                  {/* Registered user UPI ID - locked & read only */}
                  <div className="flex items-center justify-between text-xs bg-white/70 dark:bg-gray-900/70 px-2.5 py-1.5 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
                    <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                      <QrCode size={12} />
                      <span>Registered UPI ID:</span>
                    </span>
                    <span className="font-mono font-semibold text-blue-900 dark:text-blue-200">
                      {newContactLinkedUser.upiId || <span className="italic text-gray-400 font-normal">Not set in profile</span>}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                    <label className="flex items-start space-x-2.5 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={newContactIsSynced}
                        onChange={(e) => setNewContactIsSynced(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Live Sync ledger with @{newContactLinkedUser.username}
                        </span>
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                          Transactions will automatically mirror in both accounts. Settle up balances are verified mutually.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Only show editable UPI ID field for unregistered / manual contacts */}
              {!newContactLinkedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPI ID / VPA <span className="text-xs text-gray-400 font-normal">(for 1-click settle)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@okaxis or 9876543210@paytm"
                    value={newContactUpi}
                    onChange={(e) => setNewContactUpi(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Roommate, Supplier, Office colleague"
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingContact ? 'Adding...' : newContactIsSynced ? 'Add & Sync Contact' : 'Add Contact (Private)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${
                txType === 'YOU_GAVE' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                <div className={`p-2 rounded-lg ${
                  txType === 'YOU_GAVE' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                }`}>
                  {txType === 'YOU_GAVE' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                {txType === 'YOU_GAVE' ? 'Record Money Given (Lent)' : 'Record Money Received (Got)'}
              </h3>
              <button 
                onClick={() => setIsTxModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Recording transaction with <strong className="text-gray-800 dark:text-gray-200">{selectedContactSummary?.contact.name}</strong>
            </p>

            {txModalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{txModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount ({currency} {currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={txPaymentMode}
                    onChange={(e) => setTxPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Reason</label>
                <input
                  type="text"
                  placeholder={txType === 'YOU_GAVE' ? 'e.g. Lunch split, Advance' : 'e.g. Returned advance, Partial repayment'}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
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
      {/* Settle Up Modal with UPI Deep Link & QR Code */}
      {isSettleModalOpen && settleContactSummary && (() => {
        const net = settleContactSummary.netBalance;
        const youOwe = net < 0;
        const settleAmount = Math.abs(net);
        const contact = settleContactSummary.contact;
        const targetUpi = youOwe ? (contact.upiId || settleCustomUpi) : userProfile?.upiId;
        const payeeName = youOwe ? contact.name : (userProfile?.name || username);

        // Standard NPCI UPI Deep Link
        const upiUrl = targetUpi
          ? `upi://pay?pa=${encodeURIComponent(targetUpi)}&pn=${encodeURIComponent(payeeName)}&am=${settleAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('FinanceX Settlement')}`
          : '';

        const qrCodeUrl = upiUrl
          ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`
          : '';

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    youOwe ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                  }`}>
                    <HandCoins size={18} />
                  </div>
                  <span>Settle Up Ledger</span>
                </h3>
                <button 
                  onClick={() => setIsSettleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Settlement Summary Card */}
              <div className={`p-4 rounded-xl mb-4 border ${
                youOwe 
                  ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' 
                  : 'bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {youOwe ? 'You are settling your debt with' : 'You are collecting settlement from'}
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                      {contact.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Total Settlement</span>
                    <p className={`text-xl font-black ${
                      youOwe ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency ? formatCurrency(settleAmount, contact.currency || currency) : `${currencySymbol} ${settleAmount.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* UPI Payment Section if user owes money */}
              {youOwe ? (
                <div className="space-y-3 mb-5">
                  {targetUpi ? (
                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Payee UPI ID:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(targetUpi);
                            setUpiCopied(true);
                            setTimeout(() => setUpiCopied(false), 2000);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline font-medium"
                        >
                          {upiCopied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                          <span>{upiCopied ? 'Copied!' : 'Copy UPI'}</span>
                        </button>
                      </div>
                      <div className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 break-all mb-3">
                        {targetUpi}
                      </div>

                      {/* Pay via UPI App deep link */}
                      <a
                        href={upiUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <ExternalLink size={16} />
                        <span>Pay with UPI App (GPay, PhonePe, Paytm)</span>
                      </a>

                      {/* Desktop QR code scan */}
                      <div className="mt-3 text-center">
                        <p className="text-[11px] text-gray-400 mb-1.5">or scan QR code from mobile banking app:</p>
                        <div className="inline-block p-2 bg-white rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                          <img 
                            src={qrCodeUrl} 
                            alt="UPI QR Code" 
                            className="w-32 h-32 mx-auto"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        {contact.name} hasn't provided a UPI ID.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter payee UPI ID (e.g. name@okhdfcbank)"
                        value={settleCustomUpi}
                        onChange={(e) => setSettleCustomUpi(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-amber-300 dark:border-amber-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Or you can pay in Cash / Bank Transfer and confirm below.
                      </p>
                    </div>
                  )}

                  {/* Payment Mode Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Settlement Mode:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['UPI', 'Cash', 'Bank Transfer'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSettlePaymentMode(mode)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            settlePaymentMode === mode
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Contact owes current user */
                <div className="space-y-3 mb-5">
                  <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      Show your UPI QR or ID to <strong>{contact.name}</strong> to collect:
                    </p>
                    {userProfile?.upiId ? (
                      <div>
                        <div className="inline-block p-2 bg-white rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-2">
                          <img 
                            src={qrCodeUrl} 
                            alt="Your UPI QR" 
                            className="w-32 h-32 mx-auto"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                            {userProfile.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(userProfile.upiId);
                              setUpiCopied(true);
                              setTimeout(() => setUpiCopied(false), 2000);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                          >
                            {upiCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            <span>{upiCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Tip: Set your UPI ID in Profile Settings to generate an instant payment QR code.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSettleUp}
                  disabled={submittingSettle}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>{submittingSettle ? 'Settling...' : 'Confirm Paid & Settle Ledger'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default P2PContent;