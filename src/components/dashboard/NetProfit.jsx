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

const NetProfit = ({ performanceData, dateRange, cashFlowData }) => {
  const [monthlyTotals, setMonthlyTotals] = useState({});

  // Debug logs
  console.log('NetProfit component props:', { 
    performanceData: performanceData?.length, 
    dateRange,
    cashFlowData,
    networkTerms: cashFlowData?.networkTerms,
    sampleData: performanceData?.[0]
  });

  // Calculate cash in bank and credit card debt using direct cell values from Financial Resources sheet
  const cashInBank = cashFlowData?.directCells?.cashInBank || 0;
  const creditCardDebt = cashFlowData?.directCells?.creditCardDebt || 0;

  // Calculate outstanding invoices using the invoices data
  const outstandingInvoices = cashFlowData?.outstandingInvoices || 0;

  // Add detailed debug logs for financial calculations
  console.log('=== NETPROFIT USING DIRECT CELL VALUES ===');
  console.log('Direct cell values from Financial Resources sheet (B4 and C7:C24):', {
    cashInBank,
    creditCardDebt,
    outstandingInvoices,
    totalAvailableCapital: cashInBank + outstandingInvoices - creditCardDebt,
    directCellsRaw: cashFlowData?.directCells
  });
  console.log('=== END NETPROFIT DIRECT CELLS DEBUG ===');

  // Calculate final total
  const totalAvailableCapital = cashInBank + outstandingInvoices - creditCardDebt;

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
          // Skip rows with missing or invalid dates
          if (!row.Date) {
            console.warn('Skipping row with missing date:', row);
            return;
          }

          // Try parsing as MM/DD/YYYY format first
          let date;
          if (typeof row.Date === 'string') {
            if (row.Date.includes('/')) {
              const parts = row.Date.split('/');
              if (parts.length === 3) {
                const [month, day, year] = parts.map(num => parseInt(num, 10));
                if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                  // Handle 2-digit years
                  const fullYear = year < 100 ? 2000 + year : year;
                  date = new Date(fullYear, month - 1, day);
                }
              }
            } 
            // Try parsing as YYYY-MM-DD format
            else if (row.Date.includes('-')) {
              date = new Date(row.Date);
            }
            // Try parsing as M/D/YYYY format (without leading zeros)
            else {
              const parts = row.Date.split('/');
              if (parts.length === 3) {
                const [month, day, year] = parts.map(num => parseInt(num, 10));
                if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                  const fullYear = year < 100 ? 2000 + year : year;
                  date = new Date(fullYear, month - 1, day);
                }
              }
            }
          }

          // Skip invalid dates
          if (!date || isNaN(date.getTime())) {
            console.warn('Skipping row with invalid date format:', row.Date);
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
          console.warn('Error processing row:', row, rowError);
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
      setMonthlyTotals({}); // Set empty object on error to prevent undefined state
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
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Cash in Bank</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(cashInBank)}</p>
          <p className="text-sm text-gray-500 mt-2">Available cash and savings accounts</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Outstanding Invoices</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(outstandingInvoices)}</p>
          <p className="text-sm text-gray-500 mt-2">Expected payments from networks</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Credit Card Debt</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(creditCardDebt)}</p>
          <p className="text-sm text-gray-500 mt-2">Total credit card balances</p>
        </Card>
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Total Available Capital</h3>
          <p className={`text-3xl font-bold ${totalAvailableCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalAvailableCapital)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Cash + Invoices - Credit Card Debt</p>
        </Card>
      </div>

      {/* Monthly Net Profit Chart */}
      <Card className="p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Monthly Net Profit</h2>
          <Line data={chartData} options={chartOptions} />
          
          {/* Data Table */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Expenses</th>
                    <th className="text-right py-2">Net Profit</th>
                    <th className="text-right py-2">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyTotals).reverse().map(([month, data]) => (
                    <tr key={month} className="border-b">
                      <td className="py-2">{month}</td>
                      <td className="text-right py-2">{formatCurrency(data.revenue)}</td>
                      <td className="text-right py-2">{formatCurrency(data.expenses)}</td>
                      <td className={`text-right py-2 font-medium ${
                        data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(data.netProfit)}
                      </td>
                      <td className="text-right py-2">
                        {data.revenue > 0 
                          ? `${((data.netProfit / data.revenue) * 100).toFixed(1)}%`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500 italic">
                Note: This view shows revenue earned from ad spend (regardless of when payment is received) minus ad spend for the month. This differs from the Profit & Loss view which tracks actual money received and spent within each month.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NetProfit; 