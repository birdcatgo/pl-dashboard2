import React, { useMemo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const EnhancedCashFlow = ({ financialData, invoices, payroll, mediaBuyerSpend }) => {
  const projections = useMemo(() => {
    const today = startOfDay(new Date());
    const projectionDays = 14;
    const dailyBaseExpenses = 2500; // Fixed weekly expenses divided by 7
    
    // Initialize projection array
    const dailyProjections = [];
    
    // Calculate starting balance from financial data
    const startingBalance = financialData?.cashAccounts?.reduce((sum, account) => 
      sum + (parseFloat(account.available) || 0), 0) || 0;
    
    let runningBalance = startingBalance;
    
    // Generate daily projections
    for (let i = 0; i < projectionDays; i++) {
      const currentDate = addDays(today, i);
      const dailyProjection = {
        date: currentDate,
        inflows: [],
        outflows: [],
        balance: runningBalance
      };

      // Add daily base expenses
      dailyProjection.outflows.push({
        type: 'Daily Expenses',
        amount: dailyBaseExpenses
      });

      // Add payroll expenses if due
      const payrollDue = payroll?.find(p => {
        const dueDate = new Date(p['Due Date']);
        return dueDate.getDate() === currentDate.getDate() &&
               dueDate.getMonth() === currentDate.getMonth();
      });
      
      if (payrollDue) {
        dailyProjection.outflows.push({
          type: 'Payroll',
          description: payrollDue.Description,
          amount: parseFloat(payrollDue.Amount?.replace(/[\$,]/g, '') || 0)
        });
      }

      // Add invoice payments (inflows)
      const dueInvoices = invoices?.filter(inv => {
        const dueDate = new Date(inv['Due Date']);
        return dueDate.getDate() === currentDate.getDate() &&
               dueDate.getMonth() === currentDate.getMonth();
      }) || [];

      dueInvoices.forEach(invoice => {
        dailyProjection.inflows.push({
          type: 'Invoice Payment',
          description: invoice.Network,
          amount: parseFloat(invoice['Amount Due']?.replace(/[\$,]/g, '') || 0)
        });
      });

      // Calculate daily totals
      const dailyInflows = dailyProjection.inflows.reduce((sum, inflow) => 
        sum + inflow.amount, 0);
      const dailyOutflows = dailyProjection.outflows.reduce((sum, outflow) => 
        sum + outflow.amount, 0);

      // Update running balance
      runningBalance += (dailyInflows - dailyOutflows);
      dailyProjection.balance = runningBalance;
      dailyProjection.totalInflows = dailyInflows;
      dailyProjection.totalOutflows = dailyOutflows;
      dailyProjection.name = format(currentDate, 'MMM d'); // For chart display

      dailyProjections.push(dailyProjection);
    }

    return dailyProjections;
  }, [financialData, invoices, payroll]);

  const chartData = useMemo(() => {
    return projections.map(day => ({
      name: day.name,
      balance: day.balance,
      inflows: day.totalInflows,
      outflows: day.totalOutflows
    }));
  }, [projections]);

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Cash Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Available Cash</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(projections[0]?.balance || 0)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Expected Inflows (14d)</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(projections.reduce((sum, day) => sum + day.totalInflows, 0))}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Expected Outflows (14d)</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(projections.reduce((sum, day) => sum + day.totalOutflows, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">14-Day Cash Flow Projection</h3>
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
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Projected Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Projections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Daily Projection Details</h3>
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
              {projections.map((day, index) => (
                <React.Fragment key={index}>
                  <tr className={day.balance < 0 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(day.date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-green-600">
                      {formatCurrency(day.totalInflows)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">
                      {formatCurrency(day.totalOutflows)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(day.balance)}
                    </td>
                  </tr>
                  {(day.inflows.length > 0 || day.outflows.length > 0) && (
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-6 py-2">
                        <div className="text-xs space-y-1">
                          {day.inflows.map((inflow, i) => (
                            <div key={`inflow-${i}`} className="text-green-600">
                              + {inflow.description || inflow.type}: {formatCurrency(inflow.amount)}
                            </div>
                          ))}
                          {day.outflows.map((outflow, i) => (
                            <div key={`outflow-${i}`} className="text-red-600">
                              - {outflow.description || outflow.type}: {formatCurrency(outflow.amount)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
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

export default EnhancedCashFlow;