export const isCreditCard = (accountName) => {
  const creditCardKeywords = [
    'amex', 'chase', 'capital one', 'bank of america',
    'us bank', 'alliant', 'visa', 'mastercard', 'discover',
    'c/c', 'credit card'
  ];
  
  const lowerName = accountName.toLowerCase();
  return creditCardKeywords.some(keyword => lowerName.includes(keyword));
};

export const processCashFlowData = (rows) => {
  const data = {
    financialResources: {
      cashAccounts: [],
      creditCards: [],
      totalCash: 0,
      totalCreditAvailable: 0,
      totalCreditOwing: 0
    },
    mediaBuyerSpend: {
      buyers: [],
      totalDailySpend: 0
    },
    invoices: [],
    payroll: [],
    projections: {
      totalAvailableFunds: 0,
      totalDailySpend: 0,
      daysOfCoverage: 0
    }
  };

  // Find header row
  const headerRowIndex = rows.findIndex(row => 
    row.includes('Resource') && row.includes('Amount Available')
  );

  if (headerRowIndex === -1) return data;

  // Process each row
  rows.slice(headerRowIndex + 1).forEach(row => {
    if (!row[0] || row[0].includes('Table') || row[0].includes('TOTAL')) return;

    // Process Financial Resources
    const accountData = {
      name: row[0],
      available: parseFloat((row[1] || '0').replace(/[$,]/g, '')) || 0,
      owing: parseFloat((row[2] || '0').replace(/[$,]/g, '')) || 0,
      limit: parseFloat((row[3] || '0').replace(/[$,]/g, '')) || 0
    };

    if (isCreditCard(accountData.name)) {
      data.financialResources.creditCards.push(accountData);
      data.financialResources.totalCreditAvailable += accountData.available;
      data.financialResources.totalCreditOwing += accountData.owing;
    } else {
      data.financialResources.cashAccounts.push(accountData);
      data.financialResources.totalCash += accountData.available;
    }

    // Process Invoices (columns 5-7)
    if (row[5] && !row[5].includes('Invoices') && row[6] && row[7]) {
      const amount = parseFloat((row[6] || '0').replace(/[$,]/g, '')) || 0;
      if (amount > 0) {
        data.invoices.push({
          network: row[5],
          amount,
          dueDate: row[7]
        });
      }
    }

    // Process Payroll (handle payroll entries)
    if (row[13] === 'Payroll') {
      const biWeeklyAmount = parseFloat((row[14] || '0').replace(/[$,]/g, '')) || 0;
      const fifteenthAmount = parseFloat((row[15] || '0').replace(/[$,]/g, '')) || 0;
      const thirtiethAmount = parseFloat((row[16] || '0').replace(/[$,]/g, '')) || 0;

      if (biWeeklyAmount > 0) {
        data.payroll.push({
          description: 'Bi-weekly Payroll',
          amount: biWeeklyAmount,
          dueDate: '15' // Assuming bi-weekly is on the 15th
        });
      }
      if (fifteenthAmount > 0) {
        data.payroll.push({
          description: '15th Payroll',
          amount: fifteenthAmount,
          dueDate: '15'
        });
      }
      if (thirtiethAmount > 0) {
        data.payroll.push({
          description: '30th Payroll',
          amount: thirtiethAmount,
          dueDate: '30'
        });
      }
    }
  });

  // Calculate projections
  data.projections.totalAvailableFunds = 
    data.financialResources.totalCash + data.financialResources.totalCreditAvailable;
  
  return data;
};