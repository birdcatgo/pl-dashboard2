import React, { useState, useEffect } from 'react';

const CommissionPayments = ({ commissions }) => {
  const [selectedMonth, setSelectedMonth] = useState('march2025');

  useEffect(() => {
    console.log('CommissionPayments Component:', {
      commissions,
      selectedMonth,
      activeCommissions: commissions?.filter(c => c.status === 'ACTIVE'),
      inactiveCommissions: commissions?.filter(c => c.status === 'INACTIVE')
    });
  }, [commissions, selectedMonth]);

  if (!commissions?.length) {
    console.log('No commissions data available');
    return (
      <div className="text-gray-500 text-center py-8">
        No commission data available
      </div>
    );
  }

  // Group commissions by status
  const activeCommissions = commissions.filter(c => c.status === 'ACTIVE');
  const inactiveCommissions = commissions.filter(c => c.status === 'INACTIVE');

  // Helper function to get row background color
  const getRowBackground = (commission) => {
    const monthData = getMonthData(commission);
    const value = parseFloat(monthData.commission?.replace(/[$,]/g, '') || '0');
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-white';
  };

  // Helper function to format month for display
  const formatMonthDisplay = (monthKey) => {
    const month = monthKey.replace(/\d+/g, '');
    const year = monthKey.match(/\d+/)[0];
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  // Get available months from the first commission
  const availableMonths = [
    { key: 'march2025', label: 'March 2025' },
    { key: 'february2025', label: 'February 2025' }
  ];

  // Get the data for the selected month
  const getMonthData = (commission) => {
    if (selectedMonth === 'march2025') {
      return {
        amount: commission.march2025?.confirmed || '0',
        commission: commission.march2025?.commission || '0'
      };
    } else if (selectedMonth === 'february2025') {
      return {
        amount: commission.february2025?.confirmed || '0',
        commission: commission.february2025?.commission || '0'
      };
    }
    return { amount: '0', commission: '0' };
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex justify-end">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {availableMonths.map(month => (
            <option key={month.key} value={month.key}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  {formatMonthDisplay(selectedMonth)}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Active Commissions */}
              {activeCommissions.map((commission, index) => {
                const rowBackground = getRowBackground(commission);
                const monthData = getMonthData(commission);
                const isPositiveCommission = parseFloat(monthData.commission?.replace(/[$,]/g, '') || '0') > 0;
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
                      {selectedMonth === 'march2025' && commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {monthData.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {monthData.commission}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {isPositiveCommission && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-yellow-400 text-xs font-medium text-yellow-700 uppercase tracking-wider">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          COMMISSION DUE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Inactive Commissions */}
              {inactiveCommissions.map((commission, index) => {
                const rowBackground = getRowBackground(commission);
                const monthData = getMonthData(commission);
                const isPositiveCommission = parseFloat(monthData.commission?.replace(/[$,]/g, '') || '0') > 0;
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
                      {selectedMonth === 'march2025' && commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {monthData.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {monthData.commission}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {isPositiveCommission && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-yellow-400 text-xs font-medium text-yellow-700 uppercase tracking-wider">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          COMMISSION DUE
                        </span>
                      )}
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