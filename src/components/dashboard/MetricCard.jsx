import React from 'react';

const MetricCard = ({ title, value, trend, indicator, comparison }) => {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h5 className="text-sm font-medium">{title}</h5>
      <p className="text-lg font-bold">{value}</p>
      {trend && <p className="text-sm text-gray-500">Trend: {trend}</p>}
      {indicator && <p className="text-sm text-gray-500">Indicator: {indicator}</p>}
      {comparison && <p className="text-sm text-gray-500">Comparison: {comparison}</p>}
    </div>
  );
};

export default MetricCard;
