import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';

const MediaBuyerPerformance = ({ performanceData, dateRange }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const processedData = useMemo(() => {
    if (!performanceData) return [];

    // Filter data by date range
    const filteredByDate = performanceData.filter(row => {
      const rowDate = new Date(row.Date);
      return rowDate >= dateRange.startDate && rowDate <= dateRange.endDate;
    });

    // Group data by Media Buyer
    const grouped = filteredByDate.reduce((acc, row) => {
      const buyer = row['Media Buyer'];
      if (!acc[buyer]) {
        acc[buyer] = {
          mediaBuyer: buyer,
          adSpend: 0,
          revenue: 0,
          margin: 0,
          networks: new Set(),
          offers: new Set()
        };
      }
      acc[buyer].adSpend += parseFloat(row['Ad Spend'] || 0);
      acc[buyer].revenue += parseFloat(row['Total Revenue'] || 0);
      acc[buyer].margin += parseFloat(row.Margin || 0);
      acc[buyer].networks.add(row.Network);
      acc[buyer].offers.add(row.Offer);
      return acc;
    }, {});

    // Convert to array and calculate metrics
    return Object.values(grouped).map(item => ({
      ...item,
      networks: item.networks.size,
      offers: item.offers.size,
      roi: (item.margin / item.adSpend * 100).toFixed(2)
    }));
  }, [performanceData, dateRange]);

  const sortedData = useMemo(() => {
    if (!processedData) return [];
    
    const sorted = [...processedData];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [processedData, sortConfig]);

  const filteredData = useMemo(() => {
    return sortedData.filter(item => 
      item.mediaBuyer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedData, searchTerm]);

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!performanceData) {
    return <div>Loading media buyer data...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Media Buyer Performance</h2>
          <input
            type="text"
            placeholder="Search media buyers..."
            className="px-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('mediaBuyer')}
                >
                  Media Buyer
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('adSpend')}
                >
                  Ad Spend
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('revenue')}
                >
                  Revenue
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('margin')}
                >
                  Margin
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('roi')}
                >
                  ROI
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('networks')}
                >
                  Networks
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('offers')}
                >
                  Offers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.mediaBuyer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(item.adSpend)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(item.margin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.roi}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.networks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.offers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default MediaBuyerPerformance;