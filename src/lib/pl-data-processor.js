// lib/pl-data-processor.js
import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { sumBy } from 'lodash';

const cleanValue = (value) => {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[$,]/g, '').trim()) || 0;
  }
  return value || 0;
};

const calculateRoi = (revenue, spend) => {
  return spend === 0 ? null : ((revenue / spend - 1) * 100);
};

export const processPerformanceData = (data, dateRange) => {
  try {
    if (!data || !Array.isArray(data)) return {};

    // Current month is January 2025
    const currentMonthStart = new Date(2025, 0, 1); // Jan 1, 2025
    const currentMonthEnd = new Date(2025, 0, 31); // Jan 31, 2025
    // Previous month is December 2024
    const previousMonthStart = new Date(2024, 11, 1); // Dec 1, 2024
    const previousMonthEnd = new Date(2024, 11, 31); // Dec 31, 2024

    // Filter data for current month
    const currentMonthData = data.filter(row => {
      const rowDate = parse(row.Date, 'M/d/yyyy', new Date());
      const compareDate = startOfDay(rowDate);
      return compareDate >= startOfDay(currentMonthStart) && compareDate <= startOfDay(currentMonthEnd);
    });

    // Filter data for previous month
    const previousMonthData = data.filter(row => {
      const rowDate = parse(row.Date, 'M/d/yyyy', new Date());
      const compareDate = startOfDay(rowDate);
      return compareDate >= startOfDay(previousMonthStart) && compareDate <= startOfDay(previousMonthEnd);
    });

    console.log('Filtered Data:', {
      currentMonth: {
        dateRange: `${currentMonthStart.toLocaleDateString()} - ${currentMonthEnd.toLocaleDateString()}`,
        count: currentMonthData.length,
        sample: currentMonthData.slice(0, 2).map(row => row.Date)
      },
      previousMonth: {
        dateRange: `${previousMonthStart.toLocaleDateString()} - ${previousMonthEnd.toLocaleDateString()}`,
        count: previousMonthData.length,
        sample: previousMonthData.slice(0, 2).map(row => row.Date)
      }
    });

    // Calculate current month metrics
    const currentMetrics = {
      totalRevenue: sumBy(currentMonthData, row => cleanValue(row['Ad Revenue']) + cleanValue(row['Comment Revenue'])),
      totalSpend: sumBy(currentMonthData, row => cleanValue(row['Ad Spend'])),
      totalMargin: sumBy(currentMonthData, row => cleanValue(row.Margin)),
    };
    currentMetrics.roi = currentMetrics.totalSpend ? (currentMetrics.totalMargin / currentMetrics.totalSpend) * 100 : 0;

    // Calculate previous month metrics
    const previousMetrics = {
      totalRevenue: sumBy(previousMonthData, row => cleanValue(row['Ad Revenue']) + cleanValue(row['Comment Revenue'])),
      totalSpend: sumBy(previousMonthData, row => cleanValue(row['Ad Spend'])),
      totalMargin: sumBy(previousMonthData, row => cleanValue(row.Margin)),
    };
    previousMetrics.roi = previousMetrics.totalSpend ? (previousMetrics.totalMargin / previousMetrics.totalSpend) * 100 : 0;

    // Add debug logging for metrics
    console.log('Calculated Metrics:', {
      current: {
        month: 'January 2025',
        ...currentMetrics
      },
      previous: {
        month: 'December 2024',
        ...previousMetrics
      }
    });

    return {
      filteredData: data,
      overallMetrics: {
        ...currentMetrics,
        previousMonthRevenue: previousMetrics.totalRevenue,
        previousMonthSpend: previousMetrics.totalSpend,
        previousMonthMargin: previousMetrics.totalMargin,
        previousMonthRoi: previousMetrics.roi
      },
      networkPerformance: [],
      mediaBuyerPerformance: [],
      offerPerformance: [],
    };
  } catch (error) {
    console.error('Error processing performance data:', error);
    return {};
  }
};