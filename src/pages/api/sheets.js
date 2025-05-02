import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const monthlyData = {};
    const summaryData = [];

    // Process monthly detail sheets more efficiently
    const monthSheets = batchResponse.data.valueRanges.filter(range => 
      /^(March|February|January|December|November|October|September|August|July|June)!/.test(range.range)
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

    const result = { summary: summaryData, monthly: monthlyData };

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

async function processNetworkTermsData(response) {
  try {
    console.log('Processing Network Terms data:', {
      hasResponse: !!response,
      responseLength: response?.values?.length,
      sampleRow: response?.values?.[1]
    });

    const processedData = (response?.values || [])
      .slice(1)
      .map(row => {
        if (!row || row.length < 9) {
          console.warn('Invalid row in Network Terms data:', row);
          return null;
        }

        // Validate required fields
        if (!row[0]?.trim()) {
          console.warn('Missing network name in row:', row);
          return null;
        }

        // Parse running total and daily cap, handling special cases
        const runningTotal = parseFloat((row[7] || '0').replace(/[$,]/g, ''));
        let dailyCap;
        if (row[8] === 'Uncapped' || row[8] === 'N/A') {
          dailyCap = row[8];
        } else {
          dailyCap = parseFloat((row[8] || '0').replace(/[$,]/g, ''));
        }

        // Parse Last Day's Usage - now optional since it might not be present
        const lastDayUsage = row[9] || '-';  // Default to '-' if not present
        let lastDayPercentage = 0;
        let lastDayAmount = 0;

        if (lastDayUsage && lastDayUsage !== '-') {
          // Extract percentage and amount from format like "0% ($0)"
          const percentageMatch = lastDayUsage.match(/(\d+(?:\.\d+)?)%/);
          const amountMatch = lastDayUsage.match(/\$(\d+(?:\.\d+)?)/);
          
          if (percentageMatch) {
            lastDayPercentage = parseFloat(percentageMatch[1]);
          }
          if (amountMatch) {
            lastDayAmount = parseFloat(amountMatch[1]);
          }

          console.log('Parsed Last Day Usage:', {
            raw: lastDayUsage,
            percentage: lastDayPercentage,
            amount: lastDayAmount
          });
        }

        const processedRow = {
          networkName: row[0]?.trim() || '',
          offer: row[1]?.trim() || '',
          payPeriod: parseInt(row[2] || '0'),
          netTerms: parseInt(row[3] || '0'),
          periodStart: row[4]?.trim() || '',
          periodEnd: row[5]?.trim() || '',
          invoiceDue: row[6]?.trim() || '',
          runningTotal,
          dailyCap,
          lastDayUsage: lastDayUsage === '-' ? '-' : {
            percentage: lastDayPercentage,
            amount: lastDayAmount
          }
        };

        // Log each processed row
        console.log('Processed Network Terms row:', {
          raw: row,
          processed: processedRow
        });

        return processedRow;
      })
      .filter(Boolean);

    console.log('Final processed Network Terms data:', {
      totalRows: processedData.length,
      sampleData: processedData.slice(0, 3)
    });

    return processedData;
  } catch (error) {
    console.error('Error processing Network Terms data:', error);
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
    // Check if we have valid data
    if (!response?.values || response.values.length <= 1) {
      console.log('No employee data found or only header row present');
      return [];
    }

    // Skip header row and process each employee row
    const employeeData = response.values.slice(1).map((row, index) => {
      try {
        // Check if row has enough data
        if (!row[0]) {
          console.log(`Skipping invalid row ${index + 2}: Missing name`);
          return null;
        }

        return {
          name: row[0] || '',
          basePay: row[1] || '',
          frequency: row[2] || '',
          commission: row[3] || '',
          contractType: row[4] || '',
          email: row[5] || '',
          ndaSigned: row[6]?.toLowerCase() === 'yes',
          thirtyDayContract: row[7] || '',
          postThirtyDayContract: row[8] || '',
          status: row[9] || 'INACTIVE'
        };
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    console.log(`Processed ${employeeData.length} employee records`);
    if (employeeData.length > 0) {
      console.log('Sample employee data:', employeeData[0]);
    }

    return employeeData;
  } catch (error) {
    console.error('Error processing employee data:', error);
    return [];
  }
}

const SHEET_CONFIG = {
  performance: {
    name: 'Performance',
    range: 'A:Z',
    requiredColumns: ['Date', 'Network', 'Total Revenue', 'Ad Spend']
  },
  invoices: {
    name: 'Invoices',
    range: 'A:Z',
    requiredColumns: ['Network', 'Invoice #', 'Amount Due', 'Due Date', 'Status']
  },
  networkCaps: {
    name: 'Network Caps',
    range: 'A:Z',
    requiredColumns: ['Network', 'Cap Amount', 'Current Spend']
  },
  commissions: {
    name: 'Commissions',
    range: 'A:Z',
    requiredColumns: ['Media Buyer', 'Commission Rates', 'February 2025 Estimated', 'February 2025 Confirmed', 'February 2025 Commission', 'March 2025 Estimated', 'March 2025 Confirmed', 'March 2025 Commission']
  }
};

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
      sheetId: SHEET_ID,
      environment: process.env.NODE_ENV
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

    const sheets = google.sheets({ version: 'v4', auth });

    // Define ranges to fetch
    const ranges = [
      "'Main Sheet'!A:L",
      "'Financial Resources'!A:D",
      "'Payroll'!A:D",
      "'Media Buyer Spend'!A:B",
      "'Summary'!A:V",
      "'Network Payment Schedule'!A:H",
      "'March'!A:D",
      "'February'!A:D",
      "'January'!A:D",
      "'December'!A:D",
      "'November'!A:D",
      "'October'!A:D",
      "'September'!A:D",
      "'August'!A:D",
      "'July'!A:D",
      "'June'!A:D",
      "'Network Terms'!A:J",
      "'Invoices'!A:F",
      "'Tradeshift Check'!A:E",
      "'Monthly Expenses'!A:D",
      "'Commissions'!A:H",
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
      cashFlowData: null,
      payrollData: [],
      networkTerms: [],
      rawData: {
        invoices: [],
        payroll: []
      },
      plData: null,
      tradeshiftData: [],
      commissions: [],
      employeeData: []
    };

    // Log all sheet names and their responses
    console.log('All Sheet Responses:', batchResponse.data.valueRanges.map(range => ({
      range: range.range,
      hasValues: !!range.values,
      valuesCount: range.values?.length,
      firstRow: range.values?.[0],
      error: range.error,
      status: range.status
    })));

    // Extract array positions for debugging
    const [
      mainResponse,
      financialResponse,
      payrollResponse,
      mediaBuyerResponse,
      summaryResponse,
      networkPaymentsResponse,
      marchResponse,
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
      invoicesResponse,
      tradeshiftResponse,
      monthlyExpensesResponse,
      commissionsResponse,
      employeeResponse
    ] = batchResponse.data.valueRanges;

    // Add specific logging for Network Terms sheet
    console.log('Network Terms Sheet Details:', {
      sheetName: 'Network Terms',
      range: "'Network Terms'!A:J",
      response: {
        hasResponse: !!networkTermsResponse,
        hasValues: !!networkTermsResponse?.values,
        valuesLength: networkTermsResponse?.values?.length,
        firstRow: networkTermsResponse?.values?.[0],
        sampleRows: networkTermsResponse?.values?.slice(0, 3),
        fullResponse: networkTermsResponse
      }
    });

    // Add this right after the batchResponse is received
    console.log('Network Terms Raw Data:', {
      hasResponse: !!networkTermsResponse,
      range: networkTermsResponse?.range,
      hasValues: !!networkTermsResponse?.values,
      valuesCount: networkTermsResponse?.values?.length,
      headerRow: networkTermsResponse?.values?.[0],
      allRows: networkTermsResponse?.values?.slice(1),
      networks: networkTermsResponse?.values?.slice(1).map(row => row[0]).filter(Boolean)
    });

    // Process each response with error handling
    try {
      // Process main performance data
      processedData.performanceData = mainResponse?.values?.slice(1) || [];
      console.log('Processed performance data:', processedData.performanceData.length);

      // Process cash flow data
      console.log('Financial Resources Response:', {
        hasValues: !!financialResponse?.values,
        valuesLength: financialResponse?.values?.length,
        firstRow: financialResponse?.values?.[0],
        sampleRows: financialResponse?.values?.slice(0, 3),
        fullResponse: financialResponse
      });
      
      if (!financialResponse?.values || financialResponse.values.length < 2) {
        console.error('Invalid Financial Resources data:', financialResponse);
        processedData.cashFlowData = {
          availableCash: 0,
          creditAvailable: 0,
          totalAvailable: 0,
          financialResources: []
        };
      } else {
        try {
          // Log the raw data before processing
          console.log('Raw Financial Resources data:', {
            headerRow: financialResponse.values[0],
            dataRows: financialResponse.values.slice(1),
            rowCount: financialResponse.values.length - 1
          });

          processedData.cashFlowData = processCashFlowData(financialResponse);
          console.log('Processed cash flow data:', {
            hasData: !!processedData.cashFlowData,
            availableCash: processedData.cashFlowData?.availableCash,
            creditAvailable: processedData.cashFlowData?.creditAvailable,
            totalAvailable: processedData.cashFlowData?.totalAvailable,
            resourcesCount: processedData.cashFlowData?.financialResources?.length,
            resources: processedData.cashFlowData?.financialResources
          });
    } catch (error) {
          console.error('Error processing cash flow data:', error);
          processedData.cashFlowData = {
        availableCash: 0,
        creditAvailable: 0,
        totalAvailable: 0,
        financialResources: []
      };
    }
      }

      // Process payroll data
      processedData.payrollData = payrollResponse?.values?.slice(1) || [];
      processedData.rawData.payroll = processedData.payrollData;
      console.log('Processed payroll data:', processedData.payrollData.length);

      // Process network terms
      console.log('Network Terms Response:', {
        hasResponse: !!networkTermsResponse,
        hasValues: !!networkTermsResponse?.values,
        valuesLength: networkTermsResponse?.values?.length,
        firstRow: networkTermsResponse?.values?.[0],
        sampleRows: networkTermsResponse?.values?.slice(0, 3),
        fullResponse: networkTermsResponse
      });

      processedData.networkTerms = await processNetworkTermsData(networkTermsResponse);
      console.log('Processed Network Terms:', {
        count: processedData.networkTerms.length,
        networks: processedData.networkTerms.map(term => term.networkName),
        sample: processedData.networkTerms[0],
        allTerms: processedData.networkTerms
      });

      // Process invoices
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
      const plData = await processPLData({
        data: {
          valueRanges: [
            marchResponse,
            februaryResponse,
            januaryResponse,
            decemberResponse,
            novemberResponse,
            octoberResponse,
            septemberResponse,
            augustResponse,
            julyResponse,
            juneResponse
          ]
        }
      });
      processedData.plData = plData;
      console.log('Processed P&L data:', !!processedData.plData);

      // Process commissions data
      if (commissionsResponse?.values && commissionsResponse.values.length > 1) {
        console.log('Raw Commission Data:', {
          headerRow: commissionsResponse.values[0],
          firstDataRow: commissionsResponse.values[1],
          rowCount: commissionsResponse.values.length - 1,
          allRows: commissionsResponse.values
        });

        // Get all month columns from the header
        const headerRow = commissionsResponse.values[0];
        const monthColumns = headerRow.reduce((acc, header, index) => {
          // Match both formats: "April 2025" and "April 2025 Commission"
          const monthMatch = header.match(/^(April|March|February)\s+2025(?:\s+Commission)?$/);
          if (monthMatch) {
            acc[header] = index;
          }
          return acc;
        }, {});

        console.log('Month columns:', monthColumns);

        processedData.commissions = commissionsResponse.values.slice(1).map((row, index) => {
          const commission = {
            mediaBuyer: row[0] || '',
            commissionRate: parseFloat((row[1] || '0').replace('%', '')) / 100,
            status: row[2] || '',
            Confirmed: row[3] || ''
          };

          // Add each month's data directly
          Object.entries(monthColumns).forEach(([header, index]) => {
            commission[header] = row[index] || '0';
          });

          // Log each processed row for debugging
          console.log(`Processed Commission Row ${index + 1}:`, {
            mediaBuyer: commission.mediaBuyer,
            months: Object.keys(monthColumns),
            monthData: Object.entries(monthColumns).map(([header, index]) => ({
              header,
              value: row[index]
            }))
          });

          return commission;
        });

        console.log('Final Commission Data:', {
          count: processedData.commissions.length,
          sample: processedData.commissions[0],
          allCommissions: processedData.commissions
        });
      } else {
        console.log('No Commission Data Found:', {
          hasResponse: !!commissionsResponse,
          hasValues: !!commissionsResponse?.values,
          valuesLength: commissionsResponse?.values?.length
        });
      }

      // Process employee data
      processedData.employeeData = await processEmployeeData(employeeResponse);
      console.log('Processed employee data:', {
        count: processedData.employeeData.length,
        sample: processedData.employeeData[0]
      });

    } catch (processingError) {
      console.error('Error processing data:', processingError);
      // Continue with partial data rather than failing completely
    }

    console.log('Final processed data structure:', {
      performanceDataLength: processedData.performanceData.length,
      hasCashFlowData: !!processedData.cashFlowData,
      cashFlowDataKeys: processedData.cashFlowData ? Object.keys(processedData.cashFlowData) : [],
      payrollDataLength: processedData.payrollData.length,
      networkTermsLength: processedData.networkTerms.length,
      invoicesLength: processedData.rawData.invoices.length,
      tradeshiftDataLength: processedData.tradeshiftData.length,
      hasPlData: !!processedData.plData
    });

    return res.status(200).json(processedData);
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message,
      environment: process.env.NODE_ENV
    });
  }
}