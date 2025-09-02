/**
 * Utility functions for parsing and sorting month/year strings
 */

/**
 * Parse month and year from string like "August 2025"
 * @param {string} monthStr - Month string in format "Month Year"
 * @returns {number} - Numeric value for sorting (year * 12 + month)
 */
export const parseMonthYear = (monthStr) => {
  const monthNames = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  
  const parts = monthStr.split(' ');
  if (parts.length !== 2) return 0;
  
  const month = monthNames[parts[0]];
  const year = parseInt(parts[1]);
  
  if (!month || !year) return 0;
  
  return year * 12 + month;
};

/**
 * Sort months chronologically (most recent first)
 * @param {Array<string>} months - Array of month strings
 * @returns {Array<string>} - Sorted array of month strings
 */
export const sortMonthsDescending = (months) => {
  return months.sort((a, b) => parseMonthYear(b) - parseMonthYear(a));
};

/**
 * Sort months chronologically (oldest first)
 * @param {Array<string>} months - Array of month strings
 * @returns {Array<string>} - Sorted array of month strings
 */
export const sortMonthsAscending = (months) => {
  return months.sort((a, b) => parseMonthYear(a) - parseMonthYear(b));
};

/**
 * Get the most recent N months from data
 * @param {Object} monthlyData - Monthly data object
 * @param {number} count - Number of months to return
 * @returns {Array<string>} - Array of month strings
 */
export const getRecentMonths = (monthlyData, count = 3) => {
  if (!monthlyData) return [];
  
  return Object.keys(monthlyData)
    .sort((a, b) => parseMonthYear(b) - parseMonthYear(a))
    .slice(0, count);
};

/**
 * Extract year from month string
 * @param {string} monthStr - Month string in format "Month Year"
 * @returns {string} - Year as string
 */
export const extractYear = (monthStr) => {
  const parts = monthStr.split(' ');
  if (parts.length === 2 && /^\d{4}$/.test(parts[1])) {
    return parts[1];
  }
  
  // Fallback for old format without years
  const currentYear = new Date().getFullYear();
  return currentYear.toString();
};

/**
 * Check if a string matches the month pattern
 * @param {string} str - String to check
 * @returns {boolean} - True if matches month pattern
 */
export const isMonthPattern = (str) => {
  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(str);
};
