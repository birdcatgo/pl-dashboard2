import React from 'react';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, isValid } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

const CompactDateSelector = ({ 
  onDateChange, 
  selectedPeriod = 'last7',
  latestDate
}) => {
  const getDateRange = (period) => {
    const now = latestDate && isValid(latestDate) ? latestDate : new Date();
    if (!isValid(now) || isNaN(now.getTime())) {
      console.error('Invalid date provided to CompactDateSelector:', now, latestDate);
      return null;
    }

    let startDate, endDate;
    
    try {
      switch (period) {
        case 'last7':
          startDate = startOfDay(subDays(now, 6));
          endDate = endOfDay(now);
          break;
        case 'last30':
          startDate = startOfDay(subDays(now, 29));
          endDate = endOfDay(now);
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth': {
          const lastMonth = subDays(startOfMonth(now), 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        }
        case 'last60':
          startDate = startOfDay(subDays(now, 59));
          endDate = endOfDay(now);
          break;
        case 'last90':
          startDate = startOfDay(subDays(now, 89));
          endDate = endOfDay(now);
          break;
        case 'ytd':
          startDate = startOfYear(now);
          endDate = endOfDay(now);
          break;
        default:
          startDate = startOfDay(subDays(now, 6));
          endDate = endOfDay(now);
      }

      if (!isValid(startDate) || !isValid(endDate)) {
        console.error('Invalid date range calculated:', { startDate, endDate, period });
        return null;
      }

      return {
        startDate,
        endDate,
        period
      };
    } catch (error) {
      console.error('Error calculating date range:', error);
      return null;
    }
  };

  const handlePeriodSelect = (period) => {
    const newRange = getDateRange(period);
    if (newRange) {
      onDateChange(newRange);
    } else {
      console.error('Failed to calculate date range for period:', period);
    }
  };

  const periods = [
    { id: 'last7', label: '7D', fullLabel: 'Last 7 Days' },
    { id: 'last30', label: '30D', fullLabel: 'Last 30 Days' },
    { id: 'last60', label: '60D', fullLabel: 'Last 60 Days' },
    { id: 'last90', label: '90D', fullLabel: 'Last 90 Days' },
    { id: 'thisMonth', label: 'MTD', fullLabel: 'Month to Date' },
    { id: 'ytd', label: 'YTD', fullLabel: 'Year to Date' }
  ];

  const getDateRangeText = () => {
    const range = getDateRange(selectedPeriod);
    if (!range) return 'Invalid range';
    
    const start = range.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = range.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${start} - ${end}`;
  };

  return (
    <div className="inline-flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Period:</span>
      </div>
      
      <div className="flex items-center gap-1">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => handlePeriodSelect(period.id)}
            title={period.fullLabel}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${selectedPeriod === period.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 pl-2 border-l border-gray-200">
        {getDateRangeText()}
      </div>
    </div>
  );
};

export default CompactDateSelector; 