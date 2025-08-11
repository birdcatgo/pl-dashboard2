import React, { useState, useEffect } from 'react';
import PLWrapper from './PLWrapper';

const ImprovedPLDashboard = ({ plData, summaryData }) => {
  const [selectedMonth, setSelectedMonth] = useState('');

  // Debug logging
  console.log('ImprovedPLDashboard: Received props:', {
    hasPlData: !!plData,
    plDataKeys: plData ? Object.keys(plData) : [],
    hasMonthly: !!plData?.monthly,
    monthlyKeys: plData?.monthly ? Object.keys(plData.monthly) : [],
    hasSummary: !!plData?.summary,
    summaryLength: plData?.summary?.length || 0,
    summaryData: summaryData
  });

  // Debug: Check what's actually in the month keys
  if (plData && Object.keys(plData).length > 0) {
    const firstMonth = Object.keys(plData)[0];
    console.log('ImprovedPLDashboard: Sample month data structure:', {
      firstMonth,
      monthData: plData[firstMonth],
      monthDataKeys: plData[firstMonth] ? Object.keys(plData[firstMonth]) : [],
      monthDataType: typeof plData[firstMonth]
    });
  }

  useEffect(() => {
    // The data structure is different - months are direct keys in plData
    if (plData && Object.keys(plData).length > 0) {
      const months = Object.keys(plData).filter(key => 
        // Filter for month-like keys (e.g., 'July 2025', 'June 2025')
        /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(key)
      );
      
      if (months.length > 0 && !selectedMonth) {
        // Define month order weights with July 2025 being the most recent
        const monthOrder = {
          'July 2025': 2025 * 12 + 7,      // July 2025
          'June 2025': 2025 * 12 + 6,      // June 2025
          'May 2025': 2025 * 12 + 5,      // May 2025
          'April 2025': 2025 * 12 + 4,    // April 2025
          'March 2025': 2025 * 12 + 3,    // March 2025
          'February 2025': 2025 * 12 + 2, // February 2025
          'January 2025': 2025 * 12 + 1,  // January 2025
          'December 2024': 2024 * 12 + 12, // December 2024
          'November 2024': 2024 * 12 + 11, // November 2024
          'October 2024': 2024 * 12 + 10,  // October 2024
          'September 2024': 2024 * 12 + 9, // September 2024
          'August 2024': 2024 * 12 + 8,    // August 2024
          'July 2024': 2024 * 12 + 7,      // July 2024
          'June 2024': 2024 * 12 + 6       // June 2024
        };
        
        // Sort months chronologically and pick the most recent one
        const sortedMonths = months.sort((a, b) => monthOrder[b] - monthOrder[a]);
        setSelectedMonth(sortedMonths[0]); // First in sorted array is most recent
        console.log('ImprovedPLDashboard: Set initial month to:', sortedMonths[0]);
      }
    }
  }, [plData]);

  // Get the selected month's data - it's directly in plData[selectedMonth]
  const selectedMonthData = plData?.[selectedMonth];

  console.log('ImprovedPLDashboard: Passing to PLWrapper:', {
    selectedMonth,
    hasSelectedMonthData: !!selectedMonthData,
    selectedMonthDataKeys: selectedMonthData ? Object.keys(selectedMonthData) : [],
    sampleMonthData: selectedMonthData
  });

  // Transform the data structure to match what PLWrapper expects
  const transformedPlData = {
    monthly: plData ? Object.fromEntries(
      Object.entries(plData).filter(([key, value]) => 
        /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(key)
      ).map(([key, value]) => [
        key, 
        {
          ...value,
          // Ensure the data structure matches what PLWrapper expects
          incomeData: value.incomeData || value.income || [],
          expenseData: value.expenseData || value.expenses || [],
          categories: value.categories || {},
          totalIncome: value.totalIncome || 0,
          totalExpenses: value.totalExpenses || 0
        }
      ])
    ) : {},
    summary: summaryData || []
  };

  return (
    <div className="space-y-6">
      <PLWrapper 
        plData={transformedPlData}
        monthlyData={transformedPlData.monthly || {}}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedMonthData={selectedMonthData}
      />
    </div>
  );
};

export default ImprovedPLDashboard;