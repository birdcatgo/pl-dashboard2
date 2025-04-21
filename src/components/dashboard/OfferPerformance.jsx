import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PerformanceMetrics from './PerformanceMetrics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import MultiSelect from '../ui/multi-select';
import { ChevronDown, ChevronRight, TrendingUp, Award, AlertTriangle, Info, Search, Send } from 'lucide-react';
import _ from 'lodash';
import { Checkbox } from '../ui/checkbox';
import EnhancedDateSelector from './EnhancedDateSelector';
import { startOfDay, endOfDay } from 'date-fns';

// Helper functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateStandardDeviation = (values) => {
  const mean = _.mean(values);
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  return Math.sqrt(_.mean(squaredDiffs));
};

const calculateCorrelation = (x, y) => {
  const n = x.length;
  const sum1 = _.sum(x);
  const sum2 = _.sum(y);
  const sum1Sq = _.sum(_.map(x, v => v * v));
  const sum2Sq = _.sum(_.map(y, v => v * v));
  const pSum = _.sum(_.zipWith(x, y, (a, b) => a * b));
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  return den === 0 ? 0 : num / den;
};

const getConsistencyLabel = (consistency) => {
  if (consistency >= 90) return 'Very Stable';
  if (consistency >= 70) return 'Stable';
  if (consistency >= 50) return 'Moderate';
  if (consistency >= 30) return 'Variable';
  return 'Highly Variable';
};

// Add new components for enhanced BI features
const TrendAnalysis = ({ data, timeRange }) => {
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Calculate total margins for each day
  const dailyTotals = useMemo(() => {
    console.log('Calculating daily totals from data:', data);
    return data.map(day => {
      const total = Object.entries(day)
        .filter(([key]) => key.includes(' - '))  // Include all network-offer combinations
        .reduce((sum, [key, value]) => {
          // Skip date and displayDate fields
          if (key === 'date' || key === 'displayDate') return sum;
          return sum + (value || 0);
        }, 0);
      console.log(`Day ${day.date} total:`, total);
      return { date: day.date, total };
    });
  }, [data]);

  // Calculate week-over-week growth
  const growth = useMemo(() => {
    if (!dailyTotals.length) return 0;
    
    // Get the most recent timeRange days and previous timeRange days
    const currentPeriod = dailyTotals.slice(-timeRange);
    const previousPeriod = dailyTotals.slice(-timeRange * 2, -timeRange);
    
    // Debug log the values
    console.log('Growth Rate Calculation:', {
      currentPeriod: {
        days: currentPeriod.map(d => d.date),
        total: currentPeriod.reduce((sum, day) => sum + (day.total || 0), 0),
        dailyTotals: currentPeriod.map(d => d.total)
      },
      previousPeriod: {
        days: previousPeriod.map(d => d.date),
        total: previousPeriod.reduce((sum, day) => sum + (day.total || 0), 0),
        dailyTotals: previousPeriod.map(d => d.total)
      },
      timeRange,
      totalDays: dailyTotals.length
    });
    
    // Calculate totals for each period
    const currentTotal = currentPeriod.reduce((sum, day) => sum + (day.total || 0), 0);
    const previousTotal = previousPeriod.reduce((sum, day) => sum + (day.total || 0), 0);
    
    // If we have less than 14 days of data, compare with available previous data
    if (dailyTotals.length < timeRange * 2) {
      const availablePreviousDays = dailyTotals.slice(0, -timeRange);
      if (availablePreviousDays.length === 0) {
        console.log('No previous data available, returning 0');
        return 0;
      }
      
      const previousTotal = availablePreviousDays.reduce((sum, day) => sum + (day.total || 0), 0);
      const previousDaysCount = availablePreviousDays.length;
      
      // Normalize previous total to match current period length
      const normalizedPreviousTotal = (previousTotal / previousDaysCount) * timeRange;
      
      if (normalizedPreviousTotal === 0) {
        console.log('Previous total is 0, returning:', currentTotal > 0 ? 100 : 0);
        return currentTotal > 0 ? 100 : 0;
      }
      
      const growthRate = ((currentTotal - normalizedPreviousTotal) / Math.abs(normalizedPreviousTotal)) * 100;
      console.log('Calculated growth rate with normalized previous period:', growthRate);
      return isNaN(growthRate) ? 0 : growthRate;
    }
    
    // Calculate growth rate for full periods
    if (previousTotal === 0) {
      console.log('Previous total is 0, returning:', currentTotal > 0 ? 100 : 0);
      return currentTotal > 0 ? 100 : 0;
    }
    
    const growthRate = ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100;
    console.log('Calculated growth rate:', growthRate);
    return isNaN(growthRate) ? 0 : growthRate;
  }, [dailyTotals, timeRange]);

  // Calculate moving averages
  const movingAverages = useMemo(() => {
    if (!dailyTotals.length) return [];
    
    return dailyTotals.map((day, index, array) => {
      const last7Days = array.slice(Math.max(0, index - 6), index + 1);
      const last30Days = array.slice(Math.max(0, index - 29), index + 1);
      
      // Calculate averages, ensuring we have valid numbers
      const sevenDayAvg = last7Days.reduce((sum, d) => sum + (d.total || 0), 0) / last7Days.length;
      const thirtyDayAvg = last30Days.reduce((sum, d) => sum + (d.total || 0), 0) / last30Days.length;
      
      return {
        date: day.date,
        total: day.total || 0,
        '7d_avg': isNaN(sevenDayAvg) ? 0 : sevenDayAvg,
        '30d_avg': isNaN(thirtyDayAvg) ? 0 : thirtyDayAvg
      };
    });
  }, [dailyTotals]);

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-xl font-semibold">Performance Trends</h3>
        <div className="ml-2 group relative inline-block">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="hidden group-hover:block absolute left-0 top-6 w-80 p-2 bg-gray-800 text-white text-sm rounded-lg z-10">
            <strong>Growth Rate:</strong> Compares current {timeRange}-day total margin with previous {timeRange} days.<br /><br />
            <strong>30-Day Trend:</strong><br />
            • Blue line: 7-day moving average<br />
            • Green line: 30-day moving average
          </div>
        </div>
      </div>
      
      {/* Growth Rate Box */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="text-sm text-gray-500">Growth Rate ({timeRange}d)</div>
        <div className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth.toFixed(1)}%
        </div>
      </div>

      {/* 30-Day Trend Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-500 mb-4">30-Day Trend</div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movingAverages.slice(-30)}>
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Line 
                type="monotone" 
                dataKey="7d_avg" 
                stroke="#3B82F6" 
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
                name="7-Day Average"
              />
              <Line 
                type="monotone" 
                dataKey="30d_avg" 
                stroke="#10B981" 
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
                name="30-Day Average"
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Legend moved below the chart */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>7-Day Average (Short-term trend)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>30-Day Average (Long-term trend)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const TopPerformers = ({ data, period = 30, performanceData }) => {
  const topOffers = useMemo(() => {
    if (!data.length) return [];
    const recentData = data.slice(-period);
    
    // Get all network-offer combinations
    const networkOffers = new Set();
    recentData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key.includes(' - ') && key !== 'Suited - ACA') networkOffers.add(key);
      });
    });

    // Calculate metrics for each network-offer
    return Array.from(networkOffers)
      .map(networkOffer => {
        // For ACA - ACA, combine with Suited - ACA
        const isACA = networkOffer === 'ACA - ACA';
        
        const offerData = recentData.map(day => {
          const margin = isACA ? 
            (day[networkOffer] || 0) + (day['Suited - ACA'] || 0) : 
            (day[networkOffer] || 0);
          
          // Get the corresponding raw data entry for this day and offer
          const rawDataEntry = performanceData.find(entry => {
            try {
              if (!entry.Date) return false;
              const entryDate = new Date(entry.Date);
              // Validate if the date is valid before using it
              if (isNaN(entryDate.getTime())) return false;
              return entryDate.toISOString().split('T')[0] === day.date &&
                `${entry.Network} - ${entry.Offer}` === networkOffer;
            } catch (error) {
              // Handle any parsing errors
              console.error('Error parsing date:', entry.Date);
              return false;
            }
          });

          return {
            margin,
            revenue: rawDataEntry ? parseFloat(rawDataEntry['Total Revenue'] || 0) : 0,
            spend: rawDataEntry ? parseFloat(rawDataEntry['Ad Spend'] || 0) : 0
          };
        }).filter(d => !isNaN(d.margin));

        if (!offerData.length) return null;

        const totalMargin = _.sumBy(offerData, 'margin');
        const totalSpend = _.sumBy(offerData, 'spend');
        const meanMargin = _.mean(offerData.map(d => d.margin));
        
        // Calculate consistency using coefficient of variation
        const margins = offerData.map(d => d.margin);
        const stdDev = calculateStandardDeviation(margins);
        
        // Improved consistency calculation
        let consistency;
        if (meanMargin === 0) {
          consistency = 0;
        } else {
          const coefficientOfVariation = stdDev / Math.abs(meanMargin);
          // Cap the coefficient of variation at 1 to prevent negative consistency
          consistency = 100 * (1 - Math.min(coefficientOfVariation, 1));
        }

        // Calculate ROI
        const totalAdSpend = offerData.reduce((sum, d) => sum + d.spend, 0);
        const roi = totalAdSpend > 0 ? (totalMargin / totalAdSpend) * 100 : 0;

        return {
          networkOffer: isACA ? 'ACA - ACA (incl. Suited)' : networkOffer,
          totalMargin,
          avgMargin: meanMargin,
          roi,
          consistency
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.totalMargin - a.totalMargin)
      .slice(0, 5);
  }, [data, period, performanceData]);

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <Award className="w-5 h-5 mr-2 text-yellow-600" />
        <h3 className="text-xl font-semibold">Top Performers</h3>
        <div className="ml-2 group relative inline-block">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="hidden group-hover:block absolute left-0 top-6 w-80 p-2 bg-gray-800 text-white text-sm rounded-lg z-10">
            Shows the top 5 offers by total margin over the last {period} days.<br /><br />
            <strong>Metrics:</strong><br />
            • Total Margin: Net profit over the period<br />
            • ROI: (Margin / Spend) × 100<br />
            • Consistency: Stability of daily margins<br />
            (100% = perfectly stable, 0% = highly variable)
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {topOffers.map((offer, index) => (
          <div key={offer.networkOffer} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-400 mr-4">#{index + 1}</div>
              <div>
                <div className="font-medium">{offer.networkOffer}</div>
                <div className="text-sm text-gray-500">
                  <span className="group relative inline-block">
                    ROI: {offer.roi.toFixed(1)}%
                    <div className="hidden group-hover:block absolute left-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                      Return on investment percentage
                    </div>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600">{formatCurrency(offer.totalMargin)}</div>
              <div className="text-sm text-gray-500">
                <span className="group relative inline-block">
                  Consistency: {getConsistencyLabel(offer.consistency)}
                  <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    <div className="font-medium mb-1">Consistency Rating:</div>
                    <div className="space-y-1">
                      <div>• Very Stable: Daily margins vary by less than 10%</div>
                      <div>• Stable: Daily margins vary by 10-30%</div>
                      <div>• Moderate: Daily margins vary by 30-50%</div>
                      <div>• Variable: Daily margins vary by 50-70%</div>
                      <div>• Highly Variable: Daily margins vary by more than 70%</div>
                    </div>
                    <div className="mt-2 text-gray-300">
                      Technical: {offer.consistency.toFixed(1)}% (based on coefficient of variation)
                    </div>
                  </div>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const OfferPerformance = ({ performanceData, dateRange, onDateChange, latestDate }) => {
  const [selectedNetworks, setSelectedNetworks] = useState(['all']);
  const [selectedOffers, setSelectedOffers] = useState(['all']);
  const [selectedGraphOffers, setSelectedGraphOffers] = useState(new Set());
  const [showDetails, setShowDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get unique networks and offers for filters
  const { networks, offers } = useMemo(() => {
    const networksSet = new Set();
    const offersSet = new Set();
    
    performanceData?.forEach(entry => {
      if (entry.Network) networksSet.add(entry.Network);
      if (entry.Offer) offersSet.add(entry.Offer);
    });
    
    return {
      networks: ['all', ...Array.from(networksSet)],
      offers: ['all', ...Array.from(offersSet)]
    };
  }, [performanceData]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!performanceData || !dateRange) return [];
    
    // Get the end date from the date range
    const endDate = endOfDay(dateRange.endDate);
    // Calculate start date to include 14 days before the end date
    const startDate = startOfDay(new Date(endDate.getTime() - (14 * 24 * 60 * 60 * 1000)));
    
    return performanceData.filter(entry => {
      const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
      const entryDate = new Date(year, month - 1, day);
      const matchesDate = entryDate >= startDate && entryDate <= endDate;
      const matchesNetwork = selectedNetworks.includes('all') || selectedNetworks.includes(entry.Network);
      const matchesOffer = selectedOffers.includes('all') || selectedOffers.includes(entry.Offer);
      
      return matchesDate && matchesNetwork && matchesOffer;
    });
  }, [performanceData, dateRange, selectedNetworks, selectedOffers]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredData.length) return {};

    const totalRevenue = filteredData.reduce((sum, entry) => sum + parseFloat(entry['Total Revenue'] || 0), 0);
    const totalSpend = filteredData.reduce((sum, entry) => sum + parseFloat(entry['Ad Spend'] || 0), 0);
    const totalMargin = totalRevenue - totalSpend;
    const roi = totalSpend > 0 ? (totalMargin / totalSpend) * 100 : 0;

    return {
      totalRevenue,
      totalSpend,
      totalMargin,
      roi
    };
  }, [filteredData]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    // Group by date first
    const dailyData = filteredData.reduce((acc, entry) => {
      try {
        if (!entry.Date) return acc;
        const dateObj = new Date(entry.Date);
        // Check if valid date
        if (isNaN(dateObj.getTime())) return acc;
        
        const date = dateObj.toISOString().split('T')[0];
        const networkOffer = `${entry.Network} - ${entry.Offer}`;
        
        if (!acc[date]) {
          acc[date] = {
            date,
            displayDate: dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            }),
            total: 0
          };
        }
        
        if (!acc[date][networkOffer]) {
          acc[date][networkOffer] = 0;
        }
        
        // Calculate margin
        const revenue = parseFloat(entry['Total Revenue'] || 0);
        const spend = parseFloat(entry['Ad Spend'] || 0);
        const margin = revenue - spend;
        
        acc[date][networkOffer] += margin;
        acc[date].total += margin;
        
        return acc;
      } catch (error) {
        console.error('Error processing entry date:', entry.Date, error);
        return acc;
      }
    }, {});

    // Convert to array and sort by date
    const sortedData = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Log the data being passed to TrendAnalysis
    console.log('Chart data for TrendAnalysis:', {
      totalDays: sortedData.length,
      dateRange: sortedData.map(d => d.date),
      sampleData: sortedData.slice(0, 2)
    });

    return sortedData;
  }, [filteredData]);

  // Get unique network-offer combinations
  const networkOfferCombos = useMemo(() => {
    if (!filteredData.length) return [];

    return [...new Set(filteredData.map(entry => `${entry.Network} - ${entry.Offer}`))];
  }, [filteredData]);

  // Initialize selected graph offers when combos change
  useEffect(() => {
    setSelectedGraphOffers(new Set(networkOfferCombos));
  }, [networkOfferCombos]);

  // Generate color scale for network-offer combinations
  const colorScale = useMemo(() => {
    const colors = {};
    const goldenRatio = 0.618033988749895;
    let hue = Math.random();

    networkOfferCombos.forEach(combo => {
      hue += goldenRatio;
      hue %= 1;
      colors[combo] = `hsl(${Math.floor(hue * 360)}, 70%, 50%)`;
    });

    return colors;
  }, [networkOfferCombos]);

  // State for expanded offers
  const [expandedOffers, setExpandedOffers] = useState(new Set());

  const toggleOffer = (offerName) => {
    const newExpandedOffers = new Set(expandedOffers);
    if (newExpandedOffers.has(offerName)) {
      newExpandedOffers.delete(offerName);
    } else {
      newExpandedOffers.add(offerName);
    }
    setExpandedOffers(newExpandedOffers);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Offer Performance</h2>

        {/* Performance Metrics */}
        <PerformanceMetrics metrics={metrics} />

        {/* New BI Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendAnalysis data={chartData} timeRange={7} />
          <TopPerformers data={chartData} period={30} performanceData={performanceData} />
        </div>
        
        {/* Performance Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Daily Margin by Network-Offer</h3>
          
          {/* Color-coded offer list with checkboxes */}
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="w-full mb-2 flex justify-end">
              <button
                className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                onClick={() => setSelectedGraphOffers(new Set(networkOfferCombos))}
              >
                Select All
              </button>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setSelectedGraphOffers(new Set())}
              >
                Clear All
              </button>
            </div>
            {networkOfferCombos.map((combo) => (
              <div
                key={combo}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer"
                style={{
                  backgroundColor: selectedGraphOffers.has(combo) ? `${colorScale[combo]}20` : '#f3f4f6',
                  color: selectedGraphOffers.has(combo) ? colorScale[combo] : '#6b7280',
                  border: `1px solid ${selectedGraphOffers.has(combo) ? colorScale[combo] : '#e5e7eb'}`
                }}
                onClick={() => {
                  const newSelected = new Set(selectedGraphOffers);
                  if (newSelected.has(combo)) {
                    newSelected.delete(combo);
                  } else {
                    newSelected.add(combo);
                  }
                  setSelectedGraphOffers(newSelected);
                }}
              >
                <Checkbox
                  checked={selectedGraphOffers.has(combo)}
                  className="mr-2 h-4 w-4"
                  style={{
                    borderColor: selectedGraphOffers.has(combo) ? colorScale[combo] : '#e5e7eb'
                  }}
                />
                {combo}
              </div>
            ))}
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 40, right: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate"
                  tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                  height={60}
                  interval={Math.ceil(chartData.length / 15)}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <ReferenceLine 
                  y={0} 
                  stroke="red" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Break Even', 
                    position: 'right',
                    fill: 'red',
                    fontSize: 12
                  }}
                />
                {networkOfferCombos
                  .filter(combo => selectedGraphOffers.has(combo))
                  .map((combo) => (
                    <Line 
                      key={combo}
                      type="monotone" 
                      dataKey={combo}
                      stroke={colorScale[combo]}
                      name={combo}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Table */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Detailed Offer Performance</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Networks</label>
              <MultiSelect
                options={networks}
                selected={selectedNetworks}
                onChange={setSelectedNetworks}
                placeholder="Select Networks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offers</label>
              <MultiSelect
                options={offers}
                selected={selectedOffers}
                onChange={setSelectedOffers}
                placeholder="Select Offers"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((offer, index) => (
                  <React.Fragment key={`${offer.date}-${index}`}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleOffer(offer.date)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        <span className="mr-2">
                          {expandedOffers.has(offer.date) ? '▼' : '▶'}
                        </span>
                        {offer.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {selectedNetworks.includes('all') ? 'All Networks' : selectedNetworks.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {Object.entries(offer).map(([networkOffer, margin]) => {
                          if (networkOffer.includes(offer.date)) {
                            const [network, offer] = networkOffer.split(' - ');
                            return (
                              <div key={networkOffer}>
                                {network} - {offer}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {Object.entries(offer).map(([networkOffer, margin]) => {
                          if (networkOffer.includes(offer.date)) {
                            const [network, offer] = networkOffer.split(' - ');
                            return (
                              <div key={`${networkOffer}-spend`}>
                                {formatCurrency(margin)}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {Object.entries(offer).map(([networkOffer, margin]) => {
                          if (networkOffer.includes(offer.date)) {
                            const [network, offer] = networkOffer.split(' - ');
                            return (
                              <div key={`${networkOffer}-margin`}>
                                {formatCurrency(margin)}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {Object.entries(offer).map(([networkOffer, margin]) => {
                          if (networkOffer.includes(offer.date)) {
                            const [network, offer] = networkOffer.split(' - ');
                            return (
                              <div key={`${networkOffer}-roi`}>
                                {((margin / offer[`${network} - ${offer} Ad Spend`]) * 100).toFixed(1)}%
                              </div>
                            );
                          }
                          return null;
                        })}
                      </td>
                    </tr>
                    {expandedOffers.has(offer.date) && Object.entries(offer).map(([networkOffer, margin]) => {
                      if (networkOffer.includes(offer.date)) {
                        const [network, offer] = networkOffer.split(' - ');
                        return (
                          <tr 
                            key={`${networkOffer}-details`}
                            className="bg-gray-50"
                          >
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500 pl-12">
                              {network} - {offer}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                              {formatCurrency(margin)}
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OfferPerformance;
