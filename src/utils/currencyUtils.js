import { CURRENCIES } from './CURRENCIES';

const CONVERSION_RATES = {
  USD: 1.0,
  EUR: 1.08,  
  GBP: 1.28,  
  UGX: 0.00027, 
};

/**
 * Convert an amount from one currency to another
 * @param {number} amount 
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number} 
 */
export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
  if (fromCurrency === toCurrency) return amount;
  
  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount * (CONVERSION_RATES[fromCurrency] || 1);
  
  if (toCurrency === 'USD') return amountInUSD;
  
  return amountInUSD / (CONVERSION_RATES[toCurrency] || 1);
};

/**
 * Format a monetary amount with the appropriate currency symbol
 * @param {number} amount 
 * @param {string} currencyCode 
 * @returns {string} 
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  }).format(amount).replace(/[^\d.,()-]/g, '') + ' ' + currency.symbol;
};

/**
 * Get the currency symbol for a given currency code
 * @param {string} currencyCode - The currency code
 * @returns {string} - The currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '$';
};