import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import _ from 'lodash';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, startOfDay, endOfDay } from 'date-fns';

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

const TimeRangeSelector = ({ selectedRange, onRangeChange }) => {
  const ranges = [
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: 'mtd', label: 'MTD' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '60d', label: 'Last 60 Days' },
    { id: 'ytd', label: 'YTD' }
  ];

  return (
    <div className="flex space-x-2">
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`px-3 py-1 text-sm rounded-md ${
            selectedRange === range.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

const PerformanceChart = ({ data, title, selectedItems, metric = 'revenue' }) => {
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2'];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={metric === 'roi' ? formatPercent : formatCurrency} />
              <Tooltip 
                formatter={(value) => metric === 'roi' ? formatPercent(value) : formatCurrency(value)}
              />
              <Legend />
              {selectedItems.map((item, index) => (
                <Line
                  key={item}
                  type="monotone"
                  dataKey={`${item}_${metric}`}
                  name={item}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const NetworkRow = ({ networkData, rawData, isUnknownBuyer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const networkDetails = rawData?.filter(row => row.Network === networkData.network) || [];
  const uniqueBuyers = _.uniqBy(networkDetails, 'Media Buyer');
  const buyerCount = uniqueBuyers.length;

  const isProfitable = networkData.roi > 0;
  const rowClassName = isUnknownBuyer 
    ? 'bg-blue-50 hover:bg-blue-100'
    : isProfitable 
      ? 'hover:bg-gray-50'
      : 'bg-red-50 hover:bg-red-100';

  return (
    <>
      <tr className={rowClassName}>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-gray-900">{networkData.network}</span>
            {isProfitable 
              ? <TrendingUp className="h-4 w-4 text-green-600" />
              : <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(networkData.totalRevenue)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(networkData.totalSpend)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatCurrency(networkData.totalMargin)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {formatPercent(networkData.roi)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
          {buyerCount}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="p-0">
            <div className="bg-gray-50 p-4">
              <h4 className="text-sm font-medium mb-2">Media Buyer Breakdown</h4>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Media Buyer</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Margin</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {_.chain(networkDetails)
                    .groupBy('Media Buyer')
                    .map((rows, buyer) => {
                      const revenue = _.sumBy(rows, row => row['Total Revenue'] || 0);
                      const spend = _.sumBy(rows, row => row['Ad Spend'] || 0);
                      const margin = _.sumBy(rows, row => row.Margin || 0);
                      const roi = spend > 0 ? ((revenue / spend - 1) * 100) : 0;
                      
                      return (
                        <tr key={buyer} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm">{buyer}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(revenue)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(spend)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(margin)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatPercent(roi)}</td>
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

const MetricSelector = ({ selectedMetric, onMetricChange }) => {
  const metrics = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'spend', label: 'Spend' },
    { id: 'margin', label: 'Margin' },
    { id: 'roi', label: 'ROI' }
  ];

  return (
    <div className="flex space-x-2">
      {metrics.map(metric => (
        <button
          key={metric.id}
          onClick={() => onMetricChange(metric.id)}
          className={`px-3 py-1 text-sm rounded-md ${
            selectedMetric === metric.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {metric.label}
        </button>
      ))}
    </div>
  );
};

const ImprovedPerformanceDashboard = ({ performanceData, type = 'network' }) => {
  const [timeRange, setTimeRange] = useState('yesterday');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [selectedItems, setSelectedItems] = useState([]);

  const dateRange = useMemo(() => {
    const today = new Date();
    const endDate = endOfDay(today);
    let startDate;

    switch (timeRange) {
      case 'yesterday':
        startDate = startOfDay(subDays(today, 1));
        break;
      case '7d':
        startDate = startOfDay(subDays(today, 7));
        break;
      case 'mtd':
        startDate = startOfMonth(today);
        break;
      case '30d':
        startDate = startOfDay(subDays(today, 30));
        break;
      case '60d':
        startDate = startOfDay(subDays(today, 60));
        break;
      case 'ytd':
        startDate = startOfYear(today);
        break;
      default:
        startDate = startOfDay(subDays(today, 1));
    }

    return { startDate, endDate };
  }, [timeRange]);

  const processedData = useMemo(() => {
    if (!performanceData?.length) return { aggregated: [], daily: [] };

    const filteredData = performanceData.filter(row => {
      const rowDate = new Date(row.Date);
      return rowDate >= dateRange.startDate && rowDate <= dateRange.endDate;
    });

    const groupKey = type === 'network' ? 'Network' : 'Media Buyer';
    
    const aggregated = _.chain(filteredData)
      .groupBy(groupKey)
      .map((rows, key) => ({
        [groupKey.toLowerCase()]: key,
        totalRevenue: _.sumBy(rows, row => row['Total Revenue'] || 0),
        totalSpend: _.sumBy(rows, row => row['Ad Spend'] || 0),
        totalMargin: _.sumBy(rows, row => row.Margin || 0),
        roi: ((_.sumBy(rows, row => row['Total Revenue'] || 0) / 
               _.sumBy(rows, row => row['Ad Spend'] || 0) - 1) * 100) || 0
      }))
      .value();

    const daily = _.chain(filteredData)
      .groupBy(row => format(new Date(row.Date), 'yyyy-MM-dd'))
      .map((rows, date) => {
        const dayData = { date };
        _.chain(rows)
          .groupBy(groupKey)
          .forEach((groupRows, key) => {
            dayData[`${key}_revenue`] = _.sumBy(groupRows, row => row['Total Revenue'] || 0);
            dayData[`${key}_spend`] = _.sumBy(groupRows, row => row['Ad Spend'] || 0);
            dayData[`${key}_margin`] = _.sumBy(groupRows, row => row.Margin || 0);
            dayData[`${key}_roi`] = ((_.sumBy(groupRows, row => row['Total Revenue'] || 0) / 
                                     _.sumBy(groupRows, row => row['Ad Spend'] || 0) - 1) * 100) || 0;
          })
          .value();
        return dayData;
      })
      .value();

    return { aggregated, daily };
  }, [performanceData, dateRange, type]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold">
            {type === 'network' ? 'Network Performance' : 'Media Buyer Performance'}
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <TimeRangeSelector
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
            />
            <MetricSelector
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {type === 'network' ? 'Network' : 'Media Buyer'}
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
                  {type === 'network' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyers
                    </th>
                  )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.aggregated.map((itemData, index) => (
              <NetworkRow
                key={type === 'network' ? itemData.network : itemData['media buyer'] || index}
                networkData={itemData}
                rawData={performanceData}
                isUnknownBuyer={itemData[type === 'network' ? 'network' : 'media buyer'] === 'unknown'}
              />
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                {formatCurrency(_.sumBy(processedData.aggregated, 'totalRevenue'))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                {formatCurrency(_.sumBy(processedData.aggregated, 'totalSpend'))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                {formatCurrency(_.sumBy(processedData.aggregated, 'totalMargin'))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                {formatPercent(
                  (_.sumBy(processedData.aggregated, 'totalRevenue') / 
                   _.sumBy(processedData.aggregated, 'totalSpend') - 1) * 100
                )}
              </td>
              {type === 'network' && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  -
                </td>
              )}
            </tr>
          </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      {selectedItems.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {type === 'network' ? 'Network Performance Trends' : 'Media Buyer Performance Trends'}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-4">
                {processedData.aggregated.map((item) => {
                  const itemName = type === 'network' ? item.network : item['media buyer'];
                  return (
                    <button
                      key={itemName}
                      onClick={() => {
                        setSelectedItems(prev => 
                          prev.includes(itemName)
                            ? prev.filter(i => i !== itemName)
                            : [...prev, itemName]
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md ${
                        selectedItems.includes(itemName)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {itemName}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PerformanceChart
                  data={processedData.daily}
                  title={`Daily ${selectedMetric.toUpperCase()}`}
                  selectedItems={selectedItems}
                  metric={selectedMetric}
                />
              </div>
            </CardContent>
          </Card>

          {/* Offers Performance for Selected Items */}
          {type === 'network' && (
            <Card>
              <CardHeader>
                <CardTitle>Offer Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedItems.map(network => {
                    const networkOffers = _.chain(performanceData)
                      .filter(row => row.Network === network)
                      .groupBy('Offer')
                      .map((rows, offer) => ({
                        offer,
                        revenue: _.sumBy(rows, row => row['Total Revenue'] || 0),
                        spend: _.sumBy(rows, row => row['Ad Spend'] || 0),
                        margin: _.sumBy(rows, row => row.Margin || 0),
                        roi: ((_.sumBy(rows, row => row['Total Revenue'] || 0) / 
                              _.sumBy(rows, row => row['Ad Spend'] || 0) - 1) * 100) || 0
                      }))
                      .orderBy(['revenue'], ['desc'])
                      .take(5)
                      .value();

                    return networkOffers.length > 0 ? (
                      <div key={network}>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{network} - Top Offers</h4>
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Offer</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Margin</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {networkOffers.map((offer, index) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="px-4 py-2 text-sm">{offer.offer}</td>
                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(offer.revenue)}</td>
                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(offer.spend)}</td>
                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(offer.margin)}</td>
                                <td className="px-4 py-2 text-sm text-right">{formatPercent(offer.roi)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedPerformanceDashboard;