import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';

export default async function handler(req, res) {
  // Set cache-busting headers to ensure fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
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

    if (!response.data.values || response.data.values.length === 0) {
      console.log('No data found in spreadsheet');
      return res.status(404).json({ error: 'No data found.' });
    }

    // Process the data and map to expected format
    console.log('Processing Network Exposure data...');
    console.log('Sample row:', response.data.values[1]);
    
    const processedData = response.data.values.slice(1).map((row, index) => {
      console.log(`Row ${index + 1}:`, row);
      
      let networkName = (row[0] || '').trim(); // Column A: Network
      const invoiceNumber = row[1] || ''; // Column B: Invoice Number
      const exposureAmount = row[2] || '0'; // Column C: C2F Amount Due
      const startDate = row[3] || ''; // Column D: Period Start
      const endDate = row[4] || ''; // Column E: Period End
      const networkAmountDue = parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0; // Column F: Network Amount Due
      const payPeriodFromSheet = row[6] || ''; // Column G: Pay Period
      const netTermsFromSheet = parseInt(row[7] || '30') || 30; // Column H: Net Terms
      
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
      
      // Use the actual net terms from the sheet (column H) instead of parsing pay period text
      const netTerms = netTermsFromSheet;
      let paymentTerms = payPeriodFromSheet.trim();
      
      // Format the payment terms display based on the pay period and net terms
      if (paymentTerms.toLowerCase().includes('weekly')) {
        paymentTerms = 'Weekly';
      } else if (paymentTerms.toLowerCase().includes('bi monthly') || paymentTerms.toLowerCase().includes('bi-monthly')) {
        paymentTerms = 'Bi-Monthly';
      } else if (paymentTerms.toLowerCase().includes('monthly')) {
        paymentTerms = 'Monthly';
      } else {
        // If it's a specific net term, format it as "Net X"
        paymentTerms = `Net ${netTerms}`;
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
        offer: '', // Not available in this sheet structure
        paymentTerms: paymentTerms,
        dailyCap: 0, // Not available in this sheet structure
        dailyBudget: 0, // Not available in this sheet structure
        c2fAmountDue: currentExposure, // Use column C for exposure amount
        availableBudget: networkAmountDue, // Use column F
        riskLevel: '', // Not available in this sheet structure
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
    });
  }
} 