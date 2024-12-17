import React from 'react';
import { format, parseISO } from 'date-fns';
import EnhancedCashFlowProjection from './EnhancedCashFlowProjection';

const ProjectionsTab = ({ cashManagementData, performanceData, invoicesData = [], payrollData = [] }) => {
  console.log('Invoices Data:', invoicesData);
  console.log('Payroll Data:', payrollData);

  const projResources = cashManagementData?.financialResources || [];
  const projTotalCash = projResources
    .filter((resource) => {
      if (!resource || typeof resource.account !== 'string') {
        return false;
      }
      return resource.account.toLowerCase().includes('bank') || 
             resource.account.toLowerCase().includes('cash');
    })
    .reduce((sum, resource) => sum + (parseFloat(resource.available) || 0), 0);

  const calculateDailySpend = () => {
    // Get last 7 days
    const last7Days = new Set(); // Use Set for unique dates
    const spendByDate = new Map();

    // Sort by date in descending order
    const sortedData = [...performanceData].sort((a, b) => 
      new Date(b.Date) - new Date(a.Date)
    );

    // Collect unique dates and sum spend for each date
    sortedData.forEach(entry => {
      const date = format(new Date(entry.Date), 'yyyy-MM-dd');
      if (last7Days.size < 7) {
        last7Days.add(date);
        if (!spendByDate.has(date)) {
          spendByDate.set(date, 0);
        }
        spendByDate.set(date, spendByDate.get(date) + (Number(entry['Ad Spend']) || 0));
      }
    });

    // Calculate average from the daily totals
    const dailyTotals = Array.from(spendByDate.values());
    console.log('Daily spend totals for last 7 days:', dailyTotals);
    const avgDailySpend = dailyTotals.reduce((sum, spend) => sum + spend, 0) / dailyTotals.length;
    console.log('Calculated average daily spend:', avgDailySpend);
    return avgDailySpend;
  };

  const generateProjections = () => {
    const projectionArray = [];
    const today = new Date();
    let runningBalance = projTotalCash;
    const avgDailySpend = calculateDailySpend();
    
    // Create a map of dates to expected inflows and outflows
    const dateMap = new Map();

    // Add invoices to the date map
    invoicesData.forEach(invoice => {
      const dueDate = format(new Date(invoice.DueDate), 'yyyy-MM-dd');
      const amount = typeof invoice.AmountDue === 'string' 
        ? Number(invoice.AmountDue.replace(/[^0-9.-]+/g, ''))
        : Number(invoice.AmountDue);
      
      if (!dateMap.has(dueDate)) {
        dateMap.set(dueDate, { inflows: 0, outflows: 0, details: { invoices: [], creditCardPayments: [] } });
      }
      
      const dayData = dateMap.get(dueDate);
      dayData.inflows += amount;
      dayData.details.invoices.push({
        source: invoice.Invoices,
        amount: amount
      });
    });

    // Add payroll/credit card payments to the date map
    payrollData.forEach(expense => {
        if (!expense.DueDate) return; // Skip if no date
            
        const dueDate = format(new Date(expense.DueDate), 'yyyy-MM-dd');
        const amount = typeof expense.Amount === 'string'
          ? Number(expense.Amount.replace(/[^0-9.-]+/g, ''))
          : Number(expense.Amount);
            
        if (!dateMap.has(dueDate)) {
          dateMap.set(dueDate, { inflows: 0, outflows: 0, details: { invoices: [], creditCardPayments: [] } });
        }
            
        const dayData = dateMap.get(dueDate);
        dayData.outflows += amount;
        dayData.details.creditCardPayments.push({
          type: expense.Type,
          description: expense.Description, 
          amount: amount
        });
      });

    // Generate 14 days of projections
    for (let i = 0; i < 14; i++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + i);
      const dateKey = format(projectionDate, 'yyyy-MM-dd');
      
      const dateData = dateMap.get(dateKey) || { 
        inflows: 0, 
        outflows: 0, 
        details: { invoices: [], creditCardPayments: [] } 
      };

      // Add the average daily spend to the total outflows
      const totalDayOutflows = dateData.outflows + avgDailySpend;

      const dailyProjection = {
        date: projectionDate,
        inflows: dateData.inflows,
        outflows: totalDayOutflows,
        balance: runningBalance + dateData.inflows - totalDayOutflows,
        details: {
          invoices: dateData.details.invoices,
          creditCardPayments: dateData.details.creditCardPayments,
          avgDailySpend: avgDailySpend
        }
      };
      
      runningBalance = dailyProjection.balance;
      projectionArray.push(dailyProjection);
    }
    
    return projectionArray;
  };

  const generatedProjections = generateProjections();
  const totalInflows = generatedProjections.reduce((sum, day) => sum + day.inflows, 0);
  const totalOutflows = generatedProjections.reduce((sum, day) => sum + day.outflows, 0);

  const projectionData = {
    currentBalance: projTotalCash,
    creditAvailable: cashManagementData?.creditAvailable || 0,
    projections: generatedProjections,
    totalInflows: totalInflows,
    totalOutflows: totalOutflows
  };

  return (
    <div className="space-y-6">
      <EnhancedCashFlowProjection 
        projectionData={projectionData}
        historicalSpendData={performanceData}
      />
    </div>
  );
};

export default ProjectionsTab;