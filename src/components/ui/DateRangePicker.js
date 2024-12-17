import React, { useState } from 'react';
import { format } from 'date-fns';

const CustomDateRangePicker = ({ onDateRangeChange }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const formatDate = (date) => (date ? format(date, 'MM/dd/yyyy') : '');

  const handleApply = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    onDateRangeChange({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
  };

  return (
    <div className="custom-date-range-picker bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold mb-4">Select Date Range</h3>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
      <div className="mt-4">
        <p>Selected Start Date: {startDate ? formatDate(startDate) : 'None'}</p>
        <p>Selected End Date: {endDate ? formatDate(endDate) : 'None'}</p>
      </div>
    </div>
  );
};

export default CustomDateRangePicker;
