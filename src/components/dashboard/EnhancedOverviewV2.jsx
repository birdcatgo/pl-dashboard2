import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OverviewMetrics from './OverviewMetrics';
import { processPerformanceData } from '@/lib/pl-data-processor';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return `${Number(value).toFixed(1)}%`;
};

const MetricCard = ({ title, value, icon: Icon, isCurrency = true }) => {
  const displayValue = isCurrency ? formatCurrency(value) : `${value}`;

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="text-blue-600 font-medium">{title}</div>
        {Icon && <Icon className="h-5 w-5 text-blue-500" />}
      </div>
      <div className="text-2xl font-bold text-blue-700 mt-2">
        {displayValue} {!isCurrency && 'days'}
      </div>
    </div>
  );
};

const DailyPerformanceChart = ({ data }) => {
  const chartData = _.chain(data)
    .groupBy('Date')
    .map((dayEntries, date) => ({
      date,
      'Ad Spend': _.sumBy(dayEntries, row => parseFloat(row['Ad Spend'] || '0')),
      'Total Revenue': _.sumBy(dayEntries, row => parseFloat(row['Total Revenue'] || '0')),
      'Margin': _.sumBy(dayEntries, row => {
        const revenue = parseFloat(row['Total Revenue'] || '0');
        const spend = parseFloat(row['Ad Spend'] || '0');
        return revenue - spend;
      }),
    }))
    .orderBy(['date'], ['asc'])
    .value();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => date.split('/').slice(0, 2).join('/')}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="Ad Spend"
              name="Ad Spend"
              stroke="#EF4444" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="Total Revenue"
              name="Revenue"
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="Margin"
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TopOffersTable = ({ data }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Top Offers (MTD)</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network - Offer</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((offer, index) => (
            <tr key={index} className={offer.margin < 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {offer.network} - {offer.offer}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                {formatCurrency(offer.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                {formatCurrency(offer.margin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {formatPercent(offer.roi)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TopMediaBuyersTable = ({ data }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Top Media Buyers (MTD)</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((buyer, index) => (
            <tr key={index} className={buyer.margin < 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.buyer}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                {formatCurrency(buyer.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                {formatCurrency(buyer.margin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {formatPercent(buyer.roi)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MonthlyComparison = ({ data }) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const mtdData = (performanceData || []).filter(row => {
    if (!row || !row.Date) return false;
    const [month, day, year] = (row.Date || '').split('/');
    return parseInt(month) === (thisMonth + 1) && parseInt(year) === thisYear;
  });
  
  const lastMonthData = data.filter(row => {
    const [month, day, year] = (row.Date || '').split('/');
    return parseInt(month) === thisMonth && parseInt(year) === thisYear;
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Month to Date Performance</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">Current Month (MTD)</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Revenue</dt>
                <dd className="text-green-600 font-medium">
                  {formatCurrency(_.sumBy(mtdData, row => parseFloat(row['Total Revenue']) || 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Ad Spend</dt>
                <dd className="text-red-600 font-medium">
                  {formatCurrency(_.sumBy(mtdData, row => parseFloat(row['Ad Spend']) || 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Margin</dt>
                <dd className="text-blue-600 font-medium">
                  {formatCurrency(_.sumBy(mtdData, row => parseFloat(row.Margin) || 0))}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">Previous Month</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Revenue</dt>
                <dd className="text-green-600 font-medium">
                  {formatCurrency(_.sumBy(lastMonthData, row => parseFloat(row['Total Revenue']) || 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Ad Spend</dt>
                <dd className="text-red-600 font-medium">
                  {formatCurrency(_.sumBy(lastMonthData, row => parseFloat(row['Ad Spend']) || 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Margin</dt>
                <dd className="text-blue-600 font-medium">
                  {formatCurrency(_.sumBy(lastMonthData, row => parseFloat(row.Margin) || 0))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedOverviewV2 = ({ performanceData = [], cashFlowData, plData, data }) => {
  console.log('EnhancedOverviewV2 Input:', {
    performanceDataLength: performanceData?.length,
    performanceDataSample: performanceData?.slice(0, 3),
    hasPerformanceData: !!performanceData?.length,
    plDataKeys: Object.keys(plData || {})
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (performanceData) {
      setIsLoading(false);
    }
  }, [performanceData]);

  useEffect(() => {
    console.log('EnhancedOverviewV2 received data:', {
      hasData: !!data,
      networkTerms: data?.networkTerms,
      networkTermsLength: data?.networkTerms?.length
    });
  }, [data]);

  useEffect(() => {
    console.log('EnhancedOverviewV2 received performanceData:', {
      hasData: !!performanceData,
      rowCount: performanceData?.length,
      dateRange: performanceData?.length > 0 ? {
        first: performanceData[0]?.Date,
        last: performanceData[performanceData.length - 1]?.Date,
        sample: performanceData.slice(0, 2)
      } : null
    });
  }, [performanceData]);

  // Add this where performanceData is first received
  console.log('Raw performance data:', {
    totalRows: performanceData?.length,
    firstRow: performanceData?.[0],
    lastRow: performanceData?.[performanceData.length - 1],
    allDates: performanceData?.map(row => row.Date).sort()
  });

  // Add near where performanceData is received
  console.log('EnhancedOverviewV2 received data:', {
    performanceData,
    processedData: processPerformanceData(performanceData)
  });

  // Add debug log for cashFlowData
  useEffect(() => {
    console.log('EnhancedOverviewV2 received cashFlowData:', cashFlowData);
  }, [cashFlowData]);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const mtdData = useMemo(() => {
    return performanceData?.filter(row => {
      if (!row?.Date) return false;
      const [month, day, year] = row.Date.split('/');
      return parseInt(month) === (thisMonth + 1) && parseInt(year) === thisYear;
    }) || [];
  }, [performanceData, thisMonth, thisYear]);

  const dailyMetrics = useMemo(() => {
    if (!mtdData?.length) return {
      dailySpends: {},
      dailyRevenues: {},
      chartData: []
    };

    const dailySpends = _.chain(mtdData)
      .groupBy('Date')
      .mapValues(dayEntries => _.sumBy(dayEntries, row => parseFloat(row['Ad Spend'] || '0')))
      .value();

    const dailyRevenues = _.chain(mtdData)
      .groupBy('Date')
      .mapValues(dayEntries => _.sumBy(dayEntries, row => parseFloat(row['Total Revenue'] || '0')))
      .value();

    const chartData = Object.keys(dailySpends).map(date => ({
      date,
      spend: dailySpends[date] || 0,
      revenue: dailyRevenues[date] || 0,
      profit: (dailyRevenues[date] || 0) - (dailySpends[date] || 0)
    }));

    return {
      dailySpends,
      dailyRevenues,
      chartData: _.sortBy(chartData, 'date')
    };
  }, [mtdData]);

  // Update resourceMetrics calculation
  const resourceMetrics = useMemo(() => {
    console.log('Calculating resource metrics with raw data:', cashFlowData);

    // Use the processed values directly from cashFlowData
    const availableCash = cashFlowData?.availableCash || 0;
    const creditAvailable = cashFlowData?.creditAvailable || 0;
    const totalAvailable = cashFlowData?.totalAvailable || 0;

    // Get daily spend values from dailyMetrics
    const spendValues = Object.values(dailyMetrics.dailySpends);
    const recentSpends = spendValues.slice(-7);  // Get last 7 days
    const avgDailySpend = recentSpends.reduce((sum, spend) => sum + spend, 0) / recentSpends.length;

    // Calculate coverage days based on total available and average daily spend
    const coverageDays = avgDailySpend ? Math.floor(totalAvailable / avgDailySpend) : 0;

    const metrics = {
      availableCash,
      creditAvailable,
      totalAvailable,
      avgDailySpend,
      coverageDays
    };

    console.log('Calculated resource metrics:', {
      ...metrics,
      recentSpends,
      daysUsed: recentSpends.length,
      totalSpend: recentSpends.reduce((sum, spend) => sum + spend, 0)
    });
    return metrics;
  }, [cashFlowData, dailyMetrics]);

  const [topOffers, topBuyers] = React.useMemo(() => {
    const offers = _.chain(mtdData)
      .groupBy(row => `${row.Network}-${row.Offer}`)
      .map((rows, key) => {
        const [network, offer] = key.split('-');
        return {
          network,
          offer,
          revenue: _.sumBy(rows, row => parseFloat(row['Total Revenue']) || 0),
          margin: _.sumBy(rows, row => parseFloat(row.Margin) || 0),
          spend: _.sumBy(rows, row => parseFloat(row['Ad Spend']) || 0)
        };
      })
      .map(offer => ({
        ...offer,
        roi: offer.spend > 0 ? ((offer.revenue / offer.spend - 1) * 100) : 0
      }))
      .orderBy(['margin'], ['desc'])
      .take(5)
      .value();

    const buyers = _.chain(mtdData)
      .groupBy('Media Buyer')
      .map((rows, buyer) => ({
        buyer,
        revenue: _.sumBy(rows, row => parseFloat(row['Total Revenue']) || 0),
        margin: _.sumBy(rows, row => parseFloat(row.Margin) || 0),
        spend: _.sumBy(rows, row => parseFloat(row['Ad Spend']) || 0)
      }))
      .map(buyer => ({
        ...buyer,
        roi: buyer.spend > 0 ? ((buyer.revenue / buyer.spend - 1) * 100) : 0
      }))
      .orderBy(['margin'], ['desc'])
      .take(5)
      .value();

    return [offers, buyers];
  }, [mtdData]);

  const metrics = useMemo(() => {
    // Get current month's data
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get MTD data
    const mtdData = performanceData.filter(row => {
      const [month, day, year] = row.Date.split('/');
      return parseInt(month) === (currentMonth + 1) && parseInt(year) === currentYear;
    });

    // Get date range for current month
    const currentDateRange = {
      first: mtdData[0]?.Date,
      last: mtdData[mtdData.length - 1]?.Date
    };

    // Calculate current month metrics
    const current = {
      totalRevenue: _.sumBy(mtdData, row => parseFloat(row['Total Revenue']) || 0),
      totalSpend: _.sumBy(mtdData, row => parseFloat(row['Ad Spend']) || 0),
      totalProfit: _.sumBy(mtdData, row => parseFloat(row.Margin) || 0),
      dateRange: currentDateRange
    };

    // Calculate ROI and profit margin
    current.roi = current.totalSpend ? ((current.totalRevenue / current.totalSpend - 1) * 100) : 0;
    current.profitMargin = current.totalRevenue ? ((current.totalProfit / current.totalRevenue) * 100) : 0;

    // Get previous month's data
    const prevMonth = currentMonth === 0 ? 12 : currentMonth;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthData = performanceData.filter(row => {
      const [month, day, year] = row.Date.split('/');
      return parseInt(month) === prevMonth && parseInt(year) === prevYear;
    });

    // Get date range for previous month
    const previousDateRange = {
      first: previousMonthData[0]?.Date,
      last: previousMonthData[previousMonthData.length - 1]?.Date
    };

    // Calculate previous month metrics
    const previous = {
      totalRevenue: _.sumBy(previousMonthData, row => parseFloat(row['Total Revenue']) || 0),
      totalSpend: _.sumBy(previousMonthData, row => parseFloat(row['Ad Spend']) || 0),
      totalProfit: _.sumBy(previousMonthData, row => parseFloat(row.Margin) || 0),
      dateRange: previousDateRange
    };

    // Calculate ROI and profit margin for previous month
    previous.roi = previous.totalSpend ? ((previous.totalRevenue / previous.totalSpend - 1) * 100) : 0;
    previous.profitMargin = previous.totalRevenue ? ((previous.totalProfit / previous.totalRevenue) * 100) : 0;

    console.log('Month to Date Metrics:', { 
      current: {
        month: currentMonth + 1,
        year: currentYear,
        dateRange: currentDateRange,
        ...current
      },
      previous: {
        month: prevMonth,
        year: prevYear,
        dateRange: previousDateRange,
        ...previous,
        dataPoints: previousMonthData.length
      }
    });

    return { current, previous };
  }, [performanceData]);

  if (isLoading || !performanceData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard 
            title="Available Cash" 
            value={resourceMetrics.availableCash}
            icon={DollarSign}
          />
          <MetricCard 
            title="Credit Available" 
            value={resourceMetrics.creditAvailable}
            icon={CreditCard}
          />
          <MetricCard 
            title="Total Available" 
            value={resourceMetrics.totalAvailable}
            icon={Wallet}
          />
          <MetricCard 
            title="Avg Daily Spend" 
            value={resourceMetrics.avgDailySpend}
            icon={TrendingUp}
          />
          <MetricCard 
            title="Coverage Days" 
            value={resourceMetrics.coverageDays}
            icon={Calendar}
            isCurrency={false}
          />
        </div>
      </div>

      <DailyPerformanceChart data={mtdData} />

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">MTD Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Revenue" 
            value={_.sumBy(mtdData, row => parseFloat(row['Total Revenue']) || 0)}
            icon={TrendingUp}
          />
          <MetricCard 
            title="Ad Spend" 
            value={_.sumBy(mtdData, row => parseFloat(row['Ad Spend']) || 0)}
            icon={DollarSign}
          />
          <MetricCard 
            title="Margin" 
            value={_.sumBy(mtdData, row => parseFloat(row.Margin) || 0)}
            icon={TrendingUp}
          />
        </div>
      </div>

      <OverviewMetrics metrics={metrics} />

      {/* Network Terms & Exposure */}
      {data?.networkTerms?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Terms & Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Terms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Due</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Running Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Last Day's Usage ({data?.networkTerms?.[0]?.lastDate || ''})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.networkTerms.map((network, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.network}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.offer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.payPeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.netTerms}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodStart}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodEnd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.invoiceDue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(network.runningTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {typeof network.dailyCap === 'number' ? formatCurrency(network.dailyCap) : network.dailyCap}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {typeof network.dailyCap === 'number' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className={`
                              ${!network.capUtilization ? 'text-gray-600' :
                                network.capUtilization > 90 ? 'text-red-600' : 
                                network.capUtilization > 75 ? 'text-yellow-600' : 
                                'text-green-600'}
                            `}>
                              {typeof network.capUtilization === 'number' 
                                ? `${network.capUtilization.toFixed(1)}%` 
                                : '0%'
                              }
                            </span>
                            <span className="text-gray-500">
                              ({formatCurrency(network.lastDateSpend || 0)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopOffersTable data={topOffers} />
        <TopMediaBuyersTable data={topBuyers} />
      </div>
    </div>
  );
};

export default EnhancedOverviewV2;