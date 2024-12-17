import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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

const InvoicesTable = ({ data = [] }) => {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No invoices to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((invoice, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{invoice.Invoices}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(invoice.AmountDue)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{invoice.DueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicesTable;