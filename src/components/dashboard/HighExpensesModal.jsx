import React, { useState } from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const HighExpensesModal = ({ expenses, monthlyData, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">High Expense Review</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          {Object.entries(expenses).map(([month, amount]) => (
            <div 
              key={month} 
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => setSelectedMonth(month)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-lg">{month}</h4>
                  <p className="text-sm text-gray-600">Click to view detailed breakdown</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-medium ${
                    amount > 100000 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {amount > 100000 ? '⚠️ High Spend Month' : 'Normal Range'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HighExpensesModal; 