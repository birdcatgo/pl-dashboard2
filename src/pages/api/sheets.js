import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const valueRanges = batchResponse.data.valueRanges;
    const months = ['June', 'July', 'August', 'September', 'October', 'November'];
    const monthlyData = {};
    const summaryData = [];

    months.forEach((month, index) => {
      const monthRange = valueRanges[index + 6];
      if (monthRange?.values) {
        monthlyData[month] = monthRange.values.slice(1).map(row => ({
          DESCRIPTION: row[0] || '',
          AMOUNT: parseFloat((row[1] || '0').replace(/[$,]/g, '')),
          CATEGORY: row[2] || '',
          'Income/Expense': row[3] || ''
        }));

        const monthData = monthlyData[month];
        const income = monthData
          .filter(row => row['Income/Expense'] === 'Income')
          .reduce((sum, row) => sum + (row.AMOUNT || 0), 0);
        const expenses = monthData
          .filter(row => row['Income/Expense'] === 'Expense')
          .reduce((sum, row) => sum + Math.abs(row.AMOUNT || 0), 0);

        summaryData.push({
          Month: month,
          Income: income,
          Expenses: expenses,
          NetProfit: income - expenses
        });
      }
    });

    return { summary: summaryData, monthly: monthlyData };
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return { summary: [], monthly: {} };
  }
}

export default async function handler(req, res) {
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
              'June!A:D',
              'July!A:D',
              'August!A:D',
              'September!A:D',
              'October!A:D',
              'November!A:D',
              'Network Payment Schedule!A:H'
          ],
      });

      const [mainResponse, financialResponse, invoicesResponse, payrollResponse, mediaBuyerResponse] =
          batchResponse.data.valueRanges || [];
          const networkPaymentsResponse = batchResponse.data.valueRanges[batchResponse.data.valueRanges.length - 1];
          
          const networkPayments = networkPaymentsResponse?.values?.slice(1).map(row => ({
            network: row[0] || '',
            offer: row[1] || '',
            paymentTerms: row[2] || '',
            dailyCap: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
            dailyBudget: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
            currentExposure: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
            availableBudget: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
            riskLevel: row[7] || ''
        }));
        
// Clean financial resources
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

// Add validation
if (!Array.isArray(cleanedFinancialResources)) {
console.error('Invalid financial resources data');
cleanedFinancialResources = [];
}

let result = {
  performanceData: [],
  cashFlowData: null,
  networkPayments, // Change from networkPaymentsData
  plData: await processPLData(batchResponse),
  rawData: {
      financialResources: cleanedFinancialResources,
      invoices: invoicesResponse?.values || [],
      payroll: payrollResponse?.values || [],
      mediaBuyerSpend: mediaBuyerResponse?.values || [],
      networkPayments // Add this
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
        networkPayments // Add this
    };
      return res.status(200).json(result);
  } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'API Error', details: error.message });
  }
}