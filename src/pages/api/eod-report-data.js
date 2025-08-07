export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
    const EOD_BOARD_ID = '9498909231'; // August 2025 Daily P&L Board

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    console.log('Fetching EOD report data from board:', EOD_BOARD_ID);

    // GraphQL query to fetch EOD report data
    const query = `
      query {
        boards(ids: ${EOD_BOARD_ID}) {
          items_page(limit: 100) {
            items {
              id
              name
              column_values {
                id
                type
                value
                text
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': MONDAY_API_TOKEN,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EOD report API error response:', errorText);
      throw new Error(`EOD report API error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('EOD report API raw response length:', responseText.length);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse EOD report API response as JSON:', parseError);
      throw new Error(`Invalid JSON response from EOD report API: ${responseText.substring(0, 200)}`);
    }

    if (data.errors) {
      console.error('EOD report API errors:', data.errors);
      return res.status(500).json({ error: 'EOD report API returned errors', details: data.errors });
    }

    const items = data.data.boards[0]?.items_page?.items || [];
    console.log('Total EOD report items:', items.length);

    // Process items to extract detailed data
    const processedItems = items.map(item => {
      // Look for date-related columns
      const dateColumn = item.column_values.find(col => 
        col.type === 'date' || 
        col.type === 'timeline' ||
        col.id === 'date' ||
        col.id === 'timeline__1' ||
        col.id === 'date4'
      );

      // Extract other relevant columns using correct column IDs
      const adAccountColumn = item.column_values.find(col => 
        col.id === 'ad_account__1'
      );
      
      const networkColumn = item.column_values.find(col => 
        col.id === 'network__1'
      );
      
      const offerColumn = item.column_values.find(col => 
        col.id === 'offer__1'
      );
      
      const adRevColumn = item.column_values.find(col => 
        col.id === 'ad_rev__1'
      );
      
      const adSpendColumn = item.column_values.find(col => 
        col.id === 'ad_spend__1'
      );

      return {
        id: item.id,
        name: item.name,
        date: dateColumn?.text || 'No date',
        rawDateValue: dateColumn?.value || null,
        adAccount: adAccountColumn?.text || 'N/A',
        network: networkColumn?.text || 'N/A',
        offer: offerColumn?.text || 'N/A',
        adRev: adRevColumn?.text || '0',
        adSpend: adSpendColumn?.text || '0',
        rawColumns: item.column_values.map(col => ({
          id: col.id,
          type: col.type,
          text: col.text,
          value: col.value
        }))
      };
    });

    // Sort items by date to find the most recent
    const sortedItems = processedItems.sort((a, b) => {
      const dateA = a.rawDateValue ? new Date(JSON.parse(a.rawDateValue).date) : new Date(0);
      const dateB = b.rawDateValue ? new Date(JSON.parse(b.rawDateValue).date) : new Date(0);
      return dateB - dateA; // Most recent first
    });

    const mostRecentItem = sortedItems[0];
    const latestEODDate = mostRecentItem?.date || 'No date found';

    console.log('Latest EOD report date:', latestEODDate);

    res.status(200).json({
      success: true,
      latestEODDate,
      totalItems: items.length,
      allItems: sortedItems.slice(0, 10), // Keep last 10 items for debugging
      eodData: sortedItems, // Include all processed EOD data for comparison
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching EOD report data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch EOD report data',
      details: error.message 
    });
  }
} 