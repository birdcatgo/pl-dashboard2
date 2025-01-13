import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const valueRanges = batchResponse.data.valueRanges;
    const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December'];
    console.log('Processing monthly ranges:', valueRanges);
    const monthlyData = {};
    const summaryData = [];

    // Get the Summary sheet data (it's at index 5 in valueRanges)
    const summarySheet = valueRanges[5];
    console.log('Raw Summary Sheet Data:', summarySheet?.values);

    if (summarySheet?.values) {
      // Skip header row and process each data row
      summarySheet.values.slice(1).forEach(row => {
        if (row.length) {
          summaryData.push({
            Month: row[0] || '',
            Income: parseFloat((row[1] || '0').replace(/[$,]/g, '')),
            Cash_Injection: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
            Payroll: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
            Advertising: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
            Software: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
            Training: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
            Once_Off: parseFloat((row[7] || '0').replace(/[$,]/g, '')),
            Memberships: parseFloat((row[8] || '0').replace(/[$,]/g, '')),
            Contractors: parseFloat((row[9] || '0').replace(/[$,]/g, '')),
            Tax: parseFloat((row[10] || '0').replace(/[$,]/g, '')),
            Bank_Fees: parseFloat((row[11] || '0').replace(/[$,]/g, '')),
            Utilities: parseFloat((row[12] || '0').replace(/[$,]/g, '')),
            Travel: parseFloat((row[13] || '0').replace(/[$,]/g, '')),
            Capital_One: parseFloat((row[14] || '0').replace(/[$,]/g, '')),
            Barclay: parseFloat((row[15] || '0').replace(/[$,]/g, '')),
            Business_Loan: parseFloat((row[16] || '0').replace(/[$,]/g, '')),
            'Unknown Expense': parseFloat((row[17] || '0').replace(/[$,]/g, '')),
            Net_Rev: parseFloat((row[18] || '0').replace(/[$,]/g, '')),
            'Net%': row[19] ? row[19].replace('%', '') : '0'
          });
        }
      });
    }

    // Process monthly detail data as before
    months.forEach((month, index) => {
      const monthRange = valueRanges[index + 6];
      if (monthRange?.values) {
        const monthlyRows = monthRange.values.slice(1).map(row => ({
          DESCRIPTION: row[0] || '',
          AMOUNT: parseFloat((row[1] || '0').replace(/[$,]/g, '')),
          CATEGORY: row[2] || '',
          'Income/Expense': row[3] || ''
        }));

        // Calculate total expenses
        const totalExpenses = monthlyRows
          .filter(row => row['Income/Expense'] === 'Expense')
          .reduce((sum, row) => sum + row.AMOUNT, 0);

        monthlyData[month] = {
          rows: monthlyRows,
          totalExpenses: totalExpenses
        };
      }
    });

    console.log('Processed Summary Data:', summaryData);
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

export default async function handler(req, res) {
  console.log('Environment Variables Check:');
  console.log('SHEET_ID exists:', !!process.env.SHEET_ID);
  console.log('GOOGLE_CLIENT_EMAIL exists:', !!process.env.GOOGLE_CLIENT_EMAIL);
  console.log('GOOGLE_PRIVATE_KEY exists:', !!process.env.GOOGLE_PRIVATE_KEY?.includes('PRIVATE KEY'));
  
  // Test SHEET_ID format
  const sheetIdPattern = /^[a-zA-Z0-9-_]+$/;
  console.log('SHEET_ID format valid:', sheetIdPattern.test(process.env.SHEET_ID));

  try {
      const auth = new google.auth.GoogleAuth({
          credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const batchResponse = await sheets.spreadsheets.values.batchGet({
          spreadsheetId: process.env.SHEET_ID,
          ranges: [
      'Main Sheet!A:L',
      'Financial Resources!A:D',
      'Invoices!A:C',
      'Payroll!A:D',
      'Media Buyer Spend!A:B',
      'Summary!A:U',
      'Bank Structure!A:M',
      'June!A:D',
      'July!A:D',
      'August!A:D',
      'September!A:D',
      'October!A:D',
      'November!A:D',
      'December!A:D',
      'Network Payment Schedule!A:H'
    ],
  });
    

    const [
      mainResponse, 
      financialResponse, 
      invoicesResponse, 
      payrollResponse, 
      mediaBuyerResponse,
      summaryResponse,
      bankStructureResponse,
      ...monthlyResponses
    ] = batchResponse.data.valueRanges || [];
      const networkPaymentsResponse = batchResponse.data.valueRanges?.[batchResponse.data.valueRanges.length - 1];
      const networkPayments = Array.isArray(networkPaymentsResponse?.values) 
        ? networkPaymentsResponse.values.slice(1).map(row => ({
            network: row[0] || '',
            offer: row[1] || '',
            paymentTerms: row[2] || '',
            dailyCap: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
            dailyBudget: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
            currentExposure: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
            availableBudget: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
            riskLevel: row[7] || ''
          }))
        : [];
    console.log('Network Payments:', networkPayments);

    const cleanedInvoices = Array.isArray(invoicesResponse?.values)
      ? invoicesResponse.values.slice(1).map(row => ({
          Invoices: row[0]?.trim() || '',
          AmountDue: row[1]?.trim() || '',
          DueDate: row[2]?.trim() || ''
        }))
      : [];

    const cleanedPayroll = Array.isArray(payrollResponse?.values)
      ? payrollResponse.values
          .slice(1)
          .filter(row => row && row.length > 0)
          .map(row => ({
            Type: row[0]?.trim() || '',
            Description: row[1]?.trim() || '',
            Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')) || 0,
            DueDate: row[3] ? new Date(row[3].trim()).toISOString() : null
          }))
      : [];

    const cleanedFinancialResources = Array.isArray(financialResponse?.values)
      ? financialResponse.values.slice(1)
          .filter(row => row && row.length >= 2 && row[0]?.trim())
          .map(row => ({
            account: row[0],
            available: parseFloat((row[1] || '0').replace(/[$,]/g, '')),
            owing: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
            limit: parseFloat((row[3] || '0').replace(/[$,]/g, ''))
          }))
      : [];

    let result = {
      performanceData: [],
      cashFlowData: null,
      networkPaymentsData: networkPayments,
      plData: {
        ...(await processPLData(batchResponse)),
        bankStructure: await processBankStructureData(bankStructureResponse)
      },
      rawData: {
        financialResources: cleanedFinancialResources,
        invoices: cleanedInvoices,
        payroll: cleanedPayroll,
        mediaBuyerSpend: mediaBuyerResponse?.values || [],
        networkPayments
      }
    };

    if (mainResponse?.values) {
      result.performanceData = mainResponse.values
        .slice(1)
        .filter((row) => row.length >= 10)
        .map((row) => ({
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
        }));
    }

    result.cashFlowData = {
      ...processCashFlowData(
        result.rawData.financialResources,
        result.rawData.invoices,
        result.rawData.payroll,
        result.rawData.mediaBuyerSpend
      ),
      networkPayments
    };
    
    console.log('Bank Structure Sheet Index:', batchResponse.data.valueRanges.indexOf(bankStructureResponse));
    console.log('All Sheet Names:', batchResponse.data.valueRanges.map((range, i) => 
      `Sheet ${i}: ${range.range}`
    ));
    
    console.log('Bank Structure Sheet:', {
      range: bankStructureResponse?.range,
      values: bankStructureResponse?.values
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'API Error', details: error.message });
  }
}