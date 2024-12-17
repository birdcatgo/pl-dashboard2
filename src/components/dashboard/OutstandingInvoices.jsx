import React from 'react';
import { format, isBefore, startOfDay } from 'date-fns';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const OutstandingInvoices = ({ invoices }) => {
  const today = startOfDay(new Date());
  const invoiceEntries = Object.entries(invoices || {})
    .filter(([key, value]) => key !== 'Total Outstanding' && value['Amount Due'] && value['Date Due']);

  if (!invoiceEntries.length) return null;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Outstanding Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoiceEntries.map(([network, details], index) => {
              const dueDate = new Date(details['Date Due']);
              const isOverdue = isBefore(dueDate, today);
              const amount = parseFloat(details['Amount Due']?.replace(/[\$,]/g, '') || 0);

              return (
                <tr key={index} className={isOverdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm text-gray-900">{network}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(amount)}</td>
                  <td className="px-6 py-4 text-sm">{format(dueDate, 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutstandingInvoices;
