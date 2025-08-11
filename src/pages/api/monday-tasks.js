export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Monday.com API configuration
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
    const BOARD_ID = '6741994585';
    const GROUP_NAME = 'ANGE';
    
    // Check for debug mode
    const showAll = req.query.showAll === 'true';
    console.log('Monday Tasks API called with showAll:', showAll);

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
    
    // Filter to show everything except DONE status (unless debug mode)
    let finalTasks = tasks;
    if (!showAll) {
      console.log('=== FILTERING TASKS ===');
      console.log('Raw statuses before filtering:', tasks.map(t => ({ name: t.name, status: t.status, rawStatus: t.status })));
      
      finalTasks = tasks.filter(task => {
        const status = task.status || '';
        const statusLower = status.toLowerCase();
        
        // Check for completed statuses
        const hasCheckmark = status.includes('✅');
        const hasDone = statusLower.includes('done');
        const hasComplete = statusLower.includes('complete');
        const hasFinished = statusLower.includes('finished');
        
        const isCompleted = hasCheckmark || hasDone || hasComplete || hasFinished;
        
        const shouldShow = !isCompleted;
        
        // Debug: Log each task's filtering decision
        console.log(`Task "${task.name}"`);
        console.log(`  Status: "${task.status}"`);
        console.log(`  Has checkmark: ${hasCheckmark}`);
        console.log(`  Has done: ${hasDone}`);
        console.log(`  Has complete: ${hasComplete}`);
        console.log(`  Has finished: ${hasFinished}`);
        console.log(`  Is completed: ${isCompleted}`);
        console.log(`  Should show: ${shouldShow}`);
        console.log('---');
        
        return shouldShow;
      });
      
      console.log('=== FILTERING COMPLETE ===');
      console.log('Tasks after filtering:', finalTasks.map(t => ({ name: t.name, status: t.status })));
    }
    
    // Debug: Log final tasks
    console.log('Final tasks to show:', finalTasks);
    
    // Log status summary for debugging
    const statusCounts = {};
    tasks.forEach(task => {
      const status = task.status || 'No Status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('Task status summary:', statusCounts);
    
    // If no tasks found, show all tasks for debugging
    if (finalTasks.length === 0 && tasks.length > 0) {
      console.log('No tasks found with current filter. Showing all tasks for debugging.');
      console.log('All task statuses:', tasks.map(t => ({ name: t.name, status: t.status })));
      finalTasks = tasks;
    }
    
    // TEMPORARY: Force show only non-done tasks for debugging
    if (!showAll && finalTasks.length === tasks.length) {
      console.log('WARNING: Filter not working - showing all tasks. Forcing manual filter...');
      finalTasks = tasks.filter(task => {
        const status = task.status || '';
        return !status.includes('✅') && !status.toLowerCase().includes('done');
      });
      console.log('Manual filter result:', finalTasks.map(t => ({ name: t.name, status: t.status })));
    }

    res.status(200).json({
      success: true,
      tasks: finalTasks,
      totalTasks: tasks.length,
      activeTasks: finalTasks.length,
      allTasksShown: finalTasks.length === 0 && tasks.length > 0,
      debugMode: showAll
    });

  } catch (error) {
    console.error('Error fetching Monday.com tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Monday.com tasks',
      details: error.message 
    });
  }
} 