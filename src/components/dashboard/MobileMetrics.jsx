// MobileMetrics.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MobileMetricCard = ({ title, value, trend }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
    <div className="flex items-center mt-2">
      {trend >= 0 ? <TrendingUp className="text-green-500" /> : <TrendingDown className="text-red-500" />}
      <span className="ml-1 text-sm">{trend >= 0 ? `+${trend}%` : `${trend}%`}</span>
    </div>
  </div>
);

const MobileChart = ({ data, type }) => (
  <div className="bg-white rounded-lg shadow p-4 h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Line type={type} dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const MobileMetrics = ({ data }) => {    return (
      <div className="md:hidden space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MobileMetricCard
            title="Daily Revenue"
            value={formatCurrency(data.dailyRevenue)}
            trend={data.revenueTrend}
          />
          <MobileMetricCard
            title="Cash Balance"
            value={formatCurrency(data.cashBalance)}
            trend={data.cashTrend}
          />
        </div>
        <MobileChart data={data.revenueHistory} type="line" />
      </div>
    );
   };
   export default MobileMetrics;