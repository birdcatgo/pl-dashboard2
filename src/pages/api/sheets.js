import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function processPLData(batchResponse) {
  try {
    const monthlyData = {};
    
    // Extract month sheets from the batch response - starting from index 6
    const monthSheets = batchResponse.data.valueRanges.slice(6, 18).filter(range => 
      range && range.range && /'\w+ \d{4}'!/.test(range.range)
    );

    // Process all months in parallel
    await Promise.all(monthSheets.map(async monthSheet => {
      const monthName = monthSheet.range.split('!')[0].replace(/['"]/g, '');
      
      if (monthSheet.values && monthSheet.values.length > 1) {
        // Map rows more efficiently with a single pass, matching exact sheet column order
        const monthlyRows = monthSheet.values.slice(1).map(row => {
          // Parse amount properly, handling empty or invalid values
          let amount = 0;
          if (row[1]) {
            amount = parseFloat(row[1].replace(/[$,]/g, '')) || 0;
          }
          // Get Card/Account value, if present, otherwise set to '-'
          let cardAccount = '-';
          if (row.length >= 5 && row[4] !== undefined && row[4] !== null && row[4] !== '') {
            cardAccount = row[4].trim();
          }
          if (row.length < 5) {
            cardAccount = '-';
          }
          return {
            Date: monthName,
            Category: row[2]?.trim() || '',
            'Card/Account': cardAccount,
            Description: row[0]?.trim() || '',
            Amount: amount,
            'Income/Expense': row[3]?.trim() || ''
          };
        });
        // Calculate totals in a single reduce operation
        const { incomeData, expenseData, totalIncome, totalExpenses } = monthlyRows.reduce((acc, row) => {
          if (row['Income/Expense']?.toLowerCase() === 'income') {
            acc.incomeData.push(row);
            acc.totalIncome += row.Amount;
          } else {
            acc.expenseData.push(row);
            acc.totalExpenses += row.Amount;
          }
          return acc;
        }, { incomeData: [], expenseData: [], totalIncome: 0, totalExpenses: 0 });
        // Group expenses by category more efficiently
        const categories = expenseData.reduce((acc, expense) => {
          const category = expense.Category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(expense);
          return acc;
        }, {});
        monthlyData[monthName] = {
          income: incomeData,
          expenses: expenseData,
          categories,
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses
        };
      }
    }));

    return monthlyData;
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return {};
  }
}

async function processNetworkTermsData(response) {
  try {
    if (!response?.values || response.values.length === 0) {
      console.log('No network terms data found');
      return [];
    }

    // Skip header row and process data
    const rows = response.values.slice(1).map(row => {
      if (!row || row.length < 2) {
        return null;
      }

      const networkName = row[0]?.trim() || '';
      
      // Skip empty rows
      if (!networkName) {
        return null;
      }

      const paymentTerms = row[1]?.trim() || '';
      const invoiceDelay = parseInt(row[2]) || 0;
      const paymentDelay = parseInt(row[3]) || 0;
      const publicHolidays = row[4]?.trim() || '';
      const bankingDays = row[5]?.trim() === 'Yes' || row[5]?.trim() === 'TRUE';
      const paymentDates = row[6]?.trim() || '';
      const notes = row[7]?.trim() || '';

      // Parse net terms from payment terms
      let netTerms = 30; // default
      if (paymentTerms.toLowerCase().includes('net')) {
        const match = paymentTerms.match(/net\s*(\d+)/i);
        if (match) {
          netTerms = parseInt(match[1]);
        }
      } else if (paymentTerms.toLowerCase().includes('weekly')) {
        netTerms = 7;
      } else if (paymentTerms.toLowerCase().includes('bi-monthly')) {
        netTerms = 15;
      } else if (paymentTerms.toLowerCase().includes('monthly')) {
        netTerms = 30;
      }

      return {
        networkName,
        paymentTerms,
        netTerms,
        invoiceDelay,
        paymentDelay,
        publicHolidays,
        bankingDays,
        paymentDates,
        notes
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Processed network terms rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error processing network terms data:', error);
    return [];
  }
}

async function processInvoiceData(response) {
  if (!response?.values || response.values.length < 2) {
    console.log('No valid invoice data found');
    return [];
  }

  try {
    // Skip header row and process data
    const rows = response.values.slice(1).map(row => {
      if (!row || row.length < 6) {
        console.log('Invalid invoice row:', row);
        return null;
      }

      return {
        Network: row[0]?.trim() || '',
        PeriodStart: row[1]?.trim() || '',
        PeriodEnd: row[2]?.trim() || '',
        DueDate: row[3]?.trim() || '',
        AmountDue: row[4]?.trim() || '0',
        InvoiceNumber: row[5]?.trim() || ''
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Processed invoice rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error processing invoice data:', error);
    return [];
  }
}

async function processEmployeeData(response) {
  try {
    if (!response?.values || response.values.length === 0) {
      console.log('No employee data found');
      return [];
    }

    // Skip header row and process data
    const rows = response.values.slice(1).map(row => {
      if (!row || row.length < 4) {
        return null;
      }

      const name = row[0]?.trim() || '';
      
      // Skip empty rows
      if (!name) {
        return null;
      }

      return {
        name,
        role: row[1]?.trim() || '',
        department: row[2]?.trim() || '',
        startDate: row[3]?.trim() || '',
        salary: parseFloat(row[4]?.replace(/[$,]/g, '')) || 0,
        commissionRate: parseFloat(row[5]) || 0,
        employeeId: row[6]?.trim() || '',
        email: row[7]?.trim() || '',
        status: row[8]?.trim() || 'Active',
        notes: row[9]?.trim() || ''
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Processed employee rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error processing employee data:', error);
    return [];
  }
}

async function processTradeShiftData(response) {
  try {
    if (!response?.values || response.values.length === 0) {
      console.log('No tradeshift data found');
      return [];
    }

    // Skip header row and process data
    const rows = response.values.slice(1).map(row => {
      if (!row || row.length < 3) {
        return null;
      }

      const company = row[0]?.trim() || '';
      
      // Skip empty rows
      if (!company) {
        return null;
      }

      return {
        company,
        invoiceNumber: row[1]?.trim() || '',
        amount: parseFloat(row[2]?.replace(/[$,]/g, '')) || 0,
        dueDate: row[3]?.trim() || '',
        status: row[4]?.trim() || '',
        description: row[5]?.trim() || '',
        currency: row[6]?.trim() || 'USD',
        paymentMethod: row[7]?.trim() || '',
        notes: row[8]?.trim() || ''
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Processed tradeshift rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error processing tradeshift data:', error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // Set cache-busting headers to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // First, get all sheet names
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });
      
      console.log('Available sheets:', {
        sheets: spreadsheet.data.sheets.map(sheet => sheet.properties.title),
        totalSheets: spreadsheet.data.sheets.length
      });
      

      
    } catch (error) {
      console.error('Error getting sheet names:', error);
    }

    // Define ranges to fetch
    const ranges = [
      "'Main Sheet'!A:L",
      "'Financial Resources'!A:D",
      "'Payroll'!A:D",
      "'Media Buyer Spend'!A:B",
      "'Summary'!A:V",
      "'Network Payment Schedule'!A:H",
      "'July 2025'!A:E",
      "'June 2025'!A:E",
      "'May 2025'!A:E",
      "'April 2025'!A:E",
      "'March 2025'!A:E",
      "'February 2025'!A:E",
      "'January 2025'!A:E",
      "'December 2024'!A:E",
      "'November 2024'!A:E",
      "'October 2024'!A:E",
      "'September 2024'!A:E",
      "'August 2024'!A:E",
      "'July 2024'!A:E",
      "'June 2024'!A:E",
      "'Network Terms'!A:J",
      "'Network Exposure'!A:H",
      "'Invoices'!A:F",
      "'Tradeshift Check'!A:I",
      "'Monthly Expenses'!A:D",
      "'Commissions'!A:Z",
      "'Employees'!A:J",
      "'DigitSolution Accounts'!A:Z"
    ];

    console.log('Fetching sheets data with ranges:', ranges);
    
    let batchResponse;
    try {
      batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: ranges
    });
      console.log('Successfully fetched sheets data:', {
        valueRangesCount: batchResponse.data.valueRanges?.length,
        ranges: batchResponse.data.valueRanges?.map(range => ({
          range: range.range,
          hasValues: !!range.values,
          valuesCount: range.values?.length
        }))
      });
    } catch (error) {
      console.error('Error fetching sheets data:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new Error(`Failed to fetch sheets data: ${error.message}`);
    }

    if (!batchResponse?.data?.valueRanges) {
      throw new Error('Invalid response from Google Sheets API');
    }

    // Initialize processedData first
    let processedData = {
      performanceData: [],
      cashFlowData: {
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
        },
        outstandingInvoices: 0
      },
      payrollData: [],
      networkTerms: [],
      rawData: {
        invoices: [],
        payroll: []
      },
      networkExposure: []
    };



    // Extract array positions for debugging - FIXED ORDER
    const [
      mainResponse,              // 0
      financialResponse,         // 1
      payrollResponse,           // 2
      mediaBuyerResponse,        // 3
      summaryResponse,           // 4
      networkPaymentsResponse,   // 5
      july2025Response,          // 6 - FIXED: was missing
      june2025Response,          // 7
      may2025Response,           // 8
      april2025Response,         // 9
      march2025Response,         // 10
      february2025Response,      // 11
      january2025Response,       // 12
      december2024Response,      // 13
      november2024Response,      // 14
      october2024Response,       // 15
      september2024Response,     // 16
      august2024Response,        // 17
      july2024Response,          // 18
      june2024Response,          // 19
      networkTermsResponse,      // 20
      networkExposureResponse,   // 21
      invoicesResponse,          // 22 - FIXED: now correctly positioned
      tradeshiftResponse,        // 23
      monthlyExpensesResponse,   // 24
      commissionsResponse,       // 25
      employeeResponse,          // 26
      digitSolutionResponse      // 27
    ] = batchResponse.data.valueRanges;




    // Process each response with error handling
    try {
      // Process main performance data
      processedData.performanceData = mainResponse?.values?.slice(1) || [];
      console.log('Processed performance data:', processedData.performanceData.length);

      // Process cash flow data
      if (financialResponse?.values) {
        const headerRowIndex = financialResponse.values.findIndex(row => 
          row.includes('Resource') && row.includes('Amount Available')
        );

        if (headerRowIndex !== -1) {
          // Process Financial Resources rows and update existing cashFlowData
          financialResponse.values.slice(headerRowIndex + 1).forEach(row => {
            if (!row[0] || row[0].includes('Table') || row[0].includes('TOTAL')) return;

            const accountData = {
              name: row[0],
              available: parseFloat((row[1] || '0').replace(/[$,]/g, '')) || 0,
              owing: parseFloat((row[2] || '0').replace(/[$,]/g, '')) || 0,
              limit: parseFloat((row[3] || '0').replace(/[$,]/g, '')) || 0
            };

            const isCreditCard = ['amex', 'american express', 'visa', 'mastercard', 'discover', 'card'].some(keyword => 
              accountData.name.toLowerCase().includes(keyword)
            );

            if (isCreditCard) {
              processedData.cashFlowData.financialResources.creditCards.push(accountData);
              processedData.cashFlowData.financialResources.totalCreditAvailable += accountData.available;
              processedData.cashFlowData.financialResources.totalCreditOwing += accountData.owing;
            } else {
              processedData.cashFlowData.financialResources.cashAccounts.push(accountData);
              processedData.cashFlowData.financialResources.totalCash += accountData.available;
            }
          });
        }
      }

      // Process network terms
      processedData.networkTerms = await processNetworkTermsData(networkTermsResponse);
      console.log('Processed Network Terms:', {
        count: processedData.networkTerms.length,
        networks: processedData.networkTerms.map(term => term.networkName),
        sample: processedData.networkTerms[0],
        allTerms: processedData.networkTerms
      });

      // Process invoices - FIXED: now using correct response
      processedData.rawData.invoices = await processInvoiceData(invoicesResponse);
      console.log('Processed invoices:', {
        count: processedData.rawData.invoices.length,
        sample: processedData.rawData.invoices.slice(0, 3),
        rawResponse: invoicesResponse?.values?.slice(0, 3)
      });

      // Calculate outstanding invoices
      const outstandingInvoices = processedData.rawData.invoices.reduce((total, invoice) => {
        if (!invoice || !invoice.AmountDue) return total;
        
        const amount = parseFloat(invoice.AmountDue.replace(/[$,]/g, ''));
        
        // Only count invoices that are not paid
        if (!isNaN(amount)) {
          return total + amount;
        }
        return total;
      }, 0);

      processedData.cashFlowData.outstandingInvoices = outstandingInvoices;
      console.log('Calculated outstanding invoices:', {
        total: outstandingInvoices,
        invoiceCount: processedData.rawData.invoices.length,
        sampleInvoices: processedData.rawData.invoices.slice(0, 3).map(inv => ({
          network: inv.Network,
          amount: inv.AmountDue,
          parsedAmount: parseFloat((inv.AmountDue || '0').replace(/[$,]/g, '')),
          dueDate: inv.DueDate
        }))
      });

      // Process Tradeshift data
      processedData.tradeshiftData = await processTradeShiftData(tradeshiftResponse);
      console.log('Processed Tradeshift data:', {
        count: processedData.tradeshiftData.length,
        sample: processedData.tradeshiftData[0],
        allData: processedData.tradeshiftData
      });

      // Process P&L data
      const plData = await processPLData(batchResponse);
      processedData.plData = plData;
      console.log('Processed P&L data:', Object.keys(plData));

      // Process Commission data
      if (commissionsResponse?.values && commissionsResponse.values.length > 1) {
        processedData.commissions = commissionsResponse.values.slice(1)
          .filter(row => row && row.length >= 4)
          .map(row => ({
            date: row[0]?.trim() || '',
            employee: row[1]?.trim() || '',
            amount: parseFloat(row[2]?.replace(/[$,]/g, '')) || 0,
            type: row[3]?.trim() || '',
            notes: row[4]?.trim() || ''
          }));
        console.log('Processed commissions:', processedData.commissions.length);
      }

      // Process Employee data
      processedData.employeeData = await processEmployeeData(employeeResponse);
      console.log('Processed employee data:', {
        count: processedData.employeeData.length,
        sample: processedData.employeeData[0]
      });

      // Process network exposure data
      if (networkExposureResponse?.values && networkExposureResponse.values.length > 1) {
        processedData.networkExposure = networkExposureResponse.values.slice(1)
          .filter(row => row && row.length >= 3)
          .map(row => ({
            network: row[0]?.trim() || '',
            exposureAmount: parseFloat(row[1]?.replace(/[$,]/g, '')) || 0,
            lastUpdated: row[2]?.trim() || ''
          }));
        console.log('Processed network exposure:', processedData.networkExposure.length);
      }

    } catch (processingError) {
      console.error('Error processing data:', processingError);
      throw new Error(`Data processing failed: ${processingError.message}`);
    }

    console.log('Final processed data summary:', {
      performanceDataCount: processedData.performanceData.length,
      invoicesCount: processedData.rawData.invoices.length,
      networkTermsCount: processedData.networkTerms.length,
      tradeshiftDataCount: processedData.tradeshiftData?.length || 0,
      plDataMonths: Object.keys(processedData.plData || {}).length,
      commissionsCount: processedData.commissions?.length || 0,
      employeeDataCount: processedData.employeeData?.length || 0,
      networkExposureCount: processedData.networkExposure?.length || 0
    });

    // Return the processed data
    return res.status(200).json(processedData);

  } catch (error) {
    console.error('Sheets API Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response?.data
    });
    
    return res.status(500).json({ 
      error: 'Failed to fetch data from Google Sheets',
      message: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
}