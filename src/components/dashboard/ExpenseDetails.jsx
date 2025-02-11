import React, { useState } from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  return parseFloat(amount.replace(/[$,]/g, '')) || 0;
};

const ExpenseDetails = ({ expenses, onClose, isAdvertising = false }) => {
  const [selectedForCancellation, setSelectedForCancellation] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleToggleSelection = (expense) => {
    if (selectedForCancellation.includes(expense)) {
      setSelectedForCancellation(selectedForCancellation.filter(e => e !== expense));
    } else {
      setSelectedForCancellation([...selectedForCancellation, expense]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Expense Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Amount</th>
              <th className="pb-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses?.sort((a, b) => parseAmount(b.AMOUNT) - parseAmount(a.AMOUNT)).map((expense, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2">{expense.CATEGORY || 'N/A'}</td>
                <td className="py-2 text-right">{formatCurrency(parseAmount(expense.AMOUNT))}</td>
                <td className="py-2 text-center">
                  {isAdvertising && (
                    <button
                      onClick={() => handleToggleSelection(expense)}
                      className={`text-sm px-2 py-1 rounded ${
                        selectedForCancellation.includes(expense)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedForCancellation.includes(expense) ? 'Selected' : 'Select'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="py-2 font-medium">Total</td>
              <td className="py-2 text-right font-medium">
                {formatCurrency(
                  expenses?.reduce((sum, expense) => sum + parseAmount(expense.AMOUNT), 0) || 0
                )}
              </td>
              <td className="py-2 text-center font-medium">
                {selectedForCancellation.length > 0 && (
                  <span className="text-sm text-red-600">
                    {formatCurrency(
                      selectedForCancellation.reduce((sum, expense) => 
                        sum + parseAmount(expense.AMOUNT), 0
                      )
                    )} to cancel
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ExpenseDetails; 