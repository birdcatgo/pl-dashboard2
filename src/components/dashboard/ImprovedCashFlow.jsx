import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseAmount = (amountString) => {
  if (typeof amountString === 'number') return amountString;
  return parseFloat(amountString?.replace(/[$,]/g, '') || '0') || 0;
};

const ImprovedCashFlow = ({ startingBalance = 0, invoicesData = [], payrollData = [] }) => {
  const [projections, setProjections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    const generateProjections = () => {
      const today = new Date();
      const projectionDays = 14;
      const dailyProjections = [];
      let runningBalance = startingBalance;

      // Create a map to store payments by date
      const dateMap = new Map();

      // Process invoices
      invoicesData.forEach(invoice => {
        const date = new Date(invoice.DueDate);
        const amount = parseAmount(invoice.AmountDue);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { 
            invoices: [], 
            payroll: [], 
            creditCard: [] 
          });
        }

        dateMap.get(dateKey).invoices.push({
          source: invoice.Invoices,
          amount
        });
      });

      // Process payroll/credit card payments
      // Process payroll/credit card payments
      payrollData.forEach(expense => {
        if (!expense.DueDate) return; // Skip if no date
        
        const date = new Date(expense.DueDate); 
        const amount = parseAmount(expense.Amount);
        const type = expense.Type;
        const dateKey = format(date, 'yyyy-MM-dd');
      
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { 
            invoices: [], 
            payroll: [],
            creditCard: []
          }); 
        }
      
        if (type.toLowerCase() === 'credit card') {
          dateMap.get(dateKey).creditCard.push({
            description: expense.Description,
            amount  
          });
        } else {
          dateMap.get(dateKey).payroll.push({
            description: expense.Description,
            amount
          });
        }
      });

      // Generate daily projections
      for (let i = 0; i < projectionDays; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const dateData = dateMap.get(dateKey) || { 
          invoices: [], 
          payroll: [], 
          creditCard: [] 
        };

        const invoiceTotal = dateData.invoices.reduce((sum, item) => sum + item.amount, 0);
        const payrollTotal = dateData.payroll.reduce((sum, item) => sum + item.amount, 0);
        const creditCardTotal = dateData.creditCard.reduce((sum, item) => sum + item.amount, 0);

        runningBalance = runningBalance + invoiceTotal - payrollTotal - creditCardTotal;

        dailyProjections.push({
          date: currentDate,
          details: dateData,
          invoiceTotal,
          payrollTotal,
          creditCardTotal,
          balance: runningBalance
        });
      }

      setProjections(dailyProjections);
      setIsLoading(false);
    };

    generateProjections();
  }, [startingBalance, invoicesData, payrollData]);

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
    balance: day.balance
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalInvoices = projections.reduce((sum, day) => sum + day.invoiceTotal, 0);
  const totalPayroll = projections.reduce((sum, day) => sum + day.payrollTotal, 0);
  const totalCreditCard = projections.reduce((sum, day) => sum + day.creditCardTotal, 0);
  const finalBalance = projections[projections.length - 1]?.balance || startingBalance;

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
              <div className="text-green-600 font-medium">Total Invoices</div>
              <ArrowUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(totalInvoices)}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-600 font-medium">Total Outgoing</div>
              <ArrowDown className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700 mt-2">
              {formatCurrency(totalPayroll + totalCreditCard)}
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payroll</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Card</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projections.map((day, index) => {
              const hasDetails = day.details?.invoices?.length > 0 || 
              day.details?.payroll?.length > 0 || 
              day.details?.creditCard?.length > 0;
              return (
                <React.Fragment key={index}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${day.balance < 50000 ? 'bg-red-50' : ''}`}
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
                      {day.invoiceTotal > 0 && formatCurrency(day.invoiceTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {day.payrollTotal > 0 && formatCurrency(day.payrollTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {day.creditCardTotal > 0 && formatCurrency(day.creditCardTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(day.balance)}
                    </td>
                  </tr>
                  {expandedRows.has(index) && hasDetails && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-8 py-3">
                        <div className="text-sm space-y-1">
                          {day.details.invoices.map((item, i) => (
                            <div key={`invoice-${i}`} className="text-green-600">
                              + Invoice from {item.source} ({formatCurrency(item.amount)})
                            </div>
                          ))}
                          {day.details.payroll.map((item, i) => (
                            <div key={`payroll-${i}`} className="text-red-600">
                              - Payroll: {item.description} ({formatCurrency(item.amount)})
                            </div>
                          ))}
                          {day.details.creditCard.map((item, i) => (
                            <div key={`cc-${i}`} className="text-red-600">
                              - Credit Card: {item.description} ({formatCurrency(item.amount)})
                            </div>
                          ))}
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