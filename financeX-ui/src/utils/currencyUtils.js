// Comprehensive Multi-Currency & Geolocation Engine for FinanceX

/**
 * Top curated world currencies covering all global regions, major economies, and VPN endpoints.
 */
export const SUPPORTED_CURRENCIES = [
  // Core & Americas
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso', locale: 'es-AR' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', locale: 'es-CL', decimalDigits: 0 },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', locale: 'es-CO', decimalDigits: 0 },
  { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', locale: 'es-PE' },

  // Nordic & Northern Europe
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'DKK', symbol: 'kr.', name: 'Danish Krone', locale: 'da-DK' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', locale: 'is-IS', decimalDigits: 0 },

  // Central & Eastern Europe
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU', decimalDigits: 0 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', locale: 'bg-BG' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', locale: 'uk-UA' },

  // East & Southeast Asia
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimalDigits: 0 },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', decimalDigits: 0 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', locale: 'zh-TW' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', decimalDigits: 0 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'fil-PH' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', decimalDigits: 0 },

  // South Asia
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', locale: 'si-LK' },
  { code: 'NPR', symbol: 'रु', name: 'Nepalese Rupee', locale: 'ne-NP' },

  // Middle East
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', locale: 'ar-QA' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', locale: 'ar-KW' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', locale: 'ar-BH' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', locale: 'ar-OM' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', locale: 'he-IL' },

  // Africa
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', locale: 'ar-MA' },
];

/**
 * Baseline exchange rates relative to USD = 1.0.
 * Used as reliable immediate defaults until live rates load from open.er-api.com.
 */
export const DEFAULT_EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 86.85,
  CAD: 1.38,
  AUD: 1.54,
  NZD: 1.69,
  BRL: 5.68,
  MXN: 20.35,
  ARS: 1060.0,
  CLP: 960.0,
  COP: 4200.0,
  PEN: 3.75,

  SEK: 10.45,
  NOK: 10.85,
  DKK: 6.87,
  ISK: 138.0,

  CHF: 0.88,
  PLN: 3.98,
  CZK: 23.40,
  HUF: 382.0,
  RON: 4.58,
  BGN: 1.80,
  TRY: 36.40,
  RUB: 96.50,
  UAH: 41.50,

  JPY: 155.20,
  CNY: 7.24,
  KRW: 1440.0,
  SGD: 1.34,
  HKD: 7.78,
  TWD: 32.80,
  THB: 34.20,
  MYR: 4.45,
  IDR: 16300.0,
  PHP: 58.20,
  VND: 25400.0,

  PKR: 279.0,
  BDT: 120.0,
  LKR: 295.0,
  NPR: 139.0,

  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  ILS: 3.60,

  ZAR: 18.20,
  EGP: 50.50,
  NGN: 1530.0,
  KES: 129.0,
  GHS: 15.50,
  MAD: 9.90,
};

/**
 * Exact 2-letter ISO 3166-1 country code to currency mapping.
 * Matches ONLY when the input is a 2-character country code (prevents false substring collisions!).
 */
const ISO_COUNTRY_CODE_TO_CURRENCY = {
  in: 'INR',
  us: 'USD',
  se: 'SEK',
  no: 'NOK',
  dk: 'DKK',
  is: 'ISK',
  gb: 'GBP',
  uk: 'GBP',
  de: 'EUR',
  fr: 'EUR',
  it: 'EUR',
  es: 'EUR',
  nl: 'EUR',
  be: 'EUR',
  at: 'EUR',
  ie: 'EUR',
  pt: 'EUR',
  gr: 'EUR',
  fi: 'EUR',
  lu: 'EUR',
  cy: 'EUR',
  mt: 'EUR',
  sk: 'EUR',
  si: 'EUR',
  ee: 'EUR',
  lv: 'EUR',
  lt: 'EUR',
  hr: 'EUR',
  ch: 'CHF',
  pl: 'PLN',
  cz: 'CZK',
  hu: 'HUF',
  ro: 'RON',
  bg: 'BGN',
  tr: 'TRY',
  ru: 'RUB',
  ua: 'UAH',
  ca: 'CAD',
  au: 'AUD',
  nz: 'NZD',
  jp: 'JPY',
  cn: 'CNY',
  kr: 'KRW',
  sg: 'SGD',
  hk: 'HKD',
  tw: 'TWD',
  th: 'THB',
  my: 'MYR',
  id: 'IDR',
  ph: 'PHP',
  vn: 'VND',
  pk: 'PKR',
  bd: 'BDT',
  lk: 'LKR',
  np: 'NPR',
  ae: 'AED',
  sa: 'SAR',
  qa: 'QAR',
  kw: 'KWD',
  bh: 'BHD',
  om: 'OMR',
  il: 'ILS',
  br: 'BRL',
  mx: 'MXN',
  ar: 'ARS',
  cl: 'CLP',
  co: 'COP',
  pe: 'PEN',
  za: 'ZAR',
  eg: 'EGP',
  ng: 'NGN',
  ke: 'KES',
  gh: 'GHS',
  ma: 'MAD',
};

/**
 * Full English and localized country names to ISO currency codes.
 */
const COUNTRY_NAME_TO_CURRENCY = {
  // India
  'india': 'INR', 'bharat': 'INR',

  // Nordic
  'sweden': 'SEK', 'sverige': 'SEK',
  'norway': 'NOK', 'norge': 'NOK',
  'denmark': 'DKK', 'danmark': 'DKK',
  'iceland': 'ISK', 'ísland': 'ISK',
  'finland': 'EUR', 'suomi': 'EUR',

  // North America
  'united states': 'USD', 'united states of america': 'USD', 'usa': 'USD',
  'canada': 'CAD',
  'mexico': 'MXN',

  // UK & Ireland
  'united kingdom': 'GBP', 'great britain': 'GBP', 'england': 'GBP', 'scotland': 'GBP', 'wales': 'GBP',
  'ireland': 'EUR',

  // Eurozone
  'germany': 'EUR', 'deutschland': 'EUR',
  'france': 'EUR',
  'italy': 'EUR', 'italia': 'EUR',
  'spain': 'EUR', 'españa': 'EUR',
  'netherlands': 'EUR', 'holland': 'EUR',
  'belgium': 'EUR',
  'austria': 'EUR', 'österreich': 'EUR',
  'portugal': 'EUR',
  'greece': 'EUR', 'hellas': 'EUR',
  'luxembourg': 'EUR',
  'cyprus': 'EUR',
  'malta': 'EUR',
  'slovakia': 'EUR',
  'slovenia': 'EUR',
  'estonia': 'EUR',
  'latvia': 'EUR',
  'lithuania': 'EUR',
  'croatia': 'EUR',

  // Non-Euro Europe
  'switzerland': 'CHF', 'swiss': 'CHF', 'schweiz': 'CHF',
  'poland': 'PLN', 'polska': 'PLN',
  'czech republic': 'CZK', 'czechia': 'CZK', 'česká republika': 'CZK',
  'hungary': 'HUF', 'magyarország': 'HUF',
  'romania': 'RON',
  'bulgaria': 'BGN',
  'turkey': 'TRY', 'türkiye': 'TRY',
  'russia': 'RUB', 'russian federation': 'RUB',
  'ukraine': 'UAH',

  // Asia Pacific
  'japan': 'JPY', 'nippon': 'JPY',
  'china': 'CNY', "people's republic of china": 'CNY',
  'south korea': 'KRW', 'korea': 'KRW', 'republic of korea': 'KRW',
  'singapore': 'SGD',
  'hong kong': 'HKD',
  'taiwan': 'TWD',
  'thailand': 'THB',
  'malaysia': 'MYR',
  'indonesia': 'IDR',
  'philippines': 'PHP',
  'vietnam': 'VND',
  'australia': 'AUD',
  'new zealand': 'NZD',

  // South Asia
  'pakistan': 'PKR',
  'bangladesh': 'BDT',
  'sri lanka': 'LKR',
  'nepal': 'NPR',

  // Middle East
  'united arab emirates': 'AED', 'uae': 'AED', 'dubai': 'AED', 'abu dhabi': 'AED',
  'saudi arabia': 'SAR',
  'qatar': 'QAR',
  'kuwait': 'KWD',
  'bahrain': 'BHD',
  'oman': 'OMR',
  'israel': 'ILS',

  // Latin America
  'brazil': 'BRL', 'brasil': 'BRL',
  'argentina': 'ARS',
  'chile': 'CLP',
  'colombia': 'COP',
  'peru': 'PEN',

  // Africa
  'south africa': 'ZAR',
  'egypt': 'EGP',
  'nigeria': 'NGN',
  'kenya': 'KES',
  'ghana': 'GHS',
  'morocco': 'MAD',
};

/**
 * Combined country dictionary for backward compatibility.
 */
export const COUNTRY_TO_CURRENCY = {
  ...ISO_COUNTRY_CODE_TO_CURRENCY,
  ...COUNTRY_NAME_TO_CURRENCY,
};

/**
 * Derives a currency code from a country name or 2-letter ISO code.
 * Uses exact matching and word boundaries to completely prevent false substring collisions!
 */
export const getCurrencyFromCountry = (countryStr) => {
  if (!countryStr || typeof countryStr !== 'string') return 'USD';
  const raw = countryStr.trim();
  const normalized = raw.toLowerCase();

  // 1. Check if the string itself is already a valid 3-letter currency code (e.g. "SEK", "EUR", "USD")
  const upper = raw.toUpperCase();
  if (upper.length === 3 && (DEFAULT_EXCHANGE_RATES[upper] || SUPPORTED_CURRENCIES.some(c => c.code === upper))) {
    return upper;
  }

  // 2. Exact 2-letter ISO country code lookup (e.g. "SE" -> SEK, "IN" -> INR, "US" -> USD)
  if (normalized.length === 2 && ISO_COUNTRY_CODE_TO_CURRENCY[normalized]) {
    return ISO_COUNTRY_CODE_TO_CURRENCY[normalized];
  }

  // 3. Exact full country name lookup (e.g. "sweden" -> SEK, "finland" -> EUR)
  if (COUNTRY_NAME_TO_CURRENCY[normalized]) {
    return COUNTRY_NAME_TO_CURRENCY[normalized];
  }

  // 4. Safe phrase matching (only for whole-word country names >= 4 characters, NO 2-letter substrings)
  for (const [countryName, currCode] of Object.entries(COUNTRY_NAME_TO_CURRENCY)) {
    if (countryName.length >= 4) {
      // Check word boundary or direct inclusion of complete country name
      const regex = new RegExp(`\\b${countryName}\\b`, 'i');
      if (regex.test(normalized)) {
        return currCode;
      }
    }
  }

  return 'USD';
};

/**
 * Maps major timezone identifiers to local currencies for reliable fallback detection.
 */
export const getCurrencyFromTimeZone = (timeZone) => {
  if (!timeZone || typeof timeZone !== 'string') return null;

  // Nordic
  if (timeZone.includes('Stockholm')) return 'SEK';
  if (timeZone.includes('Oslo')) return 'NOK';
  if (timeZone.includes('Copenhagen')) return 'DKK';
  if (timeZone.includes('Reykjavik')) return 'ISK';
  if (timeZone.includes('Helsinki')) return 'EUR';

  // India
  if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('Asia/Kolkata')) return 'INR';

  // UK
  if (timeZone.includes('London')) return 'GBP';

  // Eurozone major cities
  if (
    timeZone.includes('Berlin') || timeZone.includes('Paris') || timeZone.includes('Rome') ||
    timeZone.includes('Madrid') || timeZone.includes('Amsterdam') || timeZone.includes('Vienna') ||
    timeZone.includes('Brussels') || timeZone.includes('Dublin') || timeZone.includes('Athens') ||
    timeZone.includes('Lisbon')
  ) return 'EUR';

  // Other European
  if (timeZone.includes('Zurich')) return 'CHF';
  if (timeZone.includes('Warsaw')) return 'PLN';
  if (timeZone.includes('Prague')) return 'CZK';
  if (timeZone.includes('Budapest')) return 'HUF';
  if (timeZone.includes('Bucharest')) return 'RON';
  if (timeZone.includes('Istanbul')) return 'TRY';
  if (timeZone.includes('Moscow')) return 'RUB';
  if (timeZone.includes('Kyiv') || timeZone.includes('Kiev')) return 'UAH';

  // Asia
  if (timeZone.includes('Tokyo')) return 'JPY';
  if (timeZone.includes('Seoul')) return 'KRW';
  if (timeZone.includes('Shanghai') || timeZone.includes('Chongqing') || timeZone.includes('Beijing')) return 'CNY';
  if (timeZone.includes('Hong_Kong')) return 'HKD';
  if (timeZone.includes('Taipei')) return 'TWD';
  if (timeZone.includes('Singapore')) return 'SGD';
  if (timeZone.includes('Bangkok')) return 'THB';
  if (timeZone.includes('Jakarta')) return 'IDR';
  if (timeZone.includes('Kuala_Lumpur')) return 'MYR';
  if (timeZone.includes('Manila')) return 'PHP';
  if (timeZone.includes('Ho_Chi_Minh') || timeZone.includes('Saigon')) return 'VND';
  if (timeZone.includes('Karachi')) return 'PKR';
  if (timeZone.includes('Dhaka')) return 'BDT';
  if (timeZone.includes('Colombo')) return 'LKR';
  if (timeZone.includes('Kathmandu')) return 'NPR';

  // Middle East
  if (timeZone.includes('Dubai')) return 'AED';
  if (timeZone.includes('Riyadh')) return 'SAR';
  if (timeZone.includes('Qatar')) return 'QAR';
  if (timeZone.includes('Kuwait')) return 'KWD';
  if (timeZone.includes('Jerusalem')) return 'ILS';

  // Americas
  if (
    timeZone.includes('New_York') || timeZone.includes('Chicago') ||
    timeZone.includes('Los_Angeles') || timeZone.includes('Denver') ||
    timeZone.includes('Phoenix')
  ) return 'USD';
  if (timeZone.includes('Toronto') || timeZone.includes('Vancouver') || timeZone.includes('Montreal')) return 'CAD';
  if (timeZone.includes('Sao_Paulo')) return 'BRL';
  if (timeZone.includes('Mexico_City')) return 'MXN';
  if (timeZone.includes('Buenos_Aires')) return 'ARS';
  if (timeZone.includes('Santiago')) return 'CLP';
  if (timeZone.includes('Bogota')) return 'COP';
  if (timeZone.includes('Lima')) return 'PEN';

  // Australia / NZ
  if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || timeZone.includes('Brisbane') || timeZone.includes('Perth')) return 'AUD';
  if (timeZone.includes('Auckland')) return 'NZD';

  // Africa
  if (timeZone.includes('Johannesburg')) return 'ZAR';
  if (timeZone.includes('Cairo')) return 'EGP';
  if (timeZone.includes('Lagos')) return 'NGN';
  if (timeZone.includes('Nairobi')) return 'KES';

  return null;
};

/**
 * Returns dynamic currency metadata (symbol, English display name, locale) for ANY valid ISO currency.
 */
export const getCurrencyMeta = (currencyCode) => {
  const code = (currencyCode || 'USD').toUpperCase();
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (found) return found;

  // Dynamically resolve using modern browser Intl API
  let name = code;
  let symbol = code + ' ';
  try {
    if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
      name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code;
    }
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(1);
      const symPart = parts.find(p => p.type === 'currency');
      if (symPart && symPart.value) {
        symbol = symPart.value;
      }
    }
  } catch (e) {}

  return {
    code,
    symbol,
    name,
    locale: 'en-US'
  };
};

/**
 * Returns the list of supported currencies, guaranteeing that activeCurrency is included in the options.
 */
export const getAvailableCurrencies = (activeCurrency = null) => {
  const list = [...SUPPORTED_CURRENCIES];
  if (activeCurrency) {
    const clean = activeCurrency.toUpperCase();
    if (!list.some(c => c.code === clean)) {
      list.unshift(getCurrencyMeta(clean));
    }
  }
  return list;
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
 * Mathematically verified: (amount * toRate) / fromRate.
 */
export const convertAmount = (amount, toCurrency = 'USD', fromCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES) => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 0;
  const cleanTo = (toCurrency || 'USD').toUpperCase();
  const cleanFrom = (fromCurrency || 'USD').toUpperCase();
  if (cleanTo === cleanFrom) return num;

  const toRate = rates[cleanTo] ?? DEFAULT_EXCHANGE_RATES[cleanTo];
  const fromRate = rates[cleanFrom] ?? DEFAULT_EXCHANGE_RATES[cleanFrom];

  // If rate is somehow completely unknown, fall back safely to 1.0
  const safeToRate = toRate !== undefined && toRate > 0 ? toRate : 1.0;
  const safeFromRate = fromRate !== undefined && fromRate > 0 ? fromRate : 1.0;

  return (num * safeToRate) / safeFromRate;
};

/**
 * Converts an entered amount in current currency back to base currency (USD) for storage.
 */
export const toBaseAmount = (amountInCurrentCurrency, currentCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES) => {
  const num = Number(amountInCurrentCurrency);
  if (isNaN(num) || num === 0) return 0;
  const clean = (currentCurrency || 'USD').toUpperCase();
  const currentRate = rates[clean] ?? DEFAULT_EXCHANGE_RATES[clean] ?? 1.0;
  return num / currentRate;
};

/**
 * Formats a monetary amount from fromCurrency into user's chosen targetCurrency with appropriate symbol and localization.
 */
export const formatCurrency = (amount, targetCurrency = 'USD', rates = DEFAULT_EXCHANGE_RATES, fromCurrency = null) => {
  const num = Number(amount);
  const safeNum = isNaN(num) ? 0 : num;
  const cleanTarget = (targetCurrency || 'USD').toUpperCase();
  const cleanFrom = (fromCurrency || cleanTarget).toUpperCase();

  const converted = convertAmount(safeNum, cleanTarget, cleanFrom, rates);
  const meta = getCurrencyMeta(cleanTarget);

  const decimals = meta.decimalDigits !== undefined ? meta.decimalDigits : 2;

  try {
    return new Intl.NumberFormat(meta.locale || 'en-US', {
      style: 'currency',
      currency: cleanTarget,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(converted);
  } catch (e) {
    const sym = meta.symbol || cleanTarget + ' ';
    return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
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
      if (data && (data.country_name || data.country_code)) {
        const country = data.country_name || data.country_code;
        const city = data.city || '';
        const countryCode = data.country_code || '';
        const currency = data.currency || getCurrencyFromCountry(countryCode || country);
        const postal = data.postal || '';
        return { city, country, countryCode, currency, postal, source: 'ipapi' };
      }
    }
  } catch (e) {}

  // Service 2: ipwho.is
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.country) {
        const country = data.country;
        const city = data.city || '';
        const countryCode = data.country_code || '';
        const currency = data.currency?.code || getCurrencyFromCountry(countryCode || country);
        const postal = data.postal || '';
        return { city, country, countryCode, currency, postal, source: 'ipwhois' };
      }
    }
  } catch (e) {}

  // Service 3: Browser locale / timezone inference fallback
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzCurr = getCurrencyFromTimeZone(timeZone);
    if (tzCurr) {
      return {
        city: timeZone.split('/')[1]?.replace(/_/g, ' ') || '',
        country: '',
        countryCode: '',
        currency: tzCurr,
        postal: '',
        source: 'timezone'
      };
    }
  } catch (e) {}

  const envDefault = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_CURRENCY)
    ? import.meta.env.VITE_DEFAULT_CURRENCY.toUpperCase()
    : 'INR';

  return {
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    currency: envDefault,
    postal: '10001',
    source: 'default'
  };
};

/**
 * Returns user's detected default currency based on timezone/locale, defaulting to configured default currency.
 */
export const detectDefaultCurrency = () => {
  const envDefault = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_CURRENCY)
    ? import.meta.env.VITE_DEFAULT_CURRENCY.toUpperCase()
    : 'INR';

  if (typeof window === 'undefined') return envDefault;
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone) {
      const tzCurr = getCurrencyFromTimeZone(timeZone);
      if (tzCurr) return tzCurr;
    }
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('-')) {
      const region = lang.split('-')[1];
      const regionCurr = getCurrencyFromCountry(region);
      if (regionCurr) return regionCurr;
    }
  } catch (e) {}
  return envDefault;
};
