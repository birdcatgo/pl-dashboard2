import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';

const formatValue = (value, formatType) => {
  if (formatType === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (formatType === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return value;
};

const MetricItem = ({ label, value, format: formatType, comparison }) => {
  const formattedValue = formatValue(value, formatType);
  const percentChange = comparison ? ((value - comparison) / Math.abs(comparison)) * 100 : 0;
  
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-600 w-1/3">{label}</span>
      <div className={`flex items-center justify-end w-2/3 ${comparison ? 'space-x-4' : ''}`}>
        <span className="font-semibold">{formattedValue}</span>
        {comparison !== undefined && (
          <span className={`text-sm whitespace-nowrap ${
            percentChange > 0 ? 'text-green-600' : 
            percentChange < 0 ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : '–'} {Math.abs(percentChange).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

const OverviewMetrics = ({ metrics }) => {
  const { current, previous } = metrics || {};

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Month to Date Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Previous Month */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-lg font-medium mb-4">
            Previous Month
            {previous?.dateRange?.first && previous?.dateRange?.last && (
              <span className="text-sm text-gray-500 ml-2">
                ({format(new Date(previous.dateRange.first), 'MMM d')} - {format(new Date(previous.dateRange.last), 'MMM d')})
              </span>
            )}
          </div>
          <div className="space-y-1">
            <MetricItem label="Revenue" value={previous?.totalRevenue} format="currency" />
            <MetricItem label="Spend" value={previous?.totalSpend} format="currency" />
            <MetricItem label="Profit" value={previous?.totalProfit} format="currency" />
            <MetricItem label="ROI" value={previous?.roi} format="percentage" />
            <MetricItem label="Profit Margin" value={previous?.profitMargin} format="percentage" />
          </div>
        </div>

        {/* Current Month */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-lg font-medium mb-4">
            Current Month
            {current?.dateRange?.first && current?.dateRange?.last && (
              <span className="text-sm text-gray-500 ml-2">
                ({format(new Date(current.dateRange.first), 'MMM d')} - {format(new Date(current.dateRange.last), 'MMM d')})
              </span>
            )}
          </div>
          <div className="space-y-1">
            <MetricItem label="Revenue" value={current?.totalRevenue} format="currency" comparison={previous?.totalRevenue} />
            <MetricItem label="Spend" value={current?.totalSpend} format="currency" comparison={previous?.totalSpend} />
            <MetricItem label="Profit" value={current?.totalProfit} format="currency" comparison={previous?.totalProfit} />
            <MetricItem label="ROI" value={current?.roi} format="percentage" comparison={previous?.roi} />
            <MetricItem label="Profit Margin" value={current?.profitMargin} format="percentage" comparison={previous?.profitMargin} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewMetrics;

