import React, { useState } from 'react';

const CommissionPayments = ({ commissions }) => {
  const [selectedMonth, setSelectedMonth] = useState('May 2025');

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value || value === '0' || value === 0) return '$0.00';
    
    // Handle string values with currency symbols and commas
    const cleanValue = typeof value === 'string' ? value.replace(/[$,]/g, '') : value;
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericValue);
  };

  if (!commissions?.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No commission data available
      </div>
    );
  }

  // Group commissions by status
  const activeCommissions = commissions.filter(c => c.status === 'ACTIVE');
  const inactiveCommissions = commissions.filter(c => c.status === 'INACTIVE');

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex justify-end">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="May 2025">May 2025</option>
          <option value="April 2025">April 2025</option>
          <option value="March 2025">March 2025</option>
          <option value="February 2025">February 2025</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Active Commissions */}
              {activeCommissions.map((commission, index) => {
                const amount = commission[selectedMonth];
                // Handle both "Commission" and "Commissions" formats
                const commissionAmount = commission[`${selectedMonth} Commissions`] || commission[`${selectedMonth} Commission`];
                const rowBackground = parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') > 0 ? 'bg-green-50' : 
                                    parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') < 0 ? 'bg-red-50' : 'bg-white';
                
                return (
                  <tr key={`active-${index}`} className={rowBackground}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {commission.mediaBuyer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {commission.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {(commission.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(commissionAmount)}
                    </td>
                  </tr>
                );
              })}

              {/* Inactive Commissions */}
              {inactiveCommissions.map((commission, index) => {
                const amount = commission[selectedMonth];
                // Handle both "Commission" and "Commissions" formats
                const commissionAmount = commission[`${selectedMonth} Commissions`] || commission[`${selectedMonth} Commission`];
                const rowBackground = parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') > 0 ? 'bg-green-50' : 
                                    parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') < 0 ? 'bg-red-50' : 'bg-white';
                
                return (
                  <tr key={`inactive-${index}`} className={`${rowBackground} opacity-75`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {commission.mediaBuyer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {commission.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {(commission.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(commissionAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionPayments; 