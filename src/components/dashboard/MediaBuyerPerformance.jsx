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
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isCumulative, setIsCumulative] = useState(false);

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

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!performanceData) return [];

    return performanceData.filter(entry => {
      // Parse dates using local time to avoid timezone issues
      const [month, day, year] = entry.Date.split('/');
      const entryDate = new Date(year, month - 1, day);
      
      // Parse start and end dates the same way
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Set all times to midnight for consistent comparison
      entryDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const matchesDate = entryDate >= startDate && entryDate <= endDate;

      // Debug logging
      console.log('Date Check:', {
        rawEntryDate: entry.Date,
        parsedEntry: entryDate.toLocaleDateString(),
        parsedStart: startDate.toLocaleDateString(),
        parsedEnd: endDate.toLocaleDateString(),
        isAfterStart: entryDate >= startDate,
        isBeforeEnd: entryDate <= endDate,
        matches: matchesDate
      });

      const matchesBuyer = selectedBuyers.includes('all') || selectedBuyers.includes(entry['Media Buyer']);
      const matchesNetwork = selectedNetworks.includes('all') || selectedNetworks.includes(entry.Network);
      
      return matchesDate && matchesBuyer && matchesNetwork;
    });
  }, [performanceData, dateRange, selectedBuyers, selectedNetworks]);

  // Add a useEffect to log the filtered results
  useEffect(() => {
    console.log('Filtered Data Results:', {
      totalRecords: filteredData.length,
      dateRange: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString()
      },
      sampleDates: filteredData.slice(0, 5).map(d => d.Date)
    });
  }, [filteredData, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredData.length) return {};

    return filteredData.reduce((acc, entry) => ({
      totalRevenue: (acc.totalRevenue || 0) + parseFloat(entry['Total Revenue'] || 0),
      totalSpend: (acc.totalSpend || 0) + parseFloat(entry['Ad Spend'] || 0),
      totalMargin: (acc.totalMargin || 0) + parseFloat(entry.Margin || 0),
      roi: ((acc.totalMargin || 0) / (acc.totalSpend || 1)) * 100
    }), {});
  }, [filteredData]);

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
    if (!filteredData.length) return [];

    // Group data by date
    const dailyData = filteredData.reduce((acc, entry) => {
      const date = new Date(entry.Date).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          displayDate: new Date(entry.Date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          revenue: 0,
          spend: 0,
          margin: 0
        };
      }
      
      acc[date].revenue += parseFloat(entry['Total Revenue'] || 0);
      acc[date].spend += parseFloat(entry['Ad Spend'] || 0);
      acc[date].margin += parseFloat(entry.Margin || 0);
      
      return acc;
    }, {});

    // Sort dates in ascending order
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  // Process data for the profit graph with proper date sorting
  const profitChartData = useMemo(() => {
    if (!filteredData.length) return null;

    // Get unique dates and sort them
    const dates = [...new Set(filteredData.map(item => {
      const [month, day, year] = item.Date.split('/');
      return new Date(year, month - 1, day).toISOString().split('T')[0];
    }))].sort();

    const mediaBuyers = [...new Set(filteredData.map(item => item['Media Buyer']))];
    const colors = mediaBuyers.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });

    // Create datasets for each media buyer
    const datasets = mediaBuyers.map((buyer, index) => {
      let runningTotal = 0;
      const data = dates.map(date => {
        const dayData = filteredData.filter(item => {
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
  }, [filteredData, isCumulative]);

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
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(mediaBuyer)) {
      newExpanded.delete(mediaBuyer);
    } else {
      newExpanded.add(mediaBuyer);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Media Buyer Performance</h2>
        
        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Buyers</label>
              <MultiSelect
                options={buyers}
                selected={selectedBuyers}
                onChange={setSelectedBuyers}
                placeholder="Select Media Buyers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Networks</label>
              <MultiSelect
                options={networks}
                selected={selectedNetworks}
                onChange={setSelectedNetworks}
                placeholder="Select Networks"
              />
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <PerformanceMetrics metrics={metrics} />

        {/* Performance Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Daily Performance</h3>
            <span className="text-sm text-gray-500">
              {formatDateRange(dateRange.startDate, dateRange.endDate)}
            </span>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 40, right: 40, bottom: 40 }}>
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
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <RechartsLegend />
                <RechartsLine 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4F46E5" 
                  name="Revenue"
                  strokeWidth={2}
                  dot={false}
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="margin" 
                  stroke="#10B981" 
                  name="Margin"
                  strokeWidth={2}
                  dot={false}
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#EF4444" 
                  name="Spend"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily Profit by Media Buyer Graph */}
        {profitChartData && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-semibold">
                  {isCumulative ? 'Cumulative' : 'Daily'} Profit by Media Buyer
                </h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isCumulative}
                    onCheckedChange={setIsCumulative}
                    id="cumulative-mode"
                  />
                  <label 
                    htmlFor="cumulative-mode" 
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Show Cumulative
                  </label>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {formatDateRange(dateRange.startDate, dateRange.endDate)}
              </span>
            </div>
            <div className="h-[400px]">
              <ChartJSLine 
                data={profitChartData} 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: [
                        `${isCumulative ? 'Cumulative' : 'Daily'} Profit by Media Buyer`,
                        `Period: ${formatDateRange(dateRange.startDate, dateRange.endDate)}`
                      ]
                    }
                  }
                }} 
              />
            </div>
          </Card>
        )}

        {/* Detailed Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Detailed Media Buyer Performance</h3>
            <span className="text-sm text-gray-500">
              {formatDateRange(dateRange.startDate, dateRange.endDate)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Media Buyer / Network
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spend
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupDataByMediaBuyer(filteredData).map((buyerData) => (
                  <React.Fragment key={buyerData.mediaBuyer}>
                    {/* Media Buyer Row */}
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(buyerData.mediaBuyer)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        <span className="mr-2">
                          {expandedRows.has(buyerData.mediaBuyer) ? '▼' : '▶'}
                        </span>
                        {buyerData.mediaBuyer}
                        {/* Add trend indicator */}
                        {(() => {
                          const trend = analyzeTrend(filteredData, buyerData.mediaBuyer);
                          return (
                            <span className={`ml-2 ${trend.color} flex items-center`}>
                              {trend.icon === 'up' && <TrendingUp className="w-4 h-4" />}
                              {trend.icon === 'down' && <TrendingDown className="w-4 h-4" />}
                              {trend.icon === 'horizontal' && <ArrowRight className="w-4 h-4" />}
                              {trend.icon === 'volatile' && <Activity className="w-4 h-4" />}
                              <span className="ml-1 text-xs">{trend.label}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(buyerData.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(buyerData.spend)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(buyerData.margin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {((buyerData.margin / buyerData.spend) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Network Breakdown Rows */}
                    {expandedRows.has(buyerData.mediaBuyer) && 
                      Object.values(buyerData.networks)
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((networkData) => (
                          <tr 
                            key={`${buyerData.mediaBuyer}-${networkData.network}`} 
                            className="bg-gray-50"
                          >
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 pl-12">
                              {networkData.network}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {formatCurrency(networkData.revenue)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {formatCurrency(networkData.spend)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {formatCurrency(networkData.margin)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {((networkData.margin / networkData.spend) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
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

export default MediaBuyerPerformance;