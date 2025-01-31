import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { format, parse, isValid, parseISO } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
};

const ImprovedCashFlow = ({ startingBalance = 0, invoicesData = [], payrollData = [] }) => {
  const [projections, setProjections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Try MM/dd/yyyy format first
    let parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    // Try yyyy-MM-dd format
    parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    // Try ISO format
    parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return parsedDate;
    
    return null;
  };

  const generateProjections = () => {
    const projections = [];
    const today = new Date();
    
    // Process invoices
    invoicesData?.forEach(invoice => {
      const dueDate = parseDate(invoice.DueDate);
      if (!dueDate) {
        // Use PeriodEnd date as fallback for Digi invoices
        if (invoice.Network === 'Digi' && invoice.PeriodEnd) {
          const periodEndDate = parseDate(invoice.PeriodEnd);
          if (periodEndDate) {
            // Add 14 days for Net 14 terms
            const calculatedDueDate = new Date(periodEndDate);
            calculatedDueDate.setDate(periodEndDate.getDate() + 14);
            projections.push({
              date: calculatedDueDate,
              type: 'invoice',
              description: `${invoice.Network} Invoice #${invoice.InvoiceNumber}`,
              amount: invoice.Amount,
              category: 'income'
            });
            return;
          }
        }
        console.debug(`Skipping invoice for ${invoice.Network} - missing or invalid due date`);
        return;
      }
      
      projections.push({
        date: dueDate,
        type: 'invoice',
        description: `${invoice.Network} Invoice #${invoice.InvoiceNumber}`,
        amount: invoice.Amount,
        category: 'income'
      });
    });

    // Process expenses
    payrollData?.forEach(expense => {
      const dueDate = parseDate(expense.dueDate);
      if (!dueDate) {
        console.debug(`Skipping expense ${expense.role} - missing or invalid due date`);
        return;
      }

      projections.push({
        date: dueDate,
        type: 'expense',
        description: expense.role,
        amount: -expense.amount, // Negative for expenses
        category: expense.name
      });
    });

    // Sort projections by date
    return projections.sort((a, b) => a.date - b.date);
  };

  useEffect(() => {
    const projections = generateProjections();
    setProjections(projections);
    setIsLoading(false);
  }, [invoicesData, payrollData]);

  const toggleRowExpansion = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const chartData = projections.map(day => ({
    name: format(day.date, 'MMM dd'),
    balance: day.amount
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalInflows = projections.reduce((sum, day) => sum + day.amount, 0);
  const totalOutflows = 0;
  const finalBalance = projections[projections.length - 1]?.amount || startingBalance;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow Projections</h3>
          <span className="text-sm text-gray-500">14-Day Forecast</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-600 font-medium">Starting Balance</div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(startingBalance)}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-600 font-medium">Total Inflows</div>
              <ArrowUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(totalInflows)}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-600 font-medium">Total Outflows</div>
              <ArrowDown className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700 mt-2">
              {formatCurrency(totalOutflows)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-purple-600 font-medium">Projected Balance</div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-2">{formatCurrency(finalBalance)}</div>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
            {projections.map((day, index) => {
              const hasDetails = day.type === 'invoice' || day.type === 'expense';
              return (
                <React.Fragment key={index}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${day.amount < 50000 ? 'bg-red-50' : ''}`}
                    onClick={() => hasDetails && toggleRowExpansion(index)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {hasDetails && (
                          <span className="mr-2">{expandedRows.has(index) ? '▼' : '▶'}</span>
                        )}
                        {format(day.date, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {day.amount > 0 && formatCurrency(day.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {day.amount < 0 && formatCurrency(-day.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(day.amount)}
                    </td>
                  </tr>
                  {expandedRows.has(index) && hasDetails && (
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-8 py-3">
                        <div className="text-sm space-y-1">
                          {day.type === 'invoice' && (
                            <div className="text-green-600">
                              + {day.description} ({formatCurrency(day.amount)})
                            </div>
                          )}
                          {day.type === 'expense' && (
                            <div className="text-red-600">
                              - {day.description} ({formatCurrency(-day.amount)})
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

export default ImprovedCashFlow;