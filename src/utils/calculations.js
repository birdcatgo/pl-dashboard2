/**
 * Calculates the percentage change between two values
 * @param {number} currentValue - The current value
 * @param {number} previousValue - The previous value to compare against
 * @returns {number|null} The percentage change or null if previous value is 0
 */
export const calculateChange = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return null;
  return ((currentValue - previousValue) / previousValue) * 100;
};

/**
 * Calculates the profit margin
 * @param {number} revenue - The total revenue
 * @param {number} expenses - The total expenses
 * @returns {number} The profit margin as a percentage
 */
export const calculateProfitMargin = (revenue, expenses) => {
  if (!revenue || revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};

/**
 * Calculates the ROI (Return on Investment)
 * @param {number} profit - The profit amount
 * @param {number} investment - The investment amount
 * @returns {number} The ROI as a percentage
 */
export const calculateROI = (profit, investment) => {
  if (!investment || investment === 0) return 0;
  return (profit / investment) * 100;
}; 