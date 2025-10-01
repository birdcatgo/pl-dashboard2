import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function processPLData(batchResponse) {
  try {
    const monthlyData = {};
    
    // Extract month sheets from the batch response dynamically
    // Base ranges: 0-5 are Main Sheet, Financial Resources, Payroll, Media Buyer Spend, Summary, Network Payment Schedule
    // Starting from index 6 until we hit non-month sheets
    const monthPattern = /^'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}'!/;
    const monthSheets = batchResponse.data.valueRanges.filter(range => 
      range && range.range && monthPattern.test(range.range)
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
        Amount: row[4]?.trim() || '0',  // Changed from AmountDue to Amount for consistency
        AmountDue: row[4]?.trim() || '0',  // Keep both for backward compatibility
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

    console.log('Raw employee response:', {
      hasValues: !!response?.values,
      valuesLength: response?.values?.length || 0,
      headers: response?.values?.[0],
      firstDataRow: response?.values?.[1],
      sampleRows: response?.values?.slice(1, 4)
    });

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

      // Correct field mapping based on actual data structure (9 columns)
      const commissionRateStr = row[3]?.trim() || '0%';
      const commissionRate = parseFloat(commissionRateStr.replace('%', '')) / 100 || 0;
      
      return {
        name,                                    // Column A: Name
        basePay: row[1]?.trim() || '0',         // Column B: Salary/Base Pay
        frequency: row[2]?.trim() || 'Monthly', // Column C: Payment Frequency  
        commissionRate: commissionRate,         // Column D: Commission Rate (convert % to decimal)
        role: row[4]?.trim() || '',             // Column E: Employment Type (Employee/Contractor)
        email: row[5]?.trim() || '',            // Column F: Email
        employeeId: row[6]?.trim() || '',       // Column G: Additional Field 1
        department: row[7]?.trim() || '',       // Column H: Additional Field 2  
        status: row[8]?.trim() || 'ACTIVE',     // Column I: Status (ACTIVE/INACTIVE)
        startDate: '',                          // Not in current data structure
        notes: ''                               // Not in current data structure
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
    let availableSheets = [];
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });
      
      availableSheets = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
      
      console.log('Available sheets:', {
        sheets: availableSheets,
        totalSheets: spreadsheet.data.sheets.length
      });
      
      // We'll use the Financial Resources sheet for specific cell data
      console.log('Will fetch specific cells from Financial Resources sheet');
      
    } catch (error) {
      console.error('Error getting sheet names:', error);
    }

    // Dynamic month detection - get all month sheets from the spreadsheet
    let monthSheets = [];
    if (availableSheets && availableSheets.length > 0) {
      // Match month patterns: "Month Year" (e.g., "August 2025", "July 2024")
      const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/;
      monthSheets = availableSheets
        .filter(name => monthPattern.test(name))
        .map(name => `'${name}'!A:E`);
      
      console.log('Detected month sheets:', monthSheets);
    }

    // Define base ranges to fetch
    const baseRanges = [
      "'Main Sheet'!A:L",
      "'Financial Resources'!A:D",
      "'Payroll'!A:D",
      "'Media Buyer Spend'!A:B",
      "'Summary'!A:V",
      "'Network Payment Schedule'!A:H",
      // Dynamic month sheets will be added below
      ...monthSheets,
      "'Network Terms'!A:J",
      "'Network Exposure'!A:H",
      "'Invoices'!A:F",
      "'Tradeshift Check'!A:I",
      "'Monthly Expenses'!A:D",
      "'Commissions'!A:ZZ",
      "'Employees'!A:J",
      "'DigitSolution Accounts'!A:Z"
    ];

    // Add Financial Resources specific cell ranges for CreditLine calculations
    const ranges = [...baseRanges];
        ranges.push("'Financial Resources'!B4:B4");   // Cash Available part 1
    ranges.push("'Financial Resources'!B6:B6");   // Cash Available part 2
    ranges.push("'Financial Resources'!B7:B24");  // Credit Available
    ranges.push("'Financial Resources'!C7:C24");  // Total Owing (Credit Card Debt)
    ranges.push("'Financial Resources'!D7:D24");  // Total Credit Limit
    ranges.push("'Financial Resources'!A4:D6");   // Cash Accounts (rows 4:6)
    
    console.log('Added Financial Resources cell ranges for CreditLine calculations (B4, B6, B7:B24, C7:C24)');

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



    // Dynamic destructuring based on actual ranges order
    const responses = batchResponse.data.valueRanges;
    
    // Base responses (indices 0-5)
    const mainResponse = responses[0];
    const financialResponse = responses[1];
    const payrollResponse = responses[2];
    const mediaBuyerResponse = responses[3];
    const summaryResponse = responses[4];
    const networkPaymentsResponse = responses[5];
    
    // Dynamic month responses (indices 6 to 6+monthSheets.length-1)
    const monthResponses = responses.slice(6, 6 + monthSheets.length);
    
    // Calculate starting index for remaining responses
    const remainingStartIndex = 6 + monthSheets.length;
    
    // Remaining responses
    const networkTermsResponse = responses[remainingStartIndex];
    const networkExposureResponse = responses[remainingStartIndex + 1];
    const invoicesResponse = responses[remainingStartIndex + 2];
    const tradeshiftResponse = responses[remainingStartIndex + 3];
    const monthlyExpensesResponse = responses[remainingStartIndex + 4];
    const commissionsResponse = responses[remainingStartIndex + 5];
    const employeeResponse = responses[remainingStartIndex + 6];
    const digitSolutionResponse = responses[remainingStartIndex + 7];
    
    console.log('Dynamic response mapping:', {
      totalResponses: responses.length,
      monthSheetsCount: monthSheets.length,
      remainingStartIndex,
      commissionsIndex: remainingStartIndex + 5,
      commissionsResponseExists: !!commissionsResponse,
      commissionsRange: `'Commissions'!A:ZZ`,
      commissionsHasValues: !!commissionsResponse?.values,
      commissionsValuesLength: commissionsResponse?.values?.length
    });




    // Process each response with error handling
    try {
      // Process main performance data
      processedData.performanceData = mainResponse?.values?.slice(1) || [];
      console.log('Processed performance data:', processedData.performanceData.length);

      // Process cash flow data
      if (financialResponse?.values) {
        console.log('Financial response values:', {
          totalRows: financialResponse.values.length,
          firstFewRows: financialResponse.values.slice(0, 5),
          headers: financialResponse.values[0]
        });
        
        // Try multiple possible header formats
        let headerRowIndex = financialResponse.values.findIndex(row => 
          row.includes('Resource') && row.includes('Amount Available')
        );
        
        // If not found, try alternative headers
        if (headerRowIndex === -1) {
          headerRowIndex = financialResponse.values.findIndex(row => 
            row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('resource'))
          );
        }
        
        // If still not found, try looking for any row with financial data
        if (headerRowIndex === -1) {
          headerRowIndex = financialResponse.values.findIndex(row => 
            row.length >= 4 && 
            row[0] && 
            !row[0].toString().toLowerCase().includes('table') &&
            !row[0].toString().toLowerCase().includes('total') &&
            !isNaN(parseFloat(row[1]?.toString().replace(/[$,]/g, '')))
          );
          if (headerRowIndex !== -1) {
            console.log('Found data row instead of header, using as starting point');
          }
        }

        console.log('Header row search result:', {
          headerRowIndex,
          foundHeaders: headerRowIndex !== -1 ? financialResponse.values[headerRowIndex] : 'Not found'
        });

        if (headerRowIndex !== -1) {
          console.log('=== FINANCIAL RESOURCES ROW PROCESSING DEBUG ===');
          console.log('Header found at row:', headerRowIndex);
          console.log('Total rows in sheet:', financialResponse.values.length);
          console.log('Processing rows from', headerRowIndex + 1, 'to', financialResponse.values.length - 1);
          
          // Process Financial Resources rows and update existing cashFlowData
          financialResponse.values.slice(headerRowIndex + 1).forEach((row, index) => {
            const actualRowNumber = headerRowIndex + 1 + index;
            console.log(`Processing row ${actualRowNumber}:`, row);
            
            // Check if this is row 7 (or close to it)
            if (actualRowNumber >= 6 && actualRowNumber <= 8) {
              console.log(`*** ROW ${actualRowNumber} (near row 7) ***:`, {
                rowData: row,
                hasFirstColumn: !!row[0],
                firstColumnValue: row[0],
                includesTable: row[0] ? row[0].toString().includes('Table') : false,
                includesTotal: row[0] ? row[0].toString().includes('TOTAL') : false,
                willBeSkipped: !row[0] || row[0].toString().includes('Table') || row[0].toString().includes('TOTAL')
              });
            }
            
            if (!row[0] || row[0].toString().includes('Table') || row[0].toString().includes('TOTAL')) {
              console.log(`Skipping row ${actualRowNumber}:`, row[0]);
              return;
            }

            const accountData = {
              account: row[0],
              available: parseFloat((row[1] || '0').toString().replace(/[$,]/g, '')) || 0,
              owing: parseFloat((row[2] || '0').toString().replace(/[$,]/g, '')) || 0,
              limit: parseFloat((row[3] || '0').toString().replace(/[$,]/g, '')) || 0
            };

            const accountName = accountData.account.toString().toLowerCase();
            
            // First check if it's explicitly a cash account
            const isCashAccount = [
              'cash in bank', 'slash account', 'business savings', 'savings', 'checking'
            ].some(keyword => accountName.includes(keyword));
            
            // If it's not a cash account, check if it's a credit card
            const isCreditCard = !isCashAccount && (
              [
                'amex', 'american express', 'visa', 'mastercard', 'discover', 'card',
                'chase c/c', 'capital one', 'bank of america', 'us bank', 'citi', 'wells fargo'
              ].some(keyword => accountName.includes(keyword)) ||
              // Also check if it has a limit (credit cards typically have limits)
              accountData.limit > 0
            );

            let classification;
            if (isCashAccount) {
              classification = 'CASH_ACCOUNT';
              processedData.cashFlowData.financialResources.cashAccounts.push({ ...accountData, type: 'cashAccount' });
            } else if (isCreditCard) {
              classification = 'CREDIT_CARD';
              processedData.cashFlowData.financialResources.creditCards.push({ ...accountData, type: 'creditCard' });
            } else {
              classification = 'UNKNOWN';
              // Default to cash account for unknown types
              processedData.cashFlowData.financialResources.cashAccounts.push({ ...accountData, type: 'cashAccount' });
            }

            console.log('Processing account:', {
              account: accountData.account,
              available: accountData.available,
              owing: accountData.owing,
              limit: accountData.limit,
              isCashAccount,
              isCreditCard,
              classified_as: classification
            });
            
            // Special logging for AMEX 1276
            if (accountData.account && accountData.account.toString().includes('1276')) {
              console.log('*** FOUND AMEX 1276 ***', {
                fullAccount: accountData.account,
                classification: classification,
                data: accountData
              });
            }
          });
          
          console.log('Processed financial resources:', {
            cashAccounts: processedData.cashFlowData.financialResources.cashAccounts.length,
            creditCards: processedData.cashFlowData.financialResources.creditCards.length,
            totalProcessed: processedData.cashFlowData.financialResources.cashAccounts.length + processedData.cashFlowData.financialResources.creditCards.length,
            allCreditCardNames: processedData.cashFlowData.financialResources.creditCards.map(card => card.account),
            sampleCash: processedData.cashFlowData.financialResources.cashAccounts[0],
            sampleCredit: processedData.cashFlowData.financialResources.creditCards[0]
          });
          console.log('=== END FINANCIAL RESOURCES ROW PROCESSING DEBUG ===');
          
          // Calculate totals
          processedData.cashFlowData.financialResources.totalCash = processedData.cashFlowData.financialResources.cashAccounts.reduce((total, account) => {
            return total + (parseFloat(account.available) || 0);
          }, 0);
          
          processedData.cashFlowData.financialResources.totalCreditAvailable = processedData.cashFlowData.financialResources.creditCards.reduce((total, account) => {
            return total + (parseFloat(account.available) || 0);
          }, 0);
          
          processedData.cashFlowData.financialResources.totalCreditOwing = processedData.cashFlowData.financialResources.creditCards.reduce((total, account) => {
            return total + (parseFloat(account.owing) || 0);
          }, 0);
          
          console.log('Calculated totals:', {
            totalCash: processedData.cashFlowData.financialResources.totalCash,
            totalCreditAvailable: processedData.cashFlowData.financialResources.totalCreditAvailable,
            totalCreditOwing: processedData.cashFlowData.financialResources.totalCreditOwing
          });
        } else {
          console.log('No financial resources header found. Available columns:', financialResponse.values[0]);
        }
      } else {
        console.log('No financial response values found');
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

      // Process payroll data for upcoming expenses
      if (payrollResponse?.values && payrollResponse.values.length > 1) {
        processedData.rawData.payroll = payrollResponse.values.slice(1)
          .filter(row => row && row.length >= 4)
          .map(row => ({
            Category: row[0]?.trim() || '',
            Description: row[1]?.trim() || '',
            Amount: row[2]?.trim() || '0',
            Date: row[3]?.trim() || ''
          }));
        console.log('Processed payroll data:', {
          count: processedData.rawData.payroll.length,
          sample: processedData.rawData.payroll.slice(0, 3)
        });
      }

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

      // Process P&L data using dynamic month responses
      const plData = await processPLData({ data: { valueRanges: monthResponses } });
      processedData.plData = plData;
      console.log('Processed P&L data:', Object.keys(plData));

      // Process Commission data
      if (commissionsResponse?.values && commissionsResponse.values.length > 1) {
        const headers = commissionsResponse.values[0];
        const dataRows = commissionsResponse.values.slice(1);
        
        console.log('Raw commissions data:', {
          headers: headers,
          firstDataRow: dataRows[0],
          totalRows: dataRows.length,
          sampleRows: dataRows.slice(0, 3),
          totalColumns: headers.length,
          monthColumns: headers.slice(4).filter(h => h && h.includes('202')), // Show month-related columns
          allHeadersFromE: headers.slice(4) // Show all columns from E onwards
        });
        
        processedData.commissions = dataRows
          .filter(row => row && row.length >= 4)
          .map(row => {
            const mediaBuyerName = row[0]?.trim() || '';
            const commissionRateStr = row[1]?.trim() || '10%';
            const commissionRate = parseFloat(commissionRateStr.replace('%', '')) / 100 || 0.10;
            
            const commission = {
              mediaBuyer: mediaBuyerName,
              commissionRate: commissionRate,           // Column B: Commission Rate (convert % to decimal)
              status: row[2]?.trim() || 'ACTIVE',       // Column C: Status
              Confirmed: row[3]?.trim() || 'NO'         // Column D: Confirmed
            };
            
            // Process all remaining columns (E onwards) as month data
            // Each month typically has 2 columns: revenue and commission
            for (let i = 4; i < headers.length; i++) {
              const headerText = headers[i]?.trim() || '';
              const cellValue = row[i] || '';
              
              if (headerText) {
                // Store the value with the exact header name, even if empty
                // This ensures we capture all month columns structure
                commission[headerText] = cellValue;
              }
            }
            
            return commission;
          })
          .filter(commission => commission.mediaBuyer); // Only include rows with media buyer names
        
        console.log('Processed commissions:', {
          count: processedData.commissions.length,
          sample: processedData.commissions[0],
          sampleKeys: processedData.commissions[0] ? Object.keys(processedData.commissions[0]) : [],
          monthColumns: headers.slice(4),
          detectedMonthData: processedData.commissions[0] ? 
            Object.keys(processedData.commissions[0]).filter(key => 
              key.includes('202') // Filter for year-containing columns
            ) : []
        });
      } else {
        processedData.commissions = [];
        console.log('No commissions data found or insufficient columns');
        console.log('Commissions response:', {
          hasValues: !!commissionsResponse?.values,
          valuesLength: commissionsResponse?.values?.length || 0,
          firstRow: commissionsResponse?.values?.[0]
        });
      }

      // Process Employee data
      console.log('Raw employee response:', {
        hasValues: !!employeeResponse?.values,
        valuesLength: employeeResponse?.values?.length || 0,
        headers: employeeResponse?.values?.[0],
        firstDataRow: employeeResponse?.values?.[1],
        sampleRows: employeeResponse?.values?.slice(1, 4)
      });
      
      processedData.employeeData = await processEmployeeData(employeeResponse);
      console.log('Processed employee data:', {
        count: processedData.employeeData.length,
        sample: processedData.employeeData[0],
        allEmployees: processedData.employeeData
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

      // Process Summary sheet data
      if (summaryResponse?.values && summaryResponse.values.length > 1) {
        const headers = summaryResponse.values[0];
        const dataRows = summaryResponse.values.slice(1);
        
        console.log('Raw summary data:', {
          headers: headers,
          totalRows: dataRows.length,
          sampleRows: dataRows.slice(0, 3),
          totalColumns: headers.length
        });
        
        processedData.summaryData = dataRows
          .filter(row => row && row.length >= 2 && row[0]?.trim()) // Filter out empty rows
          .map((row, index) => {
            const summaryRow = {
              Month: row[0]?.trim() || '',
              rowIndex: index + 2 // +2 because we skip header (row 1) and array is 0-indexed
            };
            
            // Process all remaining columns dynamically
            for (let i = 1; i < headers.length && i < row.length; i++) {
              const headerText = headers[i]?.trim() || '';
              const cellValue = row[i] || '';
              
              if (headerText) {
                // Parse numeric values, keep text as-is
                let processedValue = cellValue;
                if (typeof cellValue === 'string' && cellValue.match(/^[\d,.$%-]+$/)) {
                  processedValue = parseFloat(cellValue.replace(/[$,%]/g, '')) || 0;
                }
                summaryRow[headerText] = processedValue;
              }
            }
            
            return summaryRow;
          });
        
        console.log('Processed summary data:', {
          count: processedData.summaryData.length,
          sample: processedData.summaryData[0],
          sampleKeys: processedData.summaryData[0] ? Object.keys(processedData.summaryData[0]) : [],
          september2025Row: processedData.summaryData.find(row => 
            row.Month && row.Month.toLowerCase().includes('september') && row.Month.includes('2025')
          )
        });
      } else {
        processedData.summaryData = [];
        console.log('No summary data found or insufficient columns');
      }

    } catch (processingError) {
      console.error('Error processing data:', processingError);
      throw new Error(`Data processing failed: ${processingError.message}`);
    }

    // Process Financial Resources specific cells for CreditLine calculations
    try {
      // Get the Financial Resources cell ranges (last six ranges)
      const b4Range = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 6]; // B4
      const b6Range = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 5]; // B6
      const b7b24Range = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 4]; // B7:B24
      const c7c24Range = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 3]; // C7:C24
      const d7d24Range = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 2]; // D7:D24
      const cashAccountsRange = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 1]; // A4:D6
      
      console.log('Processing Financial Resources specific cells:', {
        b4Range: b4Range?.range,
        b4Values: b4Range?.values,
        b6Range: b6Range?.range,
        b6Values: b6Range?.values,
        b7b24Range: b7b24Range?.range,
        b7b24Values: b7b24Range?.values,
        c7c24Range: c7c24Range?.range,
        c7c24Values: c7c24Range?.values,
        d7d24Range: d7d24Range?.range,
        d7d24Values: d7d24Range?.values,
        cashAccountsRange: cashAccountsRange?.range,
        cashAccountsValues: cashAccountsRange?.values
      });
      
      // Extract Cash Available from B4 + B6
      let b4Value = 0;
      if (b4Range?.values?.[0]?.[0]) {
        b4Value = parseFloat(String(b4Range.values[0][0]).replace(/[$,]/g, '')) || 0;
      }
      
      let b6Value = 0;
      if (b6Range?.values?.[0]?.[0]) {
        b6Value = parseFloat(String(b6Range.values[0][0]).replace(/[$,]/g, '')) || 0;
      }
      
      const cashAvailable = b4Value + b6Value;
      
      // Extract Credit Available from B7:B24 (sum of all values)
      let creditAvailable = 0;
      if (b7b24Range?.values) {
        creditAvailable = b7b24Range.values.reduce((total, row) => {
          if (row[0]) {
            const amount = parseFloat(String(row[0]).replace(/[$,]/g, '')) || 0;
            return total + amount;
          }
          return total;
        }, 0);
      }
      
      // Extract Total Owing from C7:C24 (sum of all values)
      let totalOwing = 0;
      if (c7c24Range?.values) {
        totalOwing = c7c24Range.values.reduce((total, row) => {
          if (row[0]) {
            const amount = parseFloat(String(row[0]).replace(/[$,]/g, '')) || 0;
            return total + amount;
          }
          return total;
        }, 0);
      }
      
      // Extract Total Credit Limit from D7:D24 (sum of all values)
      let totalCreditLimit = 0;
      if (d7d24Range?.values) {
        totalCreditLimit = d7d24Range.values.reduce((total, row) => {
          if (row[0]) {
            const amount = parseFloat(String(row[0]).replace(/[$,]/g, '')) || 0;
            return total + amount;
          }
          return total;
        }, 0);
      }
      
      // Process Cash Accounts from A4:D6
      let cashAccounts = [];
      if (cashAccountsRange?.values) {
        cashAccounts = cashAccountsRange.values.map((row, index) => {
          const account = row[0] || '';
          const available = parseFloat(String(row[1] || '0').replace(/[$,]/g, '')) || 0;
          const owing = parseFloat(String(row[2] || '0').replace(/[$,]/g, '')) || 0;
          const limit = parseFloat(String(row[3] || '0').replace(/[$,]/g, '')) || 0;
          
          return {
            account: account.trim(),
            available: available,
            owing: owing,
            limit: limit,
            type: 'cashAccount',
            rowNumber: index + 4 // Rows 4, 5, 6
          };
        }).filter(account => account.account); // Filter out empty rows
      }
      
      // Add these direct values to the cash flow data
      processedData.cashFlowData.directCells = {
        cashInBank: b4Value,           // Legacy for NetProfit (Forecasting View)
        creditCardDebt: totalOwing,    // Legacy for NetProfit (Forecasting View)
        cashAvailable: cashAvailable,  // B4 + B6
        creditAvailable: creditAvailable, // Sum of B7:B24
        totalOwing: totalOwing,        // Sum of C7:C24
        totalCreditLimit: totalCreditLimit, // Sum of D7:D24
        cashAccounts: cashAccounts     // Individual cash accounts from A4:D6
      };
      
                console.log('Direct cell values from Financial Resources sheet:', {
            b4Value,
            b6Value,
            cashAvailable,
            creditAvailable,
            totalOwing,
            totalCreditLimit,
            cashAccountsCount: cashAccounts.length,
            cashAccountsData: cashAccounts,
            legacy_cashInBank: b4Value,
            legacy_creditCardDebt: totalOwing
          });
      
    } catch (error) {
      console.error('Error processing Financial Resources specific cells:', error);
      // Set defaults if there's an error
      processedData.cashFlowData.directCells = {
        cashInBank: 0,
        creditCardDebt: 0,
        cashAvailable: 0,
        creditAvailable: 0,
        totalOwing: 0,
        totalCreditLimit: 0,
        cashAccounts: []
      };
    }

    console.log('Final processed data summary:', {
      performanceDataCount: processedData.performanceData.length,
      invoicesCount: processedData.rawData.invoices.length,
      networkTermsCount: processedData.networkTerms.length,
      tradeshiftDataCount: processedData.tradeshiftData?.length || 0,
      plDataMonths: Object.keys(processedData.plData || {}).length,
      commissionsCount: processedData.commissions?.length || 0,
      employeeDataCount: processedData.employeeData?.length || 0,
      networkExposureCount: processedData.networkExposure?.length || 0,
      summaryDataCount: processedData.summaryData?.length || 0,
      directCashInBank: processedData.cashFlowData.directCells?.cashInBank || 0,
      directCreditCardDebt: processedData.cashFlowData.directCells?.creditCardDebt || 0,
      directCashAvailable: processedData.cashFlowData.directCells?.cashAvailable || 0,
      directCreditAvailable: processedData.cashFlowData.directCells?.creditAvailable || 0,
      directTotalOwing: processedData.cashFlowData.directCells?.totalOwing || 0,
      directTotalCreditLimit: processedData.cashFlowData.directCells?.totalCreditLimit || 0
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