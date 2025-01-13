import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
  ReferenceLine
} from 'recharts';
import { format, parse } from 'date-fns';
import _ from 'lodash';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const NetProfit = ({ performanceData, plData }) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM yyyy'));
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    if (!performanceData || !plData?.monthly) return;

    // Get list of months that have expense data from sheets
    const monthsWithExpenses = new Set(Object.keys(plData.monthly).map(month => `${month} 2024`));

    // Group and calculate monthly totals
    const monthlyTotals = (performanceData || []).reduce((acc, row) => {
      try {
        const date = parse(row.Date, 'M/d/yyyy', new Date());
        const monthKey = format(date, 'MMMM yyyy');
        
        if (!monthsWithExpenses.has(monthKey)) return acc;

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            revenue: 0,
            expenses: 0,
            netProfit: 0,
            byOffer: {},
            byNetwork: {}
          };
        }

        // Add revenue
        acc[monthKey].revenue += parseFloat(row['Ad Revenue'] || 0) + parseFloat(row['Comment Revenue'] || 0);

        // Track by offer
        const offerKey = `${row.Network} - ${row.Offer}`;
        if (!acc[monthKey].byOffer[offerKey]) {
          acc[monthKey].byOffer[offerKey] = {
            revenue: 0,
            expenses: 0,
            netProfit: 0
          };
        }
        acc[monthKey].byOffer[offerKey].revenue += parseFloat(row['Ad Revenue'] || 0) + parseFloat(row['Comment Revenue'] || 0);

        // Track by network
        if (!acc[monthKey].byNetwork[row.Network]) {
          acc[monthKey].byNetwork[row.Network] = {
            revenue: 0,
            expenses: 0,
            netProfit: 0
          };
        }
        acc[monthKey].byNetwork[row.Network].revenue += parseFloat(row['Ad Revenue'] || 0) + parseFloat(row['Comment Revenue'] || 0);

        return acc;
      } catch (error) {
        console.error('Error processing performance row:', row, error);
        return acc;
      }
    }, {});

    // Add expenses from PL data
    Object.entries(plData.monthly).forEach(([month, entries]) => {
      const monthKey = `${month} 2024`;
      if (!monthlyTotals[monthKey]) return;

      const expenses = entries
        .filter(entry => entry['Income/Expense'] === 'Expense')
        .reduce((sum, entry) => sum + Math.abs(entry.AMOUNT), 0);
      
      monthlyTotals[monthKey].expenses = expenses;
      
      // Calculate net profit
      monthlyTotals[monthKey].netProfit = monthlyTotals[monthKey].revenue - expenses;
    });

    // Sort monthly data by date
    const sortedMonthlyData = Object.values(monthlyTotals).sort((a, b) => {
      return parse(a.month, 'MMMM yyyy', new Date()) - parse(b.month, 'MMMM yyyy', new Date());
    });

    setMonthlyData(sortedMonthlyData);
    
    if (sortedMonthlyData.length > 0) {
      setSelectedMonth(sortedMonthlyData[sortedMonthlyData.length - 1].month);
    }
  }, [performanceData, plData]);

  const currentMonthData = monthlyData.find(m => m.month === selectedMonth) || {
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    byOffer: {},
    byNetwork: {}
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex justify-end items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="form-select rounded-md border-gray-300"
        >
          {monthlyData.map(month => (
            <option key={month.month} value={month.month}>
              {month.month}
            </option>
          ))}
        </select>
      </div>

      {/* Net Profit Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Net Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  label={{ 
                    value: 'Net Profit', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  itemStyle={{ color: '#2196F3' }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#000" />
                <Bar
                  dataKey="netProfit"
                  name="Net Profit"
                  fill="#2196F3"
                  label={{
                    position: 'top',
                    formatter: (value) => formatCurrency(value),
                    style: { fill: '#2196F3' }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offer Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(currentMonthData.byOffer)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([offer, data]) => {
                      const percentage = (data.revenue / currentMonthData.revenue) * 100;
                      const roi = data.expenses > 0 ? ((data.revenue - data.expenses) / data.expenses) * 100 : 0;
                      
                      let statusText;
                      let statusColor;
                      if (roi < 0) {
                        statusText = 'Not Profitable';
                        statusColor = 'bg-red-100 text-red-800';
                      } else if (roi <= 20) {
                        statusText = 'Breakeven';
                        statusColor = 'bg-yellow-100 text-yellow-800';
                      } else {
                        statusText = 'Profitable';
                        statusColor = 'bg-green-100 text-green-800';
                      }

                      return (
                        <tr key={offer}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{offer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {formatCurrency(data.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(_.groupBy(plData.monthly[selectedMonth.split(' ')[0]] || [], 'CATEGORY'))
                    .filter(([category, entries]) => entries.some(entry => entry['Income/Expense'] === 'Expense'))
                    .map(([category, entries]) => {
                      const categoryTotal = entries
                        .filter(entry => entry['Income/Expense'] === 'Expense')
                        .reduce((sum, entry) => sum + Math.abs(entry.AMOUNT), 0);
                      const percentage = (categoryTotal / currentMonthData.expenses) * 100;
                      
                      return (
                        <tr key={category}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                            {formatCurrency(categoryTotal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetProfit; 