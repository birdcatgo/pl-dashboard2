export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Allow testing with a specific date
    const testDate = req.query.testDate;
    let today;
    if (testDate) {
      // Parse the date string properly (YYYY-MM-DD format)
      today = new Date(testDate + 'T00:00:00Z');
      console.log('Test date provided:', testDate, 'Parsed date:', today.toISOString());
    } else {
      today = new Date();
      console.log('Using current date:', today.toISOString());
    }
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    const dayOfMonth = today.getDate();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const year = today.getFullYear();

    // Default scheduled tasks configuration (fallback if no localStorage data)
    const defaultScheduledTasks = [
      {
        id: 'weekly-invoices',
        name: 'Weekly Invoices',
        type: 'weekly',
        schedule: 'Every Monday',
        dayOfWeek: 1, // Monday
        enabled: true
      },
      {
        id: 'bi-monthly-invoices',
        name: 'Bi-Monthly Invoices',
        type: 'bi-monthly',
        schedule: '2nd and 17th of every month',
        dayOfMonth: [2, 17],
        enabled: true
      },
      {
        id: 'monthly-invoices',
        name: 'Monthly Invoices',
        type: 'monthly',
        schedule: '2nd of every month',
        dayOfMonth: 2,
        enabled: true
      },
      {
        id: 'media-buyer-pl',
        name: 'Media Buyer Profit & Loss',
        type: 'monthly',
        schedule: '2nd of every month',
        dayOfMonth: 2,
        enabled: true
      },
      {
        id: 'company-pl',
        name: 'Company Profit & Loss',
        type: 'monthly',
        schedule: '2nd of every month',
        dayOfMonth: 2,
        enabled: true
      }
    ];

    // Get the dynamic configuration
    // Note: In a real server environment, you'd read this from a database
    // For now, we'll use the default configuration with the Monday update
    let scheduledTasksConfig = defaultScheduledTasks;

    // Try to get configuration from query parameter (for testing)
    if (req.query.config) {
      try {
        scheduledTasksConfig = JSON.parse(decodeURIComponent(req.query.config));
      } catch (e) {
        console.log('Could not parse config from query, using default');
      }
    }

    console.log('Using scheduled tasks configuration:', scheduledTasksConfig);

    const scheduledTasks = [];

    // Process each configured task
    scheduledTasksConfig.forEach(taskConfig => {
      if (!taskConfig.enabled) {
        return; // Skip disabled tasks
      }

      let shouldAddTask = false;

      switch (taskConfig.type) {
        case 'daily':
          shouldAddTask = true;
          break;
          
        case 'weekly':
          shouldAddTask = (dayOfWeek === taskConfig.dayOfWeek);
          break;
          
        case 'bi-monthly':
          if (Array.isArray(taskConfig.dayOfMonth)) {
            shouldAddTask = taskConfig.dayOfMonth.includes(dayOfMonth);
          } else {
            shouldAddTask = (dayOfMonth === taskConfig.dayOfMonth);
          }
          break;
          
        case 'monthly':
          shouldAddTask = (dayOfMonth === taskConfig.dayOfMonth);
          break;
      }

      if (shouldAddTask) {
        scheduledTasks.push({
          id: `${taskConfig.id}-${year}-${month}-${dayOfMonth}`,
          text: taskConfig.name,
          type: taskConfig.type,
          schedule: taskConfig.schedule,
          completed: false,
          createdAt: today.toISOString(),
          completedAt: null,
          fromScheduled: true
        });
      }
    });

    console.log(`Generated ${scheduledTasks.length} tasks for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} ${today.toDateString()}`);

    res.status(200).json({
      success: true,
      scheduledTasks,
      date: {
        dayOfWeek,
        dayOfMonth,
        month,
        year,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      }
    });

  } catch (error) {
    console.error('Error generating scheduled tasks:', error);
    res.status(500).json({ 
      error: 'Failed to generate scheduled tasks',
      details: error.message 
    });
  }
}