import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';

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
  console.log('Environment Variables Check:');
  console.log('SHEET_ID exists:', !!process.env.SHEET_ID);
  console.log('GOOGLE_CLIENT_EMAIL exists:', !!process.env.GOOGLE_CLIENT_EMAIL);
  console.log('GOOGLE_PRIVATE_KEY exists:', !!process.env.GOOGLE_PRIVATE_KEY?.includes('PRIVATE KEY'));

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
        'Network Payment Schedule!A:H',
      ],
    });

    const valueRanges = batchResponse.data.valueRanges || [];
    if (valueRanges.length < 13) {
      throw new Error('Insufficient data returned from Google Sheets.');
    }

    const [mainResponse, financialResponse, invoicesResponse, payrollResponse, mediaBuyerResponse] = valueRanges;
    const networkPaymentsResponse = valueRanges[valueRanges.length - 1];

    const networkPayments = (networkPaymentsResponse?.values || []).slice(1).map((row) => ({
      network: row[0] || '',
      offer: row[1] || '',
      paymentTerms: row[2] || '',
      dailyCap: parseFloat((row[3] || '0').replace(/[$,]/g, '')) || 0,
      dailyBudget: parseFloat((row[4] || '0').replace(/[$,]/g, '')) || 0,
      currentExposure: parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0,
      availableBudget: parseFloat((row[6] || '0').replace(/[$,]/g, '')) || 0,
      riskLevel: row[7] || '',
    }));

    console.log('Network Payments:', networkPayments);

    const result = {
      performanceData: (mainResponse?.values || []).slice(1).map((row) => ({
        Date: row[0] || '',
        Network: row[1] || '',
        Offer: row[2] || '',
        // Additional fields...
      })),
      cashFlowData: {
        ...processCashFlowData(financialResponse, invoicesResponse, payrollResponse, mediaBuyerResponse),
        networkPayments,
      },
      plData: await processPLData(batchResponse),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'API Error', details: error.message });
  }
}
