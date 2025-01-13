import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parse } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import _ from 'lodash';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || !isFinite(value)) return '0%';
  return `${value.toFixed(1)}%`;
};

// MonthRow Component
const MonthRow = ({ monthData, breakdownType }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Process breakdown based on selected type
  const breakdown = React.useMemo(() => {
    if (breakdownType === 'network-offer') {
      return _.chain(monthData.rows)
        .groupBy(row => `${row.Network}-${row.Offer}`)
        .map((rows, key) => {
          const [network, ...offerParts] = key.split('-');
          const offer = offerParts.join('-');
          return {
            name: `${network} → ${offer}`,
            adSpend: _.sumBy(rows, row => row['Ad Spend'] || 0),
            adRevenue: _.sumBy(rows, row => row['Ad Revenue'] || 0),
            margin: _.sumBy(rows, row => row.Margin || 0)
          };
        })
        .filter(item => item.adSpend > 0 || item.adRevenue > 0)
        .orderBy(['margin'], ['desc'])
        .value();
    } else {
      return _.chain(monthData.rows)
        .groupBy('Media Buyer')
        .map((rows, buyer) => ({
          name: buyer,
          adSpend: _.sumBy(rows, row => row['Ad Spend'] || 0),
          adRevenue: _.sumBy(rows, row => row['Ad Revenue'] || 0),
          margin: _.sumBy(rows, row => row.Margin || 0)
        }))
        .filter(item => item.adSpend > 0 || item.adRevenue > 0)
        .orderBy(['margin'], ['desc'])
        .value();
    }
  }, [monthData.rows, breakdownType]);

  const monthDate = parse(monthData.month, 'yyyy-MM', new Date());
  const roi = monthData.adSpend ? ((monthData.adRevenue / monthData.adSpend - 1) * 100) : 0;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-gray-900">{format(monthDate, 'MMMM yyyy')}</span>
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
          {formatCurrency(monthData.adRevenue)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
          {formatCurrency(monthData.adSpend)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
          {formatCurrency(monthData.margin)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
          {formatPercent(roi)}
        </td>
      </tr>
      {isExpanded && breakdown.map((item, index) => (
        <tr key={index} className="bg-gray-50">
          <td className="pl-12 pr-6 py-2 text-sm text-gray-500">
            <span className="font-medium">{item.name}</span>
          </td>
          <td className="px-6 py-2 text-sm text-right text-gray-500">
            {formatCurrency(item.adRevenue)}
          </td>
          <td className="px-6 py-2 text-sm text-right text-gray-500">
            {formatCurrency(item.adSpend)}
          </td>
          <td className="px-6 py-2 text-sm text-right text-gray-500">
            {formatCurrency(item.margin)}
          </td>
          <td className="px-6 py-2 text-sm text-right text-gray-500">
            {item.adSpend ? formatPercent((item.adRevenue / item.adSpend - 1) * 100) : '0%'}
          </td>
        </tr>
      ))}
    </>
  );
};

// Chart Component (as before)
const ProfitChart = ({ data }) => {
  const chartData = data.map((row) => ({
    name: format(parse(row.month, 'yyyy-MM', new Date()), 'MMM yyyy'),
    Revenue: row.adRevenue,
    Spend: row.adSpend,
    Margin: row.margin,
    ROI: row.adSpend ? ((row.adRevenue / row.adSpend - 1) * 100) : 0
  }));

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => [
              name === 'ROI' ? `${value.toFixed(1)}%` : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(value),
              name
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="Revenue" fill="#4F46E5" />
          <Bar yAxisId="left" dataKey="Spend" fill="#EF4444" />
          <Bar yAxisId="left" dataKey="Margin" fill="#10B981" />
          <Line yAxisId="right" type="monotone" dataKey="ROI" stroke="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main MonthlyProfitOverview Component (as before)
const MonthlyProfitOverview = ({ rawData }) => {
  console.log('MonthlyProfitOverview received data:', rawData);

  // Process monthly data
  const monthlyData = useMemo(() => {
    if (!rawData?.length) return [];

    // Get the earliest and latest dates
    const dates = rawData.map(row => parse(row.Date, 'M/d/yyyy', new Date()));
    const latestDate = new Date(Math.max(...dates));
    const earliestDate = new Date(Math.min(...dates));
    
    console.log('Date range:', { earliest: earliestDate, latest: latestDate });

    return _(rawData)
      .groupBy(row => {
        const date = parse(row.Date, 'M/d/yyyy', new Date());
        return format(date, 'MMMM yyyy');
      })
      .map((rows, month) => {
        const revenue = _.sumBy(rows, row => parseFloat(row['Total Revenue'] || 0));
        const spend = _.sumBy(rows, row => parseFloat(row['Ad Spend'] || 0));
        const margin = _.sumBy(rows, row => parseFloat(row.Margin || 0));
        const roi = spend > 0 ? (margin / spend) * 100 : 0;

        console.log(`Processing month ${month}:`, {
          rowCount: rows.length,
          revenue,
          spend,
          margin,
          roi
        });

        return {
          month,
          revenue,
          spend,
          margin,
          roi,
          rows
        };
      })
      // Sort by actual date, not string
      .sortBy(item => {
        const date = parse(item.month, 'MMMM yyyy', new Date());
        return -date.getTime(); // Negative for descending order
      })
      .value();
  }, [rawData]);

  console.log('Processed monthly data:', monthlyData);

  // Debug current vs previous month data
  const currentMonth = monthlyData[0];
  const previousMonth = monthlyData[1];
  console.log('Current month data:', currentMonth);
  console.log('Previous month data:', previousMonth);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Monthly Performance Overview</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spend</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {monthlyData.map((monthData) => (
              <MonthRow
                key={monthData.month}
                monthData={monthData}
                breakdownType="network-offer"
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyProfitOverview;