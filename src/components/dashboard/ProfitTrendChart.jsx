import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ProfitTrendChart = ({ plData }) => {
  const profitTrendData = Object.entries(plData.monthly || {}).map(([month, data]) => {
    const revenue = data.totalIncome || 0;
    const expenses = data.totalExpenses || 0;
    const profit = revenue - expenses;
    const profitMargin = revenue ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    // Calculate expense breakdowns
    const adSpend = data.expenseData?.reduce((sum, expense) => {
      const category = expense.CATEGORY?.toLowerCase() || '';
      if (category.includes('advertising') || category.includes('ad spend')) {
        return sum + parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) || 0;
      }
      return sum;
    }, 0) || 0;

    const payroll = data.expenseData?.reduce((sum, expense) => {
      const category = expense.CATEGORY?.toLowerCase() || '';
      if (category.includes('payroll') || category.includes('salary')) {
        return sum + parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) || 0;
      }
      return sum;
    }, 0) || 0;

    const subscriptions = data.expenseData?.reduce((sum, expense) => {
      const category = expense.CATEGORY?.toLowerCase() || '';
      if (category.includes('subscription') || category.includes('software')) {
        return sum + parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) || 0;
      }
      return sum;
    }, 0) || 0;

    const otherExpenses = expenses - (adSpend + payroll + subscriptions);

    return {
      month,
      revenue,
      expenses,
      profit,
      profitMargin,
      adSpend,
      payroll,
      subscriptions,
      otherExpenses
    };
  });

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Trend Analysis</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Expenses</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ad Spend</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payroll</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subscriptions</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Other</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {profitTrendData.map((data, index) => {
              const totalExpenses = data.adSpend + data.payroll + data.subscriptions + data.otherExpenses;

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{data.month}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(data.revenue)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium border-l bg-gray-100">{formatCurrency(totalExpenses)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.adSpend)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.payroll)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.subscriptions)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.otherExpenses)}</td>
                  <td className="px-4 py-3 text-right font-bold border-l bg-gray-50">{formatCurrency(data.profit)}</td>
                  <td className="px-4 py-3 text-right bg-gray-50 font-bold">{data.profitMargin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitTrendChart; 