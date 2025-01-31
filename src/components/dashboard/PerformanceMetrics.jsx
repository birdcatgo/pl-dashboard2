import React from 'react';
import { Card } from '../ui/card';

const MetricsCard = ({ title, current = 0, previous = 0, format = 'number', prefix = '' }) => {
  const formatValue = (value) => {
    if (!value && value !== 0) return '0';
    
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (format === 'percentage') {
      return `${Number(value).toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  const percentageChange = previous ? ((current - previous) / previous) * 100 : 0;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900">
            {prefix}{formatValue(current)}
          </p>
          <p className="text-sm text-gray-500">
            vs {prefix}{formatValue(previous)}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 text-sm font-medium rounded-full ${
          percentageChange >= 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
        </span>
      </div>
    </Card>
  );
};

const PerformanceMetrics = ({ metrics }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
        <p className="text-2xl font-bold text-blue-700">
          {formatCurrency(metrics?.totalRevenue)}
        </p>
      </div>
      <div className="bg-red-50 rounded-lg p-4">
        <p className="text-sm text-red-600 font-medium">Total Spend</p>
        <p className="text-2xl font-bold text-red-700">
          {formatCurrency(metrics?.totalSpend)}
        </p>
      </div>
      <div className="bg-green-50 rounded-lg p-4">
        <p className="text-sm text-green-600 font-medium">Total Margin</p>
        <p className="text-2xl font-bold text-green-700">
          {formatCurrency(metrics?.totalMargin)}
        </p>
      </div>
      <div className="bg-purple-50 rounded-lg p-4">
        <p className="text-sm text-purple-600 font-medium">ROI</p>
        <p className="text-2xl font-bold text-purple-700">
          {formatPercent(metrics?.roi)}
        </p>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 