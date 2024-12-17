import React, { useState } from 'react';
import format from 'date-fns/format';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import subDays from 'date-fns/subDays';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import subMonths from 'date-fns/subMonths';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';

const CustomDateRangePicker = ({ onDateRangeChange }) => {
  const today = utcToZonedTime(new Date(), 'America/Los_Angeles');
  const [dateRange, setDateRange] = useState([today, today]);
  const [startDate, endDate] = dateRange;
  const [isComparing, setIsComparing] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState(null);
  const [compareEndDate, setCompareEndDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const getPSTDate = (date) => {
    return utcToZonedTime(zonedTimeToUtc(date, 'America/Los_Angeles'), 'America/Los_Angeles');
  };

  const handlePresetSelect = (preset) => {
    let newStartDate;
    let newEndDate;
    const now = getPSTDate(new Date());

    switch (preset) {
      case 'yesterday':
        const yesterday = subDays(now, 1);
        newStartDate = startOfDay(yesterday);
        newEndDate = endOfDay(yesterday);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        newStartDate = startOfMonth(lastMonth);
        newEndDate = endOfMonth(lastMonth);
        break;
      case 'monthToDate':
        newStartDate = startOfMonth(now);
        newEndDate = now;
        break;
      default:
        return;
    }

    const newRange = [getPSTDate(newStartDate), getPSTDate(newEndDate)];
    setDateRange(newRange);
    
    if (isComparing) {
      const duration = newEndDate - newStartDate;
      const compareEnd = subDays(newStartDate, 1);
      const compareStart = new Date(compareEnd - duration);
      setCompareStartDate(getPSTDate(compareStart));
      setCompareEndDate(getPSTDate(compareEnd));
    }

    handleApply(newRange);
    setIsOpen(false);
  };

  const handleApply = (selectedRange = dateRange) => {
    const [start, end] = selectedRange;
    const dates = {
      startDate: getPSTDate(start),
      endDate: getPSTDate(end),
    };
    
    if (isComparing && compareStartDate && compareEndDate) {
      dates.compareStartDate = getPSTDate(compareStartDate);
      dates.compareEndDate = getPSTDate(compareEndDate);
    }
    
    onDateRangeChange(dates);
    setIsOpen(false);
  };

  const toggleCompare = () => {
    setIsComparing(!isComparing);
    if (!isComparing) {
      const duration = endDate - startDate;
      const compareEnd = subDays(startDate, 1);
      const compareStart = new Date(compareEnd - duration);
      setCompareStartDate(getPSTDate(compareStart));
      setCompareEndDate(getPSTDate(compareEnd));
    } else {
      setCompareStartDate(null);
      setCompareEndDate(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          {startDate ? format(startDate, 'MMM d, yyyy') : 'Start Date'} - {endDate ? format(endDate, 'MMM d, yyyy') : 'End Date'}
          {isComparing && ' (Comparing)'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handlePresetSelect('yesterday')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
            >
              Yesterday
            </button>
            <button
              onClick={() => handlePresetSelect('lastMonth')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
            >
              Last Month
            </button>
            <button
              onClick={() => handlePresetSelect('monthToDate')}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
            >
              Month to Date
            </button>
          </div>
          
          <div>
            <div className="mb-2 text-sm font-medium text-gray-600">
              Select date range
            </div>
            <DatePicker
              selected={startDate}
              onChange={(update) => {
                setDateRange(update);
              }}
              startDate={startDate}
              endDate={endDate}
              selectsRange={true}
              inline
            />
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isComparing}
                onChange={toggleCompare}
                className="rounded"
              />
              <span className="text-sm">Compare to previous period</span>
            </label>
            
            {isComparing && compareStartDate && compareEndDate && (
              <div className="mt-2 text-sm text-gray-600">
                Comparing with: {format(compareStartDate, 'MMM d, yyyy')} - {format(compareEndDate, 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApply()}
              disabled={!startDate || !endDate}
              className={`px-4 py-2 text-sm rounded ${
                (!startDate || !endDate)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateRangePicker;