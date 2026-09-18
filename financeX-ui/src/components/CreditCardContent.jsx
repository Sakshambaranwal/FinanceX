import React, { useState, useEffect, useContext } from 'react';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Zap, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  DollarSign, 
  Tag, 
  Percent, 
  X,
  HelpCircle,
  BookOpen,
  Info,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { AppContext } from '../AppContext';
import CARDS_CATALOG from '../data/cards-catalog.json';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const COMMON_MERCHANTS = [
  'Amazon',
  'Flipkart',
  'Swiggy',
  'Zomato',
  'Myntra',
  'MakeMyTrip',
  'Uber',
  'Dining',
  'Groceries',
  'Utilities / Bills',
  'Fuel',
  'General Spend'
];

const CreditCardContent = () => {
  const { username, formatCurrency, homeCurrency, currency, currencySymbol } = useContext(AppContext);

  const [cards, setCards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [spends, setSpends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Smart Spend Advisor state
  const [advisorAmount, setAdvisorAmount] = useState('30000');
  const [advisorMerchant, setAdvisorMerchant] = useState('Amazon');
  const [recommendation, setRecommendation] = useState(null);
  const [evaluatingAdvisor, setEvaluatingAdvisor] = useState(false);

  // Bank Catalog Browser Modal
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedCatalogBank, setSelectedCatalogBank] = useState('HDFC Bank');

  // Add / Edit Card Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [cardModalError, setCardModalError] = useState('');
  const [selectedDropdownBank, setSelectedDropdownBank] = useState('');
  const [selectedDropdownCardId, setSelectedDropdownCardId] = useState('');
  const [cardFormData, setCardFormData] = useState({
    cardName: '',
    bank: '',
    cardLast4: '',
    network: 'Visa',
    isLtf: false,
    annualFee: '',
    feeWaiverSpend: '',
    milestoneSpend: '',
    milestoneReward: '',
    baseRewardRate: '1.0',
    baseRewardCap: '',
    acceleratedRewardCap: '',
    cappingCycle: 'STATEMENT_CYCLE',
    catalogCardId: '',
    merchantRewardRates: {},
    billingCycleDay: '15',
    paymentDueDays: '20',
    annualSpendStartDate: new Date().toISOString().split('T')[0],
    creditLimit: ''
  });

  // Custom merchant rate inputs in Card Modal
  const [customMerchantName, setCustomMerchantName] = useState('');
  const [customMerchantRate, setCustomMerchantRate] = useState('');

  // Add Spend Modal
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [submittingSpend, setSubmittingSpend] = useState(false);
  const [spendModalError, setSpendModalError] = useState('');
  const [spendFormData, setSpendFormData] = useState({
    cardId: '',
    amount: '',
    merchant: 'Amazon',
    category: 'Shopping',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Load cards and summary
  const loadData = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [summaryRes, spendsRes] = await Promise.all([
        authFetch(API_ENDPOINTS.CREDIT_CARD_SUMMARY(username)),
        authFetch(API_ENDPOINTS.CREDIT_CARD_SPENDS_USER(username))
      ]);

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
        setCards(sumData.cards || []);
        if (sumData.cards && sumData.cards.length > 0 && !spendFormData.cardId) {
          setSpendFormData(prev => ({ ...prev, cardId: sumData.cards[0].card.id }));
        }
      }

      if (spendsRes.ok) {
        const spendsData = await spendsRes.json();
        setSpends(Array.isArray(spendsData) ? spendsData : []);
      }
    } catch (err) {
      setError('Cannot connect to Credit Card service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [username]);

  // Evaluate advisor recommendation whenever advisor inputs or cards change
  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!username || !advisorAmount || isNaN(advisorAmount) || Number(advisorAmount) <= 0 || cards.length === 0) {
        setRecommendation(null);
        return;
      }

      try {
        setEvaluatingAdvisor(true);
        const res = await authFetch(
          API_ENDPOINTS.CREDIT_CARD_RECOMMEND(username, advisorAmount, advisorMerchant)
        );
        if (res.ok) {
          const recData = await res.json();
          setRecommendation(recData);
        }
      } catch (err) {
        console.warn('Failed to fetch card recommendation:', err);
      } finally {
        setEvaluatingAdvisor(false);
      }
    };

    fetchRecommendation();
  }, [username, advisorAmount, advisorMerchant, cards.length]);

  // Dropdown Selection Helpers
  const handleDropdownBankChange = (bankName) => {
    setSelectedDropdownBank(bankName);
    setSelectedDropdownCardId('');
    if (bankName === 'CUSTOM') {
      setCardFormData(prev => ({ ...prev, bank: '', catalogCardId: '' }));
    } else if (bankName) {
      setCardFormData(prev => ({ ...prev, bank: bankName }));
    } else {
      setCardFormData(prev => ({ ...prev, bank: '' }));
    }
  };

  const handleDropdownCardChange = (cardId) => {
    setSelectedDropdownCardId(cardId);
    if (!cardId) {
      return;
    }
    if (cardId === 'CUSTOM') {
      setCardFormData(prev => ({
        ...prev,
        cardName: '',
        catalogCardId: ''
      }));
      return;
    }

    const bankObj = CARDS_CATALOG.find(b => b.bank === selectedDropdownBank);
    const cardItem = bankObj?.cards?.find(c => c.id === cardId);
    if (cardItem) {
      setCardFormData(prev => ({
        ...prev,
        cardName: cardItem.cardName,
        bank: selectedDropdownBank || cardItem.bank,
        cardLast4: prev.cardLast4 || '',
        network: cardItem.network || 'Visa',
        isLtf: !!cardItem.isLtf,
        annualFee: cardItem.annualFee != null ? cardItem.annualFee.toString() : '0',
        feeWaiverSpend: cardItem.feeWaiverSpend != null ? cardItem.feeWaiverSpend.toString() : '0',
        milestoneSpend: cardItem.milestoneSpend != null ? cardItem.milestoneSpend.toString() : '',
        milestoneReward: cardItem.milestoneReward || '',
        baseRewardRate: cardItem.baseRewardRate != null ? cardItem.baseRewardRate.toString() : '1.0',
        baseRewardCap: cardItem.baseRewardCap != null ? cardItem.baseRewardCap.toString() : '',
        acceleratedRewardCap: cardItem.acceleratedRewardCap != null ? cardItem.acceleratedRewardCap.toString() : '',
        cappingCycle: cardItem.cappingCycle || 'STATEMENT_CYCLE',
        catalogCardId: cardItem.id || '',
        merchantRewardRates: { ...(cardItem.merchantRewardRates || {}) },
        billingCycleDay: cardItem.billingCycleDay ? cardItem.billingCycleDay.toString() : '15',
        paymentDueDays: cardItem.paymentDueDays ? cardItem.paymentDueDays.toString() : '20',
        annualSpendStartDate: prev.annualSpendStartDate || new Date().toISOString().split('T')[0],
        creditLimit: cardItem.creditLimit ? cardItem.creditLimit.toString() : prev.creditLimit
      }));
    }
  };

  // Preset Selection Helper from Catalog
  const handleSelectCatalogCard = (cardItem, bankName) => {
    const resolvedBank = bankName || cardItem.bank;
    setSelectedDropdownBank(resolvedBank);
    setSelectedDropdownCardId(cardItem.id);
    setCardFormData({
      cardName: cardItem.cardName,
      bank: resolvedBank,
      cardLast4: '',
      network: cardItem.network || 'Visa',
      isLtf: !!cardItem.isLtf,
      annualFee: cardItem.annualFee != null ? cardItem.annualFee.toString() : '0',
      feeWaiverSpend: cardItem.feeWaiverSpend != null ? cardItem.feeWaiverSpend.toString() : '0',
      milestoneSpend: cardItem.milestoneSpend != null ? cardItem.milestoneSpend.toString() : '',
      milestoneReward: cardItem.milestoneReward || '',
      baseRewardRate: cardItem.baseRewardRate != null ? cardItem.baseRewardRate.toString() : '1.0',
      baseRewardCap: cardItem.baseRewardCap != null ? cardItem.baseRewardCap.toString() : '',
      acceleratedRewardCap: cardItem.acceleratedRewardCap != null ? cardItem.acceleratedRewardCap.toString() : '',
      cappingCycle: cardItem.cappingCycle || 'STATEMENT_CYCLE',
      catalogCardId: cardItem.id || '',
      merchantRewardRates: { ...(cardItem.merchantRewardRates || {}) },
      billingCycleDay: cardItem.billingCycleDay ? cardItem.billingCycleDay.toString() : '15',
      paymentDueDays: cardItem.paymentDueDays ? cardItem.paymentDueDays.toString() : '20',
      annualSpendStartDate: new Date().toISOString().split('T')[0],
      creditLimit: cardItem.creditLimit ? cardItem.creditLimit.toString() : ''
    });
    setIsCatalogModalOpen(false);
    setIsCardModalOpen(true);
  };

  const handleOpenAddCardModal = () => {
    setEditingCardId(null);
    setCardModalError('');
    setSelectedDropdownBank('');
    setSelectedDropdownCardId('');
    setCardFormData({
      cardName: '',
      bank: '',
      cardLast4: '',
      network: 'Visa',
      isLtf: false,
      annualFee: '',
      feeWaiverSpend: '',
      milestoneSpend: '',
      milestoneReward: '',
      baseRewardRate: '1.0',
      baseRewardCap: '',
      acceleratedRewardCap: '',
      cappingCycle: 'STATEMENT_CYCLE',
      catalogCardId: '',
      merchantRewardRates: {},
      billingCycleDay: '15',
      paymentDueDays: '20',
      annualSpendStartDate: new Date().toISOString().split('T')[0],
      creditLimit: ''
    });
    setIsCardModalOpen(true);
  };

  const handleOpenEditCardModal = (cardSummary) => {
    const c = cardSummary.card;
    setEditingCardId(c.id);
    setCardModalError('');

    // Preselect dropdown bank and card if found in catalog
    const matchingBank = CARDS_CATALOG.find(b => b.bank.toLowerCase() === (c.bank || '').toLowerCase());
    const matchingCard = matchingBank?.cards?.find(card =>
      (c.catalogCardId && card.id === c.catalogCardId) ||
      (card.cardName.toLowerCase() === (c.cardName || '').toLowerCase())
    );

    if (matchingBank && matchingCard) {
      setSelectedDropdownBank(matchingBank.bank);
      setSelectedDropdownCardId(matchingCard.id);
    } else if (matchingBank) {
      setSelectedDropdownBank(matchingBank.bank);
      setSelectedDropdownCardId('CUSTOM');
    } else {
      setSelectedDropdownBank('CUSTOM');
      setSelectedDropdownCardId('CUSTOM');
    }

    let parsedRates = {};
    if (c.merchantRewardRates) {
      try {
        parsedRates = typeof c.merchantRewardRates === 'string' ? JSON.parse(c.merchantRewardRates) : c.merchantRewardRates;
      } catch (e) {}
    }

    setCardFormData({
      cardName: c.cardName || '',
      bank: c.bank || '',
      cardLast4: c.cardLast4 || '',
      network: c.network || 'Visa',
      isLtf: !!c.isLtf,
      annualFee: c.annualFee != null ? c.annualFee.toString() : '',
      feeWaiverSpend: c.feeWaiverSpend != null ? c.feeWaiverSpend.toString() : '',
      milestoneSpend: c.milestoneSpend != null ? c.milestoneSpend.toString() : '',
      milestoneReward: c.milestoneReward || '',
      baseRewardRate: c.baseRewardRate != null ? c.baseRewardRate.toString() : '1.0',
      baseRewardCap: c.baseRewardCap != null ? c.baseRewardCap.toString() : '',
      acceleratedRewardCap: c.acceleratedRewardCap != null ? c.acceleratedRewardCap.toString() : '',
      cappingCycle: c.cappingCycle || 'STATEMENT_CYCLE',
      catalogCardId: c.catalogCardId || '',
      merchantRewardRates: parsedRates,
      billingCycleDay: c.billingCycleDay != null ? c.billingCycleDay.toString() : '15',
      paymentDueDays: c.paymentDueDays != null ? c.paymentDueDays.toString() : '20',
      annualSpendStartDate: c.annualSpendStartDate || new Date().toISOString().split('T')[0],
      creditLimit: c.creditLimit != null ? c.creditLimit.toString() : ''
    });
    setIsCardModalOpen(true);
  };

  const handleAddCustomRate = () => {
    if (!customMerchantName.trim() || isNaN(customMerchantRate) || Number(customMerchantRate) < 0) return;
    setCardFormData(prev => ({
      ...prev,
      merchantRewardRates: {
        ...prev.merchantRewardRates,
        [customMerchantName.trim()]: parseFloat(customMerchantRate)
      }
    }));
    setCustomMerchantName('');
    setCustomMerchantRate('');
  };

  const handleRemoveMerchantRate = (name) => {
    setCardFormData(prev => {
      const copy = { ...prev.merchantRewardRates };
      delete copy[name];
      return { ...prev, merchantRewardRates: copy };
    });
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();

    let finalBank = cardFormData.bank.trim();
    if (!finalBank && selectedDropdownBank && selectedDropdownBank !== 'CUSTOM') {
      finalBank = selectedDropdownBank;
    }
    if (!finalBank) {
      setCardModalError('Please select or enter a bank / issuer.');
      return;
    }

    let finalCardName = cardFormData.cardName.trim();
    if (!finalCardName) {
      setCardModalError('Please select or enter a card name.');
      return;
    }

    setSubmittingCard(true);
    setCardModalError('');

    const payload = {
      username,
      cardName: finalCardName,
      bank: finalBank,
      cardLast4: cardFormData.cardLast4.trim(),
      network: cardFormData.network,
      isLtf: cardFormData.isLtf,
      annualFee: cardFormData.isLtf ? 0.0 : (parseFloat(cardFormData.annualFee) || 0.0),
      feeWaiverSpend: cardFormData.isLtf ? 0.0 : (parseFloat(cardFormData.feeWaiverSpend) || 0.0),
      milestoneSpend: cardFormData.milestoneSpend ? parseFloat(cardFormData.milestoneSpend) : null,
      milestoneReward: cardFormData.milestoneReward.trim() || null,
      baseRewardRate: parseFloat(cardFormData.baseRewardRate) || 1.0,
      baseRewardCap: cardFormData.baseRewardCap ? parseFloat(cardFormData.baseRewardCap) : null,
      acceleratedRewardCap: cardFormData.acceleratedRewardCap ? parseFloat(cardFormData.acceleratedRewardCap) : null,
      cappingCycle: cardFormData.cappingCycle || 'STATEMENT_CYCLE',
      catalogCardId: cardFormData.catalogCardId || null,
      merchantRewardRates: JSON.stringify(cardFormData.merchantRewardRates || {}),
      billingCycleDay: parseInt(cardFormData.billingCycleDay) || 15,
      paymentDueDays: parseInt(cardFormData.paymentDueDays) || 20,
      annualSpendStartDate: cardFormData.annualSpendStartDate,
      creditLimit: cardFormData.creditLimit ? parseFloat(cardFormData.creditLimit) : null,
      currency: homeCurrency || 'INR'
    };

    try {
      const url = editingCardId
        ? API_ENDPOINTS.CREDIT_CARD_BY_ID(editingCardId)
        : API_ENDPOINTS.CREDIT_CARD_CARDS;
      const method = editingCardId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsCardModalOpen(false);
        loadData();
        setSuccessMsg(editingCardId ? 'Credit card updated successfully!' : 'Credit card added successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const msg = await res.text();
        setCardModalError(msg || 'Failed to save card.');
      }
    } catch (err) {
      setCardModalError('Error: ' + err.message);
    } finally {
      setSubmittingCard(false);
    }
  };

  const handleDeleteCard = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}? All recorded card spends will also be deleted.`)) return;

    try {
      const res = await authFetch(API_ENDPOINTS.CREDIT_CARD_BY_ID(id), {
        method: 'DELETE'
      });
      if (res.ok) {
        loadData();
        setSuccessMsg(`Card "${name}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError('Failed to delete card.');
      }
    } catch (err) {
      setError('Error deleting card: ' + err.message);
    }
  };

  const handleOpenAddSpendModal = (targetCardId = null) => {
    setSpendModalError('');
    setSpendFormData({
      cardId: targetCardId || (cards[0]?.card?.id || ''),
      amount: '',
      merchant: 'Amazon',
      category: 'Shopping',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsSpendModalOpen(true);
  };

  const handleAddSpend = async (e) => {
    e.preventDefault();
    if (!spendFormData.cardId) {
      setSpendModalError('Please select a credit card.');
      return;
    }
    if (!spendFormData.amount || isNaN(spendFormData.amount) || Number(spendFormData.amount) <= 0) {
      setSpendModalError('Please enter a valid spend amount.');
      return;
    }

    setSubmittingSpend(true);
    setSpendModalError('');

    try {
      const res = await authFetch(API_ENDPOINTS.CREDIT_CARD_SPENDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: spendFormData.cardId,
          amount: parseFloat(spendFormData.amount),
          merchant: spendFormData.merchant.trim(),
          category: spendFormData.category.trim(),
          date: spendFormData.date,
          description: spendFormData.description.trim()
        })
      });

      if (res.ok) {
        const createdSpend = await res.json();
        setIsSpendModalOpen(false);
        loadData();
        const capNotice = createdSpend.wasCapped ? ' ⚠️ (capped due to monthly ceiling)' : '';
        setSuccessMsg(
          `Spend recorded! Earned ${createdSpend.rewardRateApplied.toFixed(1)}% rewards (+${formatCurrency(createdSpend.rewardsEarned, createdSpend.currency || homeCurrency)})${capNotice}`
        );
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const msg = await res.text();
        setSpendModalError(msg || 'Failed to record spend.');
      }
    } catch (err) {
      setSpendModalError('Error: ' + err.message);
    } finally {
      setSubmittingSpend(false);
    }
  };

  const handleDeleteSpend = async (spendId) => {
    if (!confirm('Are you sure you want to delete this spend entry?')) return;
    try {
      const res = await authFetch(API_ENDPOINTS.CREDIT_CARD_SPEND_BY_ID(spendId), {
        method: 'DELETE'
      });
      if (res.ok) {
        loadData();
      } else {
        setError('Failed to delete spend entry.');
      }
    } catch (err) {
      setError('Error deleting spend: ' + err.message);
    }
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CardIcon className="text-blue-600" size={28} />
            Credit Cards & Rewards Optimizer
          </h2>
          <p className="text-gray-500 text-sm">
            Track annual fee waivers, reward caps per cycle, and optimize card choices for every spend
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCatalogModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-semibold transition-colors text-sm border border-indigo-200 shadow-2xs"
          >
            <BookOpen size={17} />
            <span>Bank Cards Catalog</span>
          </button>

          <button
            onClick={() => handleOpenAddSpendModal()}
            disabled={cards.length === 0}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
          >
            <Plus size={18} />
            <span>Record CC Spend</span>
          </button>

          <button
            onClick={handleOpenAddCardModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
          >
            <Plus size={18} />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in">
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

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Credit Cards</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {summary?.totalCards || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary?.ltfCards || 0} LTF &bull; {summary?.feeCards || 0} Fee-paying
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CardIcon size={26} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Fee Waiver Status</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {(summary?.ltfCards || 0) + (summary?.feeWaivedCards || 0)} / {summary?.totalCards || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cards free from annual fee
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={26} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Annual CC Spends</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              {formatCurrency(summary?.totalAnnualSpends || 0, homeCurrency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              In current anniversary year
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp size={26} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Rewards Earned</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              +{formatCurrency(summary?.totalRewardsEarned || 0, homeCurrency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All-time cashback & perks
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={26} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SMART SPEND ADVISOR ("WHICH CARD SHOULD I USE?") */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={16} className="text-amber-300" />
            <span>Smart Card Advisor &bull; Cap & Waiver Aware</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Which card should you swipe?
          </h3>
          <p className="text-blue-100 text-sm mt-1 mb-6">
            Enter your planned purchase. We dynamically calculate reward caps per cycle (e.g. Millennia's ₹1,000/mo cap vs Amazon ICICI's unlimited 5%), existing headroom, and fee waiver proximity!
          </p>

          {/* Quick Input Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
            <div className="sm:col-span-4">
              <label className="block text-[11px] text-blue-200 font-bold uppercase mb-1">Spend Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  value={advisorAmount}
                  onChange={(e) => setAdvisorAmount(e.target.value)}
                  placeholder="e.g. 30000"
                  className="w-full pl-8 pr-3 py-2 bg-white text-gray-900 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-[11px] text-blue-200 font-bold uppercase mb-1">Merchant / Platform</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={advisorMerchant}
                  onChange={(e) => setAdvisorMerchant(e.target.value)}
                  placeholder="e.g. Amazon, Flipkart, Swiggy, Air India..."
                  className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Preset Merchant Quick Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs text-blue-200 self-center mr-1">Popular:</span>
            {COMMON_MERCHANTS.slice(0, 8).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setAdvisorMerchant(m)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                  advisorMerchant.toLowerCase() === m.toLowerCase()
                    ? 'bg-amber-400 text-gray-900 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Advisor Result Output */}
          {cards.length === 0 ? (
            <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/20 text-blue-100 text-sm">
              Please add at least one credit card below to receive personalized card swipe suggestions.
            </div>
          ) : recommendation ? (
            <div className="mt-6 p-5 bg-white text-gray-900 rounded-2xl shadow-lg border border-white/30 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-600" /> Best Choice
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">{recommendation.recommendedCardBank}</span>
                  </div>
                  <h4 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
                    {recommendation.recommendedCardName}
                    {recommendation.recommendedCardLast4 && (
                      <span className="text-sm font-normal text-gray-500">(&bull;&bull;&bull;&bull; {recommendation.recommendedCardLast4})</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    {recommendation.reason}
                  </p>
                </div>

                <div className="text-left md:text-right bg-blue-50/80 p-3.5 rounded-xl border border-blue-100 flex-shrink-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">You Earn</p>
                  <p className="text-2xl font-black text-emerald-600">
                    +{formatCurrency(recommendation.rewardAmount, homeCurrency)}
                  </p>
                  <p className="text-xs font-bold text-indigo-700">
                    {recommendation.rewardRate.toFixed(1)}% effective rate
                  </p>
                </div>
              </div>

              {/* Comparison table of all user cards with capping highlights */}
              {recommendation.allEvaluations && recommendation.allEvaluations.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Card Comparison for this spend:</p>
                  <div className="space-y-2">
                    {recommendation.allEvaluations.map(ev => (
                      <div
                        key={ev.cardId}
                        className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                          ev.isRecommended ? 'bg-amber-50/80 border border-amber-300' : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 text-sm">{ev.cardName}</span>
                            {ev.isCapped && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800">
                                <AlertTriangle size={11} /> Capped (Max {formatCurrency(ev.rewardAmount, homeCurrency)})
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500">{ev.benefitNote}</p>
                          {ev.cappingRuleSummary && (
                            <p className="text-[11px] text-gray-400">{ev.cappingRuleSummary}</p>
                          )}
                        </div>

                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="font-extrabold text-sm text-emerald-700">
                            +{formatCurrency(ev.rewardAmount, homeCurrency)}
                          </p>
                          <p className="text-gray-400 text-[11px]">
                            {ev.isCapped ? `Uncapped: ${formatCurrency(ev.uncappedReward, homeCurrency)}` : `${ev.rewardRate.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISUAL CREDIT CARDS DECK */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Your Credit Cards</h3>
            <p className="text-gray-500 text-xs">Annual spend progress, cycle reward caps, and statement dates</p>
          </div>
          <span className="text-xs text-gray-500 font-medium">{cards.length} card(s) active</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading credit cards...</div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <CardIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <h4 className="text-base font-bold text-gray-800">No credit cards added yet</h4>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-1 mb-5">
              Add your cards or pick from our catalog of popular Indian credit cards to track reward caps, fee waivers, and never miss statement cycles.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsCatalogModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-indigo-200 shadow-2xs"
              >
                <BookOpen size={16} />
                <span>Browse Bank Cards</span>
              </button>
              <button
                onClick={handleOpenAddCardModal}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus size={16} />
                <span>Add Custom Card</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(item => {
              const c = item.card;
              const isLtf = Boolean(c.isLtf);
              const isWaived = item.feeWaiverAchieved;
              const cycleLabel = c.cappingCycle === 'CALENDAR_MONTH' ? 'Calendar Month' : 'Statement Cycle';

              let merchantRates = {};
              if (c.merchantRewardRates) {
                try {
                  merchantRates = typeof c.merchantRewardRates === 'string' ? JSON.parse(c.merchantRewardRates) : c.merchantRewardRates;
                } catch (e) {}
              }

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all"
                >
                  {/* Card Visual Top Banner */}
                  <div className={`p-6 text-white relative overflow-hidden ${
                    c.network === 'Amex'
                      ? 'bg-gradient-to-br from-cyan-900 via-sky-800 to-blue-900'
                      : c.network === 'Mastercard'
                      ? 'bg-gradient-to-br from-orange-900 via-amber-900 to-stone-900'
                      : isLtf
                      ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900'
                      : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950'
                  }`}>
                    {/* Background Decorative Rings */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute -right-2 -bottom-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-white/70">{c.bank || 'Credit Card'}</p>
                        <h4 className="text-lg font-black tracking-tight mt-0.5">{c.cardName}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isLtf
                          ? 'bg-emerald-400 text-emerald-950'
                          : isWaived
                          ? 'bg-blue-400 text-blue-950'
                          : 'bg-white/20 text-white'
                      }`}>
                        {isLtf ? 'LTF (Lifetime Free)' : isWaived ? 'Fee Waived' : `${c.currency || '₹'} ${c.annualFee}/yr`}
                      </span>
                    </div>

                    {/* Chip and Masked Digits */}
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="w-9 h-7 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                          <div className="w-5 h-4 border border-amber-600/40 rounded-sm" />
                        </div>
                        <p className="font-mono text-sm tracking-widest text-white/90">
                          &bull;&bull;&bull;&bull; {c.cardLast4 || 'XXXX'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase text-white/60 font-semibold">Network</p>
                        <p className="font-extrabold text-sm tracking-wider">{c.network || 'Visa'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Details & Capping / Waiver Tracker */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Cycle & Capping Reset Banner */}
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Capping Reset Cycle</p>
                        <p className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                          <Calendar size={13} className="text-indigo-600" />
                          {cycleLabel}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Resets in {item.daysUntilCycleReset}d
                      </span>
                    </div>

                    {/* Accelerated Cap Meter (if card has an accelerated cap like Millennia) */}
                    {item.acceleratedRewardCap != null ? (
                      <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-amber-900">5% Accelerated Cap:</span>
                          <span className="font-bold text-gray-800">
                            {formatCurrency(item.acceleratedRewardsEarnedInCycle, c.currency || homeCurrency)} / {formatCurrency(item.acceleratedRewardCap, c.currency || homeCurrency)}
                          </span>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (item.acceleratedRewardsEarnedInCycle / item.acceleratedRewardCap) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium text-right">
                          {item.acceleratedRewardRemainingInCycle <= 0 ? (
                            <span className="text-red-600 font-bold">Capped out this cycle!</span>
                          ) : (
                            <span>{formatCurrency(item.acceleratedRewardRemainingInCycle, c.currency || homeCurrency)} headroom remaining</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-blue-50/60 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-1.5">
                        <Sparkles size={14} className="text-blue-600" />
                        <span>Accelerated Rewards: <strong>Unlimited (No Capping)</strong></span>
                      </div>
                    )}

                    {/* Annual Fee Waiver Tracker */}
                    {!isLtf && c.feeWaiverSpend > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-medium">Fee Waiver Spend:</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(item.currentAnnualSpend, c.currency || homeCurrency)} / {formatCurrency(c.feeWaiverSpend, c.currency || homeCurrency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isWaived ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, item.feeWaiverProgressPct)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-right font-medium">
                          {isWaived ? (
                            <span className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 size={12} /> Fee waiver achieved!
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              Spend <strong className="text-indigo-700">{formatCurrency(item.spendRemainingForFeeWaiver, c.currency || homeCurrency)}</strong> more to waive fee
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Reward Highlights */}
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reward Rates</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {c.baseRewardRate}% Base
                        </span>
                        {Object.entries(merchantRates).slice(0, 4).map(([m, r]) => (
                          <span key={m} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {m}: <strong>{r}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Billing Cycle Info */}
                    <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Statement Date</p>
                        <p className="font-semibold text-gray-800">{item.nextStatementDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Payment Due</p>
                        <p className="font-bold text-red-600">
                          {item.nextDueDate} <span className="text-[10px] text-gray-400 font-normal">({item.daysUntilDue}d)</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenAddSpendModal(c.id)}
                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors text-center"
                      >
                        + Spend
                      </button>
                      <button
                        onClick={() => handleOpenEditCardModal(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-colors"
                        title="Edit card details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c.id, c.cardName)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete card"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SPENDS HISTORY & REWARDS LEDGER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Credit Card Spends & Rewards Ledger</h3>
            <p className="text-gray-400 text-xs">Recent purchases and rewards accrued</p>
          </div>
          <span className="text-xs text-gray-500 font-medium">{spends.length} transaction(s)</span>
        </div>

        {spends.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No credit card spends recorded yet. Click "Record CC Spend" to log your first purchase!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Card</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Merchant & Category</th>
                  <th className="px-6 py-3.5 text-right">Spend Amount</th>
                  <th className="px-6 py-3.5 text-right">Reward Rate</th>
                  <th className="px-6 py-3.5 text-right">Rewards Earned</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spends.map((sp) => {
                  const parentCard = cards.find(c => c.card.id === sp.cardId);
                  return (
                    <tr key={sp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {parentCard?.card?.cardName || 'Card'}
                        {parentCard?.card?.cardLast4 && (
                          <span className="text-xs text-gray-400 font-normal ml-1">(&bull;&bull;&bull;&bull; {parentCard.card.cardLast4})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{sp.date}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{sp.merchant || 'General'}</p>
                        <p className="text-xs text-gray-400">{sp.description || sp.category}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-gray-900 whitespace-nowrap">
                        {formatCurrency(sp.amount, sp.currency || homeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                          {sp.rewardRateApplied.toFixed(1)}%
                        </span>
                        {sp.wasCapped && (
                          <span className="ml-1.5 text-[10px] text-red-600 font-bold" title="Capped by cycle limit">
                            (Capped)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        +{formatCurrency(sp.rewardsEarned, sp.currency || homeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteSpend(sp.id)}
                          className="p-1 text-gray-300 hover:text-red-600 rounded transition-colors"
                          title="Delete spend entry"
                        >
                          <Trash2 size={15} />
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

      {/* ========================================================================= */}
      {/* BANK CARDS CATALOG BROWSER MODAL */}
      {/* ========================================================================= */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={22} />
                  Bank Credit Cards & Cashback Criteria Catalog
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Official reward structures, accelerated capping limits, and cycle rules for major Indian credit cards
                </p>
              </div>
              <button onClick={() => setIsCatalogModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Bank Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4 pb-2 border-b border-gray-100">
              {CARDS_CATALOG.map(b => (
                <button
                  key={b.bank}
                  onClick={() => setSelectedCatalogBank(b.bank)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCatalogBank === b.bank
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {b.bank} ({b.cards.length})
                </button>
              ))}
            </div>

            {/* Cards Grid for Selected Bank */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {CARDS_CATALOG.find(b => b.bank === selectedCatalogBank)?.cards.map(c => (
                <div
                  key={c.id}
                  className="p-4 bg-gray-50 hover:bg-indigo-50/40 rounded-2xl border border-gray-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-gray-900 text-base">{c.cardName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {c.network}
                      </span>
                      {c.isLtf ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Lifetime Free
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          ₹{c.annualFee}/yr (Waiver at ₹{c.feeWaiverSpend.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium">{c.description}</p>

                    {/* Capping & Reset Specs */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                        {c.acceleratedRewardCap ? `5% Cap: ₹${c.acceleratedRewardCap.toLocaleString('en-IN')}` : 'Accelerated: Unlimited'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold">
                        Cycle: {c.cappingCycle === 'CALENDAR_MONTH' ? 'Calendar Month' : 'Statement Date'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCatalogCard(c, selectedCatalogBank)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
                  >
                    + Add This Card
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT CREDIT CARD MODAL */}
      {/* ========================================================================= */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CardIcon size={22} className="text-blue-600" />
                {editingCardId ? 'Edit Credit Card' : 'Add Credit Card'}
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {cardModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{cardModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCard} className="space-y-4">
              {/* Bank and Card Dropdowns (Primary selection) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Bank / Issuer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDropdownBank}
                    onChange={(e) => handleDropdownBankChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="">-- Choose Bank / Issuer --</option>
                    {CARDS_CATALOG.map((b) => (
                      <option key={b.bank} value={b.bank}>
                        {b.bank} ({b.cards?.length || 0} cards)
                      </option>
                    ))}
                    <option value="CUSTOM">Other / Custom Issuer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Card Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDropdownCardId}
                    onChange={(e) => handleDropdownCardChange(e.target.value)}
                    disabled={!selectedDropdownBank}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {!selectedDropdownBank
                        ? '-- Choose Bank First --'
                        : selectedDropdownBank === 'CUSTOM'
                        ? '-- Enter Custom Card Below --'
                        : '-- Choose Card --'}
                    </option>
                    {selectedDropdownBank && selectedDropdownBank !== 'CUSTOM' && (
                      CARDS_CATALOG.find((b) => b.bank === selectedDropdownBank)?.cards?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cardName} ({c.isLtf ? 'LTF' : `₹${c.annualFee}/yr`})
                        </option>
                      ))
                    )}
                    <option value="CUSTOM">Other / Custom Card</option>
                  </select>
                </div>
              </div>

              {/* Conditional inputs for custom bank or card names */}
              {(selectedDropdownBank === 'CUSTOM' || selectedDropdownCardId === 'CUSTOM') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl animate-in fade-in">
                  {selectedDropdownBank === 'CUSTOM' && (
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Custom Issuer / Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Standard Chartered"
                        value={cardFormData.bank}
                        onChange={(e) => setCardFormData({ ...cardFormData, bank: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  )}
                  {selectedDropdownCardId === 'CUSTOM' && (
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                        Custom Card Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. My Premium Card"
                        value={cardFormData.cardName}
                        onChange={(e) => setCardFormData({ ...cardFormData, cardName: e.target.value })}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedDropdownCardId && selectedDropdownCardId !== 'CUSTOM' && (
                <div className="text-xs text-blue-800 bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
                  <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {CARDS_CATALOG.find((b) => b.bank === selectedDropdownBank)?.cards?.find((c) => c.id === selectedDropdownCardId)?.description ||
                      'Standard card terms, reward caps, fee waivers, and merchant rates have been loaded below. You can customize them if needed.'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4321"
                    value={cardFormData.cardLast4}
                    onChange={(e) => setCardFormData({ ...cardFormData, cardLast4: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Network</label>
                  <select
                    value={cardFormData.network}
                    onChange={(e) => setCardFormData({ ...cardFormData, network: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="RuPay">RuPay</option>
                    <option value="Amex">American Express</option>
                    <option value="Diners">Diners Club</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Credit Limit ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 200000"
                    value={cardFormData.creditLimit}
                    onChange={(e) => setCardFormData({ ...cardFormData, creditLimit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fee & Waiver Section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">Fee Structure</span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFormData.isLtf}
                      onChange={(e) => setCardFormData({ ...cardFormData, isLtf: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-700">Lifetime Free (LTF)</span>
                  </label>
                </div>

                {!cardFormData.isLtf && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Annual Fee ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 999"
                        value={cardFormData.annualFee}
                        onChange={(e) => setCardFormData({ ...cardFormData, annualFee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Min Spends for Fee Waiver ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 100000"
                        value={cardFormData.feeWaiverSpend}
                        onChange={(e) => setCardFormData({ ...cardFormData, feeWaiverSpend: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reward Capping & Cycle Rules */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <span className="text-sm font-bold text-amber-900">Reward Capping & Cycle Rules</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      5% Accel Cap ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000 (blank = unltd)"
                      value={cardFormData.acceleratedRewardCap}
                      onChange={(e) => setCardFormData({ ...cardFormData, acceleratedRewardCap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      1% Base Cap ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000 (blank = unltd)"
                      value={cardFormData.baseRewardCap}
                      onChange={(e) => setCardFormData({ ...cardFormData, baseRewardCap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Capping Reset Cycle
                    </label>
                    <select
                      value={cardFormData.cappingCycle}
                      onChange={(e) => setCardFormData({ ...cardFormData, cappingCycle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="STATEMENT_CYCLE">Statement Cycle</option>
                      <option value="CALENDAR_MONTH">Calendar Month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reward Rates Section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">Merchant Reward Rates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Base Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      value={cardFormData.baseRewardRate}
                      onChange={(e) => setCardFormData({ ...cardFormData, baseRewardRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Merchant Specific Rates (e.g. Amazon: 5%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Merchant (e.g. Amazon)"
                        value={customMerchantName}
                        onChange={(e) => setCustomMerchantName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Rate %"
                        value={customMerchantRate}
                        onChange={(e) => setCustomMerchantRate(e.target.value)}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomRate}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display active merchant rates tags */}
                {Object.keys(cardFormData.merchantRewardRates || {}).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {Object.entries(cardFormData.merchantRewardRates).map(([m, r]) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 font-medium"
                      >
                        <strong>{m}</strong>: {r}%
                        <button
                          type="button"
                          onClick={() => handleRemoveMerchantRate(m)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing Cycle Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Statement Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={cardFormData.billingCycleDay}
                    onChange={(e) => setCardFormData({ ...cardFormData, billingCycleDay: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Due in (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="20"
                    value={cardFormData.paymentDueDays}
                    onChange={(e) => setCardFormData({ ...cardFormData, paymentDueDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Annual Start Date</label>
                  <input
                    type="date"
                    value={cardFormData.annualSpendStartDate}
                    onChange={(e) => setCardFormData({ ...cardFormData, annualSpendStartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCard}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingCard ? 'Saving...' : editingCardId ? 'Save Changes' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CC SPEND MODAL */}
      {/* ========================================================================= */}
      {isSpendModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-emerald-600" />
                Record Credit Card Spend
              </h3>
              <button onClick={() => setIsSpendModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {spendModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{spendModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSpend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Select Credit Card <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={spendFormData.cardId}
                  onChange={(e) => setSpendFormData({ ...spendFormData, cardId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cards.map(c => (
                    <option key={c.card.id} value={c.card.id}>
                      {c.card.cardName} ({c.card.bank}) &bull;&bull;&bull;&bull; {c.card.cardLast4}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Spend Amount ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2499"
                  value={spendFormData.amount}
                  onChange={(e) => setSpendFormData({ ...spendFormData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Merchant / Platform</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon, Swiggy, Uber"
                  value={spendFormData.merchant}
                  onChange={(e) => setSpendFormData({ ...spendFormData, merchant: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Uber', 'Groceries'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSpendFormData({ ...spendFormData, merchant: m })}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={spendFormData.category}
                    onChange={(e) => setSpendFormData({ ...spendFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Dining">Dining</option>
                    <option value="Travel">Travel</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={spendFormData.date}
                    onChange={(e) => setSpendFormData({ ...spendFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday dinner, Electronics order"
                  value={spendFormData.description}
                  onChange={(e) => setSpendFormData({ ...spendFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSpendModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSpend}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingSpend ? 'Recording...' : 'Record Spend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardContent;
