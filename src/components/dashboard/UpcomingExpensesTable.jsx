import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';

const UpcomingExpensesTable = ({ data = [] }) => {
  console.log('Raw Expenses Data:', data); // Debug log
  const [selectedDate, setSelectedDate] = useState(null);

  // Transform array data into objects with named properties
  const expenses = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.map(row => ({
      Category: row[0],
      Description: row[1],
      Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
      Date: row[3]
    }));
  }, [data]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const amount = parseFloat(expense.Amount || 0);
      if (expense.Category?.toLowerCase().includes('payroll')) {
        acc.totalPayroll += amount;
        acc.payrollCount++;
      } else if (expense.Category?.toLowerCase().includes('credit')) {
        acc.totalCredit += amount;
        acc.creditCount++;
      }
      acc.totalAmount += amount;
      return acc;
    }, { 
      totalPayroll: 0, 
      totalCredit: 0, 
      totalAmount: 0,
      payrollCount: 0,
      creditCount: 0 
    });
  }, [expenses]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort expenses by date (soonest to latest)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.Date);
      const dateB = new Date(b.Date);
      return dateA - dateB;
    });
  }, [expenses]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calendar related functions
  const getCalendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, []);

  const getUpcomingPayments = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    const sevenDaysAgo = addDays(today, -7);
    
    const paymentsByDate = expenses.reduce((acc, expense) => {
      if (!expense.Date) return acc;
      
      const dueDate = new Date(expense.Date);
      if (dueDate > thirtyDaysFromNow || dueDate < sevenDaysAgo) return acc;
      
      const dateKey = format(dueDate, 'yyyy-MM-dd');
      const amount = expense.Amount || 0;
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dueDate,
          total: 0,
          expenses: []
        };
      }
      
      acc[dateKey].total += amount;
      acc[dateKey].expenses.push(expense);
      
      return acc;
    }, {});
    
    return Object.values(paymentsByDate)
      .sort((a, b) => a.date - b.date);
  }, [expenses]);

  const getPaymentsForMonth = useMemo(() => {
    const paymentsByDate = {};
    getUpcomingPayments.forEach(day => {
      const dateKey = format(day.date, 'yyyy-MM-dd');
      paymentsByDate[dateKey] = day;
    });
    return paymentsByDate;
  }, [getUpcomingPayments]);

  if (!expenses.length) {
    return (
      <div className="text-center p-6 text-gray-500">
        No upcoming expenses found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 font-medium">Total Payroll</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(metrics.totalPayroll)}
            </div>
            <div className="text-sm text-red-600 mt-1">
              {metrics.payrollCount} upcoming payments
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-600 font-medium">Credit Card Payments</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(metrics.totalCredit)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              {metrics.creditCount} upcoming payments
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-sm text-purple-600 font-medium">Total Expenses</div>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <div className="text-sm text-purple-600 mt-1">
              {expenses.length} total expenses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedExpenses.map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        expense.Category?.toLowerCase().includes('payroll') 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.Category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.Description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.Date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(expense.Amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Condensed Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Payments</h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          {getCalendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const payment = getPaymentsForMonth[dateKey];
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, new Date());
            const isSelected = selectedDate === dateKey;

            return (
              <div
                key={dateKey}
                className={`relative p-1 min-h-[60px] border rounded cursor-pointer ${
                  isCurrentDay
                    ? 'bg-blue-50 border-blue-200'
                    : payment
                    ? payment.total >= 500
                      ? 'bg-red-50 border-red-200'
                      : 'bg-orange-50 border-orange-200'
                    : 'border-gray-200'
                } ${!isCurrentMonth ? 'bg-gray-50' : ''} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              >
                <div className={`text-xs font-medium ${
                  isCurrentDay ? 'text-blue-700' : payment ? (payment.total >= 500 ? 'text-red-700' : 'text-orange-700') : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
                {payment && (
                  <div className="mt-1">
                    <div className={`text-xs font-medium ${
                      payment.total >= 500 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(payment.total)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {payment.expenses.length} {payment.expenses.length === 1 ? 'expense' : 'expenses'}
                    </div>
                  </div>
                )}
                {isSelected && payment && (
                  <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 p-2">
                    <div className="text-xs font-medium text-gray-900 mb-1">Due Expenses:</div>
                    {payment.expenses.map((expense, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        {expense.Category}: {formatCurrency(expense.Amount)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next 30 Days View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Next 30 Days</h2>
        <div className="space-y-2">
          {Array.from({ length: 30 }, (_, i) => {
            const date = addDays(new Date(), i);
            const dateKey = format(date, 'yyyy-MM-dd');
            const payment = getPaymentsForMonth[dateKey];
            const isCurrentDay = isSameDay(date, new Date());

            return (
              <div
                key={dateKey}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentDay
                    ? 'bg-blue-50 border border-blue-200'
                    : payment
                    ? payment.total >= 500
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-orange-50 border border-orange-200'
                    : 'border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-medium ${
                    isCurrentDay ? 'text-blue-700' : payment ? (payment.total >= 500 ? 'text-red-700' : 'text-orange-700') : 'text-gray-900'
                  }`}>
                    {format(date, 'MMM d, yyyy')}
                  </div>
                  {payment && (
                    <div className="text-sm text-gray-600">
                      {payment.expenses.length} {payment.expenses.length === 1 ? 'expense' : 'expenses'} due
                    </div>
                  )}
                </div>
                {payment && (
                  <div className={`text-sm font-medium ${
                    payment.total >= 500 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {formatCurrency(payment.total)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpcomingExpensesTable;