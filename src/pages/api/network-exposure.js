import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Network Exposure!A:H',
    });

    if (!response.data.values || response.data.values.length <= 1) {
      console.log('No data found in Network Exposure sheet');
      return res.status(200).json({ networks: {} });
    }

    // Process the data and map to expected format
    console.log('Processing Network Exposure data...');
    console.log('Sample row:', response.data.values[1]);
    
    const processedData = response.data.values.slice(1).map((row, index) => {
      console.log(`Row ${index + 1}:`, row);
      
      let networkName = (row[0] || '').trim(); // Trim whitespace
      const offer = row[1] || '';
      const exposureAmount = row[2] || '0'; // Column C contains the exposure amount
      const startDate = row[3] || ''; // Start date
      const endDate = row[4] || ''; // End date
      const additionalField = parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0; // Not sure what this is
      const paymentTermsFromSheet = row[6] || 'Net 30'; // Column G contains actual payment terms
      const riskLevel = row[7] || '';
      
      // Normalize Banner and Banner Edge to just "Banner"
      if (networkName.toLowerCase().includes('banner edge') || 
          networkName.toLowerCase().trim() === 'banner edge') {
        networkName = 'Banner';
      } else if (networkName.toLowerCase().includes('banner') || 
                 networkName.toLowerCase().trim() === 'banner') {
        networkName = 'Banner';
      }
      
      // Parse exposure amount from column C
      const currentExposure = parseFloat((exposureAmount || '0').replace(/[$,]/g, '')) || 0;
      
      // Use the actual payment terms from the sheet (column 6)
      let paymentTerms = paymentTermsFromSheet.trim();
      let netTerms = 30; // Default
      
      // Parse the payment terms to determine net terms
      const lowerPaymentTerms = paymentTerms.toLowerCase();
      if (lowerPaymentTerms.includes('weekly')) {
        netTerms = 7;
        paymentTerms = 'Weekly';
      } else if (lowerPaymentTerms.includes('bi monthly') || lowerPaymentTerms.includes('bi-monthly')) {
        netTerms = 60; // 60 days for bi-monthly
        paymentTerms = 'Bi-Monthly';
      } else if (lowerPaymentTerms.includes('monthly')) {
        netTerms = 30;
        paymentTerms = 'Monthly';
      } else {
        // Check for specific net terms like "Net 30", "Net 15", etc.
        const netMatch = paymentTerms.match(/net\s*(\d+)/i);
        if (netMatch) {
          netTerms = parseInt(netMatch[1]);
          paymentTerms = `Net ${netTerms}`;
        } else {
          paymentTerms = 'Net 30';
          netTerms = 30;
        }
      }
      
      // Use the actual dates from the sheet if available, otherwise use defaults
      let periodStart, periodEnd;
      if (startDate && endDate) {
        // Parse the dates from the sheet
        periodStart = startDate;
        periodEnd = endDate;
      } else {
        // Use defaults
        const now = new Date();
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      }
      
      console.log(`Network ${networkName}: exposure = ${currentExposure}, paymentTerms = ${paymentTerms}, netTerms = ${netTerms}`);
      
      return {
        name: networkName,
        offer: offer,
        paymentTerms: paymentTerms,
        dailyCap: 0, // Not available in this sheet structure
        dailyBudget: 0, // Not available in this sheet structure
        c2fAmountDue: currentExposure, // Use column C for exposure amount
        availableBudget: additionalField, // Use column F
        riskLevel: riskLevel,
        netTerms: netTerms,
        periodEnd: periodEnd,
        periodStart: periodStart,
        payPeriod: paymentTerms
      };
    });
    
    console.log('Processed data sample:', processedData[0]);
    
    // Consolidate duplicate networks (especially Banner/Banner Edge)
    const consolidatedData = {};
    processedData.forEach(network => {
      const key = network.name;
      if (consolidatedData[key]) {
        // Merge the data - add exposure amounts and keep most recent payment terms
        consolidatedData[key].c2fAmountDue += network.c2fAmountDue;
        consolidatedData[key].availableBudget += network.availableBudget;
        // Keep the payment terms from the entry with higher exposure
        if (network.c2fAmountDue > consolidatedData[key].c2fAmountDue - network.c2fAmountDue) {
          consolidatedData[key].paymentTerms = network.paymentTerms;
          consolidatedData[key].netTerms = network.netTerms;
          consolidatedData[key].payPeriod = network.payPeriod;
          consolidatedData[key].riskLevel = network.riskLevel;
        }
      } else {
        consolidatedData[key] = network;
      }
    });
    
    const finalData = Object.values(consolidatedData);
    console.log('Consolidated data sample:', finalData[0]);
    
    // Group by payment terms
    const networks = finalData.reduce((acc, network) => {
      const paymentTermsKey = network.paymentTerms;
      if (!acc[paymentTermsKey]) {
        acc[paymentTermsKey] = [];
      }
      acc[paymentTermsKey].push(network);
      return acc;
    }, {});
    
    console.log('Grouped networks:', Object.keys(networks));

    return res.status(200).json({ networks });
  } catch (error) {
    console.error('Error fetching network exposure data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch network exposure data',
      details: error.message 
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