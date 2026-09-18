// Multi-Currency & Geolocation Utilities for FinanceX

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
];

export const DEFAULT_EXCHANGE_RATES = {
  USD: 1.0,
  INR: 86.85,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
  AUD: 1.54,
  JPY: 155.20,
  SGD: 1.34,
  AED: 3.67,
  CHF: 0.88,
  CNY: 7.24,
  NZD: 1.69,
  BRL: 5.68,
  MXN: 20.35,
  SAR: 3.75,
  ZAR: 18.20,
};

// Map country names and ISO codes to currencies
export const COUNTRY_TO_CURRENCY = {
  // India
  'india': 'INR',
  'in': 'INR',
  
  // United States
  'united states': 'USD',
  'united states of america': 'USD',
  'usa': 'USD',
  'us': 'USD',

  // United Kingdom
  'united kingdom': 'GBP',
  'uk': 'GBP',
  'great britain': 'GBP',
  'gb': 'GBP',
  'england': 'GBP',
  'scotland': 'GBP',
  'wales': 'GBP',

  // Eurozone
  'germany': 'EUR', 'de': 'EUR',
  'france': 'EUR', 'fr': 'EUR',
  'italy': 'EUR', 'it': 'EUR',
  'spain': 'EUR', 'es': 'EUR',
  'netherlands': 'EUR', 'nl': 'EUR',
  'belgium': 'EUR', 'be': 'EUR',
  'austria': 'EUR', 'at': 'EUR',
  'ireland': 'EUR', 'ie': 'EUR',
  'portugal': 'EUR', 'pt': 'EUR',
  'greece': 'EUR', 'gr': 'EUR',
  'finland': 'EUR', 'fi': 'EUR',

  // Canada
  'canada': 'CAD',
  'ca': 'CAD',

  // Australia
  'australia': 'AUD',
  'au': 'AUD',

  // Japan
  'japan': 'JPY',
  'jp': 'JPY',

  // Singapore
  'singapore': 'SGD',
  'sg': 'SGD',

  // UAE
  'united arab emirates': 'AED',
  'uae': 'AED',
  'ae': 'AED',
  'dubai': 'AED',

  // Switzerland
  'switzerland': 'CHF',
  'ch': 'CHF',

  // China
  'china': 'CNY',
  'cn': 'CNY',

  // New Zealand
  'new zealand': 'NZD',
  'nz': 'NZD',

  // Brazil
  'brazil': 'BRL',
  'br': 'BRL',

  // Mexico
  'mexico': 'MXN',
  'mx': 'MXN',

  // Saudi Arabia
  'saudi arabia': 'SAR',
  'sa': 'SAR',

  // South Africa
  'south africa': 'ZAR',
  'za': 'ZAR',
};

/**
 * Derives a currency code from a country name or country code.
 */
export const getCurrencyFromCountry = (countryStr) => {
  if (!countryStr || typeof countryStr !== 'string') return 'USD';
  const normalized = countryStr.trim().toLowerCase();
  if (COUNTRY_TO_CURRENCY[normalized]) {
    return COUNTRY_TO_CURRENCY[normalized];
  }
  // Check if country matches any partial string
  for (const [countryKey, currCode] of Object.entries(COUNTRY_TO_CURRENCY)) {
    if (normalized.includes(countryKey) || countryKey.includes(normalized)) {
      return currCode;
    }
  }
  return 'USD';
};

/**
 * Fetches live exchange rates relative to USD from open API, falling back to cached or default rates.
 */
export const fetchLiveExchangeRates = async () => {
  try {
    const cached = sessionStorage.getItem('exchange_rates_v1');
    const cachedTimestamp = sessionStorage.getItem('exchange_rates_timestamp_v1');
    if (cached && cachedTimestamp && (Date.now() - Number(cachedTimestamp) < 3600000)) {
      return JSON.parse(cached);
    }

    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const mergedRates = { ...DEFAULT_EXCHANGE_RATES, ...data.rates };
        sessionStorage.setItem('exchange_rates_v1', JSON.stringify(mergedRates));
        sessionStorage.setItem('exchange_rates_timestamp_v1', Date.now().toString());
        return mergedRates;
      }
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using defaults:', err.message);
  }
  return DEFAULT_EXCHANGE_RATES;
};

/**
 * Converts an amount from base currency (USD) or custom fromCurrency to targetCurrency.
 */
export const convertAmount = (amount, toCurrency = 'USD', fromCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES) => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 0;
  const cleanTo = (toCurrency || 'USD').toUpperCase();
  const cleanFrom = (fromCurrency || 'USD').toUpperCase();
  if (cleanTo === cleanFrom) return num;
  const toRate = rates[cleanTo] ?? DEFAULT_EXCHANGE_RATES[cleanTo] ?? 1.0;
  const fromRate = rates[cleanFrom] ?? DEFAULT_EXCHANGE_RATES[cleanFrom] ?? 1.0;
  return (num * toRate) / fromRate;
};

/**
 * Converts an entered amount in current currency back to base currency (USD) for storage.
 */
export const toBaseAmount = (amountInCurrentCurrency, currentCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES) => {
  const num = Number(amountInCurrentCurrency);
  if (isNaN(num) || num === 0) return 0;
  const currentRate = rates[currentCurrency] ?? DEFAULT_EXCHANGE_RATES[currentCurrency] ?? 1.0;
  return num / currentRate;
};

/**
 * Formats a monetary amount from USD base into user's chosen target currency with appropriate symbol and localization.
 */
export const formatCurrency = (amount, targetCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES, fromCurrency = 'USD') => {
  const num = Number(amount);
  const safeNum = isNaN(num) ? 0 : num;
  const converted = convertAmount(safeNum, targetCurrency, fromCurrency, rates);

  const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency) || {
    code: targetCurrency,
    symbol: targetCurrency + ' ',
    locale: 'en-US'
  };

  try {
    return new Intl.NumberFormat(currencyObj.locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch (e) {
    return `${currencyObj.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Auto-detects user's location (city, country, currency) using free IP geolocation services with fallback.
 */
export const fetchUserLocation = async () => {
  // Service 1: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_name) {
        const country = data.country_name;
        const city = data.city || '';
        const countryCode = data.country_code || '';
        const currency = data.currency || getCurrencyFromCountry(country);
        const postal = data.postal || '';
        return { city, country, countryCode, currency, postal, source: 'ipapi' };
      }
    }
  } catch (e) {
    // try fallback
  }

  // Service 2: ipwho.is
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.country) {
        const country = data.country;
        const city = data.city || '';
        const countryCode = data.country_code || '';
        const currency = data.currency?.code || getCurrencyFromCountry(country);
        const postal = data.postal || '';
        return { city, country, countryCode, currency, postal, source: 'ipwhois' };
      }
    }
  } catch (e) {
    // try fallback
  }

  // Service 3: Browser locale / timezone inference fallback
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('Asia/Kolkata')) {
      return { city: 'Mumbai', country: 'India', countryCode: 'IN', currency: 'INR', postal: '', source: 'timezone' };
    }
    if (timeZone.includes('London')) {
      return { city: 'London', country: 'United Kingdom', countryCode: 'GB', currency: 'GBP', postal: '', source: 'timezone' };
    }
    if (timeZone.includes('Tokyo')) {
      return { city: 'Tokyo', country: 'Japan', countryCode: 'JP', currency: 'JPY', postal: '', source: 'timezone' };
    }
    if (timeZone.includes('Paris') || timeZone.includes('Berlin') || timeZone.includes('Rome')) {
      return { city: 'Berlin', country: 'Germany', countryCode: 'DE', currency: 'EUR', postal: '', source: 'timezone' };
    }
  } catch (e) {}

  return {
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    postal: '10001',
    source: 'default'
  };
};

