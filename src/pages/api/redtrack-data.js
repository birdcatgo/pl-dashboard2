import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1M8uVndnkYg4pNyjVc7nahCQr2SRUnuP4NBpCAA0iHRY';
    const range = 'Formatted Data!A:Z';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Get headers from the first row
    const headers = rows[0];
    
    // Convert rows to objects
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Redtrack data:', error);
    res.status(500).json({ error: 'Error fetching data from Google Sheets' });
  }
} 