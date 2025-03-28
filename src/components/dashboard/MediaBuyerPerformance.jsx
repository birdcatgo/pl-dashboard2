import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../ui/card';
import PerformanceMetrics from './PerformanceMetrics';
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend
} from 'recharts';
import MultiSelect from '../ui/multi-select';
import { Line as ChartJSLine } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Add this helper function for row grouping
const groupDataByMediaBuyer = (data) => {
  // First group by media buyer
  const buyerGroups = data.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    if (!acc[buyer]) {
      acc[buyer] = {
        mediaBuyer: buyer,
        revenue: 0,
        spend: 0,
        margin: 0,
        networks: {}
      };
    }
    
    // Add to buyer totals
    acc[buyer].revenue += parseFloat(entry['Total Revenue'] || 0);
    acc[buyer].spend += parseFloat(entry['Ad Spend'] || 0);
    acc[buyer].margin += parseFloat(entry.Margin || 0);
    
    // Group by network within each buyer
    const network = entry.Network;
    if (!acc[buyer].networks[network]) {
      acc[buyer].networks[network] = {
        network,
        revenue: 0,
        spend: 0,
        margin: 0
      };
    }
    
    // Add to network totals
    acc[buyer].networks[network].revenue += parseFloat(entry['Total Revenue'] || 0);
    acc[buyer].networks[network].spend += parseFloat(entry['Ad Spend'] || 0);
    acc[buyer].networks[network].margin += parseFloat(entry.Margin || 0);
    
    return acc;
  }, {});
  
  // Convert to array and sort by revenue
  return Object.values(buyerGroups)
    .sort((a, b) => b.revenue - a.revenue);
};

// Add this helper function for trend analysis
const analyzeTrend = (data, buyer) => {
  // Get buyer's daily margins for the period
  const dailyMargins = data
    .filter(entry => entry['Media Buyer'] === buyer)
    .reduce((acc, entry) => {
      const date = entry.Date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += parseFloat(entry.Margin || 0);
      return acc;
    }, {});

  const margins = Object.values(dailyMargins);
  if (margins.length < 2) return { type: 'insufficient', label: 'Insufficient Data' };

  // Calculate trend
  let increases = 0;
  let decreases = 0;
  let stabilityCount = 0;
  const threshold = 0.1; // 10% change threshold for stability

  for (let i = 1; i < margins.length; i++) {
    const change = (margins[i] - margins[i-1]) / margins[i-1];
    if (Math.abs(change) <= threshold) {
      stabilityCount++;
    } else if (change > threshold) {
      increases++;
    } else {
      decreases++;
    }
  }

  // Determine trend type
  if (stabilityCount > margins.length * 0.6) {
    return { 
      type: 'stable',
      label: 'Stable',
      color: 'text-blue-600',
      icon: 'horizontal'
    };
  } else if (increases > decreases * 1.5) {
    return { 
      type: 'improving',
      label: 'Improving',
      color: 'text-green-600',
      icon: 'up'
    };
  } else if (decreases > increases * 1.5) {
    return { 
      type: 'declining',
      label: 'Declining',
      color: 'text-red-600',
      icon: 'down'
    };
  } else {
    return { 
      type: 'inconsistent',
      label: 'Inconsistent',
      color: 'text-yellow-600',
      icon: 'volatile'
    };
  }
};

// Add a helper function to format date range
const formatDateRange = (startDate, endDate) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const MediaBuyerPerformance = ({ performanceData, dateRange }) => {
  const [selectedBuyers, setSelectedBuyers] = useState(['all']);
  const [selectedNetworks, setSelectedNetworks] = useState(['all']);
  const [expandedBuyers, setExpandedBuyers] = useState(new Set());
  const [isCumulative, setIsCumulative] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState(new Set());

  // First filter data by date range - Optimize the date comparison
  const filteredByDate = useMemo(() => {
    if (!performanceData?.length) return [];

    // Pre-calculate the comparison dates once
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Create a cache for parsed dates to avoid repeated parsing
    const dateCache = new Map();

    return performanceData.filter(entry => {
      if (!entry.Date) return false;

      try {
        // Use cached date if available
        let entryDate = dateCache.get(entry.Date);
        if (!entryDate) {
          const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
          entryDate = new Date(year, month - 1, day);
          entryDate.setUTCHours(0, 0, 0, 0);
          dateCache.set(entry.Date, entryDate);
        }

        return entryDate >= startDate && entryDate <= endDate;
      } catch (error) {
        console.error('Error processing date:', error, entry);
        return false;
      }
    });
  }, [performanceData, dateRange.startDate, dateRange.endDate]); // Remove dateRange object to prevent unnecessary recalculation

  // Then process the filtered data - Optimize the data processing
  const processedData = useMemo(() => {
    if (!filteredByDate.length) return { buyerMetrics: [], buyerOptions: ['all'] };

    // Pre-calculate field names to avoid repeated lookups
    const buyerData = new Map();
    const buyerOptions = new Set(['all']);

    // Single pass through the data
    filteredByDate.forEach(row => {
      const buyer = row.MediaBuyer || row['Media Buyer'] || 'Unknown';
      buyerOptions.add(buyer);

      let buyerMetrics = buyerData.get(buyer);
      if (!buyerMetrics) {
        buyerMetrics = {
          name: buyer,
          spend: 0,
          revenue: 0,
          margin: 0,
          networkData: new Map()
        };
        buyerData.set(buyer, buyerMetrics);
      }

      const spend = parseFloat(row.Spend || row['Ad Spend'] || row['Total Ad Spend'] || 0);
      const revenue = parseFloat(row.Revenue || row['Total Revenue'] || 0);
      const margin = revenue - spend;

      buyerMetrics.spend += spend;
      buyerMetrics.revenue += revenue;
      buyerMetrics.margin += margin;

      const network = row.Network;
      if (network) {
        let networkMetrics = buyerMetrics.networkData.get(network);
        if (!networkMetrics) {
          networkMetrics = { spend: 0, revenue: 0, margin: 0 };
          buyerMetrics.networkData.set(network, networkMetrics);
        }
        networkMetrics.spend += spend;
        networkMetrics.revenue += revenue;
        networkMetrics.margin += margin;
      }
    });

    // Convert Map to array and calculate final metrics
    const buyerMetrics = Array.from(buyerData.values()).map(metrics => ({
      ...metrics,
      roi: metrics.spend ? ((metrics.revenue / metrics.spend) - 1) * 100 : 0,
      networkData: Object.fromEntries(metrics.networkData)
    }));

    // Sort by margin descending
    buyerMetrics.sort((a, b) => b.margin - a.margin);

    return {
      buyerMetrics,
      buyerOptions: Array.from(buyerOptions)
    };
  }, [filteredByDate]);

  // Debug logging
  console.log('MediaBuyerPerformance state:', {
    dateRange,
    totalData: performanceData?.length,
    filteredData: filteredByDate.length,
    processedMetrics: processedData.buyerMetrics.length
  });

  // Get unique buyers and networks
  const { buyers, networks } = useMemo(() => {
    const buyersMap = new Map();
    const networksSet = new Set();
    
    // First pass: calculate total revenue for each buyer
    performanceData?.forEach(entry => {
      if (entry['Media Buyer']) {
        const revenue = parseFloat(entry['Total Revenue'] || 0);
        buyersMap.set(
          entry['Media Buyer'], 
          (buyersMap.get(entry['Media Buyer']) || 0) + revenue
        );
      }
      if (entry.Network) networksSet.add(entry.Network);
    });

    // Convert to array and sort by revenue
    const sortedBuyers = Array.from(buyersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([buyer]) => buyer);
    
    return {
      buyers: ['all', ...sortedBuyers],
      networks: ['all', ...Array.from(networksSet)]
    };
  }, [performanceData]);

  // Add this useEffect to debug date issues
  useEffect(() => {
    if (performanceData?.length) {
      const dates = performanceData
        .map(entry => entry.Date)
        .filter(Boolean)
        .map(date => {
          const [month, day, year] = date.split('/').map(num => parseInt(num, 10));
          return new Date(year, month - 1, day);
        })
        .sort((a, b) => b - a);

      console.log('Available Dates:', {
        latest: dates[0]?.toISOString(),
        earliest: dates[dates.length - 1]?.toISOString(),
        totalDates: dates.length,
        sampleDates: dates.slice(0, 3).map(d => d.toISOString())
      });
    }
  }, [performanceData]);

  // Add a useEffect to log the filtered results
  useEffect(() => {
    console.log('Filtered Data Results:', {
      totalRecords: filteredByDate.length,
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      },
      sampleDates: filteredByDate.slice(0, 5).map(d => d.Date)
    });
  }, [filteredByDate, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredByDate.length) return {};

    return filteredByDate.reduce((acc, entry) => ({
      totalRevenue: (acc.totalRevenue || 0) + parseFloat(entry['Total Revenue'] || 0),
      totalSpend: (acc.totalSpend || 0) + parseFloat(entry['Ad Spend'] || 0),
      totalMargin: (acc.totalMargin || 0) + parseFloat(entry.Margin || 0),
      roi: ((acc.totalMargin || 0) / (acc.totalSpend || 1)) * 100
    }), {});
  }, [filteredByDate]);

  const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

  // Prepare chart data with proper date sorting
  const chartData = useMemo(() => {
    if (!filteredByDate.length) return [];

    // Only process data for selected buyers
    const relevantBuyers = selectedBuyers.includes('all') 
      ? processedData.buyerOptions.filter(buyer => buyer !== 'all')
      : selectedBuyers;

    // Group data by date and offer for each buyer
    const dailyData = filteredByDate.reduce((acc, entry) => {
      if (!relevantBuyers.includes(entry['Media Buyer'])) return acc;

      const date = new Date(entry.Date).toISOString().split('T')[0];
      const buyerOffer = `${entry['Media Buyer']} - ${entry.Offer}`;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          displayDate: new Date(entry.Date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        };
      }
      
      if (!acc[date][buyerOffer]) {
        acc[date][buyerOffer] = 0;
      }
      
      // Calculate margin instead of using revenue
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      const spend = parseFloat(entry['Ad Spend'] || 0);
      acc[date][buyerOffer] += revenue - spend;
      return acc;
    }, {});

    // Sort dates in ascending order
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredByDate, selectedBuyers, processedData.buyerOptions]);

  // Get unique buyer-offer combinations for the graph
  const buyerOfferCombos = useMemo(() => {
    if (!filteredByDate.length) return [];

    const relevantBuyers = selectedBuyers.includes('all') 
      ? processedData.buyerOptions.filter(buyer => buyer !== 'all')
      : selectedBuyers;

    return [...new Set(filteredByDate
      .filter(entry => relevantBuyers.includes(entry['Media Buyer']))
      .map(entry => `${entry['Media Buyer']} - ${entry.Offer}`)
    )];
  }, [filteredByDate, selectedBuyers, processedData.buyerOptions]);

  // Generate colors for each buyer-offer combination
  const colorScale = useMemo(() => {
    return buyerOfferCombos.reduce((acc, combo, index) => {
      const hue = (index * 137.508) % 360; // Golden ratio for color distribution
      acc[combo] = `hsl(${hue}, 70%, 50%)`;
      return acc;
    }, {});
  }, [buyerOfferCombos]);

  // Process data for the profit graph with proper date sorting
  const profitChartData = useMemo(() => {
    if (!filteredByDate.length) return null;

    // Get unique dates and sort them
    const dates = [...new Set(filteredByDate.map(item => {
      const [month, day, year] = item.Date.split('/');
      return new Date(year, month - 1, day).toISOString().split('T')[0];
    }))].sort();

    const mediaBuyers = [...new Set(filteredByDate.map(item => item['Media Buyer']))];
    const colors = mediaBuyers.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });

    // Create datasets for each media buyer
    const datasets = mediaBuyers.map((buyer, index) => {
      let runningTotal = 0;
      const data = dates.map(date => {
        const dayData = filteredByDate.filter(item => {
          const itemDate = new Date(item.Date);
          const compareDate = new Date(date);
          return itemDate.toISOString().split('T')[0] === date && 
                 item['Media Buyer'] === buyer;
        });
        
        const dailyTotal = dayData.reduce((sum, item) => 
          sum + (parseFloat(item.Margin) || 0), 0
        );

        if (isCumulative) {
          runningTotal += dailyTotal;
          return runningTotal;
        }
        return dailyTotal;
      });

      return {
        label: buyer,
        data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.4,
        fill: false
      };
    });

    const formattedLabels = dates.map(date => 
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    );

    return {
      labels: formattedLabels,
      datasets
    };
  }, [filteredByDate, isCumulative]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        align: 'start'
      },
      title: {
        display: true,
        text: [
          'Daily Profit by Media Buyer',
          `Period: ${formatDateRange(dateRange.startDate, dateRange.endDate)}`
        ],
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        },
        title: {
          display: true,
          text: 'Profit'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  const toggleRow = (mediaBuyer) => {
    const newExpanded = new Set(expandedBuyers);
    if (newExpanded.has(mediaBuyer)) {
      newExpanded.delete(mediaBuyer);
    } else {
      newExpanded.add(mediaBuyer);
    }
    setExpandedBuyers(newExpanded);
  };

  const toggleBuyerExpansion = (buyerName) => {
    const newExpanded = new Set(expandedBuyers);
    if (newExpanded.has(buyerName)) {
      newExpanded.delete(buyerName);
    } else {
      newExpanded.add(buyerName);
    }
    setExpandedBuyers(newExpanded);
  };

  // Initialize selected offers when buyer-offer combos change
  useEffect(() => {
    setSelectedOffers(new Set(buyerOfferCombos));
  }, [buyerOfferCombos]);

  if (!performanceData?.length) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-gray-500">No media buyer performance data available for the selected date range</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Media Buyer Performance</h2>
            <MultiSelect
              options={processedData.buyerOptions}
              selected={selectedBuyers}
              onChange={setSelectedBuyers}
              placeholder="Select Media Buyers"
            />
          </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Media Buyer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spend
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {processedData.buyerMetrics
                  .filter(buyer => selectedBuyers.includes('all') || selectedBuyers.includes(buyer.name))
                  .map((buyer) => (
                    <React.Fragment key={buyer.name}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleBuyerExpansion(buyer.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          <span className="mr-2">
                            {expandedBuyers.has(buyer.name) ? '▼' : '▶'}
                          </span>
                          {buyer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.spend)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.margin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatPercent(buyer.roi)}
                        </td>
                      </tr>
                      {expandedBuyers.has(buyer.name) && Object.entries(buyer.networkData).map(([network, data]) => (
                        <tr key={`${buyer.name}-${network}`} className="bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500 pl-12">
                            {network}
                </td>
                          <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                            {formatCurrency(data.spend)}
                </td>
                          <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                            {formatCurrency(data.revenue)}
                </td>
                          <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                            {formatCurrency(data.margin)}
                </td>
                          <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                            {formatPercent(data.spend ? ((data.revenue / data.spend) - 1) * 100 : 0)}
                </td>
              </tr>
                      ))}
                    </React.Fragment>
                  ))}
              </tbody>
          </table>
        </div>
      </div>
      </Card>

      {/* Daily Revenue Graph */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedBuyers.includes('all') 
              ? 'Daily Margin by Offer (All Media Buyers)'
              : `Daily Margin by Offer (${selectedBuyers.join(', ')})`}
          </h3>

          {/* Color-coded offer list with checkboxes */}
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="w-full mb-2 flex justify-end">
              <button
                className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                onClick={() => setSelectedOffers(new Set(buyerOfferCombos))}
              >
                Select All
              </button>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setSelectedOffers(new Set())}
              >
                Clear All
              </button>
            </div>
            {buyerOfferCombos.map((combo) => (
              <div
                key={combo}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer"
                style={{
                  backgroundColor: selectedOffers.has(combo) ? `${colorScale[combo]}20` : '#f3f4f6',
                  color: selectedOffers.has(combo) ? colorScale[combo] : '#6b7280',
                  border: `1px solid ${selectedOffers.has(combo) ? colorScale[combo] : '#e5e7eb'}`
                }}
                onClick={() => {
                  const newSelected = new Set(selectedOffers);
                  if (newSelected.has(combo)) {
                    newSelected.delete(combo);
                  } else {
                    newSelected.add(combo);
                  }
                  setSelectedOffers(newSelected);
                }}
              >
                <Checkbox
                  checked={selectedOffers.has(combo)}
                  className="mr-2 h-4 w-4"
                  style={{
                    borderColor: selectedOffers.has(combo) ? colorScale[combo] : '#e5e7eb'
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
                  tickFormatter={formatCurrency}
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
                {buyerOfferCombos
                  .filter(combo => selectedOffers.has(combo))
                  .map((combo) => (
                    <RechartsLine 
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
        </div>
      </Card>
    </div>
  );
};

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

export default MediaBuyerPerformance;