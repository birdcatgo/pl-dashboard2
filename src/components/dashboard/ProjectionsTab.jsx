import React from 'react';
import { format, parse, isValid, parseISO } from 'date-fns';
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

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
    if (isValid(parsedDate)) return parsedDate;
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) return isoDate;
    return null;
  };

  const generateProjections = () => {
    const projectionArray = [];
    const today = new Date();
    let runningBalance = projTotalCash;
    const avgDailySpend = calculateDailySpend();
    
    // Create a map of dates to cash flow events
    const dateMap = new Map();

    // Add invoices to the date map
    invoicesData?.forEach(invoice => {
      const date = parseDate(invoice.DueDate);
      if (!date) {
        console.debug(`Skipping invoice for ${invoice.Network} - missing or invalid due date`);
        return;
      }
      
      const dateKey = format(date, 'yyyy-MM-dd');
      const amount = typeof invoice.Amount === 'string' 
        ? Number(invoice.Amount.replace(/[^0-9.-]+/g, ''))
        : Number(invoice.Amount);

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { income: 0, expenses: 0, events: [] });
      }
      const mapEntry = dateMap.get(dateKey);
      mapEntry.income += amount;
      mapEntry.events.push({
        type: 'invoice',
        description: `${invoice.Network} Invoice #${invoice.InvoiceNumber}`,
        amount: amount
      });
    });

    // Add payroll/expenses to the date map
    payrollData?.forEach(expense => {
      const date = parseDate(expense.dueDate);
      if (!date) {
        console.debug(`Skipping expense ${expense.role} - missing or invalid due date`);
        return;
      }

      const dateKey = format(date, 'yyyy-MM-dd');
      const amount = typeof expense.amount === 'string'
        ? Number(expense.amount.replace(/[^0-9.-]+/g, ''))
        : Number(expense.amount);

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { income: 0, expenses: 0, events: [] });
      }
      const mapEntry = dateMap.get(dateKey);
      mapEntry.expenses += amount;
      mapEntry.events.push({
        type: 'expense',
        description: expense.role,
        amount: -amount
      });
    });

    // Generate 14 days of projections
    for (let i = 0; i < 14; i++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + i);
      const dateKey = format(projectionDate, 'yyyy-MM-dd');
      
      const dateData = dateMap.get(dateKey) || { 
        income: 0, 
        expenses: 0,
        events: []
      };

      // Add the average daily spend to the total outflows
      const totalDayOutflows = dateData.expenses + avgDailySpend;

      const dailyProjection = {
        date: projectionDate,
        inflows: dateData.income,
        outflows: totalDayOutflows,
        balance: runningBalance + dateData.income - totalDayOutflows,
        details: {
          avgDailySpend: avgDailySpend,
          events: dateData.events
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

  return (
    <div className="space-y-6">
      <EnhancedCashFlowProjection 
        projections={generatedProjections}
        totalInflows={totalInflows}
        totalOutflows={totalOutflows}
      />
    </div>
  );
};

export default ProjectionsTab;