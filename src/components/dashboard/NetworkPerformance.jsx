import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import _ from 'lodash';
import NetworkGraphs from './NetworkGraphs';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

const NetworkRow = ({ networkData, rawData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const networkDetails = rawData?.filter(row => row.Network === networkData.network) || [];
  const uniqueBuyers = _.uniqBy(networkDetails, 'Media Buyer');
  const buyerCount = uniqueBuyers.length;

  const isProfitable = networkData.roi > 0;
  const profitabilityClass = isProfitable ? 'text-green-600' : 'text-red-600';
  const ProfitIcon = isProfitable ? TrendingUp : TrendingDown;
  
  return (
    <>
      <tr className={`hover:bg-gray-100 ${isProfitable ? 'bg-white' : 'bg-red-50'}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-gray-900">{networkData.network}</span>
            <ProfitIcon className={`h-4 w-4 ${profitabilityClass}`} />
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(networkData.totalRevenue)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(networkData.totalSpend)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${profitabilityClass}`}>
          {formatCurrency(networkData.totalMargin)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${profitabilityClass}`}>
          {formatPercent(networkData.roi || 0)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {buyerCount}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="p-0">
            <div className="bg-gray-50">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Media Buyer</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Margin</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                    <th className="px-6 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {_.chain(networkDetails)
                    .groupBy('Media Buyer')
                    .map((rows, buyer) => {
                      const buyerData = {
                        revenue: _.sumBy(rows, row => parseFloat(row['Total Revenue'] || 0)),
                        spend: _.sumBy(rows, row => parseFloat(row['Ad Spend'] || 0)),
                        margin: _.sumBy(rows, row => parseFloat(row.Margin || 0))
                      };
                      const buyerRoi = buyerData.spend ? ((buyerData.revenue / buyerData.spend - 1) * 100) : 0;
                      const isBuyerProfitable = buyerRoi > 0;
                      const buyerProfitClass = isBuyerProfitable ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <tr key={buyer} className="border-t border-gray-200">
                          <td className="px-6 py-2 text-sm text-gray-900">{buyer}</td>
                          <td className="px-6 py-2 text-sm text-right">{formatCurrency(buyerData.revenue)}</td>
                          <td className="px-6 py-2 text-sm text-right">{formatCurrency(buyerData.spend)}</td>
                          <td className={`px-6 py-2 text-sm text-right ${buyerProfitClass}`}>
                            {formatCurrency(buyerData.margin)}
                          </td>
                          <td className={`px-6 py-2 text-sm text-right ${buyerProfitClass}`}>
                            {formatPercent(buyerRoi)}
                          </td>
                          <td className="px-6 py-2"></td>
                        </tr>
                      );
                    })
                    .value()}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const NetworkPerformance = ({ data, rawData }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'totalRevenue',
    direction: 'desc'
  });
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  const sortedData = React.useMemo(() => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'roi') {
        aValue = (a.totalRevenue / a.totalSpend - 1) * 100;
        bValue = (b.totalRevenue / b.totalSpend - 1) * 100;
      }
      
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data, sortConfig]);

  if (!data || data.length === 0) {
    return <div className="text-gray-500">No network performance data available</div>;
  }

  const handleNetworkSelect = (network) => {
    setSelectedNetworks(prev => {
      if (prev.includes(network)) {
        return prev.filter(n => n !== network);
      }
      return [...prev, network];
    });
  };

  return (
    <div className="space-y-6">
      {/* MTD Performance Graph - Always visible */}
      <NetworkGraphs 
        rawData={rawData} 
        showAllNetworks={true} 
      />
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Network Performance</h3>
          <div className="flex gap-2">
            {sortedData.map(network => (
              <button
                key={network.network}
                onClick={() => handleNetworkSelect(network.network)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedNetworks.includes(network.network)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {network.network}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((networkData, index) => (
                <NetworkRow
                  key={networkData.network || index}
                  networkData={networkData}
                  rawData={rawData}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Networks Performance Graph */}
      {selectedNetworks.length > 0 && (
        <NetworkGraphs
          rawData={rawData}
          selectedNetworks={selectedNetworks}
          showAllNetworks={false}
        />
      )}
    </div>
  );
};

export default NetworkPerformance;