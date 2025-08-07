export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
    const CALENDAR_BOARD_ID = '1449674691';
    const USER_ID = '17155872'; // Your Monday.com user ID

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // GraphQL query to fetch calendar items from the specific board
    const query = `
      query {
        boards(ids: ${CALENDAR_BOARD_ID}) {
          items_page(limit: 500) {
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
      throw new Error(`Monday.com API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      return res.status(500).json({ error: 'Monday.com API returned errors', details: data.errors });
    }

    // Debug: Log the response structure
    console.log('Calendar API response structure:', JSON.stringify(data.data, null, 2));

    const allItems = data.data.boards[0].items_page?.items || [];
    console.log('Total calendar items returned:', allItems.length);

    // Process calendar items to extract relevant information
    const calendarItems = allItems.map(item => {
      // Debug: Log all column values for the first few items to find the correct date column
      if (allItems.indexOf(item) < 3) {
        console.log(`Item "${item.name}" column values:`, item.column_values.map(col => ({
          id: col.id,
          type: col.type,
          text: col.text,
          value: col.value
        })));
      }
      
      // Extract date from column values - try multiple possible column IDs
      const dateColumn = item.column_values.find(col => 
        col.id === 'timeline__1' || 
        col.id === 'date4' || 
        col.id === 'date' ||
        col.type === 'timeline' ||
        col.type === 'date'
      );
      
      // Extract assignee from column values (people column)
      const assignColumn = item.column_values.find(col => 
        col.id === 'multiple_person_mkq8raaf' || 
        col.id === 'person' ||
        col.type === 'people'
      );

      // Extract status from column values
      const statusColumn = item.column_values.find(col => 
        col.id === 'status' || col.type === 'status'
      );

      // Extract category from column values
      const categoryColumn = item.column_values.find(col => 
        col.id === 'dropdown' || col.type === 'dropdown'
      );

      return {
        id: item.id,
        name: item.name,
        date: dateColumn?.text || null,
        assignee: assignColumn?.text || null,
        status: statusColumn?.text || 'No Status',
        category: categoryColumn?.text || null,
        mondayId: item.id,
        rawDateValue: dateColumn?.value || null
      };
    });

    console.log('All processed calendar items:', calendarItems);

    // Filter for today's items assigned to the user
    const todaysItems = calendarItems.filter(item => {
      // Check if the item is assigned to the user
      const isAssignedToUser = item.assignee && item.assignee.includes('Ange');
      
      // Check if the item is for today
      const isToday = item.date && item.date.includes(today);
      
      console.log(`Item "${item.name}" - date: "${item.date}", assignee: "${item.assignee}", isToday: ${isToday}, isAssigned: ${isAssignedToUser}`);
      
      return isToday && isAssignedToUser;
    });

    console.log('Today\'s items assigned to user:', todaysItems);

    res.status(200).json({
      success: true,
      items: todaysItems,
      totalItems: calendarItems.length,
      todaysItems: todaysItems.length,
      today: today
    });

  } catch (error) {
    console.error('Error fetching Monday.com calendar:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Monday.com calendar',
      details: error.message 
    });
  }
} 