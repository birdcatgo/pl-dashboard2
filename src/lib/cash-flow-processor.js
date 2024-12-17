// lib/cash-flow-processor.js
import { addDays, startOfDay, format, parse } from 'date-fns';

const cashAccounts = ['Cash in Bank', 'Business Savings', 'Operating Account'];

const parseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return 0;
};

const isCashAccount = (accountName) => {
  if (!accountName || typeof accountName !== 'string') return false;
  return cashAccounts.some(name => 
    accountName.toLowerCase().includes(name.toLowerCase())
  );
};

export const processCashFlowData = (financialResources, invoicesData, payrollData) => {
  const result = {
    currentBalance: 0,
    creditAvailable: 0,
    financialResources: financialResources.map(row => ({
      account: row.account || '',
      available: parseFloat(row.available) || 0,
      owing: parseFloat(row.owing) || 0,
      limit: parseFloat(row.limit) || 0
    })),
    projections: [],
    totalInflows: 0,
    totalOutflows: 0
  };

  result.financialResources.forEach(resource => {
    if (!resource.limit) {
      result.currentBalance += resource.available;
    } else {
      result.creditAvailable += resource.limit - resource.owing;
    }
  });

  const inflows = [];
  if (invoicesData?.length > 1) {
    invoicesData.slice(1).forEach(row => {
      if (row[0] && row[1] && row[2]) {
        try {
          inflows.push({
            source: row[0],
            amount: parseAmount(row[1]),
            date: parse(row[2], 'MM/dd/yyyy', new Date())
          });
        } catch (error) {
          console.error('Error parsing invoice:', error);
        }
      }
    });
  }

  const today = startOfDay(new Date());
  let runningBalance = result.currentBalance;

  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    const dayInflows = inflows
      .filter(inflow => startOfDay(inflow.date).getTime() === date.getTime())
      .reduce((sum, inflow) => sum + inflow.amount, 0);

    const creditCardPayments = result.financialResources
      .filter(account => !account.isCash && account.owing > 0)
      .map(card => Math.max(card.owing * 0.03, 25))
      .reduce((sum, payment) => sum + payment, 0);

    const dayOutflows = i === 0 ? creditCardPayments : 0;
    runningBalance += (dayInflows - dayOutflows);

    result.projections.push({
      date,
      inflows: dayInflows,
      outflows: dayOutflows,
      balance: runningBalance,
      details: {
        creditCardPayments: i === 0 ? creditCardPayments : 0,
        invoices: inflows
          .filter(inflow => startOfDay(inflow.date).getTime() === date.getTime())
          .map(inflow => ({
            source: inflow.source,
            amount: inflow.amount
          }))
      }
    });

    result.totalInflows += dayInflows;
    result.totalOutflows += dayOutflows;
  }

  return result;
};