import React, { useMemo, useState } from 'react';
import { Card } from '../ui/card';
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
  Line
} from 'recharts';
import MultiSelect from '../ui/multi-select';

const OfferPerformance = ({ performanceData, dateRange }) => {
  // Filter states
  const [selectedNetworks, setSelectedNetworks] = useState(['all']);
  const [selectedOffers, setSelectedOffers] = useState(['all']);
  
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

  // Filter data based on selections and dateRange
  const filteredData = useMemo(() => {
    if (!performanceData) return [];
    
    return performanceData.filter(entry => {
      const entryDate = new Date(entry.Date);
      const matchesDate = entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
      const matchesNetwork = selectedNetworks.includes('all') || selectedNetworks.includes(entry.Network);
      const matchesOffer = selectedOffers.includes('all') || selectedOffers.includes(entry.Offer);
      
      return matchesDate && matchesNetwork && matchesOffer;
    });
  }, [performanceData, dateRange, selectedNetworks, selectedOffers]);

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

  // Prepare chart data grouped by offer
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

    // Convert to array and sort by date
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Offer Performance</h2>
        
        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  interval={Math.ceil(chartData.length / 15)} // Show fewer x-axis labels
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
          <h3 className="text-xl font-semibold mb-4">Detailed Offer Performance</h3>
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
                {chartData.map((offer) => (
                  <tr key={offer.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {offer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {selectedNetworks.includes('all') ? 'All Networks' : selectedNetworks.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(offer.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(offer.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(offer.margin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {((offer.margin / offer.spend) * 100).toFixed(1)}%
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

export default OfferPerformance;
