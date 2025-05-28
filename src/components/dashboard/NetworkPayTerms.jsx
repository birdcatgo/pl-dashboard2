import React, { useState, useEffect, useMemo } from 'react';
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
    key: 'c2fAmountDue',
    direction: 'desc'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching network data...');
      
      const networkResponse = await fetch('/api/network-exposure');
      
      console.log('Network response status:', networkResponse.status);
      
      if (!networkResponse.ok) {
        const errorData = await networkResponse.json();
        console.error('Network API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch network data');
      }

      const networkData = await networkResponse.json();
      console.log('Received network data:', networkData);

      if (!networkData.networks) {
        console.error('Invalid network data format:', networkData);
        throw new Error('Invalid data format received from server');
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
      setNetworks(allNetworks);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
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
    const endDate = new Date(periodEnd);
    endDate.setDate(endDate.getDate() + netTerms);
    return endDate.toISOString().split('T')[0];
  };

  const calculateDaysUntilPayment = (expectedPaymentDate) => {
    const today = new Date();
    const paymentDate = new Date(expectedPaymentDate);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!networks.length) return [];

    return [...networks].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-gray-600" />
      : <ArrowDown className="h-3 w-3 text-gray-600" />;
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

  const volumeDistribution = useMemo(() => {
    if (!networks.length) return null;

    // First, normalize the pay period values to ensure consistent categorization
    const normalizedNetworks = networks.map(network => ({
      ...network,
      payPeriod: network.payPeriod.toLowerCase().trim()
    }));

    const distribution = normalizedNetworks.reduce((acc, network) => {
      // Determine the period category
      let period;
      if (network.payPeriod.includes('bi') || network.payPeriod.includes('bi-monthly')) {
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
      acc[period].total += network.c2fAmountDue;
      acc[period].count += 1;
      acc[period].networks.push({
        name: network.name,
        amount: network.c2fAmountDue,
        netTerms: network.netTerms
      });
      return acc;
    }, {});

    const totalExposure = Object.values(distribution).reduce((sum, period) => sum + period.total, 0);

    return {
      distribution,
      totalExposure,
      riskMetrics: {
        weeklyPercentage: (distribution.weekly?.total || 0) / totalExposure * 100,
        monthlyPercentage: (distribution.monthly?.total || 0) / totalExposure * 100,
        biMonthlyPercentage: (distribution['bi-monthly']?.total || 0) / totalExposure * 100,
        otherPercentage: (distribution.other?.total || 0) / totalExposure * 100
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

  return (
    <div className="space-y-6">
      {volumeDistribution && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Distribution</CardTitle>
              <p className="text-sm text-gray-500">
                Total Exposure: {formatCurrency(volumeDistribution.totalExposure)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Weekly</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(volumeDistribution.distribution.weekly?.total || 0)}
                    </p>
                    <p className="text-sm text-blue-600">
                      {volumeDistribution.riskMetrics.weeklyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-800">Monthly</h3>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(volumeDistribution.distribution.monthly?.total || 0)}
                    </p>
                    <p className="text-sm text-purple-600">
                      {volumeDistribution.riskMetrics.monthlyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-800">Bi-Monthly</h3>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatCurrency(volumeDistribution.distribution['bi-monthly']?.total || 0)}
                    </p>
                    <p className="text-sm text-orange-600">
                      {volumeDistribution.riskMetrics.biMonthlyPercentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
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
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${getRiskLevel(volumeDistribution.riskMetrics).color}-500`} />
                  <span className="font-medium">
                    Risk Level: {getRiskLevel(volumeDistribution.riskMetrics).level}
                  </span>
                </div>
                
                <div className="space-y-2">
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Network Payment Terms</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : networks.length === 0 ? (
            <div className="text-center py-4">No network data available</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Network {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('c2fAmountDue')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Current Exposure {getSortIcon('c2fAmountDue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('netTerms')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Net Terms {getSortIcon('netTerms')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('payPeriod')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Pay Period {getSortIcon('payPeriod')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('periodStart')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Period Start {getSortIcon('periodStart')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('periodEnd')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Period End {getSortIcon('periodEnd')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('expectedPaymentDate')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Expected Payment {getSortIcon('expectedPaymentDate')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('daysUntilPayment')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Days Until Payment {getSortIcon('daysUntilPayment')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('yesterdaySpend')}
                    >
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Yesterday's Spend {getSortIcon('yesterdaySpend')}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        Spend Trend
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedData().map((network, index) => {
                    const expectedPaymentDate = calculateExpectedPaymentDate(network.periodEnd, network.netTerms);
                    const daysUntilPayment = calculateDaysUntilPayment(expectedPaymentDate);
                    const yesterdaySpend = getYesterdaySpend(network.name);
                    const spendTrend = getSpendTrend(network.name);

                    return (
                      <TableRow key={index}>
                        <TableCell>{network.name}</TableCell>
                        <TableCell>{formatCurrency(network.c2fAmountDue)}</TableCell>
                        <TableCell>{network.netTerms}</TableCell>
                        <TableCell>{network.payPeriod}</TableCell>
                        <TableCell>{network.periodStart}</TableCell>
                        <TableCell>{network.periodEnd}</TableCell>
                        <TableCell>{expectedPaymentDate}</TableCell>
                        <TableCell>{daysUntilPayment} days</TableCell>
                        <TableCell>{formatCurrency(yesterdaySpend)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(spendTrend.trend)}
                            <span className={spendTrend.trend === 'increasing' ? 'text-green-500' : 
                                           spendTrend.trend === 'decreasing' ? 'text-red-500' : 
                                           'text-gray-500'}>
                              {spendTrend.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 