import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, DollarSign, Clock } from 'lucide-react';
import _ from 'lodash';

// Utility function for currency formatting
const formatCurrency = (amount) => {
  if (amount === null || typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value) => {
  if (value === null || typeof value !== 'number' || isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

// MetricsCard Component
const MetricsCard = ({ title, value, trend, icon: Icon, className }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {Icon && <Icon className="h-5 w-5 text-gray-400" />}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {trend && (
      <div className={`flex items-center mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span className="text-sm">{formatPercent(trend)}</span>
      </div>
    )}
  </div>
);

// TopOffersTable Component
const TopOffersTable = ({ data }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium">Top Performing Offers</h3>
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
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">{`${offer.network} - ${offer.offer}`}</td>
              <td className="px-6 py-4 text-sm text-right">{formatCurrency(offer.revenue)}</td>
              <td className="px-6 py-4 text-sm text-right">{formatCurrency(offer.margin)}</td>
              <td className="px-6 py-4 text-sm text-right">{formatPercent(offer.roi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const EnhancedOverview = ({ performanceData, cashFlowData, plData }) => {
  // Process top offers
  const topOffers = React.useMemo(() => {
    return _.chain(performanceData)
      .groupBy(row => `${row.Network}-${row.Offer}`)
      .map((rows, key) => {
        const [network, offer] = key.split('-');
        const revenue = _.sumBy(rows, row => row['Total Revenue'] || 0);
        const spend = _.sumBy(rows, row => row['Ad Spend'] || 0);
        const margin = _.sumBy(rows, row => row.Margin || 0);
        return {
          network,
          offer,
          revenue,
          margin,
          roi: spend > 0 ? ((revenue / spend - 1) * 100) : 0
        };
      })
      .orderBy(['margin'], ['desc'])
      .take(5)
      .value();
  }, [performanceData]);

  // Process monthly data for chart
  const monthlyData = React.useMemo(() => {
    if (!plData?.monthly) return [];
    return Object.entries(plData.monthly).map(([month, data]) => {
      const income = _.sumBy(data.filter(item => item['Income/Expense'] === 'Income'), 'AMOUNT');
      const expenses = _.sumBy(data.filter(item => item['Income/Expense'] === 'Expense'), 'AMOUNT');
      return {
        month,
        income,
        expenses,
        profit: income - expenses
      };
    });
  }, [plData]);

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Available Cash"
          value={formatCurrency(cashFlowData?.currentBalance)}
          icon={DollarSign}
        />
        <MetricsCard
          title="Daily Spend"
          value={formatCurrency(cashFlowData?.averageDailySpend)}
          icon={Clock}
        />
        <MetricsCard
          title="Monthly Revenue"
          value={formatCurrency(_.sumBy(performanceData, 'Total Revenue'))}
          trend={10.5}
        />
        <MetricsCard
          title="Monthly Profit"
          value={formatCurrency(_.sumBy(performanceData, 'Margin'))}
          trend={5.2}
        />
      </div>

      {/* Monthly Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Offers */}
      <TopOffersTable data={topOffers} />
    </div>
  );
};

export default EnhancedOverview;