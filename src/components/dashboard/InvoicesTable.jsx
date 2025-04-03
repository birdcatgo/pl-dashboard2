import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

const InvoicesTable = ({ data }) => {
  const [invoices, setInvoices] = useState([]);
  const [expandedNetworks, setExpandedNetworks] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    console.log('InvoicesTable received data:', {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataStructure: data
    });

    // Handle both array and object formats
    const invoiceArray = Array.isArray(data) ? data : (data?.rawData?.invoices || []);
    setInvoices(invoiceArray);
  }, [data]);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (typeof value === 'string') {
      // Remove currency symbols and commas, then convert to number
      const numericValue = parseFloat(value.replace(/[$,]/g, ''));
      if (isNaN(numericValue)) {
        console.error('Invalid currency value:', value);
        return '$0';
      }
      value = numericValue;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      return due < today;
    } catch (error) {
      console.error('Error checking overdue status:', dueDate, error);
      return false;
    }
  };

  const toggleNetwork = (network) => {
    const newExpandedNetworks = new Set(expandedNetworks);
    if (newExpandedNetworks.has(network)) {
      newExpandedNetworks.delete(network);
    } else {
      newExpandedNetworks.add(network);
    }
    setExpandedNetworks(newExpandedNetworks);
  };

  const getNetworkSummary = (networkInvoices) => {
    const total = networkInvoices.reduce((sum, invoice) => {
      const amount = typeof invoice.AmountDue === 'string' 
        ? parseFloat(invoice.AmountDue.replace(/[$,]/g, '')) 
        : invoice.AmountDue;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const overdue = networkInvoices.filter(invoice => isOverdue(invoice.DueDate));
    const overdueTotal = overdue.reduce((sum, invoice) => {
      const amount = typeof invoice.AmountDue === 'string' 
        ? parseFloat(invoice.AmountDue.replace(/[$,]/g, '')) 
        : invoice.AmountDue;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      total,
      overdueTotal,
      count: networkInvoices.length,
      overdueCount: overdue.length
    };
  };

  const groupedInvoices = useMemo(() => {
    const groups = invoices.reduce((acc, invoice) => {
      if (!acc[invoice.Network]) {
        acc[invoice.Network] = [];
      }
      acc[invoice.Network].push(invoice);
      return acc;
    }, {});

    return Object.entries(groups).map(([network, networkInvoices]) => ({
      network,
      invoices: networkInvoices,
      summary: getNetworkSummary(networkInvoices)
    }));
  }, [invoices]);

  const sortedNetworks = useMemo(() => {
    if (!sortConfig.key) return groupedInvoices;

    return [...groupedInvoices].sort((a, b) => {
      if (sortConfig.key === 'Network') {
        return sortConfig.direction === 'asc' 
          ? a.network.localeCompare(b.network)
          : b.network.localeCompare(a.network);
      }

      if (sortConfig.key === 'Total') {
        return sortConfig.direction === 'asc' 
          ? a.summary.total - b.summary.total 
          : b.summary.total - a.summary.total;
      }

      if (sortConfig.key === 'Overdue') {
        return sortConfig.direction === 'asc' 
          ? a.summary.overdueTotal - b.summary.overdueTotal 
          : b.summary.overdueTotal - a.summary.overdueTotal;
      }

      return 0;
    });
  }, [groupedInvoices, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No invoice data available
      </div>
    );
  }

  // Calculate overall totals
  const overallSummary = {
    total: invoices.reduce((sum, invoice) => {
      const amount = typeof invoice.AmountDue === 'string' 
        ? parseFloat(invoice.AmountDue.replace(/[$,]/g, '')) 
        : invoice.AmountDue || 0;
      return sum + amount;
    }, 0),
    overdueTotal: invoices.reduce((sum, invoice) => {
      if (!invoice.DueDate) return sum;
      const dueDate = new Date(invoice.DueDate);
      const today = new Date();
      if (dueDate < today) {
        const amount = typeof invoice.AmountDue === 'string'
          ? parseFloat(invoice.AmountDue.replace(/[$,]/g, ''))
          : invoice.AmountDue || 0;
        return sum + amount;
      }
      return sum;
    }, 0),
    count: invoices.length,
    overdueCount: invoices.filter(invoice => {
      if (!invoice.DueDate) return false;
      const dueDate = new Date(invoice.DueDate);
      const today = new Date();
      return dueDate < today;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Outstanding Invoices</h2>
          <div className="text-sm text-gray-500">
            Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Outstanding</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {formatCurrency(overallSummary.total)}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm text-red-500">Overdue Amount</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {formatCurrency(overallSummary.overdueTotal)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Invoices</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {overallSummary.count}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-500">Overdue Invoices</div>
            <div className="text-2xl font-semibold text-orange-600 mt-1">
              {overallSummary.overdueCount}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('Total')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Outstanding
                    {getSortIcon('Total')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('Overdue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Overdue Amount
                    {getSortIcon('Overdue')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedNetworks.map(({ network, invoices: networkInvoices, summary }) => {
                const isExpanded = expandedNetworks.has(network);
                const hasOverdue = summary.overdueCount > 0;

                return (
                  <React.Fragment key={network}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${hasOverdue ? 'bg-red-50' : ''}`}
                      onClick={() => toggleNetwork(network)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {network}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(summary.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(summary.overdueTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {summary.count} ({summary.overdueCount} overdue)
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 bg-gray-50">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period Start</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period End</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
                              {networkInvoices.map((invoice, index) => {
                                const isOverdueInvoice = isOverdue(invoice.DueDate);
                                return (
                                  <tr 
                                    key={index}
                                    className={`hover:bg-gray-50 ${isOverdueInvoice ? 'bg-red-50' : ''}`}
                                  >
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(invoice.PeriodStart)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(invoice.PeriodEnd)}
                                    </td>
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${isOverdueInvoice ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                      {formatDate(invoice.DueDate)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                                      {formatCurrency(invoice.AmountDue)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {invoice.InvoiceNumber}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
    </div>
  );
};

export default InvoicesTable;