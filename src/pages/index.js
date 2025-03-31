import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

export default function DashboardPage() {
  const [performanceData, setPerformanceData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets');
      const data = await response.json();
      
      setPerformanceData(data.performanceData);
      setInvoicesData(data.rawData?.invoices || []);
      setPayrollData(data.rawData?.payroll || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <DashboardLayout
      performanceData={performanceData}
      invoiceData={invoicesData}
      expenseData={payrollData}
    />
  );
}