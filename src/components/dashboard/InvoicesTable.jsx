import React, { useEffect } from 'react';

const InvoicesTable = ({ data }) => {
  useEffect(() => {
    console.log('Invoice data structure:', {
      fullData: data,
      rawData: data?.rawData,
      sampleInvoice: data?.rawData?.[0],
      fields: data?.rawData?.[0] ? Object.keys(data?.rawData[0]) : [],
      dataType: typeof data,
      isArray: Array.isArray(data?.rawData)
    });
  }, [data]);

  // Ensure data is properly formatted and handle potential undefined/null
  const invoices = Array.isArray(data?.rawData) ? data.rawData : 
                  Array.isArray(data) ? data : [];

  // Format currency with error handling
  const formatCurrency = (amount) => {
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[$,]/g, '')) : amount;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numAmount || 0);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return '$0.00';
    }
  };

  // Get amount from invoice, checking both Amount and AmountDue fields
  const getInvoiceAmount = (invoice) => {
    return invoice.AmountDue || invoice.Amount || 0;
  };

  // Format date with additional error handling
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Check if it's already a date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try to parse date in different formats
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
        return dateString;
      }
      return date.toLocaleDateString('en-US');
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  if (!invoices.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        No invoice data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Network</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Period Start</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Period End</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Amount Due</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Invoice Number</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice, index) => (
            <tr key={`${invoice.Network}-${invoice.InvoiceNumber}-${index}`} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.Network}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(invoice.PeriodStart)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(invoice.PeriodEnd)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(invoice.DueDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(getInvoiceAmount(invoice))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.InvoiceNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesTable;