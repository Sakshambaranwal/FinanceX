import React, { useState, useEffect, useContext } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Pencil,
  Trash2, 
  DollarSign, 
  Calendar, 
  X, 
  AlertCircle, 
  Briefcase, 
  Layers, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  PieChart,
  Tag
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { 
  getLiveMarketPrice, 
  POPULAR_ASSETS, 
  findAssetQuote 
} from '../utils/marketPriceService';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const INVESTMENT_CATEGORIES = [
  'Stocks',
  'Commodities',
  'Cryptocurrency',
  'Mutual Funds',
  'Exchange Traded Funds (ETFs)',
  'Fixed Deposits',
  'Recurring Deposits',
  'Bonds',
  'Real Estate',
  'Other'
];

const RISK_LEVELS = ['Low', 'Medium', 'High'];

const InvestmentsContent = () => {
  const { username, formatCurrency, convertAmount, toStorageAmount, homeCurrency, currency, currencySymbol } = useContext(AppContext);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal state (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLiveQuote, setFetchingLiveQuote] = useState(false);
  const [modalError, setModalError] = useState('');
  const [benchmarkInfo, setBenchmarkInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    investmentName: '',
    category: 'Stocks',
    purchasePrice: '', // Buy price per unit
    quantity: '1',     // Number of units/shares
    currentPrice: '',  // Current live market price per unit
    principalAmount: '', // Total invested = purchasePrice * quantity
    currentAmount: '',   // Total current value = currentPrice * quantity
    riskLevel: 'Medium',
    investmentDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Fixed Deposit (FD) dedicated state
  const [fdData, setFdData] = useState({
    depositAmount: '',
    roi: '7.10',
    startedDate: new Date().toISOString().split('T')[0],
    duration: '1',
    durationUnit: 'Years', // 'Years' | 'Months' | 'Days'
    compoundingFrequency: 'Quarterly', // 'Quarterly' | 'Monthly' | 'Half-Yearly' | 'Annually' | 'Simple'
    bankName: 'SBI Fixed Deposit'
  });

  // Recurring Deposit (RD) dedicated state
  const [rdData, setRdData] = useState({
    installmentAmount: '',
    roi: '7.00',
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'Monthly', // 'Monthly' (default) | 'Quarterly' | 'Half-Yearly'
    duration: '12',
    durationUnit: 'Months', // 'Months' | 'Years'
    compoundingFrequency: 'Quarterly', // 'Quarterly' (default standard bank compounding) | 'Monthly' | 'Half-Yearly' | 'Annually' | 'Simple'
    bankName: 'SBI Recurring Deposit'
  });

  // Automatically calculate FD maturity date, maturity fund, and true accrued value today
  const calculateFdMaturity = (depositAmt, roiPct, durationVal, durationUnit, compoundingFreq, startDateStr) => {
    const P = parseFloat(depositAmt) || 0;
    const r = (parseFloat(roiPct) || 0) / 100;
    const dur = parseFloat(durationVal) || 0;

    if (P <= 0 || r <= 0 || dur <= 0) {
      return {
        principal: P,
        maturityFund: P,
        interestEarned: 0,
        maturityDate: startDateStr || new Date().toISOString().split('T')[0],
        effectiveYield: 0,
        currentAccrued: P,
        currentInterest: 0
      };
    }

    let t = dur;
    if (durationUnit === 'Months') t = dur / 12;
    else if (durationUnit === 'Days') t = dur / 365;

    const start = new Date(startDateStr || new Date());
    const maturity = new Date(start);
    if (durationUnit === 'Years') {
      maturity.setFullYear(maturity.getFullYear() + Math.floor(dur));
      const remMonths = Math.round((dur % 1) * 12);
      if (remMonths > 0) maturity.setMonth(maturity.getMonth() + remMonths);
    } else if (durationUnit === 'Months') {
      maturity.setMonth(maturity.getMonth() + Math.round(dur));
    } else if (durationUnit === 'Days') {
      maturity.setDate(maturity.getDate() + Math.round(dur));
    }
    const maturityDateStr = maturity.toISOString().split('T')[0];

    let maturityFund = 0;
    let n = 4; // Quarterly default
    if (compoundingFreq === 'Simple') {
      maturityFund = P + (P * r * t);
    } else {
      if (compoundingFreq === 'Monthly') n = 12;
      else if (compoundingFreq === 'Half-Yearly') n = 2;
      else if (compoundingFreq === 'Annually') n = 1;
      
      maturityFund = P * Math.pow(1 + (r / n), n * t);
    }

    const interestEarned = maturityFund - P;
    const effectiveYield = P > 0 ? ((interestEarned / P) * 100) : 0;

    // Current accrued value as of today
    const today = new Date();
    const totalMs = maturity.getTime() - start.getTime();
    const elapsedMs = Math.max(0, Math.min(today.getTime() - start.getTime(), totalMs));
    let currentAccrued = P;
    if (today >= maturity) {
      currentAccrued = maturityFund;
    } else if (totalMs > 0 && interestEarned > 0) {
      if (compoundingFreq === 'Simple') {
        const tElapsed = Math.min(t, elapsedMs / (365 * 24 * 3600 * 1000));
        currentAccrued = P + (P * r * tElapsed);
      } else {
        const tElapsed = Math.min(t, (elapsedMs / totalMs) * t);
        currentAccrued = P * Math.pow(1 + (r / n), n * tElapsed);
      }
    }
    const currentInterest = currentAccrued - P;

    return {
      principal: P,
      maturityFund: Number(maturityFund.toFixed(2)),
      interestEarned: Number(interestEarned.toFixed(2)),
      effectiveYield: Number(effectiveYield.toFixed(2)),
      maturityDate: maturityDateStr,
      currentAccrued: Number(currentAccrued.toFixed(2)),
      currentInterest: Number(currentInterest.toFixed(2))
    };
  };

  // Automatically calculate RD maturity fund, installments, and maturity date
  const calculateRdMaturity = (installmentAmt, roiPct, durationVal, durationUnit, depositFreq, compoundingFreq, startDateStr) => {
    const P = parseFloat(installmentAmt) || 0;
    const r = (parseFloat(roiPct) || 0) / 100;
    const dur = parseFloat(durationVal) || 0;

    if (P <= 0 || r <= 0 || dur <= 0) {
      return {
        installmentAmount: P,
        totalInstallments: 0,
        totalInvested: 0,
        maturityFund: 0,
        interestEarned: 0,
        effectiveYield: 0,
        maturityDate: startDateStr || new Date().toISOString().split('T')[0],
        currentAccrued: P,
        currentInterest: 0
      };
    }

    let totalMonths = dur;
    if (durationUnit === 'Years') totalMonths = dur * 12;

    const start = new Date(startDateStr || new Date());
    const maturity = new Date(start);
    maturity.setMonth(maturity.getMonth() + Math.round(totalMonths));
    const maturityDateStr = maturity.toISOString().split('T')[0];

    let stepMonths = 1; // Monthly default
    if (depositFreq === 'Quarterly') stepMonths = 3;
    else if (depositFreq === 'Half-Yearly') stepMonths = 6;

    const totalInstallments = Math.max(1, Math.floor(totalMonths / stepMonths));
    const totalInvested = P * totalInstallments;

    let n = 4; // Quarterly compounding default for Indian banks
    if (compoundingFreq === 'Monthly') n = 12;
    else if (compoundingFreq === 'Half-Yearly') n = 2;
    else if (compoundingFreq === 'Annually') n = 1;

    let maturityFund = 0;
    if (compoundingFreq === 'Simple') {
      for (let k = 1; k <= totalInstallments; k++) {
        const remainingMonths = totalMonths - (k - 1) * stepMonths;
        const t = remainingMonths / 12;
        maturityFund += P + (P * r * t);
      }
    } else {
      for (let k = 1; k <= totalInstallments; k++) {
        const remainingMonths = totalMonths - (k - 1) * stepMonths;
        const t = remainingMonths / 12;
        maturityFund += P * Math.pow(1 + (r / n), n * t);
      }
    }

    const interestEarned = maturityFund - totalInvested;
    const effectiveYield = totalInvested > 0 ? ((interestEarned / totalInvested) * 100) : 0;

    // Calculate installments deposited so far based on months passed up to today
    const today = new Date();
    let installmentsPaidSoFar = 1;
    let currentAccrued = P;

    if (today >= maturity) {
      installmentsPaidSoFar = totalInstallments;
      currentAccrued = maturityFund;
    } else if (today < start) {
      installmentsPaidSoFar = 0;
      currentAccrued = 0;
    } else {
      let elapsedMonths = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
      if (today.getDate() < start.getDate()) {
        elapsedMonths--;
      }
      elapsedMonths = Math.max(0, elapsedMonths);
      installmentsPaidSoFar = Math.min(totalInstallments, Math.floor(elapsedMonths / stepMonths) + 1);

      let accruedSum = 0;
      for (let k = 1; k <= installmentsPaidSoFar; k++) {
        const depDate = new Date(start);
        depDate.setMonth(depDate.getMonth() + Math.round((k - 1) * stepMonths));
        const elapsedInstMs = Math.max(0, today.getTime() - depDate.getTime());
        const tElapsed = elapsedInstMs / (365.25 * 24 * 3600 * 1000);
        if (compoundingFreq === 'Simple') {
          accruedSum += P + (P * r * tElapsed);
        } else {
          accruedSum += P * Math.pow(1 + (r / n), n * tElapsed);
        }
      }
      currentAccrued = accruedSum;
    }

    const currentPaid = P * installmentsPaidSoFar;
    currentAccrued = Math.max(currentPaid, Math.min(currentAccrued, maturityFund));
    const currentInterest = currentAccrued - currentPaid;

    return {
      installmentAmount: P,
      totalInstallments,
      totalInvested: Number(totalInvested.toFixed(2)),
      maturityFund: Number(maturityFund.toFixed(2)),
      interestEarned: Number(interestEarned.toFixed(2)),
      effectiveYield: Number(effectiveYield.toFixed(2)),
      maturityDate: maturityDateStr,
      installmentsPaidSoFar,
      currentPaid: Number(currentPaid.toFixed(2)),
      currentAccrued: Number(currentAccrued.toFixed(2)),
      currentInterest: Number(currentInterest.toFixed(2))
    };
  };

  const fdMaturity = calculateFdMaturity(
    fdData.depositAmount,
    fdData.roi,
    fdData.duration,
    fdData.durationUnit,
    fdData.compoundingFrequency,
    fdData.startedDate
  );

  const rdMaturity = calculateRdMaturity(
    rdData.installmentAmount,
    rdData.roi,
    rdData.duration,
    rdData.durationUnit,
    rdData.frequency,
    rdData.compoundingFrequency,
    rdData.startDate
  );

  // Helper to extract deposit details (FD/RD), true accrued value today, and maturity value + date (Currency-Safe)
  // Helper to extract deposit details (FD/RD), true invested amount so far based on months passed, and accrued value today (Currency-Safe)
  const getDepositDetails = (inv) => {
    const categoryLower = (inv.category || '').toLowerCase();
    const isDeposit = categoryLower.includes('fixed deposit') ||
                      categoryLower.includes('recurring deposit') ||
                      categoryLower === 'fd' ||
                      categoryLower === 'rd';
    if (!isDeposit) return null;

    let maturityDate = inv.maturityDate;
    let maturityAmount = inv.maturityAmount ? Number(inv.maturityAmount) : null;
    let parsedRoi = null;
    let parsedDuration = null;
    let parsedDurationUnit = 'Years';
    let parsedCompounding = 'Quarterly';
    let parsedType = categoryLower.includes('recurring') || categoryLower === 'rd' ? 'RD' : 'FD';
    let parsedFrequency = 'Monthly';
    let parsedTags = null;

    // Parse from tags if set
    if (inv.tags) {
      try {
        parsedTags = typeof inv.tags === 'string' ? JSON.parse(inv.tags) : inv.tags;
        if (parsedTags.maturityDate) maturityDate = parsedTags.maturityDate;
        if (parsedTags.maturityAmount) maturityAmount = Number(parsedTags.maturityAmount);
        if (parsedTags.roi) parsedRoi = parsedTags.roi;
        if (parsedTags.type) parsedType = parsedTags.type;
        if (parsedTags.duration) parsedDuration = parsedTags.duration;
        if (parsedTags.durationUnit) parsedDurationUnit = parsedTags.durationUnit;
        if (parsedTags.compoundingFrequency) parsedCompounding = parsedTags.compoundingFrequency;
        if (parsedTags.frequency) parsedFrequency = parsedTags.frequency;
      } catch (e) {
        // ignore
      }
    }

    // Parse from description if fields missing
    if (inv.description) {
      if (!maturityDate) {
        const matDateMatch = inv.description.match(/Maturity Date:\s*([0-9-]+)/i);
        if (matDateMatch && matDateMatch[1]) maturityDate = matDateMatch[1];
      }
      if (!parsedRoi) {
        const roiMatch = inv.description.match(/ROI:\s*([0-9.]+)%/i);
        if (roiMatch && roiMatch[1]) parsedRoi = roiMatch[1];
      }
      if (!parsedDuration) {
        const tenureMatch = inv.description.match(/Tenure:\s*([0-9.]+)\s*([a-zA-Z]+)/i);
        if (tenureMatch && tenureMatch[1]) {
          parsedDuration = tenureMatch[1];
          parsedDurationUnit = tenureMatch[2];
        }
      }
      if (!parsedCompounding) {
        const compMatch = inv.description.match(/Compounding:\s*([a-zA-Z-]+)/i);
        if (compMatch && compMatch[1]) parsedCompounding = compMatch[1];
      }
      if (!parsedFrequency) {
        const freqMatch = inv.description.match(/(Monthly|Quarterly|Half-Yearly)/i);
        if (freqMatch && freqMatch[1]) parsedFrequency = freqMatch[1];
      }
    }

    const principal = Number(inv.principalAmount) || 0;
    const startStr = inv.investmentDate || new Date().toISOString().split('T')[0];

    if (parsedType === 'RD') {
      const roiVal = parseFloat(parsedRoi) || 7.0;
      const durVal = parseFloat(parsedDuration) || 12;
      const stepMonths = parsedFrequency === 'Quarterly' ? 3 : parsedFrequency === 'Half-Yearly' ? 6 : 1;
      const totalMonths = parsedDurationUnit === 'Years' ? durVal * 12 : durVal;
      const totalInstallments = Math.max(1, Math.floor(totalMonths / stepMonths));

      let instBase = inv.unitPrice ? Number(inv.unitPrice) : null;
      if (!instBase && parsedTags?.installmentAmount) {
        instBase = Number(parsedTags.installmentAmount);
      }
      if (!instBase || instBase <= 0) {
        instBase = principal > 0 ? (principal / totalInstallments) : 0;
      }

      const calc = calculateRdMaturity(instBase, roiVal, durVal, parsedDurationUnit, parsedFrequency, parsedCompounding, startStr);

      return {
        isDeposit: true,
        type: 'RD',
        maturityDate: maturityDate || calc.maturityDate,
        maturityAmount: Number((maturityAmount && maturityAmount > calc.maturityFund * 0.5 ? maturityAmount : calc.maturityFund).toFixed(2)),
        currentInvested: Number(calc.currentPaid.toFixed(2)), // Invested based on months passed!
        currentAccrued: Number(calc.currentAccrued.toFixed(2)), // Accrued value of paid installments
        installmentsPaid: calc.installmentsPaidSoFar,
        totalInstallments: calc.totalInstallments,
        installmentAmount: Number(calc.installmentAmount.toFixed(2)),
        totalExpectedInvested: Number(calc.totalInvested.toFixed(2)),
        roi: parsedRoi || '7.00',
        duration: parsedDuration || '12',
        durationUnit: parsedDurationUnit || 'Months',
        compoundingFrequency: parsedCompounding || 'Quarterly',
        frequency: parsedFrequency || 'Monthly'
      };
    } else {
      // Fixed Deposit (FD)
      const roiVal = parseFloat(parsedRoi) || 7.1;
      const durVal = parseFloat(parsedDuration) || 1;
      const calc = calculateFdMaturity(principal, roiVal, durVal, parsedDurationUnit, parsedCompounding, startStr);

      return {
        isDeposit: true,
        type: 'FD',
        maturityDate: maturityDate || calc.maturityDate,
        maturityAmount: Number((maturityAmount && maturityAmount > principal ? maturityAmount : calc.maturityFund).toFixed(2)),
        currentInvested: Number(calc.principal.toFixed(2)),
        currentAccrued: Number(calc.currentAccrued.toFixed(2)),
        installmentsPaid: 1,
        totalInstallments: 1,
        installmentAmount: Number(calc.principal.toFixed(2)),
        totalExpectedInvested: Number(calc.principal.toFixed(2)),
        roi: parsedRoi || '7.10',
        duration: parsedDuration || '1',
        durationUnit: parsedDurationUnit || 'Years',
        compoundingFrequency: parsedCompounding || 'Quarterly',
        frequency: 'One-time'
      };
    }
  };

  // Open edit modal pre-populating all existing investment data
  const handleOpenEditModal = (inv) => {
    setEditingInvestment(inv);
    setModalError('');
    setBenchmarkInfo(null);

    const invCurr = inv.currency || homeCurrency || 'USD';
    const depDetails = getDepositDetails(inv);
    if (depDetails) {
      if (depDetails.type === 'FD') {
        const principalInViewing = convertAmount(inv.principalAmount, currency, invCurr);
        setFdData({
          depositAmount: Number(principalInViewing).toFixed(2),
          roi: depDetails.roi || '7.10',
          startedDate: inv.investmentDate || new Date().toISOString().split('T')[0],
          duration: depDetails.duration || '1',
          durationUnit: depDetails.durationUnit || 'Years',
          compoundingFrequency: depDetails.compoundingFrequency || 'Quarterly',
          bankName: inv.investmentName || 'Fixed Deposit'
        });
        setFormData(prev => ({
          ...prev,
          category: 'Fixed Deposits',
          investmentName: inv.investmentName || 'Fixed Deposit'
        }));
      } else {
        // Recurring Deposit
        const rawInstAmt = depDetails.installmentAmount || (Number(inv.principalAmount) / 12);
        const instInViewing = convertAmount(rawInstAmt, currency, invCurr);
        setRdData({
          installmentAmount: Number(instInViewing).toFixed(2),
          roi: depDetails.roi || '7.00',
          startDate: inv.investmentDate || new Date().toISOString().split('T')[0],
          frequency: depDetails.frequency || 'Monthly',
          duration: depDetails.duration || '12',
          durationUnit: depDetails.durationUnit || 'Months',
          compoundingFrequency: depDetails.compoundingFrequency || 'Quarterly',
          bankName: inv.investmentName || 'Recurring Deposit'
        });
        setFormData(prev => ({
          ...prev,
          category: 'Recurring Deposits',
          investmentName: inv.investmentName || 'Recurring Deposit'
        }));
      }
    } else {
      // Market asset
      const rawBuyPrice = inv.unitPrice ? Number(inv.unitPrice) : (Number(inv.principalAmount) / (Number(inv.quantity) || 1));
      const rawCurrPrice = inv.currentPrice ? Number(inv.currentPrice) : rawBuyPrice;
      const buyPrice = convertAmount(rawBuyPrice, currency, invCurr);
      const currPrice = convertAmount(rawCurrPrice, currency, invCurr);
      const principalLocal = convertAmount(Number(inv.principalAmount) || 0, currency, invCurr);
      const currentLocal = convertAmount(Number(inv.currentAmount ?? inv.principalAmount) || 0, currency, invCurr);

      setFormData({
        investmentName: inv.investmentName || '',
        category: inv.category || 'Stocks',
        purchasePrice: buyPrice.toFixed(2),
        quantity: inv.quantity || '1',
        currentPrice: currPrice.toFixed(2),
        principalAmount: principalLocal.toFixed(2),
        currentAmount: currentLocal.toFixed(2),
        riskLevel: inv.riskLevel || 'Medium',
        investmentDate: inv.investmentDate || new Date().toISOString().split('T')[0],
        description: inv.description || ''
      });
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvestment(null);
    setBenchmarkInfo(null);
    setModalError('');
    setFormData({
      investmentName: '',
      category: 'Stocks',
      purchasePrice: '',
      quantity: '1',
      currentPrice: '',
      principalAmount: '',
      currentAmount: '',
      riskLevel: 'Medium',
      investmentDate: new Date().toISOString().split('T')[0],
      description: ''
    });
    setFdData({
      depositAmount: '',
      roi: '7.10',
      startedDate: new Date().toISOString().split('T')[0],
      duration: '1',
      durationUnit: 'Years',
      compoundingFrequency: 'Quarterly',
      bankName: 'SBI Fixed Deposit'
    });
    setRdData({
      installmentAmount: '',
      roi: '7.00',
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'Monthly',
      duration: '12',
      durationUnit: 'Months',
      compoundingFrequency: 'Quarterly',
      bankName: 'SBI Recurring Deposit'
    });
  };

  const fetchInvestments = async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await authFetch(API_ENDPOINTS.INVESTMENT_USER(username));
      if (res.ok) {
        const data = await res.json();
        setInvestments(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load investment portfolio.');
      }
    } catch (err) {
      setError('Cannot connect to investment service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [username]);

  // When asset name or category changes, check if live price is available
  const handleAssetNameChange = async (name) => {
    const updated = { ...formData, investmentName: name };
    const matched = findAssetQuote(name);
    
    if (matched) {
      updated.category = matched.category;
      setFetchingLiveQuote(true);
      try {
        const quote = await getLiveMarketPrice(matched.symbol, matched.category);
        if (quote && quote.price) {
          const rawPrice = quote.price;
          const nativeCurr = quote.nativeCurrency || matched.nativeCurrency || 'USD';
          // Convert from quote's native currency (e.g. INR or USD) to active currency
          const localPrice = Number(convertAmount(rawPrice, currency, nativeCurr).toFixed(2));

          setBenchmarkInfo({
            nativePrice: rawPrice,
            nativeCurrency: nativeCurr,
            unit: matched.unit || quote.unit || 'unit',
            symbol: matched.symbol,
            source: matched.source || quote.source
          });

          updated.currentPrice = localPrice.toString();
          if (!updated.purchasePrice) {
            updated.purchasePrice = localPrice.toString();
          }
          const qty = parseFloat(updated.quantity) || 1;
          const buyP = parseFloat(updated.purchasePrice) || localPrice;
          updated.principalAmount = (buyP * qty).toFixed(2);
          updated.currentAmount = (localPrice * qty).toFixed(2);
        }
      } catch (e) {
        // fallback
      } finally {
        setFetchingLiveQuote(false);
      }
    } else {
      setBenchmarkInfo(null);
    }
    setFormData(updated);
  };

  // Recalculate totals when purchasePrice, currentPrice, or quantity change
  const handlePriceOrQtyChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
    const buyPrice = parseFloat(field === 'purchasePrice' ? value : updated.purchasePrice) || 0;
    const currPrice = parseFloat(field === 'currentPrice' ? value : updated.currentPrice) || buyPrice;

    if (qty > 0 && buyPrice > 0) {
      updated.principalAmount = (buyPrice * qty).toFixed(2);
      updated.currentAmount = (currPrice * qty).toFixed(2);
    }

    setFormData(updated);
  };

  const selectAssetPreset = async (asset) => {
    if (asset.category === 'Fixed Deposits') {
      setFormData(prev => ({
        ...prev,
        category: 'Fixed Deposits',
        investmentName: asset.name || 'Fixed Deposit'
      }));
      setFdData(prev => ({
        ...prev,
        bankName: asset.name || 'Fixed Deposit',
        roi: asset.defaultRoi || '7.10'
      }));
      setBenchmarkInfo(null);
      return;
    }

    if (asset.category === 'Recurring Deposits') {
      setFormData(prev => ({
        ...prev,
        category: 'Recurring Deposits',
        investmentName: asset.name || 'Recurring Deposit'
      }));
      setRdData(prev => ({
        ...prev,
        bankName: asset.name || 'Recurring Deposit',
        roi: asset.defaultRoi || '7.00',
        frequency: 'Monthly'
      }));
      setBenchmarkInfo(null);
      return;
    }

    setFetchingLiveQuote(true);
    setBenchmarkInfo(null);
    try {
      const quote = await getLiveMarketPrice(asset.symbol, asset.category);
      const rawPrice = quote?.price ?? asset.defaultPrice;
      const nativeCurr = quote?.nativeCurrency || asset.nativeCurrency || 'USD';
      // Convert from quote's native currency (e.g. INR or USD) to active currency
      const localPrice = Number(convertAmount(rawPrice, currency, nativeCurr).toFixed(2));
      const qty = parseFloat(formData.quantity) || 1;

      setBenchmarkInfo({
        nativePrice: rawPrice,
        nativeCurrency: nativeCurr,
        unit: asset.unit || quote.unit || 'unit',
        symbol: asset.symbol,
        source: asset.source || quote.source
      });

      setFormData(prev => ({
        ...prev,
        investmentName: `${asset.symbol} - ${asset.name}`,
        category: asset.category,
        purchasePrice: localPrice.toString(),
        currentPrice: localPrice.toString(),
        quantity: qty.toString(),
        principalAmount: (localPrice * qty).toFixed(2),
        currentAmount: (localPrice * qty).toFixed(2)
      }));
    } catch (e) {
      // fallback
    } finally {
      setFetchingLiveQuote(false);
    }
  };

  // Refresh live prices for all stocks and commodities in the user's portfolio
  const handleRefreshLivePrices = async () => {
    if (investments.length === 0) return;
    setRefreshingPrices(true);
    let updatedCount = 0;

    try {
      const updatedList = await Promise.all(investments.map(async (inv) => {
        const invCurr = inv.currency || homeCurrency || 'USD';

        // Handle FD / RD — recalculate accrued values and update DB
        if (inv.category === 'Fixed Deposits' || inv.category === 'Recurring Deposits') {
          try {
            const depDetails = getDepositDetails(inv);
            if (depDetails) {
              const updatedInv = {
                ...inv,
                currentAmount: depDetails.currentAccrued,
                principalAmount: depDetails.type === 'RD' ? depDetails.currentInvested : inv.principalAmount,
                totalReturns: depDetails.currentAccrued - depDetails.currentInvested,
                maturityAmount: depDetails.maturityAmount,
                maturityDate: depDetails.maturityDate
              };

              await authFetch(API_ENDPOINTS.INVESTMENT, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedInv)
              });
              updatedCount++;
              return updatedInv;
            }
          } catch (err) {
            // ignore single item error
          }
          return inv;
        }

        // Handle market assets (Stocks, Commodities, Crypto, ETFs, etc.)
        const isMarketAsset = ['Stocks', 'Commodities', 'Cryptocurrency', 'Exchange Traded Funds (ETFs)', 'Mutual Funds', 'Bonds'].includes(inv.category);
        if (!isMarketAsset) return inv;

        try {
          const quote = await getLiveMarketPrice(inv.investmentName, inv.category);
          if (quote && quote.price) {
            const quoteInInvCurrency = convertAmount(quote.price, invCurr, quote.nativeCurrency);
            const qty = parseFloat(inv.quantity) || 1;
            const newCurrentAmount = quoteInInvCurrency * qty;
            const updatedInv = {
              ...inv,
              currency: invCurr,
              currentPrice: quoteInInvCurrency.toString(),
              currentAmount: newCurrentAmount,
              totalReturns: newCurrentAmount - inv.principalAmount
            };

            await authFetch(API_ENDPOINTS.INVESTMENT, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedInv)
            });
            updatedCount++;
            return updatedInv;
          }
        } catch (err) {
          // ignore single item error
        }
        return inv;
      }));

      setInvestments(updatedList);
      setSuccessMsg(`⚡ Refreshed ${updatedCount} investment(s) — deposits recalculated, live prices updated!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Could not update investments: ' + err.message);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleAddOrUpdateInvestment = async (e) => {
    e.preventDefault();

    let nameToSave = formData.investmentName.trim();
    let categoryToSave = formData.category;
    let principalToSave = 0;
    let currentToSave = 0;
    let maturityAmountToSave = null;
    let maturityDateToSave = null;
    let tagsToSave = null;
    let unitPriceToSave = null;
    let currentPriceToSave = null;
    let quantityToSave = '1';
    let riskToSave = formData.riskLevel;
    let dateToSave = formData.investmentDate;
    let descToSave = formData.description.trim() || null;

    // Storage currency: preserve asset's existing currency if editing, or save in user's home location currency
    const saveCurrency = editingInvestment?.currency || homeCurrency || 'USD';

    if (categoryToSave === 'Fixed Deposits') {
      const depositNum = parseFloat(fdData.depositAmount);
      if (isNaN(depositNum) || depositNum <= 0) {
        setModalError('Please enter a valid deposit amount for your Fixed Deposit.');
        return;
      }
      nameToSave = (fdData.bankName || 'Fixed Deposit').trim();
      principalToSave = convertAmount(fdMaturity.principal, saveCurrency, currency);
      
      // Calculate true current accrued value as of today in saveCurrency
      currentToSave = convertAmount(fdMaturity.currentAccrued, saveCurrency, currency);
      maturityAmountToSave = convertAmount(fdMaturity.maturityFund, saveCurrency, currency);
      maturityDateToSave = fdMaturity.maturityDate;
      unitPriceToSave = principalToSave.toString();
      currentPriceToSave = `${fdData.roi}%`;
      quantityToSave = '1';
      riskToSave = 'Low';
      dateToSave = fdData.startedDate;
      descToSave = `ROI: ${fdData.roi}% p.a. | Tenure: ${fdData.duration} ${fdData.durationUnit} | Compounding: ${fdData.compoundingFrequency} | Maturity Date: ${fdMaturity.maturityDate} | Maturity Fund: ${currencySymbol}${fdMaturity.maturityFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      tagsToSave = JSON.stringify({
        type: 'FD',
        depositAmount: principalToSave,
        roi: fdData.roi,
        duration: fdData.duration,
        durationUnit: fdData.durationUnit,
        compoundingFrequency: fdData.compoundingFrequency,
        maturityDate: fdMaturity.maturityDate,
        maturityAmount: maturityAmountToSave,
        currency: saveCurrency
      });
    } else if (categoryToSave === 'Recurring Deposits') {
      const installmentNum = parseFloat(rdData.installmentAmount);
      if (isNaN(installmentNum) || installmentNum <= 0) {
        setModalError('Please enter a valid installment amount for your Recurring Deposit.');
        return;
      }
      nameToSave = (rdData.bankName || 'Recurring Deposit').trim();
      const installmentInSaveCurr = convertAmount(rdMaturity.installmentAmount, saveCurrency, currency);
      principalToSave = convertAmount(rdMaturity.currentPaid, saveCurrency, currency);
      currentToSave = convertAmount(rdMaturity.currentAccrued, saveCurrency, currency);
      maturityAmountToSave = convertAmount(rdMaturity.maturityFund, saveCurrency, currency);
      maturityDateToSave = rdMaturity.maturityDate;
      unitPriceToSave = installmentInSaveCurr.toString();
      currentPriceToSave = `${rdData.roi}%`;
      quantityToSave = `${rdMaturity.totalInstallments} (${rdData.frequency})`;
      riskToSave = 'Low';
      dateToSave = rdData.startDate;
      descToSave = `Installment: ${currencySymbol}${rdData.installmentAmount} (${rdData.frequency}) | ROI: ${rdData.roi}% p.a. | Tenure: ${rdData.duration} ${rdData.durationUnit} | Compounding: ${rdData.compoundingFrequency} | Maturity Date: ${rdMaturity.maturityDate} | Maturity Fund: ${currencySymbol}${rdMaturity.maturityFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      tagsToSave = JSON.stringify({
        type: 'RD',
        installmentAmount: installmentInSaveCurr,
        frequency: rdData.frequency,
        totalInstallments: rdMaturity.totalInstallments,
        totalInvested: convertAmount(rdMaturity.totalInvested, saveCurrency, currency),
        installmentsPaid: rdMaturity.installmentsPaidSoFar,
        currentInvested: principalToSave,
        roi: rdData.roi,
        duration: rdData.duration,
        durationUnit: rdData.durationUnit,
        compoundingFrequency: rdData.compoundingFrequency,
        maturityDate: rdMaturity.maturityDate,
        maturityAmount: maturityAmountToSave,
        currency: saveCurrency
      });
    } else {
      if (!nameToSave) {
        setModalError('Please enter an investment name or select a preset.');
        return;
      }

      const rawPrincipal = parseFloat(formData.principalAmount);
      if (isNaN(rawPrincipal) || rawPrincipal <= 0) {
        setModalError('Please enter a valid purchase price and quantity.');
        return;
      }

      const rawCurrent = formData.currentAmount ? parseFloat(formData.currentAmount) : rawPrincipal;
      if (isNaN(rawCurrent) || rawCurrent < 0) {
        setModalError('Please enter a valid current value.');
        return;
      }

      const rawPurchasePrice = parseFloat(formData.purchasePrice);
      const rawCurrentPrice = formData.currentPrice ? parseFloat(formData.currentPrice) : rawPurchasePrice;

      // Convert values to target save currency
      principalToSave = convertAmount(rawPrincipal, saveCurrency, currency);
      currentToSave = convertAmount(rawCurrent, saveCurrency, currency);
      unitPriceToSave = rawPurchasePrice > 0 ? convertAmount(rawPurchasePrice, saveCurrency, currency).toString() : null;
      currentPriceToSave = rawCurrentPrice > 0 ? convertAmount(rawCurrentPrice, saveCurrency, currency).toString() : null;
      quantityToSave = formData.quantity.trim() || '1';
    }

    setSubmitting(true);
    setModalError('');
    try {
      const isEditing = !!editingInvestment;
      const method = isEditing ? 'PUT' : 'POST';
      const payload = {
        username,
        investmentName: nameToSave,
        category: categoryToSave,
        unitPrice: unitPriceToSave,
        currentPrice: currentPriceToSave,
        principalAmount: principalToSave,
        currentAmount: currentToSave,
        totalReturns: (currentToSave - principalToSave),
        maturityAmount: maturityAmountToSave,
        maturityDate: maturityDateToSave,
        currency: saveCurrency,
        tags: tagsToSave,
        quantity: quantityToSave,
        riskLevel: riskToSave,
        investmentDate: dateToSave,
        description: descToSave
      };

      if (isEditing) {
        payload.id = editingInvestment.id;
      }

      const res = await authFetch(API_ENDPOINTS.INVESTMENT, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        handleCloseModal();
        fetchInvestments();
        setSuccessMsg(
          isEditing 
            ? 'Investment updated successfully!' 
            : categoryToSave === 'Fixed Deposits' 
            ? 'Fixed Deposit booked successfully!' 
            : categoryToSave === 'Recurring Deposits'
            ? 'Recurring Deposit booked successfully!'
            : 'Investment added successfully!'
        );
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errorText = await res.text();
        setModalError(errorText || 'Failed to save investment.');
      }
    } catch (err) {
      setModalError('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    try {
      const res = await authFetch(API_ENDPOINTS.INVESTMENT_BY_ID(id), {
        method: 'DELETE'
      });
      if (res.ok) {
        setInvestments(investments.filter(i => i.id !== id));
      } else {
        setError('Failed to delete investment.');
      }
    } catch (err) {
      setError('Error deleting investment: ' + err.message);
    }
  };

  // Filtered investments
  const filteredInvestments = investments.filter(inv => {
    const matchesSearch = inv.investmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || inv.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate totals normalized to active viewing currency
  const totalInvested = investments.reduce((sum, i) => {
    const dep = getDepositDetails(i);
    const invAmt = dep ? dep.currentInvested : (Number(i.principalAmount) || 0);
    return sum + (convertAmount ? convertAmount(invAmt, currency, i.currency || homeCurrency) : invAmt);
  }, 0);
  const totalCurrent = investments.reduce((sum, i) => {
    const dep = getDepositDetails(i);
    const curVal = dep ? dep.currentAccrued : (Number(i.currentAmount ?? i.principalAmount) || 0);
    return sum + (convertAmount ? convertAmount(curVal, currency, i.currency || homeCurrency) : curVal);
  }, 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPercentage = totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(2) : '0.00';

  // Group by category for categorical P&L view in active viewing currency
  const categoryStats = investments.reduce((acc, inv) => {
    const cat = inv.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = {
        name: cat,
        invested: 0,
        current: 0,
        count: 0
      };
    }
    const dep = getDepositDetails(inv);
    const rawInvested = dep ? dep.currentInvested : (Number(inv.principalAmount) || 0);
    const rawCurrent = dep ? dep.currentAccrued : (Number(inv.currentAmount ?? inv.principalAmount) || 0);
    const invested = convertAmount ? convertAmount(rawInvested, currency, inv.currency || homeCurrency) : rawInvested;
    const current = convertAmount ? convertAmount(rawCurrent, currency, inv.currency || homeCurrency) : rawCurrent;
    acc[cat].invested += invested;
    acc[cat].current += current;
    acc[cat].count += 1;
    return acc;
  }, {});

  const categoryList = Object.values(categoryStats).map(cat => {
    const pnl = cat.current - cat.invested;
    const pnlPct = cat.invested > 0 ? ((pnl / cat.invested) * 100).toFixed(2) : '0.00';
    return {
      ...cat,
      pnl,
      pnlPct
    };
  }).sort((a, b) => b.current - a.current);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Investment Portfolio</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Track stocks, commodities & holdings with live market prices</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleRefreshLivePrices}
            disabled={refreshingPrices || investments.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
            title="Refresh current prices for stocks and commodities"
          >
            <RefreshCw size={16} className={`text-blue-600 dark:text-blue-400 ${refreshingPrices ? 'animate-spin' : ''}`} />
            <span>{refreshingPrices ? 'Updating...' : 'Live Quotes'}</span>
          </button>

          <button
            onClick={() => { handleCloseModal(); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-xs text-sm"
          >
            <Plus size={18} />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Portfolio Summary & Total P/L */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Portfolio Value</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(totalCurrent)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{investments.length} asset(s) held</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Briefcase size={26} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Invested Capital</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(totalInvested)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Purchase cost basis</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl">
            <DollarSign size={26} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Portfolio P&L</p>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-2xl font-extrabold ${totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalReturn >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalReturn))}
              </p>
              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                totalReturn >= 0 ? 'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
              }`}>
                {totalReturn >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {returnPercentage}%
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Unrealized return on investment</p>
          </div>
          <div className={`p-3 rounded-2xl ${totalReturn >= 0 ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
            {totalReturn >= 0 ? <TrendingUp size={26} /> : <TrendingDown size={26} />}
          </div>
        </div>
      </div>

      {/* Categorical P&L View: Profits / Loss by Category */}
      {categoryList.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Layers size={18} className="text-blue-600 dark:text-blue-400" />
              Category Performance & P/L
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">{categoryList.length} categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categoryList.map(cat => {
              const isProfit = cat.pnl >= 0;
              return (
                <div key={cat.name} className="p-3.5 sm:p-4 bg-gray-50/70 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{cat.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                      {cat.count} asset{cat.count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Invested:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(cat.invested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Current Value:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(cat.current)}</span>
                    </div>
                  </div>

                  {/* P/L for this category */}
                  <div className={`pt-2 border-t border-gray-200 dark:border-gray-700/80 flex justify-between items-center text-xs font-bold ${
                    isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span>P/L:</span>
                    <div className="flex items-center space-x-1">
                      <span>{isProfit ? '+' : '-'}{formatCurrency(Math.abs(cat.pnl))}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                        isProfit ? 'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                      }`}>
                        {isProfit ? '+' : ''}{cat.pnlPct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search asset, stock, commodity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={15} className="text-gray-400 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {INVESTMENT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Holdings Table with both Current Value and Maturity Value with Date */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Holdings & Asset Breakdown</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{filteredInvestments.length} position(s)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading portfolio...</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No investments found. Click "Add Investment" to add stocks, gold, FD, RD, or other assets.
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredInvestments.map((inv) => {
                const depDetails = getDepositDetails(inv);
                const isDeposit = !!depDetails;
                const isRD = depDetails && depDetails.type === 'RD';
                const principal = Number(inv.principalAmount) || 0;
                const invested = depDetails ? depDetails.currentInvested : principal;
                const current = depDetails ? depDetails.currentAccrued : (Number(inv.currentAmount ?? inv.principalAmount) || 0);
                const ret = current - invested;
                const retPct = invested > 0 ? ((ret / invested) * 100).toFixed(2) : '0.00';
                const isProfit = ret >= 0;
                const isMarketAsset = ['Stocks', 'Commodities', 'Cryptocurrency'].includes(inv.category);
                const invCurr = inv.currency || homeCurrency;

                return (
                  <div key={inv.id} className="p-4 space-y-2.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{inv.investmentName}</h4>
                          {isMarketAsset && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              <Zap size={10} className="mr-0.5 text-blue-600" /> Live
                            </span>
                          )}
                          {isDeposit && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              {depDetails.type}
                            </span>
                          )}
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {inv.category}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                          {formatCurrency(current, invCurr)}
                        </p>
                        <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isProfit ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          <span>{isProfit ? '+' : ''}{formatCurrency(ret, invCurr)} ({retPct}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Invested</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(invested, invCurr)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">
                          {isDeposit ? 'Rate / ROI' : 'Holdings'}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {isDeposit 
                            ? (depDetails.roi ? `${depDetails.roi}% p.a.` : 'Fixed Rate')
                            : `${inv.quantity || 1} unit(s)`}
                        </span>
                      </div>
                      {isDeposit && depDetails.maturityAmount && (
                        <div className="col-span-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60 flex justify-between items-center text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Matures: {depDetails.maturityDate}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(depDetails.maturityAmount, invCurr)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end items-center space-x-2 pt-0.5">
                      <button
                        onClick={() => handleOpenEditModal(inv)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Asset / Symbol</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Quantity / Tenure</th>
                    <th className="px-6 py-3.5 text-right">Purchase / Installment</th>
                    <th className="px-6 py-3.5 text-right">Current Price / ROI</th>
                    <th className="px-6 py-3.5 text-right">Invested</th>
                    <th className="px-6 py-3.5 text-right">Current Value</th>
                    <th className="px-6 py-3.5 text-right">Maturity Value & Date</th>
                    <th className="px-6 py-3.5 text-right">Profit / Loss</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredInvestments.map((inv) => {
                    const depDetails = getDepositDetails(inv);
                    const isDeposit = !!depDetails;
                    const isRD = depDetails && depDetails.type === 'RD';
                    const principal = Number(inv.principalAmount) || 0;
                    const invested = depDetails ? depDetails.currentInvested : principal;
                    const current = depDetails ? depDetails.currentAccrued : (Number(inv.currentAmount ?? inv.principalAmount) || 0);
                    const ret = current - invested;
                    const retPct = invested > 0 ? ((ret / invested) * 100).toFixed(2) : '0.00';
                    const isProfit = ret >= 0;
                    const isMarketAsset = ['Stocks', 'Commodities', 'Cryptocurrency'].includes(inv.category);
                    const invCurr = inv.currency || homeCurrency;

                    const unitP = inv.unitPrice ? Number(inv.unitPrice) : (inv.quantity && Number(inv.quantity) > 0 ? principal / Number(inv.quantity) : principal);
                    const currP = inv.currentPrice ? Number(inv.currentPrice) : (inv.quantity && Number(inv.quantity) > 0 ? current / Number(inv.quantity) : current);

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{inv.investmentName}</p>
                            {isMarketAsset && (
                              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                <Zap size={10} className="mr-0.5 text-blue-600" /> Live
                              </span>
                            )}
                            {isDeposit && (
                              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                {depDetails.type}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {inv.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                          {isRD ? (
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {depDetails.installmentsPaid} of {depDetails.totalInstallments} paid
                              </div>
                              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                                {depDetails.duration} {depDetails.durationUnit} ({depDetails.frequency})
                              </div>
                            </div>
                          ) : isDeposit ? (
                            depDetails.tenure || `${depDetails.duration} ${depDetails.durationUnit}`
                          ) : (
                            inv.quantity || '1'
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {isRD ? (
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(depDetails.installmentAmount, invCurr)}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">per {depDetails.frequency === 'Quarterly' ? 'quarter' : depDetails.frequency === 'Half-Yearly' ? 'half-yr' : 'mo'}</div>
                            </div>
                          ) : (
                            formatCurrency(unitP, invCurr)
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {isDeposit ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              {depDetails.roi ? `${depDetails.roi}% p.a.` : (inv.currentPrice && inv.currentPrice.includes('%') ? inv.currentPrice : 'Fixed Rate')}
                            </span>
                          ) : (
                            formatCurrency(currP, invCurr)
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(invested, invCurr)}</div>
                          {isRD && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                              {depDetails.installmentsPaid} installment{depDetails.installmentsPaid > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          <div>{formatCurrency(current, invCurr)}</div>
                          {isDeposit && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Accrued today</div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isDeposit ? (
                            <div>
                              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(depDetails.maturityAmount, invCurr)}
                              </div>
                              <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                                <Calendar size={11} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span>
                                  {depDetails.maturityDate !== 'N/A' 
                                ? new Date(depDetails.maturityDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 dark:text-gray-500 text-xs">
                              <span className="font-medium">—</span>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">Open-ended</div>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isDeposit ? (
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                ret >= 0 ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              }`}>
                                {ret >= 0 ? '+' : '-'}{formatCurrency(Math.abs(ret), invCurr)} ({retPct}%)
                              </span>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                At Maturity: +{formatCurrency(depDetails.maturityAmount - depDetails.totalExpectedInvested, invCurr)}
                              </div>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isProfit ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}>
                              {isProfit ? '+' : '-'}{formatCurrency(Math.abs(ret), invCurr)} ({retPct}%)
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit investment"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete investment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className={`p-2 rounded-lg ${editingInvestment ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'}`}>
                  {editingInvestment ? <Pencil size={18} /> : <Plus size={18} />}
                </div>
                {editingInvestment ? 'Edit Investment' : 'Add Investment (Live Prices & Deposits)'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Popular Asset Presets (only shown when adding new) */}
            {!editingInvestment && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quick Presets</p>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Validated Market & Bank Data</span>
                </div>
                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  {/* Popular Commodities */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 w-24">Commodities:</span>
                    {POPULAR_ASSETS.filter(a => a.category === 'Commodities').map(asset => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => selectAssetPreset(asset)}
                        className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-900 rounded-lg text-amber-800 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-700/60 shadow-2xs"
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>

                  {/* Stocks */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 w-24">Stocks:</span>
                    {POPULAR_ASSETS.filter(a => a.category === 'Stocks').map(asset => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => selectAssetPreset(asset)}
                        className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:text-blue-900 rounded-lg text-blue-800 dark:text-blue-300 transition-colors border border-blue-200 dark:border-blue-700/60 shadow-2xs"
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>

                  {/* ETFs & Funds */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 w-24">ETFs & Funds:</span>
                    {POPULAR_ASSETS.filter(a => ['Exchange Traded Funds (ETFs)', 'Mutual Funds', 'Bonds'].includes(a.category)).map(asset => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => selectAssetPreset(asset)}
                        className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:text-indigo-900 rounded-lg text-indigo-800 dark:text-indigo-300 transition-colors border border-indigo-200 dark:border-indigo-700/60 shadow-2xs"
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>

                  {/* Bank Deposits Shortcuts (FD and RD) */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 w-24">Bank Deposits:</span>
                    <button
                      type="button"
                      onClick={() => selectAssetPreset({ category: 'Fixed Deposits', name: 'SBI Fixed Deposit', defaultRoi: '7.10' })}
                      className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                    >
                      + Book Fixed Deposit (7.10% ROI)
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAssetPreset({ category: 'Recurring Deposits', name: 'SBI Recurring Deposit', defaultRoi: '7.00' })}
                      className="px-2.5 py-0.5 text-xs font-bold bg-teal-100 dark:bg-teal-950/40 hover:bg-teal-200 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 rounded-lg transition-colors border border-teal-300 dark:border-teal-700 shadow-2xs"
                    >
                      + Book Recurring Deposit (7.00% ROI)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddOrUpdateInvestment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  disabled={!!editingInvestment}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:text-gray-500"
                >
                  {INVESTMENT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {formData.category === 'Fixed Deposits' ? (
                /* Dedicated Fixed Deposit Form */
                <div className="space-y-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase size={14} className="text-emerald-600 dark:text-emerald-400" /> Fixed Deposit Parameters
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Quarterly Compounding by default</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Deposit Title / Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBI Fixed Deposit, HDFC Bank FD, ICICI Bank FD"
                      value={fdData.bankName}
                      onChange={(e) => setFdData({ ...fdData, bankName: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Deposit Amount ({currencySymbol}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 100000"
                      value={fdData.depositAmount}
                      onChange={(e) => setFdData({ ...fdData, depositAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Rate of Interest (% p.a.) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 7.10"
                          value={fdData.roi}
                          onChange={(e) => setFdData({ ...fdData, roi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-gray-400 dark:text-gray-500">% p.a.</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Started Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={fdData.startedDate}
                        onChange={(e) => setFdData({ ...fdData, startedDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Duration / Tenure <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="1"
                          value={fdData.duration}
                          onChange={(e) => setFdData({ ...fdData, duration: e.target.value })}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <select
                          value={fdData.durationUnit}
                          onChange={(e) => setFdData({ ...fdData, durationUnit: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Compounding Frequency
                      </label>
                      <select
                        value={fdData.compoundingFrequency}
                        onChange={(e) => setFdData({ ...fdData, compoundingFrequency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                      >
                        <option value="Quarterly">Quarterly (Default - Bank FD)</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                        <option value="Annually">Annually</option>
                        <option value="Simple">Simple Interest (No Compounding)</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-Calculated Maturity Outlook Card */}
                  {fdMaturity.principal > 0 && (
                    <div className="p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-emerald-300 dark:border-emerald-800/80 text-xs space-y-2 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                          Maturity Date:
                        </span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          {new Date(fdMaturity.maturityDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Deposit Principal:</span>
                        <strong className="text-gray-900 dark:text-gray-100">{currencySymbol}{fdMaturity.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Interest Gain:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                          +{currencySymbol}{fdMaturity.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({fdMaturity.effectiveYield}%)
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-gray-900 dark:text-gray-100 font-extrabold text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-emerald-950 dark:text-emerald-200">Maturity Fund (Payout):</span>
                        <span className="text-emerald-800 dark:text-emerald-300 text-base">
                          {currencySymbol}{fdMaturity.maturityFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : formData.category === 'Recurring Deposits' ? (
                /* Dedicated Recurring Deposit Form */
                <div className="space-y-3.5 bg-teal-50/40 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase size={14} className="text-teal-600 dark:text-teal-400" /> Recurring Deposit Parameters
                    </span>
                    <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400">Monthly Frequency & Quarterly Compounding</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Deposit Title / Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBI Recurring Deposit, HDFC RD, ICICI RD"
                      value={rdData.bankName}
                      onChange={(e) => setFdData ? setRdData({ ...rdData, bankName: e.target.value }) : null}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Installment Amount ({currencySymbol}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 5000"
                      value={rdData.installmentAmount}
                      onChange={(e) => setRdData({ ...rdData, installmentAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                      Periodic deposit per {rdData.frequency === 'Monthly' ? 'month' : rdData.frequency === 'Quarterly' ? 'quarter' : 'half-year'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Rate of Interest (% p.a.) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 7.00"
                          value={rdData.roi}
                          onChange={(e) => setRdData({ ...rdData, roi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-gray-400 dark:text-gray-500">% p.a.</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Started Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={rdData.startDate}
                        onChange={(e) => setRdData({ ...rdData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Deposit Frequency <span className="text-teal-600 dark:text-teal-400 font-semibold">(Monthly Default)</span>
                      </label>
                      <select
                        value={rdData.frequency}
                        onChange={(e) => setRdData({ ...rdData, frequency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200"
                      >
                        <option value="Monthly">Monthly (Default)</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Duration / Tenure <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="12"
                          value={rdData.duration}
                          onChange={(e) => setRdData({ ...rdData, duration: e.target.value })}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <select
                          value={rdData.durationUnit}
                          onChange={(e) => setRdData({ ...rdData, durationUnit: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="Months">Months</option>
                          <option value="Years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Compounding Frequency
                    </label>
                    <select
                      value={rdData.compoundingFrequency}
                      onChange={(e) => setRdData({ ...rdData, compoundingFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                    >
                      <option value="Quarterly">Quarterly (Default - Bank RD Standard)</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Annually">Annually</option>
                      <option value="Simple">Simple Interest (No Compounding)</option>
                    </select>
                  </div>

                  {/* Auto-Calculated RD Maturity Outlook Card */}
                  {rdMaturity.installmentAmount > 0 && (
                    <div className="p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-teal-300 dark:border-teal-800/80 text-xs space-y-2 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400" />
                          Maturity Date:
                        </span>
                        <span className="font-bold text-teal-800 dark:text-teal-300 text-sm">
                          {new Date(rdMaturity.maturityDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Invested Today:</span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          {currencySymbol}{rdMaturity.currentPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rdMaturity.installmentsPaidSoFar} of {rdMaturity.totalInstallments} paid)
                        </strong>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Current Value (Accrued Today):</span>
                        <strong className="text-teal-700 dark:text-teal-400 font-bold">
                          {currencySymbol}{rdMaturity.currentAccrued.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Total Committed (Tenure):</span>
                        <strong className="text-gray-900 dark:text-gray-100">{currencySymbol}{rdMaturity.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Total Interest Gain at Maturity:</span>
                        <strong className="text-teal-700 dark:text-teal-400 font-bold">
                          +{currencySymbol}{rdMaturity.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({rdMaturity.effectiveYield}%)
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-gray-900 dark:text-gray-100 font-extrabold text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-teal-950 dark:text-teal-200">Maturity Fund (Payout):</span>
                        <span className="text-teal-800 dark:text-teal-300 text-base">
                          {currencySymbol}{rdMaturity.maturityFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Market Asset Form */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Asset / Ticker / Commodity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. GOLD (10g), SILVER (1kg), RELIANCE, AAPL"
                        value={formData.investmentName}
                        onChange={(e) => handleAssetNameChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      {fetchingLiveQuote && (
                        <div className="absolute right-3 top-2.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium animate-pulse">
                          <Zap size={14} /> Fetching live quote...
                        </div>
                      )}
                    </div>

                    {benchmarkInfo && (
                      <div className="mt-2.5 p-2.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Zap size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span>
                            {benchmarkInfo.source}: <strong>{benchmarkInfo.nativeCurrency === 'INR' ? '₹' : '$'}{benchmarkInfo.nativePrice.toLocaleString()} {benchmarkInfo.nativeCurrency}</strong> / {benchmarkInfo.unit}
                          </span>
                        </div>
                        {currency !== benchmarkInfo.nativeCurrency && (
                          <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
                            Converted to {currency} ({currencySymbol})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Level</label>
                    <select
                      value={formData.riskLevel}
                      onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                    >
                      {RISK_LEVELS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Price & Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Buy Price / Unit ({currencySymbol}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Your purchase price"
                        value={formData.purchasePrice}
                        onChange={(e) => handlePriceOrQtyChange('purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {benchmarkInfo ? `Price paid per ${benchmarkInfo.unit}` : 'Price you paid per unit'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Quantity / Units <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 10"
                        value={formData.quantity}
                        onChange={(e) => handlePriceOrQtyChange('quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {benchmarkInfo ? `Quantity in ${benchmarkInfo.unit}` : 'Number of shares or units'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Current Live Price / Unit ({currencySymbol})
                        </label>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                          <Zap size={11} /> Market Price
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Defaults to market live price"
                        value={formData.currentPrice}
                        onChange={(e) => handlePriceOrQtyChange('currentPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Calculated Summary Box */}
                  {formData.principalAmount && (
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800/60 text-xs space-y-1.5">
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>Total Invested (Cost Basis):</span>
                        <strong className="text-gray-900 dark:text-gray-100">{currencySymbol}{formData.principalAmount}</strong>
                      </div>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>Current Market Value:</span>
                        <strong className="text-gray-900 dark:text-gray-100">{currencySymbol}{formData.currentAmount || formData.principalAmount}</strong>
                      </div>
                      {formData.currentAmount && (
                        <div className="flex justify-between font-bold pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
                          <span>Expected P&L:</span>
                          <span className={(formData.currentAmount - formData.principalAmount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {(formData.currentAmount - formData.principalAmount) >= 0 ? '+' : ''}
                            {currencySymbol}{(formData.currentAmount - formData.principalAmount).toFixed(2)}
                            {' '}({formData.principalAmount > 0 ? (((formData.currentAmount - formData.principalAmount) / formData.principalAmount) * 100).toFixed(2) : 0}%)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      required
                      value={formData.investmentDate}
                      onChange={(e) => setFormData({ ...formData, investmentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting 
                    ? 'Saving...' 
                    : editingInvestment
                    ? 'Update Investment'
                    : formData.category === 'Fixed Deposits' 
                    ? 'Book Fixed Deposit' 
                    : formData.category === 'Recurring Deposits'
                    ? 'Book Recurring Deposit'
                    : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsContent;