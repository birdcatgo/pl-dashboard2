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
        // Dynamic month order calculation
        const getMonthWeight = (monthStr) => {
          const monthNames = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
          };
          
          const parts = monthStr.split(' ');
          if (parts.length !== 2) return 0;
          
          const month = monthNames[parts[0]];
          const year = parseInt(parts[1]);
          
          if (!month || !year) return 0;
          
          return year * 12 + month;
        };
        
        // Sort months chronologically and pick the most recent one
        const sortedMonths = months.sort((a, b) => getMonthWeight(b) - getMonthWeight(a));
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