/**
 * Formats a number as currency
 * @param {number} value - The value to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '–';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number as a percentage
 * @param {number} value - The value to format
 * @returns {string} The formatted percentage string
 */
export const formatPercentage = (value) => {
  if (!value && value !== 0) return '–';
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (number) => {
  if (!number && number !== 0) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}; 