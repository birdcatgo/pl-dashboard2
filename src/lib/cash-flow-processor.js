// lib/cash-flow-processor.js
import { addDays, startOfDay, format, parse } from 'date-fns';

const cashAccounts = [
  'Cash in Bank',
  'Slash Account',
  'Business Savings (JP MORGAN)'
];

const parseAmount = (str) => {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const cleaned = str.toString().replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const isCashAccount = (accountName) => {
  const cashAccounts = [
    'Cash in Bank',
    'Slash Account',
    'Business Savings (JP MORGAN)'
  ];
  
  return cashAccounts.includes(accountName);
};

export const processCashFlowData = (response) => {
  if (!response?.values || response.values.length < 2) {
    console.error('Invalid response format:', response);
    return {
      availableCash: 0,
      creditAvailable: 0,
      totalAvailable: 0,
      financialResources: []
    };
  }

  console.log('Starting cash flow processing with response:', {
    valuesLength: response.values.length,
    firstRow: response.values[0],
    sampleRows: response.values.slice(0, 3)
  });

  const result = {
    availableCash: 0,
    creditAvailable: 0,
    totalAvailable: 0,
    financialResources: []
  };

  // Skip header row and filter out empty rows
  const dataRows = response.values.slice(1).filter(row => {
    if (!row || row.length < 2) {
      console.log('Invalid row format:', row);
      return false;
    }

    const accountName = row[0]?.trim();
    if (!accountName || accountName === 'Account Name') {
      console.log('Invalid account name:', accountName);
      return false;
    }

    return true;
  });

  console.log('Filtered data rows:', {
    totalRows: dataRows.length,
    firstRow: dataRows[0],
    sampleRows: dataRows.slice(0, 3)
  });

  dataRows.forEach((row, index) => {
    try {
      const accountName = row[0].trim();
      const available = parseAmount(row[1]);
      const owing = parseAmount(row[2] || 0);
      const limit = parseAmount(row[3] || 0);

      console.log(`Processing row ${index}:`, {
        accountName,
        available,
        owing,
        limit,
        isCashAccount: isCashAccount(accountName),
        rawRow: row
      });

      // Add to appropriate totals based on account type
      if (isCashAccount(accountName)) {
        result.availableCash += available;
      } else {
        result.creditAvailable += available;
      }

      // Add to financial resources array
      result.financialResources.push({
        account: accountName,
        available,
        owing,
        limit,
        type: isCashAccount(accountName) ? 'cash' : 'credit'
      });
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
    }
  });

  // Calculate total available
  result.totalAvailable = result.availableCash + result.creditAvailable;

  console.log('Final processed cash flow data:', {
    availableCash: result.availableCash,
    creditAvailable: result.creditAvailable,
    totalAvailable: result.totalAvailable,
    resourceCount: result.financialResources.length,
    resources: result.financialResources
  });

  return result;
};