export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemName } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
    const BOARD_ID = '6741994585';
    const GROUP_ID = 'new_group71601__1'; // ANGE group ID

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // GraphQL mutation to create a new item in the ANGE group
    const mutation = `
      mutation {
        create_item(
          board_id: ${BOARD_ID}, 
          group_id: "${GROUP_ID}", 
          item_name: "${itemName.replace(/"/g, '\\"')}",
          column_values: "{\"multiple_person_mkq8raaf\":{\"personsAndTeams\":[{\"id\":17155872,\"kind\":\"person\"}]}}"
        ) {
          id
          name
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
      throw new Error(`Monday.com API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      return res.status(500).json({ error: 'Monday.com API returned errors', details: data.errors });
    }

    console.log('Successfully created Monday.com item:', { itemName, itemId: data.data.create_item.id });

    res.status(200).json({
      success: true,
      message: 'Item created successfully',
      itemId: data.data.create_item.id,
      itemName: data.data.create_item.name
    });

  } catch (error) {
    console.error('Error creating Monday.com item:', error);
    res.status(500).json({ 
      error: 'Failed to create Monday.com item',
      details: error.message 
    });
  }
} 