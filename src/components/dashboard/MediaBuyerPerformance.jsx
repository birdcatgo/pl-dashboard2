import React, { useMemo, useState } from 'react';
import { Card } from '../ui/card';
import PerformanceMetrics from './PerformanceMetrics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import MultiSelect from '../ui/multi-select';

const MediaBuyerPerformance = ({ performanceData, dateRange }) => {
  const [selectedBuyers, setSelectedBuyers] = useState(['all']);
  const [selectedNetworks, setSelectedNetworks] = useState(['all']);

  // Get unique buyers and networks
  const { buyers, networks } = useMemo(() => {
    const buyersSet = new Set();
    const networksSet = new Set();
    
    performanceData?.forEach(entry => {
      if (entry['Media Buyer']) buyersSet.add(entry['Media Buyer']);
      if (entry.Network) networksSet.add(entry.Network);
    });
    
    return {
      buyers: ['all', ...Array.from(buyersSet)],
      networks: ['all', ...Array.from(networksSet)]
    };
  }, [performanceData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!performanceData) return [];
    
    return performanceData.filter(entry => {
      const entryDate = new Date(entry.Date);
      const matchesDate = entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
      const matchesBuyer = selectedBuyers.includes('all') || selectedBuyers.includes(entry['Media Buyer']);
      const matchesNetwork = selectedNetworks.includes('all') || selectedNetworks.includes(entry.Network);
      
      return matchesDate && matchesBuyer && matchesNetwork;
    });
  }, [performanceData, dateRange, selectedBuyers, selectedNetworks]);

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

  // Prepare chart data
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

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

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
          <h3 className="text-xl font-semibold mb-4">Daily Performance</h3>
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
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4F46E5" 
                  name="Revenue"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="margin" 
                  stroke="#10B981" 
                  name="Margin"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
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

        {/* Detailed Table */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Detailed Media Buyer Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {day.displayDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(day.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(day.margin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {((day.margin / day.spend) * 100).toFixed(1)}%
                    </td>
                  </tr>
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