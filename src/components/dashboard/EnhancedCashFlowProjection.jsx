import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ensureDate = (dateValue) => {
  if (dateValue instanceof Date) return dateValue;
  try {
    return typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
  } catch {
    return new Date();
  }
};

const getRowBackgroundColor = (balance, currentBalance) => {
  const percentageLeft = (balance / currentBalance) * 100;
  if (percentageLeft < 25) return 'bg-red-50';
  if (percentageLeft < 50) return 'bg-yellow-50';
  return '';
};

const ProjectionRow = ({ day, currentBalance }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = day.details?.invoices?.length > 0 || day.details?.creditCardPayments?.length > 0;
  const rowColor = getRowBackgroundColor(day.balance, currentBalance);

  // Calculate total of credit card/payroll payments for the day
  const totalScheduledPayments = (day.details?.creditCardPayments || [])
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <tr className={rowColor}>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="flex items-center">
          {hasDetails && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2">
              {isExpanded ? 
                <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                <ChevronRight className="h-4 w-4 text-gray-500" />
              }
            </button>
          )}
          {format(ensureDate(day.date), 'MMM dd, yyyy')}
        </div>
        {isExpanded && hasDetails && (
          <div className="ml-6 mt-2 text-xs space-y-1">
            {day.details.invoices?.map((invoice, idx) => (
              <div key={idx} className="text-green-600">
                + Invoice from {invoice.source}: {formatCurrency(invoice.amount)}
              </div>
            ))}
            {day.details.creditCardPayments?.map((payment, idx) => (
              <div key={idx} className="text-red-600">
                - {payment.type}: {payment.description} - {formatCurrency(payment.amount)}
              </div>
            ))}
            <div className="text-red-600">
              - Average Daily Spend: {formatCurrency(day.details.avgDailySpend)}
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-right text-green-600">
        {day.inflows > 0 && formatCurrency(day.inflows)}
      </td>
      <td className="px-6 py-4 text-sm text-right text-red-600">
        {day.details.avgDailySpend > 0 && formatCurrency(day.details.avgDailySpend)}
      </td>
      <td className="px-6 py-4 text-sm text-right text-red-600">
        {totalScheduledPayments > 0 && formatCurrency(totalScheduledPayments)}
      </td>
      <td className="px-6 py-4 text-sm text-right font-medium">
        {formatCurrency(day.balance)}
      </td>
      <td className="px-6 py-4 text-sm text-right text-gray-500">
        {((day.balance / currentBalance) * 100).toFixed(1)}%
      </td>
    </tr>
  );
};

const EnhancedCashFlowProjection = ({ projectionData, historicalSpendData }) => {
  if (!projectionData) {
    return <div className="text-gray-500 p-4">Loading projections...</div>;
  }

  const {
    currentBalance = 0,
    creditAvailable = 0,
    projections = [],
    totalInflows = 0,
    totalOutflows = 0
  } = projectionData;

  const chartData = projections.map(day => ({
    name: format(ensureDate(day.date), 'MMM dd'),
    balance: day.balance,
    spend: day.outflows
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Current Balance</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(currentBalance)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Expected Inflows</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalInflows)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Expected Outflows</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOutflows)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Credit Available</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(creditAvailable)}</p>
        </div>
      </div>

      {projections.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">14-Day Balance Projection</h3>
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
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Daily Projections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inflows</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scheduled Payments</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projections.map((day, index) => (
                <ProjectionRow 
                  key={index} 
                  day={day} 
                  currentBalance={currentBalance}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCashFlowProjection;