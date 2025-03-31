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

export const processCashFlowData = (rows) => {
  const result = {
    availableCash: 0,
    creditAvailable: 0,
    totalAvailable: 0,
    financialResources: []
  };

  // Skip header row and filter out empty rows
  const dataRows = rows.filter(row => 
    row && 
    row.length >= 2 && // Changed from 4 to 2 to include cash account rows
    row[0] !== 'Account Name' && 
    row[0].trim() !== ''
  );

  console.log('Raw rows from sheet:', rows);
  console.log('Filtered data rows:', dataRows);
  console.log('Looking for cash accounts:', cashAccounts);

  dataRows.forEach(row => {
    const accountName = row[0].trim();
    const available = parseAmount(row[1]);
    const owing = parseAmount(row[2] || 0); // Default to 0 if column doesn't exist
    const limit = parseAmount(row[3] || 0); // Default to 0 if column doesn't exist

    console.log('Processing row:', { accountName, available, owing, limit });

    // Add to appropriate totals based on account type
    if (accountName === 'Cash in Bank' || 
        accountName === 'Slash Account' || 
        accountName === 'Business Savings (JP MORGAN)') {
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
      type: accountName === 'Cash in Bank' || 
            accountName === 'Slash Account' || 
            accountName === 'Business Savings (JP MORGAN)' ? 'cash' : 'credit'
    });
  });

  // Calculate total available
  result.totalAvailable = result.availableCash + result.creditAvailable;

  console.log('Processed cash flow data:', {
    availableCash: result.availableCash,
    creditAvailable: result.creditAvailable,
    totalAvailable: result.totalAvailable,
    resourceCount: result.financialResources.length,
    firstFewResources: result.financialResources.slice(0, 3)
  });

  return result;
};