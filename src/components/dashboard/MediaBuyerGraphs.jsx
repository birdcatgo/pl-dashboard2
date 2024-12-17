import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const MediaBuyerGraphs = ({ rawData, selectedBuyers = [], showAllBuyers = false }) => {
  const chartData = useMemo(() => {
    if (!rawData?.length) return [];

    // Get the last 30 days date range
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Filter data for last 30 days and selected buyers
    const filteredData = rawData.filter(row => {
      const date = new Date(row.Date);
      return date >= thirtyDaysAgo && 
        (showAllBuyers || selectedBuyers.length === 0 || selectedBuyers.includes(row['Media Buyer']));
    });

    // If showing all buyers or no specific selection, group by date and buyer
    if (showAllBuyers || selectedBuyers.length === 0) {
      const groupedData = _.groupBy(filteredData, row => row.Date);
      
      return Object.entries(groupedData).map(([date, rows]) => {
        const buyerMargins = {};
        rows.forEach(row => {
          if (!buyerMargins[row['Media Buyer']]) {
            buyerMargins[row['Media Buyer']] = 0;
          }
          buyerMargins[row['Media Buyer']] += parseFloat(row.Margin || 0);
        });
        
        return {
          date: new Date(date).toLocaleDateString(),
          ...buyerMargins
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    } 
    // If specific buyer(s) selected, show their offer performance
    else {
      const groupedData = _.groupBy(filteredData, row => row.Date);
      
      return Object.entries(groupedData).map(([date, rows]) => {
        const offerMargins = {};
        rows.forEach(row => {
          const key = `${row['Media Buyer']} - ${row.Offer}`;
          if (!offerMargins[key]) {
            offerMargins[key] = 0;
          }
          offerMargins[key] += parseFloat(row.Margin || 0);
        });
        
        return {
          date: new Date(date).toLocaleDateString(),
          ...offerMargins
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [rawData, selectedBuyers, showAllBuyers]);

  const series = useMemo(() => {
    if (showAllBuyers || selectedBuyers.length === 0) {
      return _.uniq(rawData?.map(row => row['Media Buyer']) || []);
    }
    // Get all unique offer combinations for selected buyers
    return _.uniq(
      rawData
        ?.filter(row => selectedBuyers.includes(row['Media Buyer']))
        .map(row => `${row['Media Buyer']} - ${row.Offer}`)
    );
  }, [rawData, selectedBuyers, showAllBuyers]);

  // Generate unique colors for each series
  const colors = [
    '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', 
    '#0891b2', '#4f46e5', '#c026d3', '#059669', '#d97706',
    '#7c3aed', '#db2777', '#0d9488', '#9333ea', '#84cc16'
  ];

  if (!chartData.length) {
    return <div className="text-gray-500 text-center py-4">No data available for the selected period</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {selectedBuyers.length > 0 
          ? `Media Buyer Performance - ${selectedBuyers.join(', ')} (All Offers)`
          : 'All Media Buyers Performance'
        }
      </h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
            />
            <Tooltip
              formatter={(value) => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
            />
            <Legend />
            {series.map((item, index) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                stroke={colors[index % colors.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MediaBuyerGraphs;