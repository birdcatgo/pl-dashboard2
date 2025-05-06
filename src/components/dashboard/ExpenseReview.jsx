import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const ExpenseReview = ({ plData }) => {
  const [expenseStatuses, setExpenseStatuses] = useState({});
  const [notes, setNotes] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem('expenseStatuses');
    const savedNotes = localStorage.getItem('expenseNotes');
    if (savedStatuses) setExpenseStatuses(JSON.parse(savedStatuses));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('expenseStatuses', JSON.stringify(expenseStatuses));
  }, [expenseStatuses]);

  const handleStatusChange = (expenseId) => {
    setExpenseStatuses(prev => {
      const currentStatus = prev[expenseId] || 'ACTIVE';
      const nextStatus = {
        'ACTIVE': 'CANCELLED',
        'CANCELLED': 'ONCE OFF',
        'ONCE OFF': 'ACTIVE'
      }[currentStatus];
      
      return {
        ...prev,
        [expenseId]: nextStatus
      };
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'ONCE OFF':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: // ACTIVE
        return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  const handleSaveAllNotes = () => {
    try {
      localStorage.setItem('expenseNotes', JSON.stringify(notes));
      toast.success('All notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleClearAllNotes = () => {
    try {
      setNotes({});
      localStorage.removeItem('expenseNotes');
      toast.success('All notes cleared');
    } catch (error) {
      console.error('Error clearing notes:', error);
      toast.error('Failed to clear notes');
    }
  };

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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {mostRecentMonth.Month} Expenses
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveAllNotes}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Save All Notes
            </Button>
            <Button
              onClick={handleClearAllNotes}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Clear All Notes
            </Button>
          </div>
        </div>
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
            {sortedData.map((item) => {
              const status = expenseStatuses[item.expenseId] || 'ACTIVE';
              return (
                <tr 
                  key={item.expenseId}
                  className={status === 'CANCELLED' ? 'bg-red-50' : 'hover:bg-gray-50'}
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
                      onClick={() => handleStatusChange(item.expenseId)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(status)}`}
                    >
                      {status}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseReview; 