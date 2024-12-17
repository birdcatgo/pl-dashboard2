import React from 'react';
import { addDays, format, startOfDay, parseISO, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CashProjectionTable = ({ cashFlowData }) => {
  if (!cashFlowData?.financialResources) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900">7-Day Cash Projection</h3>
        <p className="text-gray-500 mt-2">No cash flow data available</p>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const projectionDays = 30; // Extended to 30 days to show more future transactions
  const startingBalance = cashFlowData.financialResources.totalCash;

  // Generate projection data
  const projections = [];
  let runningBalance = startingBalance;

  // Helper function to parse dates consistently
  const parseDate = (dateString) => {
    try {
      return parseISO(dateString);
    } catch (e) {
      // Handle MM/DD/YYYY format
      const [month, day, year] = dateString.split('/');
      return new Date(year, month - 1, day);
    }
  };

  for (let i = 0; i < projectionDays; i++) {
    const date = addDays(today, i);
    const dailyProjection = {
      date,
      inflows: [],
      outflows: [],
      balance: runningBalance
    };

    // Add invoice payments (inflows)
    if (cashFlowData.invoices) {
      cashFlowData.invoices.forEach(invoice => {
        const dueDate = parseDate(invoice.dueDate);
        if (isSameDay(dueDate, date)) {
          dailyProjection.inflows.push({
            type: 'Network Payment',
            description: `${invoice.network}`,
            amount: invoice.amount
          });
        }
      });
    }

    // Add credit card payments (outflows)
    if (cashFlowData.financialResources.creditCards) {
      cashFlowData.financialResources.creditCards.forEach(card => {
        const dueDate = card.dueDate ? parseDate(card.dueDate) : null;
        if (dueDate && isSameDay(dueDate, date)) {
          dailyProjection.outflows.push({
            type: 'Credit Card Payment',
            description: card.name,
            amount: card.amount || card.owing
          });
        }
      });
    }

    // Add payroll (outflows)
    if (cashFlowData.payroll) {
      cashFlowData.payroll.forEach(payroll => {
        const dueDate = parseDate(payroll.dueDate);
        if (isSameDay(dueDate, date)) {
          dailyProjection.outflows.push({
            type: 'Payroll',
            description: payroll.description,
            amount: payroll.amount
          });
        }
      });
    }

    // Calculate daily totals
    const dayInflows = dailyProjection.inflows.reduce((sum, inflow) => sum + inflow.amount, 0);
    const dayOutflows = dailyProjection.outflows.reduce((sum, outflow) => sum + outflow.amount, 0);
    runningBalance += (dayInflows - dayOutflows);
    dailyProjection.balance = runningBalance;
    dailyProjection.totalInflows = dayInflows;
    dailyProjection.totalOutflows = dayOutflows;
    dailyProjection.name = format(date, 'MMM d'); // For chart display

    projections.push(dailyProjection);
  }

  // Prepare chart data
  const chartData = [
    { name: 'Start', balance: startingBalance },
    ...projections
  ];

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Balance Projection</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                width={100}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                name="Projected Balance"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Projections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inflows</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outflows</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Starting Balance</td>
                <td className="px-6 py-4 text-sm text-right">-</td>
                <td className="px-6 py-4 text-sm text-right">-</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(startingBalance)}
                </td>
              </tr>
              {projections.map((day, index) => (
                <React.Fragment key={index}>
                  {(day.totalInflows > 0 || day.totalOutflows > 0) && (
                    <>
                      <tr className={day.balance < 0 ? 'bg-red-50' : undefined}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {format(day.date, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">
                          {day.totalInflows > 0 && formatCurrency(day.totalInflows)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">
                          {day.totalOutflows > 0 && formatCurrency(day.totalOutflows)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(day.balance)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="4" className="px-6 py-2">
                          <div className="text-xs space-y-1">
                            {day.inflows.map((inflow, i) => (
                              <div key={`inflow-${i}`} className="text-green-600">
                                + {inflow.description}: {formatCurrency(inflow.amount)}
                              </div>
                            ))}
                            {day.outflows.map((outflow, i) => (
                              <div key={`outflow-${i}`} className="text-red-600">
                                - {outflow.description}: {formatCurrency(outflow.amount)}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashProjectionTable;