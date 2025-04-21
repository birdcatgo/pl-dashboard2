import React, { useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar } from 'lucide-react';

// Define time period selector component
const EnhancedTimePeriodSelector = ({
  onPeriodChange,
  onCustomDateChange,
  selectedPeriod = 'last7',
  showDateRange = true,
  className = ''
}) => {
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [isCustom, setIsCustom] = useState(false);

  const today = new Date();
  const yesterday = subDays(today, 1);
  const lastWeekStart = subDays(today, 6);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  const thisMonthStart = startOfMonth(today);
  const last30Days = subDays(today, 29);

  const handlePeriodChange = (period) => {
    setIsCustom(period === 'custom');
    onPeriodChange(period);

    // Set default date ranges based on period
    let startDate, endDate;
    switch (period) {
      case 'yesterday':
        startDate = yesterday;
        endDate = yesterday;
        break;
      case 'last7':
        startDate = lastWeekStart;
        endDate = today;
        break;
      case 'last30':
        startDate = last30Days;
        endDate = today;
        break;
      case 'thisMonth':
        startDate = thisMonthStart;
        endDate = today;
        break;
      case 'lastMonth':
        startDate = lastMonthStart;
        endDate = lastMonthEnd;
        break;
      default:
        return;
    }

    if (onCustomDateChange && startDate && endDate) {
      onCustomDateChange({
        startDate,
        endDate,
        period
      });
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onCustomDateChange({
        startDate: customStartDate,
        endDate: customEndDate,
        period: 'custom'
      });
    }
  };

  const getActiveClass = (period) => {
    return selectedPeriod === period
      ? 'bg-blue-500 text-white'
      : 'bg-white text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handlePeriodChange('yesterday')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${getActiveClass('yesterday')}`}
        >
          Yesterday
        </button>
        <button
          onClick={() => handlePeriodChange('last7')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${getActiveClass('last7')}`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handlePeriodChange('last30')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${getActiveClass('last30')}`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => handlePeriodChange('thisMonth')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${getActiveClass('thisMonth')}`}
        >
          This Month
        </button>
        <button
          onClick={() => handlePeriodChange('lastMonth')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${getActiveClass('lastMonth')}`}
        >
          Last Month
        </button>
        <button
          onClick={() => setIsCustom(!isCustom)}
          className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${getActiveClass('custom')}`}
        >
          <Calendar className="w-3 h-3" />
          Custom
        </button>
      </div>

      {isCustom && showDateRange && (
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setCustomStartDate(new Date(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setCustomEndDate(new Date(e.target.value))}
            />
          </div>
          <button
            onClick={handleCustomDateApply}
            disabled={!customStartDate || !customEndDate}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedTimePeriodSelector; 