import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
};

const MetricCard = ({ title, value, previousValue, prefix = '', suffix = '' }) => {
  const growth = calculateGrowth(value, previousValue);
  const isPositive = growth > 0;

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">
          {prefix}{typeof value === 'number' ? formatCurrency(value) : value}{suffix}
        </p>
        {previousValue && (
          <p className={`ml-2 flex items-center text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="ml-1">{Math.abs(growth)}%</span>
          </p>
        )}
      </div>
    </div>
  );
};

const ProfitabilitySnapshot = ({ monthlyData }) => {
  if (!monthlyData || monthlyData.length < 2) return null;

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const metrics = [
    {
      title: 'Revenue',
      value: currentMonth.revenue,
      previousValue: previousMonth.revenue
    },
    {
      title: 'Expenses',
      value: currentMonth.expenses,
      previousValue: previousMonth.expenses
    },
    {
      title: 'Net Profit',
      value: currentMonth.profit,
      previousValue: previousMonth.profit
    },
    {
      title: 'Profit Margin',
      value: ((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1),
      previousValue: ((previousMonth.profit / previousMonth.revenue) * 100).toFixed(1),
      suffix: '%'
    }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            previousValue={metric.previousValue}
            prefix={metric.prefix}
            suffix={metric.suffix}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfitabilitySnapshot; 