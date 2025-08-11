export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, dueDate, boardId } = req.body;

    if (!itemId || !dueDate || !boardId) {
      return res.status(400).json({ error: 'Missing required fields: itemId, dueDate, boardId' });
    }

    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // GraphQL mutation to update the due date (timeline column)
    const mutation = `
      mutation {
        change_column_value(
          board_id: ${boardId},
          item_id: ${itemId},
          column_id: "timeline__1",
          value: "{\\"from\\":\\"${dueDate}\\",\\"to\\":\\"${dueDate}\\"}"
        ) {
          id
        }
      }
    `;

    console.log('Updating Monday.com due date:', {
      itemId,
      dueDate,
      boardId,
      mutation
    });

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
      throw new Error(`Monday.com API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      return res.status(500).json({ 
        error: 'Monday.com API returned errors', 
        details: data.errors 
      });
    }

    console.log('Successfully updated due date on Monday.com:', data);

    res.status(200).json({
      success: true,
      message: 'Due date updated successfully',
      data: data.data
    });

  } catch (error) {
    console.error('Error updating Monday.com due date:', error);
    res.status(500).json({ 
      error: 'Failed to update due date',
      details: error.message 
    });
  }
}
