import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
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
import { TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

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

  // Calculate overall trend percentage
  const midPoint = Math.floor(margins.length / 2);
  const firstHalf = margins.slice(0, midPoint);
  const secondHalf = margins.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // Handle edge cases
  if (firstHalfAvg === 0) {
    if (secondHalfAvg === 0) {
      return { 
        type: 'stable',
        label: 'Stable',
        color: 'text-blue-600',
        icon: 'horizontal'
      };
    } else {
      return { 
        type: 'improving',
        label: '+100%',
        color: 'text-green-600',
        icon: 'up'
      };
    }
  }

  const trendPercent = ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100;

  // Determine trend type with percentage
  if (stabilityCount > margins.length * 0.6) {
    return { 
      type: 'stable',
      label: 'Consistent',
      color: 'text-blue-600',
      icon: 'horizontal'
    };
  } else if (increases > decreases * 1.5) {
    return { 
      type: 'improving',
      label: `+${Math.abs(trendPercent).toFixed(1)}%`,
      color: 'text-green-600',
      icon: 'up'
    };
  } else if (decreases > increases * 1.5) {
    return { 
      type: 'declining',
      label: `-${Math.abs(trendPercent).toFixed(1)}%`,
      color: 'text-red-600',
      icon: 'down'
    };
  } else {
    return { 
      type: 'inconsistent',
      label: 'Volatile',
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

// Add this new component near the top of the file, after the imports
const TrendGraph = ({ data, color = 'blue' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 60;
  const height = 20;
  const padding = 2;

  // Normalize data to fit within the graph height
  const normalizedData = data.map(value => {
    if (range === 0) return height / 2; // If all values are the same, draw a horizontal line
    return ((value - min) / range) * (height - padding * 2) + padding;
  });

  // Create SVG path with proper scaling and line commands
  const points = normalizedData.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    return `${x},${height - value}`;
  });

  // Create the SVG path with proper line commands
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point}`;
    return `${path} L ${point}`;
  }, '');

  const colorClasses = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    yellow: 'stroke-yellow-500'
  };

  return (
    <svg width={width} height={height} className="ml-2">
      <path
        d={pathData}
        fill="none"
        strokeWidth="1.5"
        className={colorClasses[color]}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      const buyer = row['Media Buyer'] || 'Unknown';
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

      const spend = parseFloat(row['Ad Spend'] || 0);
      const revenue = parseFloat(row['Total Revenue'] || 0);
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

  const getPerformanceColors = (profit, spend) => {
    const isProfit = profit > 0;
    const isBreakEven = Math.abs(profit) < spend * 0.05; // Within ±5% of spend
    
    return {
      row: isProfit ? 'bg-green-50 hover:bg-green-100' : 
           isBreakEven ? 'bg-yellow-50 hover:bg-yellow-100' : 
           'bg-red-50 hover:bg-red-100',
      text: isProfit ? 'text-green-600' : 
            isBreakEven ? 'text-yellow-600' : 
            'text-red-600',
      icon: isProfit ? '↑' : 
            isBreakEven ? '→' : 
            '↓'
    };
  };

  // Add this helper function near the top of the file
  const getStatus = (buyer) => {
    if (buyer.spend === 0) return '';
    
    const daysSinceStart = Math.floor((new Date() - new Date(buyer.startDate)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStart <= 3) {
      return 'Testing Phase - Focus on finding winning campaigns';
    } else if (buyer.margin < 0) {
      return 'Recovery Phase - Optimize or pivot to better performing offers';
    } else if (buyer.roi > 20) {
      return 'Advanced Scaling - Maximize profitable campaigns';
    } else {
      return 'Growth Phase - Optimize and scale profitable campaigns';
    }
  };

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
      {/* Performance Metrics - Moved up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50">
          <div className="p-6">
            <div className="text-sm text-blue-600">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(processedData.buyerMetrics.reduce((sum, buyer) => sum + buyer.revenue, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50/50">
          <div className="p-6">
            <div className="text-sm text-red-600">Total Spend</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(processedData.buyerMetrics.reduce((sum, buyer) => sum + buyer.spend, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-green-50/50">
          <div className="p-6">
            <div className="text-sm text-green-600">Total Margin</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(processedData.buyerMetrics.reduce((sum, buyer) => sum + buyer.margin, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-purple-50/50">
          <div className="p-6">
            <div className="text-sm text-purple-600">ROI</div>
            <div className="text-2xl font-bold text-purple-700">
              {((processedData.buyerMetrics.reduce((sum, buyer) => sum + buyer.margin, 0) / 
                processedData.buyerMetrics.reduce((sum, buyer) => sum + buyer.spend, 0)) * 100).toFixed(1)}%
            </div>
          </div>
        </Card>
      </div>

      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Performers Card */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">🏆 Top Media Buyers</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {dateRange.startDate && dateRange.endDate ? 
              `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}` 
              : 'All Time'}
          </div>
          <div className="space-y-2">
            {processedData.buyerMetrics
              .filter(buyer => buyer.name !== 'Unknown' && buyer.name !== 'unknown')
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 5)
              .map((buyer, index) => {
                const consistency = analyzeTrend(filteredByDate, buyer.name);
                // Get daily margins for the trend graph
                const dailyMargins = filteredByDate
                  .filter(entry => entry['Media Buyer'] === buyer.name)
                  .reduce((acc, entry) => {
                    const date = entry.Date;
                    if (!acc[date]) acc[date] = 0;
                    // Calculate margin as revenue minus spend
                    const revenue = parseFloat(entry['Total Revenue'] || 0);
                    const spend = parseFloat(entry['Ad Spend'] || 0);
                    acc[date] += revenue - spend;
                    return acc;
                  }, {});
                const marginData = Object.values(dailyMargins);

                return (
                  <div key={buyer.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index]}</span>
                      <div>
                        <div className="font-semibold text-sm">{buyer.name}</div>
                        <div className="text-xs text-gray-500">ROI: {buyer.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{formatCurrency(buyer.margin)}</div>
                      <div className="flex items-center justify-end">
                        <TrendGraph 
                          data={marginData} 
                          color={consistency.type === 'stable' ? 'blue' : 
                                 consistency.type === 'improving' ? 'green' : 
                                 consistency.type === 'declining' ? 'red' : 'yellow'} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Top Network-Offer Combinations Card */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">🎯 Top Network Offers</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {dateRange.startDate && dateRange.endDate ? 
              `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}` 
              : 'All Time'}
          </div>
          <div className="space-y-4">
            {Object.values(
              filteredByDate
                .reduce((acc, entry) => {
                  // Skip unknown media buyers
                  if (entry['Media Buyer']?.toLowerCase() === 'unknown') return acc;

                  // Normalize ACA entries - both network and media buyer
                  let network = entry.Network;
                  let mediaBuyer = entry['Media Buyer'];
                  let offer = entry.Offer;
                  
                  // Normalize all ACA related entries
                  if (network?.includes('ACA') || network?.includes('Suited')) {
                    network = 'ACA - ACA';
                    offer = 'ACA';
                  }

                  // Create a normalized key that will combine all ACA entries
                  const key = network === 'ACA - ACA' ? 
                    `${mediaBuyer} - ACA - ACA - ACA` : 
                    `${mediaBuyer} - ${network} - ${offer}`;
                  
                  if (!acc[key]) {
                    acc[key] = {
                      mediaBuyer,
                      network,
                      offer,
                      revenue: 0,
                      spend: 0,
                      margin: 0,
                      dates: new Set()
                    };
                  }

                  // Store the date for trend analysis
                  acc[key].dates.add(entry.Date);
                  
                  acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
                  acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
                  acc[key].margin = acc[key].revenue - acc[key].spend;
                  acc[key].roi = acc[key].spend > 0 ? (acc[key].margin / acc[key].spend) * 100 : 0;
                  return acc;
                }, {})
            )
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 5)
              .map((combo, index) => {
                // Calculate trend
                const dates = Array.from(combo.dates).sort();
                const midPoint = Math.floor(dates.length / 2);
                const firstHalf = dates.slice(0, midPoint);
                const secondHalf = dates.slice(midPoint);
                
                let trend = {
                  label: 'Stable',
                  color: 'text-gray-500'
                };

                if (firstHalf.length > 0 && secondHalf.length > 0) {
                  const firstHalfMargin = firstHalf.reduce((sum, date) => {
                    const entry = filteredByDate.find(e => 
                      e.Date === date && 
                      ((e.Network === combo.network) || 
                       (e.Network === 'Suited - ACA' && combo.network === 'ACA - ACA'))
                    );
                    return sum + (entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0);
                  }, 0);

                  const secondHalfMargin = secondHalf.reduce((sum, date) => {
                    const entry = filteredByDate.find(e => 
                      e.Date === date && 
                      ((e.Network === combo.network) || 
                       (e.Network === 'Suited - ACA' && combo.network === 'ACA - ACA'))
                    );
                    return sum + (entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0);
                  }, 0);

                  const growth = ((secondHalfMargin - firstHalfMargin) / Math.abs(firstHalfMargin)) * 100;
                  
                  if (growth > 10) {
                    trend = { label: `+${growth.toFixed(1)}%`, color: 'text-green-500' };
                  } else if (growth < -10) {
                    trend = { label: `${growth.toFixed(1)}%`, color: 'text-red-500' };
                  } else {
                    trend = { label: 'Flat', color: 'text-gray-500' };
                  }
                }

                return (
                  <div key={`${combo.mediaBuyer}-${combo.network}-${combo.offer}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index]}</span>
                      <div>
                        <div className="font-semibold text-sm">{combo.mediaBuyer}</div>
                        <div className="text-xs text-gray-600">{combo.network} - {combo.offer}</div>
                        <div className="text-xs text-gray-500">ROI: {combo.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{formatCurrency(combo.margin)}</div>
                      <div className="flex items-center justify-end">
                        <TrendGraph 
                          data={Array.from(combo.dates).sort().map(date => {
                            const entry = filteredByDate.find(e => 
                              e.Date === date && 
                              ((e.Network === combo.network) || 
                               (e.Network === 'Suited - ACA' && combo.network === 'ACA - ACA'))
                            );
                            return entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0;
                          })}
                          color={trend.label.includes('+') ? 'green' : 
                                 trend.label.includes('-') ? 'red' : 
                                 'blue'} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Media Buyer Performance</h2>
              <MultiSelect
                options={processedData.buyerOptions}
                selected={selectedBuyers}
                onChange={setSelectedBuyers}
                placeholder="Select Media Buyers"
              />
            </div>
            <div className="text-sm text-gray-500">
              {dateRange.startDate && dateRange.endDate ? 
                `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}` 
                : 'All Time'}
            </div>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="10% of Margin">
                  MB Comm
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="2% of Revenue for ACA entries, deducted from MB Commission">
                  Ringba
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="Margin minus MB Commission minus Ringba Costs">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.buyerMetrics
                .filter(buyer => (selectedBuyers.includes('all') || selectedBuyers.includes(buyer.name)) && 
                               buyer.name.toLowerCase() !== 'unknown')
                .map((buyer) => {
                  const commission = buyer.margin > 0 ? buyer.margin * 0.10 : 0;
                  // Calculate total Ringba costs from all ACA networks (2% of Revenue)
                  const ringbaCosts = Object.entries(buyer.networkData)
                    .reduce((total, [network, data]) => {
                      if (network.includes('ACA')) {
                        return total + (data.revenue * 0.02);
                      }
                      return total;
                    }, 0);
                  const adjustedCommission = Math.max(0, commission - ringbaCosts);
                  const updatedProfit = buyer.margin - adjustedCommission;
                  const colors = getPerformanceColors(updatedProfit, buyer.spend);
                  const showCommission = buyer.margin > 0;
                  
                  return (
                    <React.Fragment key={buyer.name}>
                      <tr 
                        className={colors.row}
                        onClick={() => toggleBuyerExpansion(buyer.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          <span className="mr-2">
                            {expandedBuyers.has(buyer.name) ? '▼' : '▶'}
                          </span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{buyer.name}</span>
                            {buyer.name.includes('ACA') && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                ACA
                              </span>
                            )}
                          </div>
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
                          {buyer.roi.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                          {showCommission ? formatCurrency(commission) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                          {showCommission ? formatCurrency(ringbaCosts) : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50 ${colors.text} font-medium`}>
                          {showCommission ? formatCurrency(updatedProfit) : '-'}
                        </td>
                      </tr>
                      {expandedBuyers.has(buyer.name) && Object.entries(buyer.networkData).map(([network, data]) => {
                        const networkCommission = data.margin > 0 ? data.margin * 0.10 : 0;
                        const networkRingbaCosts = network.includes('ACA') ? data.revenue * 0.02 : 0;
                        const networkAdjustedCommission = Math.max(0, networkCommission - networkRingbaCosts);
                        const networkUpdatedProfit = data.margin - networkAdjustedCommission;
                        const showNetworkCommission = data.margin > 0;
                        return (
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
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkCommission) : '-'}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkRingbaCosts) : '-'}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkUpdatedProfit) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
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
                <RechartsTooltip 
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