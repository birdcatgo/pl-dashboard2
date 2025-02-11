import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const RevenueDetails = ({ revenues, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Revenue Breakdown</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">Source</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {revenues?.sort((a, b) => a.DESCRIPTION.localeCompare(b.DESCRIPTION)).map((revenue, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2">{revenue.DESCRIPTION || 'N/A'}</td>
                <td className="py-2 text-right">{formatCurrency(parseFloat(revenue.AMOUNT.replace(/[$,]/g, '')) || 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="py-2 font-medium">Total Revenue</td>
              <td className="py-2 text-right font-medium">
                {formatCurrency(
                  revenues?.reduce((sum, revenue) => 
                    sum + (parseFloat(revenue.AMOUNT.replace(/[$,]/g, '')) || 0), 0
                  ) || 0
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default RevenueDetails; 