import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const monthlyData = {};
    const summaryData = [];

    // Process monthly detail sheets
    const monthSheets = batchResponse.data.valueRanges.filter(range => {
      return /^(June|July|August|September|October|November|December|January|February)!/.test(range.range);
    });

    monthSheets.forEach(monthSheet => {
      const monthName = monthSheet.range.split('!')[0];
      
      if (monthSheet.values && monthSheet.values.length > 1) {
        const monthlyRows = monthSheet.values.slice(1).map(row => ({
          DESCRIPTION: row[0]?.trim() || '',
          AMOUNT: row[1] || '0',
          CATEGORY: row[2]?.trim() || '',
          'Income/Expense': row[3]?.trim() || ''
        }));

        // Separate income and expense data
        const incomeData = monthlyRows
          .filter(row => row['Income/Expense'] === 'Income')
          .sort((a, b) => parseFloat(a.AMOUNT.replace(/[$,]/g, '')) - parseFloat(b.AMOUNT.replace(/[$,]/g, '')));

        const expenseData = monthlyRows
          .filter(row => row['Income/Expense'] === 'Expense');

        // Group expenses by category
        const categories = expenseData.reduce((acc, row) => {
          const category = row.CATEGORY || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(row);
          return acc;
        }, {});

        // Calculate totals
        const totalIncome = incomeData.reduce((sum, row) => 
          sum + parseFloat(row.AMOUNT.replace(/[$,]/g, '') || 0), 0
        );

        const totalExpenses = expenseData.reduce((sum, row) => 
          sum + parseFloat(row.AMOUNT.replace(/[$,]/g, '') || 0), 0
        );

        monthlyData[monthName] = {
          monthDataArray: monthlyRows,
          incomeData,
          expenseData,
          categories,
          totalIncome,
          totalExpenses
        };
      }
    });

    // Process summary data
    const summarySheet = batchResponse.data.valueRanges.find(range => range.range.includes('Summary'));
    if (summarySheet?.values) {
      const summaryRows = summarySheet.values.slice(1).filter(row => row.length);
      summaryRows.forEach(row => {
        // Get the values directly from the correct columns
        const income = parseFloat((row[1] || '0').replace(/[$,]/g, '')); // Income
        const expenses = [
          parseFloat((row[3] || '0').replace(/[$,]/g, '')),  // Payroll
          parseFloat((row[4] || '0').replace(/[$,]/g, '')),  // Advertising
          parseFloat((row[5] || '0').replace(/[$,]/g, '')),  // Software
          parseFloat((row[6] || '0').replace(/[$,]/g, '')),  // Training
          parseFloat((row[7] || '0').replace(/[$,]/g, '')),  // Once_Off
          parseFloat((row[8] || '0').replace(/[$,]/g, '')),  // Memberships
          parseFloat((row[9] || '0').replace(/[$,]/g, '')),  // Contractors
          parseFloat((row[10] || '0').replace(/[$,]/g, '')), // Tax
          parseFloat((row[11] || '0').replace(/[$,]/g, '')), // Bank_Fees
          parseFloat((row[12] || '0').replace(/[$,]/g, '')), // Utilities
          parseFloat((row[13] || '0').replace(/[$,]/g, '')), // Travel
          parseFloat((row[14] || '0').replace(/[$,]/g, '')), // Capital_One
          parseFloat((row[15] || '0').replace(/[$,]/g, '')), // Barclay
          parseFloat((row[16] || '0').replace(/[$,]/g, '')), // Business_Loan
          parseFloat((row[17] || '0').replace(/[$,]/g, ''))  // Unknown Expense
        ].reduce((a, b) => !isNaN(b) ? a + b : a, 0);

        // Get Net_Rev and Net% directly from the sheet
        const netProfit = parseFloat((row[18] || '0').replace(/[$,]/g, '')); // Net_Rev column
        const netPercent = parseFloat((row[19] || '0').replace(/[^0-9.-]/g, '')); // Net% column

        summaryData.push({
          Month: row[0] || '',
          Income: income,
          Expenses: expenses,
          NetProfit: netProfit,
          'Net%': netPercent
        });
      });
    }

    return { summary: summaryData, monthly: monthlyData };
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return { summary: [], monthly: {} };
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
      'Tradeshift Check!A:E'
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
        'Tradeshift Check!A:E'
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
      tradeshiftResponse
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
        networkTerms: []
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
      console.log('Raw invoice data:', invoicesResponse.values.slice(0, 2));
      
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

          return {
            Network: row[0]?.trim() || '',
            PeriodStart: cleanDateString(row[1]),
            PeriodEnd: cleanDateString(row[2]),
            DueDate: cleanDateString(row[3]),
            Amount: parseAmount(row[4]),  // Changed from AmountDue to Amount
            Status: 'Unpaid',  // Added Status field
            InvoiceNumber: row[5]?.toString().trim() || ''
          };
        })
        .filter(row => row.Network); // Only keep rows with a network name

      console.log('Processed invoices:', {
        count: result.rawData.invoices.length,
        sample: result.rawData.invoices[0],
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

          return {
            Date: row[0] || '',
            Network: row[1] || '',
            Offer: row[2] || '',
            'Media Buyer': row[3] || '',
            'Ad Spend': parseFloat((row[4] || '0').replace(/[$,]/g, '')) || 0,
            'Ad Revenue': parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0,
            'Comment Revenue': parseFloat((row[6] || '0').replace(/[$,]/g, '')) || 0,
            'Total Revenue': parseFloat((row[7] || '0').replace(/[$,]/g, '')) || 0,
            Margin: parseFloat((row[8] || '0').replace(/[$,]/g, '')) || 0,
            'Expected Payment': row[9] || '',
            'Running Balance': parseFloat((row[10] || '0').replace(/[$,]/g, '')) || 0,
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

    // Process Network Terms
    const networkTerms = networkTermsResponse?.values?.map(row => {
      if (!row || row.length < 9) {
        console.log('Skipping invalid row:', row);
        return null;
      }

      const runningTotal = parseFloat((row[7] || '0').replace(/[$,]/g, ''));
      
      if (runningTotal <= 0) {
        return null;
      }

      const lastDate = mainResponse?.values
        ?.slice(1)
        ?.sort((a, b) => new Date(b[0]) - new Date(a[0]))?.[0]?.[0];

      const lastDateSpend = mainResponse?.values
        ?.filter(perfRow => 
          perfRow[0] === lastDate && 
          perfRow[1] === row[0]?.trim() && 
          perfRow[2] === row[1]?.trim()
        )
        ?.reduce((sum, perfRow) => {
          const spend = parseFloat(perfRow[4]?.replace(/[$,]/g, '') || '0');
          return sum + (isNaN(spend) ? 0 : spend);
        }, 0) || 0;

      const dailyCap = row[8] === 'Uncapped' ? null : 
                      row[8] === 'N/A' ? null :
                      row[8] === 'TBC' ? null :
                      parseFloat((row[8] || '0').replace(/[$,]/g, ''));
      
      const capUtilization = (dailyCap && dailyCap > 0) 
        ? (lastDateSpend / dailyCap * 100)
        : null;

      return {
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
                 dailyCap,
        lastDateSpend: lastDateSpend || 0,
        capUtilization: capUtilization,
        lastDate
      };
    }).filter(Boolean);

    networkTerms?.sort((a, b) => b.runningTotal - a.runningTotal);

    console.log('Final Network Terms:', {
      count: networkTerms?.length || 0,
      sample: networkTerms?.[0],
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

    // Add Tradeshift data processing with more logging
    const tradeshiftData = await processTradeShiftData(tradeshiftResponse);
    console.log('Processed Tradeshift data:', {
      hasData: !!tradeshiftData,
      dataLength: tradeshiftData?.length,
      sampleData: tradeshiftData?.[0]
    });

    result.tradeshiftData = tradeshiftData;

    console.log('API sending networkTerms:', {
      hasTerms: !!result.networkTerms,
      termsCount: result.networkTerms.length,
      sampleTerm: result.networkTerms[0]
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}