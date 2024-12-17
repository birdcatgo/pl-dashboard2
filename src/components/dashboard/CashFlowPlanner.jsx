import React, { useState, useMemo } from 'react';
import { format, addDays, parseISO, isAfter, isBefore, startOfDay, subDays } from 'date-fns';
import _ from 'lodash';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

const CashFlowPlanner = ({ performanceData, networkData, cashFlowData }) => {
  const [daysToProject] = useState(30);

  const projections = useMemo(() => {
    if (!cashFlowData) return [];

    const today = startOfDay(new Date());
    const dailyProjections = [];
    const startingBalance = cashFlowData.currentBalance || 0;

    // Calculate expected daily media spend
    const dailyMediaSpend = 
      (cashFlowData.mediaBuyerData || [])
      .reduce((sum, buyer) => sum + parseAmount(buyer[1]), 0);

    // Process credit card payments
    const creditCardPayments = [];
    if (cashFlowData.creditCards) {
      cashFlowData.creditCards.forEach(card => {
        const owing = parseAmount(card.owing);
        if (owing > 0) {
          creditCardPayments.push({
            description: card.name,
            amount: owing,
            dueDate: addDays(today, 14)
          });
        }
      });
    }

    // Get payroll expenses
    const payrollOutflows = (cashFlowData.payrollData || [])
      .filter(entry => entry && entry.amount && entry.dueDate)
      .map(entry => ({
        description: entry.type,
        amount: parseAmount(entry.amount),
        dueDate: parseISO(entry.dueDate)
      }));

    // Process expected inflows from invoices
    const incomingPayments = (cashFlowData.invoices || [])
      .filter(invoice => invoice.amount && invoice.dueDate)
      .map(invoice => ({
        description: invoice.network || 'Network Payment',
        amount: parseAmount(invoice.amount),
        dueDate: parseISO(invoice.dueDate)
      }));

    // Calculate daily projections
    for (let i = 0; i < daysToProject; i++) {
      const date = addDays(today, i);
      const dailyProjection = {
        date,
        inflows: [],
        outflows: [],
        balance: 0
      };

      // Add incoming payments
      incomingPayments
        .filter(payment => payment.dueDate.getTime() === date.getTime())
        .forEach(payment => {
          dailyProjection.inflows.push({
            type: 'Network Payment',
            description: payment.description,
            amount: payment.amount
          });
        });

      // Add daily media spend
      dailyProjection.outflows.push({
        type: 'Media Spend',
        description: 'Total Daily Media Spend',
        amount: dailyMediaSpend
      });

      // Add credit card payments
      creditCardPayments
        .filter(payment => payment.dueDate.getTime() === date.getTime())
        .forEach(payment => {
          dailyProjection.outflows.push({
            type: 'Credit Card Payment',
            description: payment.description,
            amount: payment.amount
          });
        });

      // Add payroll expenses
      payrollOutflows
        .filter(expense => expense.dueDate.getTime() === date.getTime())
        .forEach(expense => {
          dailyProjection.outflows.push({
            type: 'Payroll',
            description: expense.description,
            amount: expense.amount
          });
        });

      dailyProjections.push(dailyProjection);
    }

    // Calculate running balance
    let runningBalance = startingBalance;
    dailyProjections.forEach(day => {
      const dayInflows = _.sumBy(day.inflows, 'amount') || 0;
      const dayOutflows = _.sumBy(day.outflows, 'amount') || 0;
      runningBalance += dayInflows - dayOutflows;
      day.balance = runningBalance;
    });

    return dailyProjections;
  }, [performanceData, networkData, cashFlowData, daysToProject]);

  if (!cashFlowData) {
    return <div className="text-gray-500">Loading cash flow data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Cash Flow Planner</h3>
        <p className="text-sm text-gray-500">30-day projection based on current spending patterns</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inflows</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outflows</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projections.map((day, index) => {
              const dayInflows = _.sumBy(day.inflows, 'amount') || 0;
              const dayOutflows = _.sumBy(day.outflows, 'amount') || 0;
              const net = dayInflows - dayOutflows;
              
              return (
                <React.Fragment key={index}>
                  <tr className={day.balance < 0 ? 'bg-red-50' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(day.date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(dayInflows)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(dayOutflows)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(net)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${day.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatCurrency(day.balance)}
                    </td>
                  </tr>
                  {(day.inflows.length > 0 || day.outflows.length > 0) && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-6 py-2">
                        <div className="text-xs space-y-1">
                          {day.inflows.length > 0 && (
                            <div className="text-green-600">
                              Inflows: {day.inflows.map(inflow => 
                                `${inflow.type} - ${inflow.description} (${formatCurrency(inflow.amount)})`
                              ).join(', ')}
                            </div>
                          )}
                          {day.outflows.length > 0 && (
                            <div className="text-red-600">
                              Outflows: {day.outflows.map(outflow => 
                                `${outflow.type} - ${outflow.description} (${formatCurrency(outflow.amount)})`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowPlanner;