import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns'; 

const formatCurrency = (amount) => {
  // Handle amount if it's already a string with $ symbol
  if (typeof amount === 'string' && amount.startsWith('$')) {
    return amount;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const UpcomingExpensesTable = ({ data = [] }) => {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No upcoming expenses to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {data.map((expense, index) => (
  <tr key={index} className="hover:bg-gray-50">
    <td className="px-6 py-4 text-sm text-gray-900">{expense.Type}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{expense.Description}</td>
    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(expense.Amount)}</td>
    <td className="px-6 py-4 text-sm text-gray-900">
  {format(new Date(expense.DueDate), 'MMM d, yyyy', { useAdditionalDayOfYearTokens: true })}
</td>  
</tr>
))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingExpensesTable;