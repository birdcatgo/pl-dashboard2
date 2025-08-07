export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, boardId } = req.body;

    if (!itemId || !boardId) {
      return res.status(400).json({ error: 'Item ID and Board ID are required' });
    }

    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // GraphQL mutation to update item status
    const mutation = `
      mutation {
        change_column_value(
          board_id: ${boardId}, 
          item_id: ${itemId}, 
          column_id: "status", 
          value: "{\\\"index\\\":${req.body.statusIndex || 1}}"
        ) {
          id
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
      body: JSON.stringify({ query: mutation })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Monday.com API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Monday.com API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      return res.status(500).json({ error: 'Monday.com API returned errors', details: data.errors });
    }

    console.log('Successfully updated Monday.com item status:', { 
      itemId, 
      boardId, 
      response: data,
      mutation: mutation 
    });

    res.status(200).json({
      success: true,
      message: 'Item status updated to Done'
    });

  } catch (error) {
    console.error('Error updating Monday.com item status:', error);
    res.status(500).json({ 
      error: 'Failed to update Monday.com item status',
      details: error.message 
    });
  }
} 