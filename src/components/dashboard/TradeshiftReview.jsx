import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const tradeshiftMapping = {
  '1011': 'Convert 2 Freedom',
  '1003': 'Convert 2 Freedom',
  '1004': 'Rightway Marketing',
  '2007': 'Quit 9 to 5',
  '2009': 'Online Legacies',
  '2006': 'Torson Enterprises'
};

const TradeshiftReview = ({ tradeshiftData }) => {
  const [expenseStatuses, setExpenseStatuses] = useState({});
  const [notes, setNotes] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedStatuses = localStorage.getItem('tradeshiftStatuses');
      const savedNotes = localStorage.getItem('tradeshiftNotes');
      console.log('Loading saved statuses:', savedStatuses);
      if (savedStatuses) {
        setExpenseStatuses(JSON.parse(savedStatuses));
      }
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      console.log('Saving statuses:', expenseStatuses);
      localStorage.setItem('tradeshiftStatuses', JSON.stringify(expenseStatuses));
    } catch (error) {
      console.error('Error saving statuses:', error);
    }
  }, [expenseStatuses]);

  // Generate consistent item IDs
  const getItemId = (item, index) => {
    return `${item.lastFourDigits}-${item.name}-${index}`;
  };

  const handleStatusChange = (itemId) => {
    setExpenseStatuses(prev => {
      const currentStatus = prev[itemId] || 'ACTIVE';
      const nextStatus = {
        'ACTIVE': 'CANCELLED',
        'CANCELLED': 'ONCE OFF',
        'ONCE OFF': 'EXPIRED',
        'EXPIRED': 'ACTIVE'
      }[currentStatus];
      
      const updated = {
        ...prev,
        [itemId]: nextStatus
      };
      
      console.log('Updated statuses:', updated);
      return updated;
    });
  };

  const handleBulkStatusChange = (newStatus) => {
    setExpenseStatuses(prev => {
      const updated = { ...prev };
      selectedItems.forEach(itemId => {
        updated[itemId] = newStatus;
      });
      return updated;
    });
    toast.success(`Updated ${selectedItems.size} items to ${newStatus}`);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = sortedData.map((item, index) => getItemId(item, index));
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === sortedData.length);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'ONCE OFF':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: // ACTIVE
        return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  const handleSaveAllNotes = () => {
    try {
      localStorage.setItem('tradeshiftNotes', JSON.stringify(notes));
      toast.success('All notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleClearAllNotes = () => {
    try {
      setNotes({});
      localStorage.removeItem('tradeshiftNotes');
      toast.success('All notes cleared');
    } catch (error) {
      console.error('Error clearing notes:', error);
      toast.error('Failed to clear notes');
    }
  };

  const handleNoteChange = (itemId, note) => {
    setNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  };

  let sortedData = [...(tradeshiftData || [])];

  // Define status priority (ACTIVE first)
  const statusPriority = {
    'ACTIVE': 0,
    'ONCE OFF': 1,
    'CANCELLED': 2,
    'EXPIRED': 3
  };

  // Always sort by status (ACTIVE first), then account, then name
  sortedData.sort((a, b) => {
    // First, sort by status
    const aStatus = expenseStatuses[getItemId(a, sortedData.indexOf(a))] || 'ACTIVE';
    const bStatus = expenseStatuses[getItemId(b, sortedData.indexOf(b))] || 'ACTIVE';
    const statusCompare = statusPriority[aStatus] - statusPriority[bStatus];
    if (statusCompare !== 0) return statusCompare;

    // Then, sort by account
    const accountCompare = (a.account || '').localeCompare(b.account || '');
    if (accountCompare !== 0) return accountCompare;

    // Finally, sort by name
    return (a.name || '').localeCompare(b.name || '');
  });

  // Apply additional sorting if specified
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      if (['available', 'spent', 'approved'].includes(sortConfig.key)) {
        const aValue = parseCurrency(a[sortConfig.key]);
        const bValue = parseCurrency(b[sortConfig.key]);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return sortConfig.direction === 'asc'
          ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
          : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
      }
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
            Tradeshift Cards
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
        {selectedItems.size > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkStatusChange('ACTIVE')}
              size="sm"
              variant="outline"
              className="bg-green-100 text-green-800 hover:bg-green-200 border-green-600"
            >
              Set Active
            </Button>
            <Button
              onClick={() => handleBulkStatusChange('CANCELLED')}
              size="sm"
              variant="outline"
              className="bg-red-100 text-red-800 hover:bg-red-200 border-red-600"
            >
              Set Cancelled
            </Button>
            <Button
              onClick={() => handleBulkStatusChange('ONCE OFF')}
              size="sm"
              variant="outline"
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-600"
            >
              Set Once Off
            </Button>
            <Button
              onClick={() => handleBulkStatusChange('EXPIRED')}
              size="sm"
              variant="outline"
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-600"
            >
              Set Expired
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('lastFourDigits')}>
                <div className="flex items-center gap-1">
                  Last 4
                  <SortIcon columnKey="lastFourDigits" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon columnKey="name" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('endDate')}>
                <div className="flex items-center gap-1">
                  Exp.
                  <SortIcon columnKey="endDate" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('usage')}>
                <div className="flex items-center gap-1">
                  Usage
                  <SortIcon columnKey="usage" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('available')}>
                <div className="flex items-center gap-1">
                  Avail.
                  <SortIcon columnKey="available" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('spent')}>
                <div className="flex items-center gap-1">
                  Spent
                  <SortIcon columnKey="spent" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('approved')}>
                <div className="flex items-center gap-1">
                  Appr.
                  <SortIcon columnKey="approved" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('account')}>
                <div className="flex items-center gap-1">
                  Acct.
                  <SortIcon columnKey="account" />
                </div>
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const itemId = getItemId(item, index);
              const status = expenseStatuses[itemId] || 'ACTIVE';
              const businessName = tradeshiftMapping[item.lastFourDigits];
              return (
                <tr key={itemId} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(itemId)}
                      onChange={(e) => handleSelectItem(itemId, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.lastFourDigits}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.name}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.endDate}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.usage}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.available}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.spent}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.approved}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusChange(itemId)}
                      className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}
                    >
                      {status}
                    </button>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">{item.account}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                    <input
                      type="text"
                      value={notes[itemId] || ''}
                      onChange={(e) => handleNoteChange(itemId, e.target.value)}
                      placeholder="Add notes..."
                      className="w-full text-xs px-1.5 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

export default TradeshiftReview; 