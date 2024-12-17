import React, { useState } from 'react';
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
  const [breakdownType, setBreakdownType] = useState('network-offer');
  const [view, setView] = useState('chart'); // 'chart' or 'table'

  const monthlyData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    return _.chain(rawData)
      .filter(row => row.Date && (row['Ad Spend'] > 0 || row['Ad Revenue'] > 0))
      .groupBy(row => {
        const date = parse(row.Date, 'M/d/yyyy', new Date());
        return format(date, 'yyyy-MM');
      })
      .map((rows, month) => ({
        month,
        rows,
        adSpend: _.sumBy(rows, row => row['Ad Spend'] || 0),
        adRevenue: _.sumBy(rows, row => row['Ad Revenue'] || 0),
        margin: _.sumBy(rows, row => row.Margin || 0)
      }))
      .orderBy(['month'], ['desc'])
      .value();
  }, [rawData]);

  if (!rawData || rawData.length === 0) {
    return <div className="text-gray-500">No data available for monthly profit overview</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Monthly Profit Overview</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('chart')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'chart'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'table'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Table View
              </button>
              <select
                value={breakdownType}
                onChange={(e) => setBreakdownType(e.target.value)}
                className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="network-offer">Network & Offer</option>
                <option value="media-buyer">Media Buyer</option>
              </select>
            </div>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="p-6">
            <ProfitChart data={monthlyData} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spend
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((monthData) => (
                  <MonthRow
                    key={monthData.month}
                    monthData={monthData}
                    breakdownType={breakdownType}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyProfitOverview;