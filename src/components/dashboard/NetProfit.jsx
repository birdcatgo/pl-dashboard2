import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { DateRangePicker } from '../ui/DateRangePicker';
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
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';
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
  const [viewType, setViewType] = useState('chart');

  useEffect(() => {
    if (!performanceData || !plData?.monthly) return;

    console.log('NetProfit - Performance Data:', performanceData);
    console.log('NetProfit - PL Data:', plData);
    console.log('NetProfit - Monthly Data from PL:', plData.monthly);

    // Get list of months that have expense data from sheets
    const monthsWithExpenses = new Set(Object.keys(plData.monthly).map(month => `${month} 2024`));
    console.log('Months with expense data:', monthsWithExpenses);

    // Group and calculate monthly totals
    const monthlyTotals = (performanceData || []).reduce((acc, row) => {
      try {
        const date = parse(row.Date, 'M/d/yyyy', new Date());
        const monthKey = format(date, 'MMMM yyyy');
        
        // Skip if this month doesn't have expense data
        if (!monthsWithExpenses.has(monthKey)) {
          console.log(`Skipping ${monthKey} - no expense data available`);
          return acc;
        }

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
      // Skip if we don't have revenue data for this month
      if (!monthlyTotals[monthKey]) {
        console.log(`Skipping expenses for ${monthKey} - no revenue data available`);
        return;
      }

      const expenses = entries
        .filter(entry => entry['Income/Expense'] === 'Expense')
        .reduce((sum, entry) => sum + Math.abs(entry.AMOUNT), 0);
      
      console.log(`${monthKey} expenses:`, expenses);
      monthlyTotals[monthKey].expenses = expenses;
      
      // Group expenses by category for network/offer breakdown
      entries
        .filter(entry => entry['Income/Expense'] === 'Expense')
        .forEach(expense => {
          // Distribute expenses proportionally across networks/offers
          const networks = Object.keys(monthlyTotals[monthKey].byNetwork);
          const expensePerNetwork = Math.abs(expense.AMOUNT) / networks.length;
          
          networks.forEach(network => {
            monthlyTotals[monthKey].byNetwork[network].expenses += expensePerNetwork;
            
            // Distribute to offers within this network
            const networkOffers = Object.keys(monthlyTotals[monthKey].byOffer)
              .filter(key => key.startsWith(network));
            const expensePerOffer = expensePerNetwork / networkOffers.length;
            
            networkOffers.forEach(offerKey => {
              monthlyTotals[monthKey].byOffer[offerKey].expenses += expensePerOffer;
            });
          });
        });
    });

    // Calculate net profit
    Object.values(monthlyTotals).forEach(month => {
      month.netProfit = month.revenue - month.expenses;
      
      // Calculate net profit for each offer and network
      Object.values(month.byOffer).forEach(offer => {
        offer.netProfit = offer.revenue - offer.expenses;
      });
      
      Object.values(month.byNetwork).forEach(network => {
        network.netProfit = network.revenue - network.expenses;
      });
    });

    // Sort monthly data by date
    const sortedMonthlyData = Object.values(monthlyTotals).sort((a, b) => {
      return parse(a.month, 'MMMM yyyy', new Date()) - parse(b.month, 'MMMM yyyy', new Date());
    });

    setMonthlyData(sortedMonthlyData);
    
    // Set selected month to most recent month with data
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonthData.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentMonthData.expenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(currentMonthData.netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
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

      {/* Month Selector */}
      <div className="flex justify-center items-center mt-8 mb-4">
        <label className="mr-2 text-sm font-medium text-gray-700">Select Month:</label>
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

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                    .sort((a, b) => b[1].revenue - a[1].revenue) // Sort by revenue in descending order
                    .map(([offer, data]) => {
                      const percentage = (data.revenue / currentMonthData.revenue) * 100;
                      // Calculate ROI
                      const roi = data.expenses > 0 ? ((data.revenue - data.expenses) / data.expenses) * 100 : 0;
                      
                      // Determine status based on ROI thresholds
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