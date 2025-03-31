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

// Add new components for enhanced BI features
const TrendAnalysis = ({ data, timeRange }) => {
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Calculate total margins for each day
  const dailyTotals = useMemo(() => {
    return data.map(day => {
      const total = Object.entries(day)
        .filter(([key]) => key.includes(' - ') && key !== 'Suited - ACA')
        .reduce((sum, [key, value]) => {
          // Combine Suited - ACA with ACA - ACA
          if (key === 'ACA - ACA') {
            return sum + value + (day['Suited - ACA'] || 0);
          }
          return sum + value;
        }, 0);
      return { date: day.date, total };
    });
  }, [data]);

  // Calculate week-over-week growth
  const growth = useMemo(() => {
    if (dailyTotals.length < timeRange * 2) return 0;
    
    const currentTotal = _.sum(dailyTotals.slice(-timeRange).map(d => d.total));
    const previousTotal = _.sum(dailyTotals.slice(-timeRange * 2, -timeRange).map(d => d.total));
    
    return calculateGrowth(currentTotal, previousTotal);
  }, [dailyTotals, timeRange]);

  // Calculate moving averages
  const movingAverages = useMemo(() => {
    return dailyTotals.map((day, index, array) => {
      const last7Days = array.slice(Math.max(0, index - 6), index + 1);
      const last30Days = array.slice(Math.max(0, index - 29), index + 1);
      return {
        date: day.date,
        total: day.total,
        '7d_avg': _.meanBy(last7Days, 'total'),
        '30d_avg': _.meanBy(last30Days, 'total')
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Growth Rate ({timeRange}d)</div>
          <div className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">30-Day Trend</div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movingAverages.slice(-30)}>
                <Line type="monotone" dataKey="7d_avg" stroke="#3B82F6" dot={false} />
                <Line type="monotone" dataKey="30d_avg" stroke="#10B981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
          const rawDataEntry = performanceData.find(entry => 
            new Date(entry.Date).toISOString().split('T')[0] === day.date &&
            `${entry.Network} - ${entry.Offer}` === networkOffer
          );

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
        
        // Calculate ROI as (Revenue - Spend) / Spend * 100
        const roi = totalSpend > 0 ? (totalMargin / totalSpend) * 100 : 0;
        
        // Calculate consistency using coefficient of variation
        const margins = offerData.map(d => d.margin);
        const stdDev = calculateStandardDeviation(margins);
        const consistency = meanMargin !== 0 ? 
          100 * (1 - (stdDev / Math.abs(meanMargin))) : 
          0;

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
                  Consistency: {offer.consistency.toFixed(1)}%
                  <div className="hidden group-hover:block absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Higher % means more stable daily margins
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
    
    return performanceData.filter(entry => {
      const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
      const entryDate = new Date(year, month - 1, day);
      const matchesDate = entryDate >= startOfDay(dateRange.startDate) && entryDate <= endOfDay(dateRange.endDate);
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
      const date = new Date(entry.Date).toISOString().split('T')[0];
      const networkOffer = `${entry.Network} - ${entry.Offer}`;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          displayDate: new Date(entry.Date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        };
      }
      
      if (!acc[date][networkOffer]) {
        acc[date][networkOffer] = 0;
      }
      
      // Calculate margin
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      const spend = parseFloat(entry['Ad Spend'] || 0);
      acc[date][networkOffer] += revenue - spend;
      
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
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
      {/* Date Range Selector */}
      <div className="mb-6">
        <EnhancedDateSelector
          onDateChange={onDateChange}
          selectedPeriod={dateRange.period}
          defaultRange="last7"
          latestDate={latestDate}
              />
            </div>

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
