// lib/pl-data-processor.js
import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const cleanValue = (value) => {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[$,]/g, '').trim()) || 0;
  }
  return value || 0;
};

const calculateRoi = (revenue, spend) => {
  return spend === 0 ? null : ((revenue / spend - 1) * 100);
};

export function processPerformanceData(data, dateRange) {
  if (!data?.length) {
    return {
      overallMetrics: {},
      networkPerformance: [],
      mediaBuyerPerformance: [],
      filteredData: [],
      comparisonData: null
    };
  }

  const filteredData = data.filter(row => {
    if (!dateRange?.startDate || !dateRange?.endDate || !row.Date) return true;
    try {
      const rowDate = parse(row.Date, 'M/d/yyyy', new Date());
      return isWithinInterval(rowDate, {
        start: startOfDay(dateRange.startDate),
        end: endOfDay(dateRange.endDate)
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return false;
    }
  });

  // Calculate overall metrics
  const overallMetrics = {
    totalRevenue: _.sumBy(filteredData, row => cleanValue(row['Total Revenue'])),
    totalSpend: _.sumBy(filteredData, row => cleanValue(row['Ad Spend'])),
    totalMargin: _.sumBy(filteredData, row => cleanValue(row.Margin)),
    roi: calculateRoi(
      _.sumBy(filteredData, row => cleanValue(row['Total Revenue'])),
      _.sumBy(filteredData, row => cleanValue(row['Ad Spend']))
    )
  };

  // Process network performance
  const networkPerformance = _(filteredData)
    .groupBy('Network')
    .map((rows, network) => ({
      network,
      totalRevenue: _.sumBy(rows, row => cleanValue(row['Total Revenue'])),
      totalSpend: _.sumBy(rows, row => cleanValue(row['Ad Spend'])),
      totalMargin: _.sumBy(rows, row => cleanValue(row.Margin)),
      roi: calculateRoi(
        _.sumBy(rows, row => cleanValue(row['Total Revenue'])),
        _.sumBy(rows, row => cleanValue(row['Ad Spend']))
      )
    }))
    .orderBy(['totalRevenue'], ['desc'])
    .value();

  // Process media buyer performance
  const mediaBuyerPerformance = _(filteredData)
    .groupBy('Media Buyer')
    .map((rows, buyer) => ({
      buyer,
      totalRevenue: _.sumBy(rows, row => cleanValue(row['Total Revenue'])),
      totalSpend: _.sumBy(rows, row => cleanValue(row['Ad Spend'])),
      totalMargin: _.sumBy(rows, row => cleanValue(row.Margin)),
      roi: calculateRoi(
        _.sumBy(rows, row => cleanValue(row['Total Revenue'])),
        _.sumBy(rows, row => cleanValue(row['Ad Spend']))
      ),
      networks: _.uniq(rows.map(row => row.Network)).length
    }))
    .orderBy(['totalRevenue'], ['desc'])
    .value();

  // Process offer performance
  const offerPerformance = _(filteredData)
    .groupBy(row => `${row.Network}-${row.Offer}`)
    .map((rows, key) => {
      const [network, offer] = key.split('-');
      const totalRevenue = _.sumBy(rows, row => cleanValue(row['Total Revenue']));
      const totalSpend = _.sumBy(rows, row => cleanValue(row['Ad Spend']));
      const totalMargin = _.sumBy(rows, row => cleanValue(row.Margin));
      
      return {
        network,
        offer,
        totalRevenue,
        totalSpend,
        totalMargin,
        roi: calculateRoi(totalRevenue, totalSpend),
        networkCount: 1,
        buyerCount: _.uniq(_.map(rows, 'Media Buyer')).length,
        transactionCount: rows.length
      };
    })
    .orderBy(['totalRevenue'], ['desc'])
    .value();

  return {
    overallMetrics,
    networkPerformance,
    mediaBuyerPerformance,
    offerPerformance,
    filteredData,
    comparisonData: null
  };
}