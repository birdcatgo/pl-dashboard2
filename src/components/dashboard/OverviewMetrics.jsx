import React, { useState } from 'react';

const OverviewMetrics = ({ metrics }) => {
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());

  const handleDateRangeChange = async ({ startDate, endDate }) => {
    try {
      // Update the state
      setStartDate(new Date(startDate));
      setEndDate(new Date(endDate));
  
      // Trigger a new fetch with the updated date range
      await loadDashboardData(new Date(startDate), new Date(endDate));
    } catch (error) {
      console.error('Error updating date range:', error);
    }
  };
  

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold mt-1">
          {metrics && metrics.totalRevenue !== null
            ? formatCurrency(metrics.totalRevenue)
            : 'N/A'}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Ad Spend</h3>
        <p className="text-2xl font-bold mt-1">
          {metrics && metrics.totalSpend !== null
            ? formatCurrency(metrics.totalSpend)
            : 'N/A'}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Margin</h3>
        <p className="text-2xl font-bold mt-1">
          {metrics && metrics.totalMargin !== null
            ? formatCurrency(metrics.totalMargin)
            : 'N/A'}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">ROI</h3>
        <p className="text-2xl font-bold mt-1">
          {metrics && metrics.roi !== null
            ? formatPercent(metrics.roi)
            : 'N/A'}
        </p>
      </div>

    </div>
  );
};

export default OverviewMetrics;

