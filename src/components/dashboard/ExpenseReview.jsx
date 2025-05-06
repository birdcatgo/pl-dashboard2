import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

const ExpenseReview = ({ plData }) => {
  const [cancelledExpenses, setCancelledExpenses] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedCancelled = localStorage.getItem('cancelledExpenses');
    const savedNotes = localStorage.getItem('expenseNotes');
    if (savedCancelled) setCancelledExpenses(new Set(JSON.parse(savedCancelled)));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('cancelledExpenses', JSON.stringify(Array.from(cancelledExpenses)));
    localStorage.setItem('expenseNotes', JSON.stringify(notes));
  }, [cancelledExpenses, notes]);

  // Get the most recent month's data
  const getMostRecentMonth = () => {
    if (!plData?.summary?.length) return null;
    
    // Sort summary by date to get the most recent month
    const sortedSummary = [...plData.summary].sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const yearA = ['January', 'February', 'March', 'April'].includes(a.Month) ? 2025 : 2024;
      const yearB = ['January', 'February', 'March', 'April'].includes(b.Month) ? 2025 : 2024;
      return (yearB * 12 + monthOrder.indexOf(b.Month)) - (yearA * 12 + monthOrder.indexOf(a.Month));
    });

    return sortedSummary[0];
  };

  const mostRecentMonth = getMostRecentMonth();
  if (!mostRecentMonth) return <div>No expense data available</div>;

  const handleCancelToggle = (expenseId) => {
    setCancelledExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const handleNoteChange = (expenseId, note) => {
    setNotes(prev => ({
      ...prev,
      [expenseId]: note
    }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get the monthly data for the most recent month
  const monthlyData = plData?.monthly?.[mostRecentMonth.Month];
  if (!monthlyData) return <div>No expense data available for {mostRecentMonth.Month}</div>;

  // Convert categories object to array of entries and prepare for sorting
  let categories = Object.entries(monthlyData.categories || {});
  
  // Flatten the data for sorting
  let sortedData = categories.flatMap(([category, items]) => 
    items.map((item, index) => ({
      ...item,
      expenseId: `${category}-${index}`
    }))
  );

  // Apply sorting
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc' ? a.Amount - b.Amount : b.Amount - a.Amount;
      } else if (sortConfig.key === 'description') {
        return sortConfig.direction === 'asc' 
          ? a.Description.localeCompare(b.Description)
          : b.Description.localeCompare(a.Description);
      } else if (sortConfig.key === 'category') {
        return sortConfig.direction === 'asc'
          ? a.Category.localeCompare(b.Category)
          : b.Category.localeCompare(a.Category);
      } else if (sortConfig.key === 'cardAccount') {
        const aCard = a['Card/Account'] || '-';
        const bCard = b['Card/Account'] || '-';
        return sortConfig.direction === 'asc'
          ? aCard.localeCompare(bCard)
          : bCard.localeCompare(aCard);
      }
      return 0;
    });
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {mostRecentMonth.Month} Expenses
        </h2>
        <div className="text-sm text-gray-500">
          Total Expenses: {formatCurrency(mostRecentMonth.Expenses)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  <SortIcon columnKey="category" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cardAccount')}
              >
                <div className="flex items-center">
                  Card/Account
                  <SortIcon columnKey="cardAccount" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  <SortIcon columnKey="description" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Amount
                  <SortIcon columnKey="amount" />
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => (
              <tr 
                key={item.expenseId}
                className={cancelledExpenses.has(item.expenseId) ? 'bg-red-50' : 'hover:bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.Date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item['Card/Account']}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.Description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(item.Amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    onClick={() => handleCancelToggle(item.expenseId)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      cancelledExpenses.has(item.expenseId)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {cancelledExpenses.has(item.expenseId) ? 'To Be Cancelled' : 'Active'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <input
                    type="text"
                    value={notes[item.expenseId] || ''}
                    onChange={(e) => handleNoteChange(item.expenseId, e.target.value)}
                    placeholder="Add notes..."
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseReview; 