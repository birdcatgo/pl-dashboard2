import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const timeframes = [
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom Range', value: 'custom' }
];

const EnhancedDateSelector = ({ selectedMonth, availableMonths, onDateChange }) => {
  // Move state initialization outside of render
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);

  // Use useEffect to handle month changes
  useEffect(() => {
    if (selectedMonth !== currentMonth) {
      setCurrentMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setCurrentMonth(newMonth);
    onDateChange(newMonth);
  };

  const [selectedTimeframe, setSelectedTimeframe] = useState('yesterday');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date(); // Current date in local time
    const pstToday = utcToZonedTime(today, 'America/Los_Angeles'); // Convert to PST
    const yesterday = utcToZonedTime(subDays(pstToday, 1), 'America/Los_Angeles');
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    
    onDateChange({
      startDate: yesterdayStart,
      endDate: yesterdayEnd,
    });
  
    return format(yesterday, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const pstToday = utcToZonedTime(today, 'America/Los_Angeles');
    const yesterday = subDays(pstToday, 1);
    return format(yesterday, 'yyyy-MM-dd');
  });
  const [displayDate, setDisplayDate] = useState('');

  const formatDateRange = (start, end) => {
    const startStr = format(start, 'dd/MM/yyyy');
    const endStr = format(end, 'dd/MM/yyyy');
    return `${startStr} - ${endStr} PST`;
  };

  const handleChange = (selectedValue) => {
    setSelectedTimeframe(selectedValue);
    if (selectedValue === 'custom') return;

    const now = new Date();
    const pstNow = utcToZonedTime(now, 'America/Los_Angeles');
    let rangeStart, rangeEnd;

    switch (selectedValue) {
      case 'yesterday':
        // Use PST for yesterday's date range
        const yesterday = subDays(pstNow, 1);
        rangeStart = startOfDay(yesterday);
        rangeEnd = endOfDay(yesterday);
        
        console.log('Yesterday date range:', {
          start: format(rangeStart, 'MM/dd/yyyy'),
          end: format(rangeEnd, 'MM/dd/yyyy'),
          startISO: rangeStart.toISOString(),
          endISO: rangeEnd.toISOString()
        });
        break;
      case '7days':
        rangeStart = startOfDay(subDays(pstNow, 7));
        rangeEnd = endOfDay(pstNow);
        break;
      case '30days':
        rangeStart = startOfDay(subDays(pstNow, 30));
        rangeEnd = endOfDay(pstNow);
        break;
      case 'thisMonth':
        rangeStart = startOfMonth(pstNow);
        rangeEnd = endOfDay(pstNow);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(pstNow, 1);
        rangeStart = startOfMonth(lastMonth);
        rangeEnd = endOfMonth(lastMonth);
        break;
      default:
        rangeStart = startOfDay(subDays(pstNow, 1));
        rangeEnd = endOfDay(subDays(pstNow, 1));
    }

    setStartDate(format(rangeStart, 'yyyy-MM-dd'));
    setEndDate(format(rangeEnd, 'yyyy-MM-dd'));
    setDisplayDate(`Showing data for ${format(rangeStart, 'MM/dd/yyyy')} - ${format(rangeEnd, 'MM/dd/yyyy')} PST`);
    onDateChange({
      startDate: rangeStart,
      endDate: rangeEnd
    });
  };


  const handleCustomDateChange = (type, date) => {
    try {
      // Create a Date object for the selected date in local time
      const localDate = new Date(date);
      
      // Adjust for PST (UTC-8)
      const pstOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const pstDate = new Date(localDate.getTime() + pstOffset);
      
      if (type === 'start') {
        setStartDate(date);
        setDisplayDate(`${format(pstDate, 'dd/MM/yyyy')} - ${format(pstDate, 'dd/MM/yyyy')} PST`);
        onDateChange({
          startDate: startOfDay(pstDate),
          endDate: endOfDay(pstDate)
        });
      } else {
        setEndDate(date);
        setDisplayDate(`${format(pstDate, 'dd/MM/yyyy')} - ${format(pstDate, 'dd/MM/yyyy')} PST`);
        onDateChange({
          startDate: startOfDay(pstDate),
          endDate: endOfDay(pstDate)
        });
      }
    } catch (error) {
      console.error('Error processing date:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600 font-medium">Time Period:</label>
          <select
            onChange={(e) => handleChange(e.target.value)}
            value={selectedTimeframe}
            className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            {timeframes.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {selectedTimeframe === 'custom' && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="form-input rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="form-input rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        )}
      </div>

      {displayDate && (
        <div className="text-sm text-gray-600 font-medium mt-2">
          Showing data for: {displayDate}
        </div>
      )}
    </div>
  );
};

export default EnhancedDateSelector;