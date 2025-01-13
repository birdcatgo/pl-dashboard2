// OverviewDashboard.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parse } from 'date-fns';
import MonthlyProfitOverview from './MonthlyProfitOverview';

const OverviewDashboard = ({ performanceData = [] }) => {
  console.log('Overview Dashboard received data:', performanceData);

  // Process data for media buyer profit by day
  const mediaBuyerProfitData = performanceData?.reduce((acc, row) => {
    try {
      const date = format(parse(row.Date, 'M/d/yyyy', new Date()), 'yyyy-MM-dd');
      console.log('Processing date:', date, 'Row:', row);
      if (!acc[date]) {
        acc[date] = {};
      }
      const buyer = row['Media Buyer'];
      acc[date][buyer] = (acc[date][buyer] || 0) + (row.Margin || 0);
      return acc;
    } catch (error) {
      console.error('Error processing row:', error, 'Row data:', row);
      return acc;
    }
  }, {});

  // Process data for network-offer profit by day
  const networkOfferProfitData = performanceData?.reduce((acc, row) => {
    try {
      const date = format(parse(row.Date, 'M/d/yyyy', new Date()), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {};
      }
      const key = `${row.Network}-${row.Offer}`;
      acc[date][key] = (acc[date][key] || 0) + (row.Margin || 0);
      return acc;
    } catch (error) {
      console.error('Error processing network-offer data:', error, 'Row:', row);
      return acc;
    }
  }, {});

  // Add sorting to ensure chronological order
  const sortedDates = Object.keys(mediaBuyerProfitData).sort();
  console.log('Available dates:', sortedDates);

  // Convert to chart data format
  const mediaBuyerChartData = Object.entries(mediaBuyerProfitData).map(([date, buyers]) => ({
    date,
    ...buyers,
  }));

  const networkOfferChartData = Object.entries(networkOfferProfitData).map(([date, offers]) => ({
    date,
    ...offers,
  }));

  // Sort chart data chronologically
  mediaBuyerChartData.sort((a, b) => new Date(a.date) - new Date(b.date));
  networkOfferChartData.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-8">
      <MonthlyProfitOverview rawData={performanceData} />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Media Buyer Daily Profit</h3>
        <div className="h-96">
          <ResponsiveContainer>
            <LineChart data={mediaBuyerChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(mediaBuyerProfitData?.[Object.keys(mediaBuyerProfitData || {})[0]] || {}).map((buyer, index) => (
                <Line 
                  key={buyer}
                  type="monotone"
                  dataKey={buyer}
                  stroke={`hsl(${index * 45}, 70%, 50%)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Network-Offer Daily Profit</h3>
        <div className="h-96">
          <ResponsiveContainer>
            <LineChart data={networkOfferChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(networkOfferProfitData?.[Object.keys(networkOfferProfitData || {})[0]] || {}).map((key, index) => (
                <Line 
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`hsl(${index * 20}, 70%, 50%)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;