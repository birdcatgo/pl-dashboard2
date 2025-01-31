// lib/pl-data-processor.js
import { format, parse, startOfMonth, endOfMonth, isSameMonth, subMonths } from 'date-fns';
import { sumBy } from 'lodash';

const cleanValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '').trim();
    return cleaned ? parseFloat(cleaned) : 0;
  }
  return 0;
};

const calculateRoi = (revenue, spend) => {
  if (!spend || spend === 0) return 0;
  return ((revenue / spend) - 1) * 100;
};

const calculateMetrics = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      totalRevenue: 0,
      totalSpend: 0,
      totalProfit: 0,
      totalMargin: 0,
      roi: 0,
      profitMargin: 0
    };
  }

  // Use the processed numeric values instead of trying to clean them again
  const totalRevenue = sumBy(data, row => (row.adRevenue || 0) + (row.commentRevenue || 0));
  const totalSpend = sumBy(data, row => row.adSpend || 0);
  const totalMargin = sumBy(data, row => row.margin || 0);
  const totalProfit = totalRevenue - totalSpend;
  
  return {
    totalRevenue,
    totalSpend,
    totalProfit,
    totalMargin,
    roi: calculateRoi(totalRevenue, totalSpend),
    profitMargin: totalRevenue ? (totalMargin / totalRevenue) * 100 : 0
  };
};

export const processPerformanceData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('No performance data to process');
    return {};
  }

  try {
    const processedData = data.map(row => {
      const date = row.Date;
      return {
        ...row,
        date
      };
    });

    return processedData;
  } catch (error) {
    console.error('Error processing performance data:', error);
    return {};
  }
};