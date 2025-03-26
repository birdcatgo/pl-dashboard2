import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NetProfit = ({ performanceData, dateRange }) => {
  const [monthlyTotals, setMonthlyTotals] = useState({});

  // Debug logs
  console.log('NetProfit component props:', { 
    performanceData: performanceData?.length, 
    dateRange,
    sampleData: performanceData?.[0]
  });

  useEffect(() => {
    try {
      if (!performanceData || !Array.isArray(performanceData)) {
        console.error('Invalid performance data:', performanceData);
        return;
      }

      // Group and calculate monthly totals
      const totals = {};
      
      performanceData.forEach(row => {
        try {
          // Safely handle date parsing
          let date;
          if (row.Date.includes('/')) {
            const [month, day, year] = row.Date.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (row.Date.includes('-')) {
            date = new Date(row.Date);
          } else {
            console.error('Unrecognized date format:', row.Date);
            return;
          }

          // Skip invalid dates
          if (isNaN(date.getTime())) {
            console.error('Invalid date:', row.Date);
            return;
          }

          const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          
          if (!totals[monthKey]) {
            totals[monthKey] = {
              revenue: 0,
              expenses: 0,
              netProfit: 0
            };
          }

          // Safely parse numbers - handle both string and number inputs
          const revenue = typeof row['Total Revenue'] === 'string' 
            ? parseFloat(row['Total Revenue'].replace(/[^0-9.-]+/g, '')) 
            : parseFloat(row['Total Revenue'] || 0);

          const expenses = typeof row['Ad Spend'] === 'string'
            ? parseFloat(row['Ad Spend'].replace(/[^0-9.-]+/g, ''))
            : parseFloat(row['Ad Spend'] || 0);
          
          if (!isNaN(revenue) && !isNaN(expenses)) {
            totals[monthKey].revenue += revenue;
            totals[monthKey].expenses += expenses;
            totals[monthKey].netProfit = totals[monthKey].revenue - totals[monthKey].expenses;
          }
        } catch (rowError) {
          console.error('Error processing row:', row, rowError);
        }
      });

      // Sort months chronologically
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      
      const sortedTotals = Object.fromEntries(
        Object.entries(totals).sort((a, b) => {
          const [monthA, yearA] = a[0].split(' ');
          const [monthB, yearB] = b[0].split(' ');
          const yearDiff = parseInt(yearA) - parseInt(yearB);
          if (yearDiff !== 0) return yearDiff;
          return months.indexOf(monthA) - months.indexOf(monthB);
        })
      );

      setMonthlyTotals(sortedTotals);
    } catch (error) {
      console.error('Error processing performance data:', error);
    }
  }, [performanceData, dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = {
    labels: Object.keys(monthlyTotals),
    datasets: [
      {
        label: 'Revenue',
        data: Object.values(monthlyTotals).map(month => month.revenue),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      },
      {
        label: 'Net Profit',
        data: Object.values(monthlyTotals).map(month => month.netProfit),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: Object.values(monthlyTotals).map(month => month.expenses),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Net Profit'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Monthly Net Profit</h2>
        <Line data={chartData} options={chartOptions} />
        
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider group relative">
                  Net Profit
                  <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded p-2 w-48 -left-16 top-8">
                    Net Profit = Revenue - Expenses
                    <br />
                    Shows actual earnings after all costs
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider group relative">
                  Profit Margin
                  <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded p-2 w-48 -left-16 top-8">
                    Profit Margin = (Net Profit / Revenue) × 100
                    <br />
                    Shows percentage of revenue kept as profit
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(monthlyTotals).map(([month, data]) => (
                <tr key={month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(data.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(data.expenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(data.netProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default NetProfit; 