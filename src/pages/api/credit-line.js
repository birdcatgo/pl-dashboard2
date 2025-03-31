import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch only the required ranges in parallel
    const [performanceData, cashFlowData, invoicesData, payrollData] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: "'Main Sheet'!A:Z",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: "'Financial Resources'!A:D",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: "'Invoices'!A:F",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: "'Payroll'!A:D",
      }),
    ]);

    // Process the data server-side to reduce client-side computation
    const processedData = {
      performanceData: processPerformanceData(performanceData.data.values),
      cashFlowData: processCashFlowData(cashFlowData.data.values),
      invoicesData: processInvoicesData(invoicesData.data.values),
      payrollData: processPayrollData(payrollData.data.values),
    };

    // Cache the response for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(processedData);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

function processPerformanceData(data) {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
}

function processCashFlowData(data) {
  const [headers, ...rows] = data;
  const financialResources = rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header.toLowerCase()] = row[index];
    });
    return {
      account: entry.account,
      available: parseFloat(entry.available) || 0,
      owing: parseFloat(entry.owing) || 0,
      limit: parseFloat(entry.limit) || 0,
    };
  });

  return { financialResources };
}

function processInvoicesData(data) {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
}

function processPayrollData(data) {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
} 