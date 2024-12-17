import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const NetworkGraphs = ({ rawData, selectedNetworks = [], showAllNetworks = false }) => {
  const chartData = useMemo(() => {
    if (!rawData?.length) return [];

    // Get the last 30 days date range
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Filter data for last 30 days and selected networks
    const filteredData = rawData.filter(row => {
      const date = new Date(row.Date);
      return date >= thirtyDaysAgo && 
        (showAllNetworks || selectedNetworks.length === 0 || selectedNetworks.includes(row.Network));
    });

    // If showing all networks or no specific selection, group by date and network
    if (showAllNetworks || selectedNetworks.length === 0) {
      const groupedData = _.groupBy(filteredData, row => row.Date);
      
      return Object.entries(groupedData).map(([date, rows]) => {
        const networkMargins = {};
        rows.forEach(row => {
          if (!networkMargins[row.Network]) {
            networkMargins[row.Network] = 0;
          }
          networkMargins[row.Network] += parseFloat(row.Margin || 0);
        });
        
        return {
          date: new Date(date).toLocaleDateString(),
          ...networkMargins
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    } 
    // If specific network(s) selected, show their media buyer performance
    else {
      const groupedData = _.groupBy(filteredData, row => row.Date);
      
      return Object.entries(groupedData).map(([date, rows]) => {
        const buyerMargins = {};
        rows.forEach(row => {
          const key = `${row.Network} - ${row['Media Buyer']}`;
          if (!buyerMargins[key]) {
            buyerMargins[key] = 0;
          }
          buyerMargins[key] += parseFloat(row.Margin || 0);
        });
        
        return {
          date: new Date(date).toLocaleDateString(),
          ...buyerMargins
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [rawData, selectedNetworks, showAllNetworks]);

  const series = useMemo(() => {
    if (showAllNetworks || selectedNetworks.length === 0) {
      return _.uniq(rawData?.map(row => row.Network) || []);
    }
    // Get all unique media buyer combinations for selected networks
    return _.uniq(
      rawData
        ?.filter(row => selectedNetworks.includes(row.Network))
        .map(row => `${row.Network} - ${row['Media Buyer']}`)
    );
  }, [rawData, selectedNetworks, showAllNetworks]);

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
        {selectedNetworks.length > 0 
          ? `Network Performance - ${selectedNetworks.join(', ')} (All Media Buyers)`
          : 'All Networks Performance'
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

export default NetworkGraphs;