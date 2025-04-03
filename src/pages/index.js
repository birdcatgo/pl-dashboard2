import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

export default function DashboardPage() {
  const [performanceData, setPerformanceData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [networkTermsData, setNetworkTermsData] = useState(null);
  const [tradeshiftData, setTradeshiftData] = useState([]);
  const [plData, setPlData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response Structure:', {
        hasPerformanceData: !!data.performanceData,
        performanceDataLength: data.performanceData?.length,
        hasInvoicesData: !!data.rawData?.invoices,
        invoicesDataLength: data.rawData?.invoices?.length,
        hasPayrollData: !!data.rawData?.payroll,
        payrollDataLength: data.rawData?.payroll?.length,
        hasCashFlowData: !!data.cashFlowData,
        cashFlowDataKeys: data.cashFlowData ? Object.keys(data.cashFlowData) : [],
        hasNetworkTerms: !!data.networkTerms,
        networkTermsLength: data.networkTerms?.length,
        hasTradeshiftData: !!data.tradeshiftData,
        tradeshiftDataLength: data.tradeshiftData?.length,
        hasPlData: !!data.plData,
        plDataKeys: data.plData ? Object.keys(data.plData) : []
      });
      
      // Transform performance data from array of arrays to array of objects
      const transformedPerformanceData = data.performanceData.map(row => ({
        Date: row[0],
        Network: row[1],
        Offer: row[2],
        'Media Buyer': row[3],
        'Ad Spend': parseFloat((row[4] || '0').replace(/[$,]/g, '')),
        'Ad Revenue': parseFloat((row[5] || '0').replace(/[$,]/g, '')),
        'Comment Revenue': parseFloat((row[6] || '0').replace(/[$,]/g, '')),
        'Total Revenue': parseFloat((row[7] || '0').replace(/[$,]/g, '')),
        'Ringba Cost': parseFloat((row[8] || '0').replace(/[$,]/g, '')),
        'Expected Payment': row[9],
        'Running Balance': parseFloat((row[10] || '0').replace(/[$,]/g, '')),
        'Ad Account': row[11]
      }));
      
      // Set all the data
      setPerformanceData({
        data: transformedPerformanceData,
        commissions: data.commissions || []
      });
      setInvoicesData(data.rawData?.invoices || []);
      setPayrollData(data.rawData?.payroll || []);
      setCashFlowData(data.cashFlowData || {});
      setNetworkTermsData(data.networkTerms || []);
      setTradeshiftData(data.tradeshiftData || []);
      setPlData(data.plData || {});

      // Log the state of each piece of data
      console.log('Data State:', {
        performanceData: transformedPerformanceData.length,
        invoicesData: data.rawData?.invoices?.length || 0,
        payrollData: data.rawData?.payroll?.length || 0,
        hasCashFlowData: !!data.cashFlowData,
        networkTermsCount: data.networkTerms?.length || 0,
        tradeshiftDataCount: data.tradeshiftData?.length || 0,
        hasPlData: !!data.plData
      });

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
      cashFlowData={cashFlowData}
      networkTermsData={networkTermsData}
      tradeshiftData={tradeshiftData}
      plData={plData}
    />
  );
}