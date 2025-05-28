import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';

export default async function handler(req, res) {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      console.error('Missing Google credentials environment variables');
      return res.status(500).json({ 
        error: 'Google credentials not configured',
        details: 'Please check that GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY are set in your environment variables'
      });
    }

    console.log('Attempting to authenticate with Google...');
    const auth = await getGoogleAuth();
    console.log('Google authentication successful');

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets API initialized');

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const range = 'Network Exposure!A2:H';

    console.log('Fetching data from spreadsheet...', { spreadsheetId, range });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    console.log('Data fetched successfully');

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in spreadsheet');
      return res.status(404).json({ error: 'No data found.' });
    }

    console.log(`Processing ${rows.length} rows of data...`);
    // Transform the data into a more usable format
    const networks = rows.map(row => ({
      name: row[0] || '',
      invoiceNumber: row[1] || '',
      c2fAmountDue: parseFloat(row[2]?.replace(/[^0-9.-]+/g, '')) || 0,
      periodStart: row[3] || '',
      periodEnd: row[4] || '',
      networkAmountDue: parseFloat(row[5]?.replace(/[^0-9.-]+/g, '')) || 0,
      payPeriod: row[6] || '',
      netTerms: parseInt(row[7]) || 0
    }));

    // Group networks by pay period
    const groupedNetworks = networks.reduce((acc, network) => {
      const period = network.payPeriod || 'Other';
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(network);
      return acc;
    }, {});

    console.log('Data processing complete, sending response');
    res.status(200).json({ networks: groupedNetworks });
  } catch (error) {
    console.error('Error in network-exposure API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch network exposure data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 