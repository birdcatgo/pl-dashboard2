import React from 'react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};


const UpcomingExpenses = ({ expenses }) => {
  if (!expenses?.length) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Expenses</h3>
          <p className="text-gray-500">No upcoming expenses to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Expenses</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"> Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
  {data.map((expense, index) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm text-gray-900">{expense.type || expense[0]}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{expense.description || expense[1]}</td>
      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(expense.amount || expense[2])}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(expense.dueDate || expense[3]), 'MMM d, yyyy')}</td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default UpcomingExpenses;
