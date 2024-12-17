import React from 'react';

const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CashSituation = ({ cashManagementData }) => {
  if (!cashManagementData) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <p className="text-gray-500">Loading cash management data...</p>
        </div>
      </div>
    );
  }

  const totalCash = cashManagementData.currentBalance || 0;
  const totalCredit = cashManagementData.creditAvailable || 0;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Cash Available</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalCash)}</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total Credit Available</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCredit)}</p>
        </div>
      </div>
    </div>
  );
};

export default CashSituation;