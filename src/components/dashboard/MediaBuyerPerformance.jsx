import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import _ from 'lodash';
import PerformanceTrends from './PerformanceTrends';

const formatCurrency = (value) => {
  if (value === null || typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (value === null || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
};

const SortHeader = ({ label, sortKey, currentSort, onSort }) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex flex-col">
          {isActive ? (
            currentSort.direction === 'asc' ? (
              <ChevronDown className="h-4 w-4 text-blue-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </th>
  );
};

const MediaBuyerRow = ({ buyer, rawData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isProfitable = buyer.roi > 0;
  const profitabilityClass = isProfitable ? 'text-green-600' : 'text-red-600';
  const ProfitIcon = isProfitable ? TrendingUp : TrendingDown;

  const buyerDetails = _.chain(rawData || [])
    .filter((row) => row?.['Media Buyer'] === buyer.buyer)
    .groupBy((row) => `${row?.Network || 'Unknown'}-${row?.Offer || 'Unknown'}`)
    .map((rows, key) => {
      const [network, ...offerParts] = key.split('-');
      const offer = offerParts.join('-');
      return {
        network,
        offer,
        revenue: _.sumBy(rows, (row) => parseFloat(row['Total Revenue'] || 0)),
        spend: _.sumBy(rows, (row) => parseFloat(row['Ad Spend'] || 0)),
        margin: _.sumBy(rows, (row) => parseFloat(row.Margin || 0)),
      };
    })
    .orderBy(['margin'], ['desc'])
    .value();

  return (
    <>
      <tr className={`hover:bg-gray-50 ${!isProfitable ? 'bg-red-50' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-gray-900">{buyer.buyer}</span>
            <ProfitIcon className={`h-4 w-4 ${profitabilityClass}`} />
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(buyer.totalRevenue)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(buyer.totalSpend)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${profitabilityClass} font-medium`}>
          {formatCurrency(buyer.totalMargin)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${profitabilityClass} font-medium`}>
          {formatPercent(buyer.roi)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {buyer.networks}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="p-0">
            <div className="bg-gray-50">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Network - Offer</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Margin</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                    <th className="px-6 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {buyerDetails.map((detail) => {
                    const detailRoi = detail.spend ? ((detail.revenue / detail.spend - 1) * 100) : 0;
                    const isDetailProfitable = detailRoi > 0;
                    const detailProfitClass = isDetailProfitable ? 'text-green-600' : 'text-red-600';
                    
                    return (
                      <tr key={`${detail.network}-${detail.offer}`} className="border-t border-gray-200">
                        <td className="px-6 py-2 text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{detail.network}</span>
                            <span>-</span>
                            <span>{detail.offer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-sm text-right">{formatCurrency(detail.revenue)}</td>
                        <td className="px-6 py-2 text-sm text-right">{formatCurrency(detail.spend)}</td>
                        <td className={`px-6 py-2 text-sm text-right ${detailProfitClass}`}>
                          {formatCurrency(detail.margin)}
                        </td>
                        <td className={`px-6 py-2 text-sm text-right ${detailProfitClass}`}>
                          {formatPercent(detailRoi)}
                        </td>
                        <td className="px-6 py-2"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const MediaBuyerPerformance = ({ data, rawData }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'totalRevenue',
    direction: 'desc'
  });
  const [selectedBuyers, setSelectedBuyers] = useState([]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedData = useMemo(() => {
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

  const handleBuyerSelect = (buyer) => {
    setSelectedBuyers(prev => {
      if (prev.includes(buyer)) {
        return prev.filter(b => b !== buyer);
      }
      return [...prev, buyer];
    });
  };

  if (!data || data.length === 0) {
    return <div className="text-gray-500">No media buyer performance data available</div>;
  }

  const totals = data.reduce(
    (acc, buyer) => ({
      revenue: acc.revenue + (buyer.totalRevenue || 0),
      spend: acc.spend + (buyer.totalSpend || 0),
      margin: acc.margin + (buyer.totalMargin || 0),
    }),
    { revenue: 0, spend: 0, margin: 0 }
  );

  const totalRoi = totals.spend > 0 ? (totals.revenue / totals.spend - 1) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Media Buyer Performance</h3>
          <div className="flex gap-2 flex-wrap">
            {sortedData.map(buyer => (
              <button
                key={buyer.buyer}
                onClick={() => handleBuyerSelect(buyer.buyer)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedBuyers.includes(buyer.buyer)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {buyer.buyer}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader
                  label="Media Buyer"
                  sortKey="buyer"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Revenue"
                  sortKey="totalRevenue"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Spend"
                  sortKey="totalSpend"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Margin"
                  sortKey="totalMargin"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <SortHeader
                  label="ROI"
                  sortKey="roi"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Networks"
                  sortKey="networks"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((buyer) => (
                <MediaBuyerRow key={buyer.buyer} buyer={buyer} rawData={rawData} />
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency(totals.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency(totals.spend)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency(totals.margin)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatPercent(totalRoi)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Performance Trends Charts */}
      {selectedBuyers.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Buyer Performance Trends</h4>
            <PerformanceTrends
              rawData={rawData}
              type="buyer"
              selectedItems={selectedBuyers}
            />
          </div>
          
          {/* Offer Performance for Selected Buyers */}
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Offer Performance Trends</h4>
            {selectedBuyers.map(buyer => {
              // Get all offers for this buyer and their metrics
              const buyerOffers = _.chain(rawData)
                .filter(row => row['Media Buyer'] === buyer)
                .groupBy('Offer')
                .map((rows, offer) => {
                  const totalRevenue = _.sumBy(rows, row => parseFloat(row['Total Revenue'] || 0));
                  const totalSpend = _.sumBy(rows, row => parseFloat(row['Ad Spend'] || 0));
                  return {
                    offer,
                    revenue: totalRevenue,
                    spend: totalSpend
                  };
                })
                .orderBy(['revenue'], ['desc'])
                .take(5) // Take top 5 offers by revenue
                .map(offerData => offerData.offer)
                .value();

              return (
                <div key={buyer} className="mb-6 last:mb-0">
                  <h5 className="text-md font-medium text-gray-700 mb-2">{buyer}</h5>
                  <PerformanceTrends
                    rawData={rawData.filter(row => row['Media Buyer'] === buyer)}
                    type="offer"
                    selectedItems={buyerOffers}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaBuyerPerformance;