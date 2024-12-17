import React from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      'Ad Spend': _.sumBy(dayEntries, row => parseFloat(row['Ad Spend']) || 0),
      'Total Revenue': _.sumBy(dayEntries, row => parseFloat(row['Total Revenue']) || 0),
      'Margin': _.sumBy(dayEntries, row => parseFloat(row.Margin) || 0),
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

  const mtdData = data.filter(row => {
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

const EnhancedOverviewV2 = ({ performanceData, cashFlowData, plData }) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const mtdData = performanceData.filter(row => {
    const [month, day, year] = (row.Date || '').split('/');
    return parseInt(month) === (thisMonth + 1) && parseInt(year) === thisYear;
  });

  const dailyMetrics = React.useMemo(() => {
    const dailySpends = _.chain(mtdData)
      .groupBy('Date')
      .mapValues(dayEntries => _.sumBy(dayEntries, row => parseFloat(row['Ad Spend']) || 0))
      .value();

    const uniqueDays = Object.keys(dailySpends).length;
    const totalSpend = _.sum(Object.values(dailySpends));
    const avgDailySpend = uniqueDays > 0 ? totalSpend / uniqueDays : 0;

    return {
      avgDailySpend,
      uniqueDays,
      totalSpend
    };
  }, [mtdData]);

  const totalAvailable = (cashFlowData?.currentBalance || 0) + (cashFlowData?.creditAvailable || 0);
  const avgDailySpend = dailyMetrics.avgDailySpend || 0;
  const coverageDays = Math.floor(totalAvailable / avgDailySpend);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard 
            title="Available Cash" 
            value={cashFlowData?.currentBalance}
          />
          <MetricCard 
            title="Credit Available" 
            value={cashFlowData?.creditAvailable}
          />
          <MetricCard 
            title="Total Available" 
            value={totalAvailable}
          />
          <MetricCard 
            title="Avg Daily Spend" 
            value={avgDailySpend}
          />
          <MetricCard 
            title="Coverage Days" 
            value={coverageDays}
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

      <MonthlyComparison data={performanceData} />

      {/* Network Caps */}
      <Card>
        <CardHeader>
          <CardTitle>Network Caps & Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Budget</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Exposure</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cashFlowData?.networkPayments?.map((network, index) => (
                <tr key={index} className={network.riskLevel.includes('🔴') ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm">{network.network}</td>
                  <td className="px-6 py-4 text-sm">{network.offer}</td>
                  <td className="px-6 py-4 text-sm">{network.paymentTerms}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.dailyCap)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.dailyBudget)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.currentExposure)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.availableBudget)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${network.riskLevel.includes('✅') ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {network.riskLevel.replace('✅ ', '').replace('🔴 ', '')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cashFlowData?.invoices && cashFlowData.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cashFlowData.invoices.map((invoice, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">{invoice.network}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(invoice.amount)}</td>
                      <td className="px-6 py-4">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Payroll */}
        {cashFlowData?.payroll && cashFlowData.payroll.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cashFlowData.payroll.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">{format(new Date(item.dueDate), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopOffersTable data={topOffers} />
        <TopMediaBuyersTable data={topBuyers} />
      </div>
    </div>
  );
};

export default EnhancedOverviewV2;