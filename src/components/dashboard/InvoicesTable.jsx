import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const InvoicesTable = ({ data = [] }) => {
  console.log('Raw Invoice Data:', data); // Debug log

  // Ensure data is an array and has content
  const invoices = Array.isArray(data) ? data : [];

  // Calculate metrics
  const metrics = useMemo(() => {
    return invoices.reduce((acc, invoice) => {
      const amount = parseFloat(invoice.Amount || 0);
      if (invoice.Status === 'Unpaid') {
        acc.totalUnpaid += amount;
        acc.unpaidCount++;
      }
      acc.totalAmount += amount;
      return acc;
    }, { totalUnpaid: 0, unpaidCount: 0, totalAmount: 0 });
  }, [invoices]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort invoices by due date (most recent first)
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const dateA = new Date(a.DueDate);
      const dateB = new Date(b.DueDate);
      return dateB - dateA;
    });
  }, [invoices]);

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

  if (!invoices.length) {
    return (
      <div className="text-center p-6 text-gray-500">
        No invoice data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 font-medium">Outstanding Balance</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(metrics.totalUnpaid)}
            </div>
            <div className="text-sm text-red-600 mt-1">
              {metrics.unpaidCount} unpaid invoice{metrics.unpaidCount !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-600 font-medium">Total Invoices</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="text-sm text-green-600 font-medium">Collection Rate</div>
            <div className="text-2xl font-bold text-green-700">
              {metrics.totalAmount ? 
                ((1 - metrics.totalUnpaid / metrics.totalAmount) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-green-600 mt-1">
              of invoices collected
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedInvoices.map((invoice, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.Network || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.PeriodStart && invoice.PeriodEnd ? 
                        `${formatDate(invoice.PeriodStart)} - ${formatDate(invoice.PeriodEnd)}` : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.DueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(invoice.Amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.InvoiceNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.Status === 'Unpaid' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {invoice.Status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesTable;
