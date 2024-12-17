// SimpleDateSelector.jsx
import React, { useState } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const timeframes = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom Date', value: 'custom' }
];

const SimpleDateSelector = ({ onDateChange }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('yesterday');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [displayDate, setDisplayDate] = useState('');

  const handleChange = (selectedValue) => {
    setSelectedTimeframe(selectedValue);
    const now = new Date();
    const pstNow = utcToZonedTime(now, 'America/Los_Angeles');
    let startDate, endDate;

    switch (selectedValue) {
      case 'custom':
        return;
      case 'today':
        startDate = startOfDay(pstNow);
        endDate = endOfDay(pstNow);
        setDisplayDate(`Today (${format(pstNow, 'd MMM yyyy')} PST)`);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(pstNow, 1));
        endDate = endOfDay(subDays(pstNow, 1));
        setDisplayDate(`Yesterday (${format(subDays(pstNow, 1), 'd MMM yyyy')} PST)`);
        break;
      case '7days':
        startDate = startOfDay(subDays(pstNow, 7));
        endDate = endOfDay(pstNow);
        setDisplayDate(`Last 7 Days (${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')} PST)`);
        break;
      case '30days':
        startDate = startOfDay(subDays(pstNow, 30));
        endDate = endOfDay(pstNow);
        setDisplayDate(`Last 30 Days (${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')} PST)`);
        break;
      case 'thisMonth':
        startDate = startOfMonth(pstNow);
        endDate = endOfDay(pstNow);
        setDisplayDate(`This Month (${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')} PST)`);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(pstNow, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        setDisplayDate(`Last Month (${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')} PST)`);
        break;
      default:
        startDate = startOfDay(subDays(pstNow, 1));
        endDate = endOfDay(subDays(pstNow, 1));
        setDisplayDate(`Yesterday (${format(subDays(pstNow, 1), 'd MMM yyyy')} PST)`);
    }

    onDateChange({
      startDate,
      endDate
    });
  };

  const handleCustomDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    setCustomDate(e.target.value);

    const pstDate = utcToZonedTime(selectedDate, 'America/Los_Angeles');
    const startDate = startOfDay(pstDate);
    const endDate = endOfDay(pstDate);

    setDisplayDate(`Custom Date (${format(pstDate, 'd MMM yyyy')} PST)`);

    onDateChange({
      startDate,
      endDate
    });
  };

  return (
    <div className="space-y-2">
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

        {selectedTimeframe === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={handleCustomDateChange}
            className="form-input rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        )}
      </div>

      {displayDate && (
        <div className="text-sm text-gray-600 font-medium">
          Showing data for: {displayDate}
        </div>
      )}
    </div>
  );
};

export default SimpleDateSelector;