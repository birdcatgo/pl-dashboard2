// AdvancedFilters.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { subDays } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

const AdvancedFilters = ({ data, onFilterChange }) => {
  const [dateRange, setDateRange] = useState([
    subDays(new Date(), 30),
    new Date()
  ]);
  const [startDate, endDate] = dateRange;
  
  const networks = [...new Set(data?.map(item => item.Network) || [])];
  const buyers = [...new Set(data?.map(item => item['Media Buyer']) || [])];
  const offers = [...new Set(data?.map(item => item.Offer) || [])];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
              onFilterChange({ type: 'date', value: { startDate: update[0], endDate: update[1] } });
            }}
            className="form-input block w-full rounded-md border-gray-300"
            placeholderText="Select date range"
          />
        </div>
        
        <Select
          isMulti
          placeholder="Filter Networks"
          options={networks.map(n => ({ value: n, label: n }))}
          onChange={selected => onFilterChange({ type: 'network', value: selected })}
        />
        
        <Select
          isMulti
          placeholder="Filter Media Buyers"
          options={buyers.map(b => ({ value: b, label: b }))}
          onChange={selected => onFilterChange({ type: 'buyer', value: selected })}
        />
        
        <Select
          isMulti
          placeholder="Filter Offers"
          options={offers.map(o => ({ value: o, label: o }))}
          onChange={selected => onFilterChange({ type: 'offer', value: selected })}
        />
      </div>
    </div>
  );
};

export default AdvancedFilters;