import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MonthlyPL from './MonthlyPL';
import Papa from 'papaparse';

const PLWrapper = ({ summaryData, monthlyData }) => {
  // Get available months from the monthlyData prop
  const availableMonths = monthlyData ? Object.keys(monthlyData) : [];
  const [currentMonth, setCurrentMonth] = useState(availableMonths[0] || '');

  // Get the data for the selected month
  const selectedMonthData = monthlyData?.[currentMonth] || [];
  console.log("Selected month data:", selectedMonthData);
  
  // Get the summary data for the selected month
  const selectedMonthSummary = summaryData?.find(m => m.Month === currentMonth) || null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
        <Select 
          value={currentMonth} 
          onValueChange={setCurrentMonth}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(month => (
              <SelectItem key={month} value={month}>
                {month} 2024
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMonthData && selectedMonthData.length > 0 ? (
        <MonthlyPL data={selectedMonthData} summary={selectedMonthSummary} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No data available for {currentMonth}
        </div>
      )}
    </div>
  );
};

export default PLWrapper;