import React, { useState, useEffect } from 'react';

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
  const [selectedForReview, setSelectedForReview] = useState([]);
  const [notes, setNotes] = useState({});
  const [isSending, setIsSending] = useState(false);

  // Load saved notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('expenseNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const handleToggleSelection = (expense) => {
    if (selectedForCancellation.includes(expense)) {
      setSelectedForCancellation(selectedForCancellation.filter(e => e !== expense));
    } else {
      setSelectedForCancellation([...selectedForCancellation, expense]);
    }
  };

  const handleToggleReview = (expense) => {
    if (selectedForReview.includes(expense)) {
      setSelectedForReview(selectedForReview.filter(e => e !== expense));
    } else {
      setSelectedForReview([...selectedForReview, expense]);
    }
  };

  const handleNoteChange = (expense, note) => {
    const newNotes = { ...notes, [expense.DESCRIPTION]: note };
    setNotes(newNotes);
    localStorage.setItem('expenseNotes', JSON.stringify(newNotes));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Expense Breakdown</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-center">To Be Reviewed</th>
                <th className="pb-2 text-center">To Be Cancelled</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map((expense, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{expense.DESCRIPTION}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(parseAmount(expense.AMOUNT))}
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedForReview.includes(expense)}
                      onChange={() => handleToggleReview(expense)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedForCancellation.includes(expense)}
                      onChange={() => handleToggleSelection(expense)}
                      className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={notes[expense.DESCRIPTION] || ''}
                      onChange={(e) => handleNoteChange(expense, e.target.value)}
                      placeholder="Add a note..."
                      className="w-full border rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-2 font-medium">Total Expenses</td>
                <td className="py-2 text-right font-medium">
                  {formatCurrency(
                    expenses?.reduce((sum, expense) => sum + parseAmount(expense.AMOUNT), 0) || 0
                  )}
                </td>
                <td className="py-2 text-center font-medium">
                  {selectedForReview.length > 0 && (
                    <span className="text-sm text-blue-600">
                      {selectedForReview.length} to review
                    </span>
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
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetails; 