import React from 'react';

const EnhancedMetrics = ({ data }) => {
  if (!data) {
    return <div>No data available for Enhanced Metrics</div>;
  }

  const { totalRevenue, totalSpend, totalMargin, roi } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Enhanced Metrics</h2>
      <ul>
        <li>Total Revenue: ${totalRevenue?.toLocaleString()}</li>
        <li>Total Spend: ${totalSpend?.toLocaleString()}</li>
        <li>Total Margin: ${totalMargin?.toLocaleString()}</li>
        <li>ROI: {roi ? `${roi.toFixed(2)}%` : 'N/A'}</li>
      </ul>
    </div>
  );
};

export default EnhancedMetrics;
