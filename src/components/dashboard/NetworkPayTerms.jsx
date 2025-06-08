import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { toast } from "@/components/ui/toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export default function NetworkPayTerms({ performanceData }) {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    primary: {
      key: 'c2fAmountDue',
      direction: 'desc'
    },
    secondary: {
      key: 'mtdSpend',
      direction: 'desc'
    }
  });

  const calculateNetworkROI = (networkName) => {
    if (!performanceData?.data || !performanceData.data.length) return { roi: 0, spend: 0, revenue: 0 };

    // Get current month's data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log('Calculating ROI for network:', networkName);
    console.log('Current month/year:', currentMonth, currentYear);

    // Filter data for current month and specific network
    const networkData = performanceData.data.filter(entry => {
      // Parse the date string (format: MM/DD/YYYY)
      const [month, day, year] = entry.Date.split('/').map(Number);
      
      // Create Date objects for comparison
      const entryDate = new Date(year, month - 1, day);
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0);
      
      const isCurrentMonth = entryDate >= startOfMonth && entryDate <= endOfMonth;
      const isMatchingNetwork = entry.Network === networkName;
      
      if (isMatchingNetwork) {
        console.log('Found matching entry:', {
          date: entry.Date,
          parsedDate: entryDate.toISOString(),
          network: entry.Network,
          spend: entry['Ad Spend'],
          revenue: entry['Revenue'] || entry['Total Revenue'] || entry['Net Revenue'] || 0,
          isCurrentMonth
        });
      }
      
      return isMatchingNetwork && isCurrentMonth;
    });

    console.log('Filtered network data:', networkData);

    // Calculate total spend and revenue
    const totalSpend = networkData.reduce((sum, entry) => {
      const spend = parseFloat(entry['Ad Spend'] || 0);
      console.log('Adding spend:', spend);
      return sum + spend;
    }, 0);

    const totalRevenue = networkData.reduce((sum, entry) => {
      // Try different possible revenue field names
      const revenue = parseFloat(
        entry['Revenue'] || 
        entry['Total Revenue'] || 
        entry['Net Revenue'] || 
        entry['Gross Revenue'] || 
        0
      );
      console.log('Adding revenue:', revenue);
      return sum + revenue;
    }, 0);

    console.log('Totals for', networkName, ':', {
      totalSpend,
      totalRevenue,
      entries: networkData.length
    });

    // Calculate ROI
    let roi = 0;
    if (totalSpend > 0) {
      roi = ((totalRevenue - totalSpend) / totalSpend) * 100;
    }

    return {
      roi: roi.toFixed(1),
      spend: totalSpend,
      revenue: totalRevenue
    };
  };

  const fetchData = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      console.log('Fetching network data...');
      
      const networkResponse = await fetch('/api/network-exposure', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log('Network response status:', networkResponse.status);
      
      if (!networkResponse.ok) {
        const errorData = await networkResponse.json();
        console.error('Network API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch network data');
      }

      const networkData = await networkResponse.json();
      console.log('Received network data:', networkData);

      if (!networkData.networks || Object.keys(networkData.networks).length === 0) {
        console.warn('No network data available');
        setNetworks([]);
        return;
      }

      // Flatten the grouped networks while preserving the pay period
      const allNetworks = Object.entries(networkData.networks).flatMap(([payPeriod, networks]) => {
        console.log(`Processing ${networks.length} networks for ${payPeriod} period`);
        return networks.map(network => ({
          ...network,
          payPeriod // Add pay period to each network
        }));
      });
      
      console.log('Processed networks:', allNetworks);
      console.log('Sample network with exposure:', allNetworks.find(n => n.c2fAmountDue > 0));
      setNetworks(allNetworks);
      
      // Show success toast only for manual refreshes
      if (isManualRefresh && allNetworks.length > 0) {
        toast({
          title: 'Success',
          description: `Network payment terms refreshed successfully. Found ${allNetworks.length} networks.`,
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
      setNetworks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateExpectedPaymentDate = (periodEnd, netTerms) => {
    // Validate inputs
    if (!periodEnd || !netTerms) {
      console.warn('Invalid inputs for calculateExpectedPaymentDate:', { periodEnd, netTerms });
      return 'N/A';
    }

    const endDate = new Date(periodEnd);
    
    // Check if date is valid
    if (isNaN(endDate.getTime())) {
      console.warn('Invalid date for periodEnd:', periodEnd);
      return 'N/A';
    }

    endDate.setDate(endDate.getDate() + netTerms);
    
    // Double-check the result is still valid after adding days
    if (isNaN(endDate.getTime())) {
      console.warn('Invalid date after adding netTerms:', { periodEnd, netTerms });
      return 'N/A';
    }

    return endDate.toISOString().split('T')[0];
  };

  const calculateDaysUntilPayment = (expectedPaymentDate) => {
    // Handle invalid or N/A payment dates
    if (!expectedPaymentDate || expectedPaymentDate === 'N/A') {
      return 'N/A';
    }

    const today = new Date();
    const paymentDate = new Date(expectedPaymentDate);
    
    // Check if payment date is valid
    if (isNaN(paymentDate.getTime())) {
      console.warn('Invalid expectedPaymentDate in calculateDaysUntilPayment:', expectedPaymentDate);
      return 'N/A';
    }

    const diffTime = paymentDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getYesterdaySpend = (networkName) => {
    if (!performanceData?.data || !performanceData.data.length) return 0;
    
    // Sort by date in descending order to get the most recent data first
    const sortedData = [...performanceData.data].sort((a, b) => {
      const [aMonth, aDay, aYear] = a.Date.split('/').map(Number);
      const [bMonth, bDay, bYear] = b.Date.split('/').map(Number);
      const aDate = new Date(aYear, aMonth - 1, aDay);
      const bDate = new Date(bYear, bMonth - 1, bDay);
      return bDate - aDate;
    });

    // Get the most recent entry for this network
    const latestEntry = sortedData.find(entry => entry.Network === networkName);
    return latestEntry ? parseFloat(latestEntry['Ad Spend'] || 0) : 0;
  };

  const getSpendTrend = (networkName) => {
    if (!performanceData?.data || !performanceData.data.length) return { trend: 'stable', percentage: 0 };

    // Sort by date in descending order
    const sortedData = [...performanceData.data].sort((a, b) => {
      const [aMonth, aDay, aYear] = a.Date.split('/').map(Number);
      const [bMonth, bDay, bYear] = b.Date.split('/').map(Number);
      const aDate = new Date(aYear, aMonth - 1, aDay);
      const bDate = new Date(bYear, bMonth - 1, bDay);
      return bDate - aDate;
    });

    // Get the last 7 days of data for this network
    const networkData = sortedData
      .filter(entry => entry.Network === networkName)
      .slice(0, 7);

    if (networkData.length < 2) return { trend: 'stable', percentage: 0 };

    // Calculate average spend for the last 3 days and previous 3 days
    const recentAvg = networkData.slice(0, 3).reduce((sum, entry) => 
      sum + parseFloat(entry['Ad Spend'] || 0), 0) / 3;
    const previousAvg = networkData.slice(3, 6).reduce((sum, entry) => 
      sum + parseFloat(entry['Ad Spend'] || 0), 0) / 3;

    if (previousAvg === 0) return { trend: 'stable', percentage: 0 };

    const percentageChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (Math.abs(percentageChange) < 5) return { trend: 'stable', percentage: percentageChange };
    return {
      trend: percentageChange > 0 ? 'increasing' : 'decreasing',
      percentage: Math.abs(percentageChange)
    };
  };

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      // If clicking the same key as primary sort
      if (prevConfig.primary.key === key) {
        return {
          primary: {
            key,
            direction: prevConfig.primary.direction === 'asc' ? 'desc' : 'asc'
          },
          secondary: prevConfig.secondary
        };
      }
      // If clicking the same key as secondary sort
      if (prevConfig.secondary.key === key) {
        return {
          primary: prevConfig.primary,
          secondary: {
            key,
            direction: prevConfig.secondary.direction === 'asc' ? 'desc' : 'asc'
          }
        };
      }
      // If clicking a new key, make it the primary sort
      return {
        primary: {
          key,
          direction: 'desc'
        },
        secondary: prevConfig.primary
      };
    });
  }, []);

  // Memoize expensive calculations
  const sortedData = useMemo(() => {
    if (!networks.length) return { active: [], inactive: [] };

    // Helper function to check if a network is inactive (all metrics are 0)
    const isInactive = (network) => {
      const yesterdaySpend = getYesterdaySpend(network.name);
      const roiData = calculateNetworkROI(network.name);
      return network.c2fAmountDue === 0 && 
             yesterdaySpend === 0 && 
             roiData.spend === 0 && 
             roiData.revenue === 0;
    };

    // Split networks into active and inactive
    const { active, inactive } = networks.reduce((acc, network) => {
      if (isInactive(network)) {
        acc.inactive.push(network);
      } else {
        acc.active.push(network);
      }
      return acc;
    }, { active: [], inactive: [] });

    // Sort function for both arrays
    const sortNetworks = (networks) => {
      return [...networks].sort((a, b) => {
        // Primary sort
        let aValue = a[sortConfig.primary.key];
        let bValue = b[sortConfig.primary.key];

        if (typeof aValue === 'string') {
          const primaryCompare = sortConfig.primary.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
          
          if (primaryCompare !== 0) return primaryCompare;
        } else {
          const primaryCompare = sortConfig.primary.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
          
          if (primaryCompare !== 0) return primaryCompare;
        }

        // Secondary sort
        aValue = a[sortConfig.secondary.key];
        bValue = b[sortConfig.secondary.key];

        if (typeof aValue === 'string') {
          return sortConfig.secondary.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.secondary.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    };

    return {
      active: sortNetworks(active),
      inactive: sortNetworks(inactive)
    };
  }, [networks, sortConfig]);

  // Memoize network calculations
  const networkCalculations = useMemo(() => {
    return networks.reduce((acc, network) => {
      acc[network.name] = {
        expectedPaymentDate: calculateExpectedPaymentDate(network.periodEnd, network.netTerms),
        daysUntilPayment: calculateDaysUntilPayment(calculateExpectedPaymentDate(network.periodEnd, network.netTerms)),
        yesterdaySpend: getYesterdaySpend(network.name),
        spendTrend: getSpendTrend(network.name),
        roiData: calculateNetworkROI(network.name)
      };
      return acc;
    }, {});
  }, [networks]);

  // Memoize volume distribution
  const volumeDistribution = useMemo(() => {
    if (!networks.length) return null;

    // First, normalize the pay period values to ensure consistent categorization
    const normalizedNetworks = networks.map(network => ({
      ...network,
      payPeriod: (network.payPeriod || '').toLowerCase().trim()
    }));

    const distribution = normalizedNetworks.reduce((acc, network) => {
      // Determine the period category
      let period;
      if (network.payPeriod.includes('bi') || network.payPeriod.includes('bi-monthly') || network.payPeriod.includes('bi-weekly')) {
        period = 'bi-monthly';
      } else if (network.payPeriod.includes('month')) {
        period = 'monthly';
      } else if (network.payPeriod.includes('week')) {
        period = 'weekly';
      } else {
        period = 'other';
      }

      if (!acc[period]) {
        acc[period] = {
          total: 0,
          count: 0,
          networks: []
        };
      }
      acc[period].total += network.c2fAmountDue || 0;
      acc[period].count += 1;
      acc[period].networks.push({
        name: network.name,
        amount: network.c2fAmountDue || 0,
        netTerms: network.netTerms
      });
      return acc;
    }, {});

    const totalExposure = Object.values(distribution).reduce((sum, period) => sum + period.total, 0);

    // Handle division by zero for percentages
    const calculatePercentage = (amount) => {
      if (totalExposure === 0) return 0;
      return (amount / totalExposure) * 100;
    };

    return {
      distribution,
      totalExposure,
      riskMetrics: {
        weeklyPercentage: calculatePercentage(distribution.weekly?.total || 0),
        monthlyPercentage: calculatePercentage(distribution.monthly?.total || 0),
        biMonthlyPercentage: calculatePercentage(distribution['bi-monthly']?.total || 0),
        otherPercentage: calculatePercentage(distribution.other?.total || 0)
      }
    };
  }, [networks]);

  const getRiskLevel = (metrics) => {
    if (!metrics) return { level: 'unknown', color: 'gray' };
    
    const { weeklyPercentage, monthlyPercentage, biMonthlyPercentage } = metrics;
    
    // High risk if more than 40% is in bi-monthly terms
    if (biMonthlyPercentage > 40) {
      return { level: 'High', color: 'red' };
    }
    // Medium risk if more than 60% is in monthly or longer terms
    if (monthlyPercentage + biMonthlyPercentage > 60) {
      return { level: 'Medium', color: 'yellow' };
    }
    // Low risk if more than 50% is in weekly terms
    if (weeklyPercentage > 50) {
      return { level: 'Low', color: 'green' };
    }
    return { level: 'Medium', color: 'yellow' };
  };

  const getRecommendations = (metrics) => {
    if (!metrics) return [];
    
    const recommendations = [];
    const { weeklyPercentage, monthlyPercentage, biMonthlyPercentage } = metrics;

    if (biMonthlyPercentage > 40) {
      recommendations.push({
        type: 'warning',
        message: 'High exposure in bi-monthly terms. Consider negotiating better terms or increasing volume with weekly networks.'
      });
    }

    if (monthlyPercentage + biMonthlyPercentage > 60) {
      recommendations.push({
        type: 'info',
        message: 'Consider rebalancing towards networks with weekly payment terms to reduce risk.'
      });
    }

    if (weeklyPercentage < 30) {
      recommendations.push({
        type: 'suggestion',
        message: 'Opportunity to increase volume with weekly payment networks to improve cash flow.'
      });
    }

    return recommendations;
  };

  const getROIColor = (roi) => {
    const roiValue = parseFloat(roi);
    if (roiValue >= 100) return 'text-green-600';
    if (roiValue >= 50) return 'text-green-500';
    if (roiValue >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.primary.key === columnKey) {
      return sortConfig.primary.direction === 'asc' 
        ? <ArrowUp className="h-3 w-3 text-gray-600" />
        : <ArrowDown className="h-3 w-3 text-gray-600" />;
    }
    if (sortConfig.secondary.key === columnKey) {
      return sortConfig.secondary.direction === 'asc' 
        ? <ArrowUp className="h-3 w-3 text-gray-400" />
        : <ArrowDown className="h-3 w-3 text-gray-400" />;
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-2">
      {volumeDistribution && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card>
            <CardHeader className="p-2">
              <CardTitle>Volume Distribution</CardTitle>
              <p className="text-sm text-gray-500">
                Total Exposure: {formatCurrency(volumeDistribution.totalExposure)}
              </p>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Weekly</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(volumeDistribution.distribution.weekly?.total || 0)}
                    </p>
                    <p className="text-sm text-blue-600">
                      {volumeDistribution.riskMetrics.weeklyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-800">Monthly</h3>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(volumeDistribution.distribution.monthly?.total || 0)}
                    </p>
                    <p className="text-sm text-purple-600">
                      {volumeDistribution.riskMetrics.monthlyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-800">Bi-Monthly</h3>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatCurrency(volumeDistribution.distribution['bi-monthly']?.total || 0)}
                    </p>
                    <p className="text-sm text-orange-600">
                      {volumeDistribution.riskMetrics.biMonthlyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Weekly', value: volumeDistribution.riskMetrics.weeklyPercentage, color: '#3B82F6' },
                              { name: 'Monthly', value: volumeDistribution.riskMetrics.monthlyPercentage, color: '#8B5CF6' },
                              { name: 'Bi-Monthly', value: volumeDistribution.riskMetrics.biMonthlyPercentage, color: '#F97316' },
                              { name: 'Other', value: volumeDistribution.riskMetrics.otherPercentage, color: '#6B7280' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {[
                              { name: 'Weekly', value: volumeDistribution.riskMetrics.weeklyPercentage, color: '#3B82F6' },
                              { name: 'Monthly', value: volumeDistribution.riskMetrics.monthlyPercentage, color: '#8B5CF6' },
                              { name: 'Bi-Monthly', value: volumeDistribution.riskMetrics.biMonthlyPercentage, color: '#F97316' },
                              { name: 'Other', value: volumeDistribution.riskMetrics.otherPercentage, color: '#6B7280' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-2">
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${getRiskLevel(volumeDistribution.riskMetrics).color}-500`} />
                  <span className="font-medium">
                    Risk Level: {getRiskLevel(volumeDistribution.riskMetrics).level}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {getRecommendations(volumeDistribution.riskMetrics).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        rec.type === 'warning' ? 'text-red-500' :
                        rec.type === 'info' ? 'text-blue-500' :
                        'text-green-500'
                      }`} />
                      <p className={`
                        ${rec.type === 'warning' ? 'text-red-700' :
                          rec.type === 'info' ? 'text-blue-700' :
                          'text-green-700'}
                      `}>
                        {rec.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="p-2">
          <div className="flex items-center justify-between">
            <CardTitle>Network Payment Terms</CardTitle>
            <Button
              onClick={() => fetchData(true)}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {loading ? (
            <div className="text-center py-2">Loading...</div>
          ) : networks.length === 0 ? (
            <div className="text-center py-2">No network data available</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        Network {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('c2fAmountDue')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Exposure {getSortIcon('c2fAmountDue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('netTerms')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Net {getSortIcon('netTerms')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('payPeriod')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Period {getSortIcon('payPeriod')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('periodStart')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Start {getSortIcon('periodStart')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('periodEnd')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        End {getSortIcon('periodEnd')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('expectedPaymentDate')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Due {getSortIcon('expectedPaymentDate')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('daysUntilPayment')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Days {getSortIcon('daysUntilPayment')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('yesterdaySpend')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Yest Spend {getSortIcon('yesterdaySpend')}
                      </div>
                    </TableHead>
                    <TableHead className="p-2">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        Trend
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('roi')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        ROI {getSortIcon('roi')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('mtdSpend')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        MTD Spend {getSortIcon('mtdSpend')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 p-2"
                      onClick={() => handleSort('mtdRevenue')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 whitespace-nowrap">
                        MTD Rev {getSortIcon('mtdRevenue')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.active.length > 0 && (
                    <>
                      <TableRow className="bg-gray-100">
                        <TableCell colSpan={13} className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-medium text-gray-700">Active Networks</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {sortedData.active.map((network, index) => {
                        const calc = networkCalculations[network.name];
                        return (
                          <TableRow 
                            key={`active-${index}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="p-2 text-sm whitespace-nowrap font-medium">{network.name}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(network.c2fAmountDue)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.netTerms}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.payPeriod}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.periodStart}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.periodEnd}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{calc.expectedPaymentDate}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              {typeof calc.daysUntilPayment === 'number' ? `${calc.daysUntilPayment} days` : calc.daysUntilPayment}
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.yesterdaySpend)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getTrendIcon(calc.spendTrend.trend)}
                                <span className={calc.spendTrend.trend === 'increasing' ? 'text-green-600' : 
                                               calc.spendTrend.trend === 'decreasing' ? 'text-red-600' : 
                                               'text-gray-600'}>
                                  {calc.spendTrend.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              <span className={getROIColor(calc.roiData.roi)}>
                                {calc.roiData.spend > 0 ? `${calc.roiData.roi}%` : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.roiData.spend)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.roiData.revenue)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}

                  {sortedData.inactive.length > 0 && (
                    <>
                      <TableRow className="bg-gray-100">
                        <TableCell colSpan={13} className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="font-medium text-gray-700">Inactive Networks</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {sortedData.inactive.map((network, index) => {
                        const calc = networkCalculations[network.name];
                        return (
                          <TableRow 
                            key={`inactive-${index}`}
                            className="hover:bg-gray-50 transition-colors opacity-75"
                          >
                            <TableCell className="p-2 text-sm whitespace-nowrap font-medium">{network.name}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(network.c2fAmountDue)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.netTerms}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.payPeriod}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.periodStart}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{network.periodEnd}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{calc.expectedPaymentDate}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              {typeof calc.daysUntilPayment === 'number' ? `${calc.daysUntilPayment} days` : calc.daysUntilPayment}
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.yesterdaySpend)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getTrendIcon(calc.spendTrend.trend)}
                                <span className={calc.spendTrend.trend === 'increasing' ? 'text-green-600' : 
                                               calc.spendTrend.trend === 'decreasing' ? 'text-red-600' : 
                                               'text-gray-600'}>
                                  {calc.spendTrend.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">
                              <span className={getROIColor(calc.roiData.roi)}>
                                {calc.roiData.spend > 0 ? `${calc.roiData.roi}%` : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.roiData.spend)}</TableCell>
                            <TableCell className="p-2 text-sm whitespace-nowrap">{formatCurrency(calc.roiData.revenue)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 