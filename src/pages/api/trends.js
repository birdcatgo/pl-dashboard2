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
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Handle GET request to retrieve trend data
    if (req.method === 'GET') {
      try {
        // First, check if the 'Daily Trends' sheet exists
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SHEET_ID,
        });
        
        const sheetsInfo = spreadsheet.data.sheets;
        let dailyTrendsSheetExists = false;
        let dailyTrendsSheetId = null;
        
        for (const sheet of sheetsInfo) {
          if (sheet.properties.title === 'Daily Trends') {
            dailyTrendsSheetExists = true;
            dailyTrendsSheetId = sheet.properties.sheetId;
            break;
          }
        }
        
        // If the sheet doesn't exist, create it
        if (!dailyTrendsSheetExists) {
          console.log('Daily Trends sheet not found, creating it...');
          
          // Create a new sheet
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            resource: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: 'Daily Trends',
                    },
                  },
                },
              ],
            },
          });
          
          console.log('Created Daily Trends sheet');
          
          // Return empty data since the sheet is new
          return res.status(200).json({ trendData: [] });
        }
        
        // Get data from the sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Daily Trends!A:A',
        });
        
        const rows = response.data.values || [];
        
        // If the sheet exists but has no data, return empty array
        if (rows.length < 2) {
          return res.status(200).json({ trendData: [] });
        }
        
        // Process the data from rows
        const trendData = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] && rows[i][0]) {
            try {
              const jsonData = JSON.parse(rows[i][0]);
              trendData.push(jsonData);
            } catch (error) {
              console.warn(`Failed to parse JSON data in row ${i+1}:`, error);
            }
          }
        }
        
        return res.status(200).json({ trendData });
      } catch (error) {
        console.error('Error getting trend data:', error);
        return res.status(500).json({ error: 'Failed to retrieve trend data', details: error.message });
      }
    }
    
    // Handle POST request to save trend data
    if (req.method === 'POST') {
      try {
        const { trendData } = req.body;
        
        if (!trendData || !Array.isArray(trendData)) {
          return res.status(400).json({ error: 'Invalid trend data. Expected an array.' });
        }
        
        // First, check if the 'Daily Trends' sheet exists
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SHEET_ID,
        });
        
        const sheetsInfo = spreadsheet.data.sheets;
        let dailyTrendsSheetExists = false;
        
        for (const sheet of sheetsInfo) {
          if (sheet.properties.title === 'Daily Trends') {
            dailyTrendsSheetExists = true;
            break;
          }
        }
        
        // If the sheet doesn't exist, create it
        if (!dailyTrendsSheetExists) {
          console.log('Daily Trends sheet not found, creating it...');
          
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            resource: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: 'Daily Trends',
                    },
                  },
                },
              ],
            },
          });
          
          console.log('Created Daily Trends sheet');
        }
        
        // Prepare data for the sheet
        const rows = [
          ['Trend Data (JSON)'], // Header
        ];
        
        // Add each trend data as a JSON string in a row
        trendData.forEach(trend => {
          rows.push([JSON.stringify(trend)]);
        });
        
        // Clear existing data and add new data
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SHEET_ID,
          range: 'Daily Trends!A:A',
        });
        
        // Write new data
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Daily Trends!A1',
          valueInputOption: 'RAW',
          resource: {
            values: rows,
          },
        });
        
        console.log('Updated Daily Trends sheet with new data');
        
        return res.status(200).json({ success: true, message: 'Trend data saved successfully' });
      } catch (error) {
        console.error('Error saving trend data:', error);
        return res.status(500).json({ error: 'Failed to save trend data', details: error.message });
      }
    }

    // If not GET or POST, return method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
} 