import React, { useState, useEffect, useMemo } from 'react';

const OverviewMetrics = ({ metrics }) => {
  useEffect(() => {
    console.log('OverviewMetrics received metrics:', metrics);
  }, [metrics]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';

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

  const calculatePercentageChange = (current, previous) => {
    if (!previous) return 0;
    return ((current / previous - 1) * 100);
  };

  const currentMonth = {
    revenue: metrics?.totalRevenue || 0,
    spend: metrics?.totalSpend || 0,
    margin: metrics?.totalMargin || 0,
    roi: metrics?.roi || 0
  };

  const previousMonth = {
    revenue: metrics?.previousMonthRevenue || 0,
    spend: metrics?.previousMonthSpend || 0,
    margin: metrics?.previousMonthMargin || 0,
    roi: metrics?.previousMonthRoi || 0
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Month to Date Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-4">Current Month (MTD)</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Revenue</dt>
              <dd className="text-green-600 font-medium">
                {formatCurrency(currentMonth.revenue)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Ad Spend</dt>
              <dd className="text-red-600 font-medium">
                {formatCurrency(currentMonth.spend)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Margin</dt>
              <dd className="text-blue-600 font-medium">
                {formatCurrency(currentMonth.margin)}
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
                {formatCurrency(previousMonth.revenue)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Ad Spend</dt>
              <dd className="text-red-600 font-medium">
                {formatCurrency(previousMonth.spend)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Margin</dt>
              <dd className="text-blue-600 font-medium">
                {formatCurrency(previousMonth.margin)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default OverviewMetrics;

