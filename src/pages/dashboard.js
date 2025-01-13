import React from 'react';
import { useState, useEffect } from 'react';
import NetProfit from '../components/dashboard/NetProfit';

const Dashboard = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mockPerformanceData = [
          {
            Date: '2024-03-01',
            Network: 'Network A',
            Offer: 'Offer 1',
            'Total Revenue': 50000,
          },
          {
            Date: '2024-03-01',
            Network: 'Network B',
            Offer: 'Offer 2',
            'Total Revenue': 75000,
          },
        ];

        const mockExpensesData = [
          {
            date: '2024-03-01',
            amount: 30000,
            category: 'Marketing',
          },
          {
            date: '2024-03-01',
            amount: 20000,
            category: 'Operations',
          },
        ];

        setPerformanceData(mockPerformanceData);
        setExpensesData(mockExpensesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'overview-v2', label: 'Overview' },
    { id: 'net-profit', label: 'Net Profit' },
    { id: 'cash-credit', label: 'Credit Line' },
    // ... other tabs
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'net-profit':
        return (
          <NetProfit 
            performanceData={performanceData} 
            expensesData={expensesData} 
          />
        );
      // ... rest of your cases
    }
  };

  return (
    <div>
      <NetProfit 
        performanceData={performanceData} 
        expensesData={expensesData} 
      />
    </div>
  );
};

export default Dashboard; 