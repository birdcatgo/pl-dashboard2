export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
    const BOARD_ID = '6741994585';
    const GROUP_NAME = 'ANGE';

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // GraphQL query to fetch tasks from the specific board and group
    const query = `
      query {
        boards(ids: ${BOARD_ID}) {
          groups {
            id
            title
          }
          items_page(limit: 500) {
            items {
              id
              name
              group {
                id
                title
              }
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
    console.log('Monday.com API response structure:', JSON.stringify(data.data, null, 2));

    // Find the ANGE group and extract tasks
    const board = data.data.boards[0];
    const angeGroup = board.groups.find(group => 
      group.title.toLowerCase() === GROUP_NAME.toLowerCase()
    );
    
    // Debug: Log the ANGE group
    console.log('ANGE group found:', angeGroup);
    
    // Debug: Log all available groups
    console.log('All available groups:', board.groups);

    if (!angeGroup) {
      return res.status(404).json({ error: `Group "${GROUP_NAME}" not found` });
    }

    // Debug: Log all items to see their group assignments
    const allItems = data.data.boards[0].items_page?.items || [];
    console.log('Total items returned from API:', allItems.length);
    console.log('All items with their groups:', allItems.map(item => ({
      name: item.name,
      groupTitle: item.group?.title,
      groupId: item.group?.id
    })));
    
    const angeTasks = allItems.filter(item => 
      item.group?.id === angeGroup.id
    );
    
    // Debug: Log all tasks from ANGE group
    console.log('All tasks from ANGE group:', angeTasks);

    // Process tasks to extract relevant information
    const tasks = angeTasks.map(item => {
      // Extract status from column values
      const statusColumn = item.column_values.find(col => 
        col.id === 'status'
      );
      
      const assignColumn = item.column_values.find(col => 
        col.id === 'multiple_person_mkq8raaf'
      );

      const dueDateColumn = item.column_values.find(col => 
        col.id === 'timeline__1'
      );

      const nextStepsColumn = item.column_values.find(col => 
        col.id === 'text_mkkv8te7'
      );

      return {
        id: item.id,
        name: item.name,
        status: statusColumn?.text || 'No Status',
        assignee: assignColumn?.text || 'Unassigned',
        dueDate: dueDateColumn?.text || null,
        nextSteps: nextStepsColumn?.text || null,
        mondayId: item.id
      };
    });

    // Debug: Log all processed tasks
    console.log('All processed tasks:', tasks);
    
    // Filter to show only "Working On It" and no status tasks
    const activeTasks = tasks.filter(task => {
      const status = task.status.toLowerCase();
      
      // Show tasks with "Working On It" status
      const isWorkingOnIt = status.includes('working on it');
      
      // Also show tasks with no status or "SET STATUS"
      const hasNoStatus = !task.status || task.status === 'No Status' || task.status === 'SET STATUS';
      
      const shouldShow = isWorkingOnIt || hasNoStatus;
      
      // Debug: Log each task's filtering decision
      console.log(`Task "${task.name}" (status: "${task.status}") - shouldShow: ${shouldShow}`);
      
      return shouldShow;
    });
    
    // Debug: Log final active tasks
    console.log('Final active tasks:', activeTasks);

    res.status(200).json({
      success: true,
      tasks: activeTasks,
      totalTasks: tasks.length,
      activeTasks: activeTasks.length
    });

  } catch (error) {
    console.error('Error fetching Monday.com tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Monday.com tasks',
      details: error.message 
    });
  }
} 