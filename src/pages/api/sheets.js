import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const monthlyData = {};
    const summaryData = [];

    // Process monthly detail sheets more efficiently
    const monthSheets = batchResponse.data.valueRanges.filter(range => 
      /^(June|July|August|September|October|November|December|January|February)!/.test(range.range)
    );

    // Process all months in parallel
    await Promise.all(monthSheets.map(async monthSheet => {
      const monthName = monthSheet.range.split('!')[0];
      
      if (monthSheet.values && monthSheet.values.length > 1) {
        // Map rows more efficiently with a single pass
        const monthlyRows = monthSheet.values.slice(1).map(row => ({
          DESCRIPTION: row[0]?.trim() || '',
          AMOUNT: parseFloat(row[1]?.replace(/[$,]/g, '') || '0'),
          CATEGORY: row[2]?.trim() || '',
          'Income/Expense': row[3]?.trim() || ''
        }));

        // Calculate totals in a single reduce operation
        const { incomeData, expenseData, totalIncome, totalExpenses } = monthlyRows.reduce((acc, row) => {
          if (row['Income/Expense']?.toLowerCase() === 'income') {
            acc.incomeData.push(row);
            acc.totalIncome += row.AMOUNT;
          } else {
            acc.expenseData.push(row);
            acc.totalExpenses += row.AMOUNT;
          }
          return acc;
        }, { incomeData: [], expenseData: [], totalIncome: 0, totalExpenses: 0 });

        // Group expenses by category more efficiently
        const categories = expenseData.reduce((acc, expense) => {
          const category = expense.CATEGORY || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(expense);
          return acc;
        }, {});

        monthlyData[monthName] = {
          monthDataArray: monthlyRows,
          incomeData,
          expenseData,
          categories,
          totalIncome,
          totalExpenses
        };

        const netProfit = totalIncome - totalExpenses;
        const netPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        summaryData.push({
          Month: monthName,
          Income: totalIncome,
          Expenses: totalExpenses,
          NetProfit: netProfit,
          'Net%': netPercent
        });
      }
    }));

    // Add Tradeshift data processing with better error handling
    let tradeshiftData;
    try {
      tradeshiftData = await processTradeShiftData(tradeshiftResponse);
      console.log('Processed Tradeshift data:', {
        hasData: !!tradeshiftData,
        dataLength: tradeshiftData?.length,
        sampleData: tradeshiftData?.[0]
      });
    } catch (error) {
      console.error('Error processing Tradeshift data:', error);
      tradeshiftData = [];
    }

    const result = { summary: summaryData, monthly: monthlyData };
    result.tradeshiftData = tradeshiftData;

    console.log('API sending networkTerms:', {
      hasTerms: !!result.networkTerms,
      termsCount: result.networkTerms?.length,
      sampleTerm: result.networkTerms?.[0]
    });

    return result;

  } catch (error) {
    console.error('Error in processPLData:', error);
    throw new Error('Failed to process P&L data: ' + error.message);
  }
}

async function processBankStructureData(bankStructureResponse) {
  try {
    if (!bankStructureResponse?.values || bankStructureResponse.values.length < 2) {
      console.log('Bank Structure Response:', bankStructureResponse?.values);
      return null;
    }

    // Skip header row and get data row
    const data = bankStructureResponse.values[1];
    console.log('Bank Structure Data Row:', data);
    
    const processed = {
      operatingMin: parseFloat((data[2] || '0').replace(/[$,]/g, '')),
      operatingIdeal: parseFloat((data[3] || '0').replace(/[$,]/g, '')),
      taxReservePercent: 0.25,
      emergencyMin: parseFloat((data[4] || '0').replace(/[$,]/g, '')),
      emergencyIdeal: parseFloat((data[5] || '0').replace(/[$,]/g, '')),
      growthFundPercent: 0.30
    };

    console.log('Processed Bank Structure:', processed);
    return processed;
  } catch (error) {
    console.error('Error processing bank structure data:', error);
    return null;
  }
}

async function processTradeShiftData(response) {
  console.log('Processing Tradeshift response:', response); // Debug log

  if (!response?.values || response.values.length <= 1) {
    console.log('No valid Tradeshift data found');
    return [];
  }
  
  try {
    // Skip header row and process data
    const rows = response.values.slice(1).map(row => {
      if (!row || row.length < 5) {
        console.log('Invalid row:', row);
        return null;
      }

      const amount = parseFloat((row[2] || '0').replace(/[$,]/g, ''));
      if (isNaN(amount)) {
        console.log('Invalid amount:', row[2]);
        return null;
      }

      return {
        purpose: row[0]?.trim() || '',
        card: row[1]?.trim() || '',
        amount: amount,
        merchantName: row[3]?.trim() || '',
        cardLastDigits: row[4]?.trim() || ''
      };
    }).filter(Boolean); // Remove any null entries

    console.log('Processed Tradeshift rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error processing Tradeshift data:', error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

    // Debug environment variables
    console.log('Environment Variables Check:', {
      hasClientEmail: !!GOOGLE_SHEETS_CLIENT_EMAIL,
      clientEmailLength: GOOGLE_SHEETS_CLIENT_EMAIL?.length,
      hasPrivateKey: !!GOOGLE_SHEETS_PRIVATE_KEY,
      privateKeyLength: GOOGLE_SHEETS_PRIVATE_KEY?.length,
      hasSheetId: !!SHEET_ID,
      sheetId: SHEET_ID
    });

    // Validate required environment variables
    if (!GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error('Missing Google Client Email');
    }
    if (!GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error('Missing Google Private Key');
    }
    if (!SHEET_ID) {
      throw new Error('Missing Sheet ID');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: GOOGLE_SHEETS_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Debug auth object
    console.log('Auth object created:', {
      hasCredentials: !!auth.credentials,
      hasScopes: !!auth.scopes,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Log the spreadsheet ID
    console.log('Spreadsheet ID:', SHEET_ID);

    // Log the ranges we're requesting
    console.log('Requesting sheet ranges:', [
      'Main Sheet!A:L',
      'Financial Resources!A:D',
      'Payroll!A:D',
      'Media Buyer Spend!A:B',
      'Summary!A:U',
      'Bank Structure!A:M',
      'Network Payment Schedule!A:H',
      'February!A:D',
      'January!A:D',
      'December!A:D',
      'November!A:D',
      'October!A:D',
      'September!A:D',
      'August!A:D',
      'July!A:D',
      'June!A:D',
      'Network Terms!A2:I',
      'Invoices!A:F',
      'Tradeshift Check!A:E',
      'Monthly Expenses!A:D'
    ]);

    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: [
        'Main Sheet!A:L',
        'Financial Resources!A:D',
        'Payroll!A:D',
        'Media Buyer Spend!A:B',
        'Summary!A:U',
        'Bank Structure!A:M',
        'Network Payment Schedule!A:H',
        'Invoices!A:F',
        'February!A:D',
        'January!A:D',
        'December!A:D',
        'November!A:D',
        'October!A:D',
        'September!A:D',
        'August!A:D',
        'July!A:D',
        'June!A:D',
        'Network Terms!A2:I',
        'Tradeshift Check!A:E',
        'Monthly Expenses!A:D'
      ]
    });
    
    // Log successful batch response
    console.log('Batch response received:', {
      success: true,
      rangesCount: batchResponse.data.valueRanges.length
    });

    // Extract array positions for debugging
    const [
      mainResponse,
      financialResponse,
      payrollResponse,
      mediaBuyerResponse,
      summaryResponse,
      bankStructureResponse,
      networkPaymentsResponse,
      invoicesResponse,
      februaryResponse,
      januaryResponse,
      decemberResponse,
      novemberResponse,
      octoberResponse,
      septemberResponse,
      augustResponse,
      julyResponse,
      juneResponse,
      networkTermsResponse,
      tradeshiftResponse,
      monthlyExpensesResponse
    ] = batchResponse.data.valueRanges || [];

    // Initialize result object with empty arrays
    let result = {
      performanceData: [],
      cashFlowData: {},
      networkPaymentsData: [],
      plData: {},
      rawData: {
        financialResources: [],
        invoices: [],
        payroll: [],
        mediaBuyerSpend: [],
        networkTerms: [],
        monthlyExpenses: []
      },
      networkTerms: [],
      tradeshiftData: []
    };

    // Process Financial Resources
    try {
      const financialResourcesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Financial Resources!A:D',
        valueRenderOption: 'UNFORMATTED_VALUE'
      });

      if (!financialResourcesResponse?.data?.values) {
        console.error('No financial resources data received');
        result.rawData.financialResources = [];
        result.cashFlowData = {
          availableCash: 0,
          creditAvailable: 0,
          totalAvailable: 0,
          financialResources: []
        };
      } else {
        result.rawData.financialResources = financialResourcesResponse.data.values
          .slice(1)
          .filter(row => row[0] && row[0] !== 'Account Name')
          .map(row => ({
            account: row[0]?.trim(),
            available: parseFloat((row[1] || '0').toString().replace(/[$,]/g, '')),
            owing: parseFloat((row[2] || '0').toString().replace(/[$,]/g, '')),
            limit: parseFloat((row[3] || '0').toString().replace(/[$,]/g, ''))
          }));

        const cashAccounts = ['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'];

        result.cashFlowData = {
          availableCash: result.rawData.financialResources
            .filter(r => cashAccounts.includes(r.account))
            .reduce((sum, r) => sum + r.available, 0),
          creditAvailable: result.rawData.financialResources
            .filter(r => !cashAccounts.includes(r.account))
            .reduce((sum, r) => sum + r.available, 0),
          financialResources: result.rawData.financialResources
        };

        result.cashFlowData.totalAvailable = result.cashFlowData.availableCash + result.cashFlowData.creditAvailable;
      }
    } catch (error) {
      console.error('Error processing financial resources:', error);
      result.rawData.financialResources = [];
      result.cashFlowData = {
        availableCash: 0,
        creditAvailable: 0,
        totalAvailable: 0,
        financialResources: []
      };
    }

    // Process Invoices - Updated with fixes
    console.log('Processing invoices:', {
      hasValues: !!invoicesResponse?.values,
      rowCount: invoicesResponse?.values?.length,
      sampleRow: invoicesResponse?.values?.[1]
    });

    // Single, consolidated invoice processing
    if (invoicesResponse?.values) {
      console.log('Raw invoice data:', {
        headers: invoicesResponse.values[0],
        firstRow: invoicesResponse.values[1],
        totalRows: invoicesResponse.values.length
      });
      
      result.rawData.invoices = invoicesResponse.values
        .slice(1) // Skip header row
        .filter(row => row.length >= 6) // Ensure we have all required columns
        .map(row => {
          const cleanDateString = (str) => {
            if (!str) return '';
            if (str.includes('$') || str.includes(',')) return '';
            return str.trim();
          };

          const parseAmount = (str) => {
            if (!str) return 0;
            const cleaned = str.toString().replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
          };

          const invoice = {
            Network: row[0]?.trim() || '',
            PeriodStart: cleanDateString(row[1]),
            PeriodEnd: cleanDateString(row[2]),
            DueDate: cleanDateString(row[3]),
            Amount: parseAmount(row[4]),
            Status: row[6]?.trim() || 'Unpaid',  // Use actual status if available
            InvoiceNumber: row[5]?.toString().trim() || '',
            paid: false // Default to unpaid
          };

          console.log('Processed invoice:', invoice);
          return invoice;
        })
        .filter(row => row.Network && row.Amount > 0); // Only keep rows with a network name and positive amount

      console.log('Processed invoices:', {
        count: result.rawData.invoices.length,
        sample: result.rawData.invoices[0],
        totalAmount: result.rawData.invoices.reduce((sum, inv) => sum + (inv.Amount || 0), 0),
        fields: result.rawData.invoices[0] ? Object.keys(result.rawData.invoices[0]) : []
      });
    } else {
      console.log('No invoice data found in response');
      result.rawData.invoices = [];
    }
    // Process Payroll
    result.rawData.payroll = Array.isArray(payrollResponse?.values)
      ? payrollResponse.values.slice(1).map(row => ({
          Type: row[0]?.trim() || '',
          Description: row[1]?.trim() || '',
          Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
          DueDate: row[3]?.trim() || ''
        }))
      : [];

    // Process Media Buyer Spend
    result.rawData.mediaBuyerSpend = mediaBuyerResponse?.values || [];

    // Process P&L Data
    result.plData = await processPLData(batchResponse);

    // Process Monthly Expenses data
    if (monthlyExpensesResponse?.values && monthlyExpensesResponse.values.length > 1) {
      console.log('Raw Monthly Expenses data:', {
        headers: monthlyExpensesResponse.values[0],
        firstRow: monthlyExpensesResponse.values[1],
        totalRows: monthlyExpensesResponse.values.length
      });

      result.rawData.monthlyExpenses = monthlyExpensesResponse.values
        .slice(1) // Skip header row
        .map(row => ({
          Category: row[0]?.trim() || '',
          Description: row[1]?.trim() || '',
          Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
          Month: row[3]?.trim() || ''
        }))
        .filter(row => row.Category && row.Amount > 0);

      console.log('Processed Monthly Expenses:', {
        count: result.rawData.monthlyExpenses.length,
        sample: result.rawData.monthlyExpenses[0],
        totalAmount: result.rawData.monthlyExpenses.reduce((sum, exp) => sum + exp.Amount, 0),
        allExpenses: result.rawData.monthlyExpenses
      });
    } else {
      console.log('No Monthly Expenses data found in response');
      result.rawData.monthlyExpenses = [];
    }

    // Calculate daily expenses from monthly expenses
    const dailyExpenses = {};
    if (result.rawData.monthlyExpenses?.length > 0) {
      // Hard code daily expenses amount
      const dailyAmount = 1946.85;
      
      // Set the daily amount for each category
      result.rawData.monthlyExpenses.forEach(expense => {
        dailyExpenses[expense.Category] = dailyAmount;
      });

      console.log('Daily expenses calculated:', {
        dailyAmount,
        categories: Object.keys(dailyExpenses)
      });
    }

    // Process performance data
    if (mainResponse?.values) {
      const headers = mainResponse.values[0];
      
      console.log('Raw Data Analysis:', {
        totalRows: mainResponse.values.length,
        rowLengths: mainResponse.values.slice(1).reduce((acc, row) => {
          acc[row.length] = (acc[row.length] || 0) + 1;
          return acc;
        }, {}),
        dateRange: {
          first: mainResponse.values[1]?.[0],
          last: mainResponse.values[mainResponse.values.length - 1]?.[0]
        }
      });

      const performanceData = mainResponse.values
        .slice(1)
        .map((row) => {
          if (row.length < 10) {
            console.log('Short row:', { length: row.length, data: row });
          }

          // Calculate total daily expenses for this row
          const totalDailyExpenses = Object.values(dailyExpenses).reduce((sum, amount) => sum + amount, 0);

          // Calculate base profit (Revenue - Ad Spend)
          const revenue = parseFloat((row[7] || '0').replace(/[$,]/g, '')) || 0;
          const adSpend = parseFloat((row[4] || '0').replace(/[$,]/g, '')) || 0;
          const baseProfit = revenue - adSpend;

          // Calculate MB Commission (10% of base profit)
          const mbCommission = baseProfit * 0.1;

          // Calculate Ringba Cost (from row[8])
          const ringbaCost = parseFloat((row[8] || '0').replace(/[$,]/g, '')) || 0;

          // Calculate Final Profit (Base Profit - MB Commission - Ringba Cost - Daily Expenses)
          const finalProfit = baseProfit - mbCommission - ringbaCost - totalDailyExpenses;

          // Calculate ROI
          const roi = adSpend > 0 ? (finalProfit / adSpend) * 100 : 0;

          return {
            Date: row[0] || '',
            Network: row[1] || '',
            Offer: row[2] || '',
            'Media Buyer': row[3] || '',
            'Ad Spend': adSpend,
            'Ad Revenue': parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0,
            'Comment Revenue': parseFloat((row[6] || '0').replace(/[$,]/g, '')) || 0,
            'Total Revenue': revenue,
            'Base Profit': baseProfit,
            'MB Commission': mbCommission,
            'Ringba Cost': ringbaCost,
            'Daily Expenses': totalDailyExpenses,
            'Final Profit': finalProfit,
            'ROI': roi,
            'Expected Payment': row[9] || '',
            'Running Balance': parseFloat((row[10] || '0').replace(/[$,]/g, '')) || 0,
            'Ad Account': row[11] || ''
          };
        })
        .filter(row => row.Date);

      result.performanceData = performanceData;
    }

    // Process Network Payments
    const networkPayments = Array.isArray(networkPaymentsResponse?.values)
      ? networkPaymentsResponse.values.slice(1).map(row => ({
          network: row[0]?.trim() || '',
          offer: row[1]?.trim() || '',
          paymentTerms: row[2]?.trim() || '',
          dailyCap: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
          dailyBudget: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
          currentExposure: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
          availableBudget: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
          riskLevel: row[7]?.trim() || ''
        }))
      : [];

    result.networkPaymentsData = networkPayments;

    // Process Network Terms with more detailed logging
    const networkTerms = networkTermsResponse?.values?.map(row => {
      if (!row || row.length < 9) {
        console.log('Skipping invalid network terms row:', row);
        return null;
      }

      const runningTotal = parseFloat((row[7] || '0').replace(/[$,]/g, ''));
      
      if (runningTotal <= 0) {
        console.log('Skipping network term with zero or negative running total:', {
          network: row[0],
          runningTotal
        });
        return null;
      }

      const lastDate = mainResponse?.values
        ?.slice(1)
        ?.sort((a, b) => new Date(b[0]) - new Date(a[0]))?.[0]?.[0];

      const networkTerm = {
        network: row[0]?.trim() || '',
        offer: row[1]?.trim() || '',
        payPeriod: row[2]?.trim() || '',
        netTerms: row[3]?.trim() || '',
        periodStart: row[4]?.trim() || '',
        periodEnd: row[5]?.trim() || '',
        invoiceDue: row[6]?.trim() || '',
        runningTotal,
        dailyCap: row[8] === 'Uncapped' ? 'Uncapped' : 
                 row[8] === 'N/A' ? 'N/A' :
                 row[8] === 'TBC' ? 'TBC' :
                 parseFloat((row[8] || '0').replace(/[$,]/g, '')),
        lastDate
      };

      console.log('Processed network term:', networkTerm);
      return networkTerm;
    }).filter(Boolean);

    networkTerms?.sort((a, b) => b.runningTotal - a.runningTotal);

    console.log('Final Network Terms:', {
      count: networkTerms?.length || 0,
      sample: networkTerms?.[0],
      totalExposure: networkTerms?.reduce((sum, term) => sum + (term.runningTotal || 0), 0) || 0,
      allData: networkTerms
    });

    result.networkTerms = networkTerms || [];

    console.log('API Response Structure:', {
      hasNetworkTerms: !!result.networkTerms,
      networkTermsCount: result.networkTerms.length,
      allKeys: Object.keys(result)
    });

    console.log('Raw Sheet Response:', {
      totalRows: mainResponse?.values?.length,
      firstRow: mainResponse?.values?.[1],
      lastRow: mainResponse?.values?.[mainResponse?.values?.length - 1],
      dateRange: {
        first: mainResponse?.values?.[1]?.[0],
        last: mainResponse?.values?.[mainResponse?.values?.length - 1]?.[0]
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}