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

    const scheduledTasks = [];

    // Weekly Invoices - Every Tuesday (day 2)
    if (dayOfWeek === 2) {
      scheduledTasks.push({
        id: `weekly-invoices-${year}-${month}-${dayOfMonth}`,
        text: 'Weekly Invoices',
        type: 'weekly',
        schedule: 'Every Tuesday',
        completed: false,
        createdAt: today.toISOString(),
        completedAt: null,
        fromScheduled: true
      });
    }

    // Bi-Monthly Invoices - 2nd and 17th of every month
    if (dayOfMonth === 2 || dayOfMonth === 17) {
      scheduledTasks.push({
        id: `bi-monthly-invoices-${year}-${month}-${dayOfMonth}`,
        text: 'Bi-Monthly Invoices',
        type: 'bi-monthly',
        schedule: `${dayOfMonth === 2 ? '2nd' : '17th'} of every month`,
        completed: false,
        createdAt: today.toISOString(),
        completedAt: null,
        fromScheduled: true
      });
    }

    // Monthly Invoices - 2nd of every month (only add if it's the 2nd and not already added as bi-monthly)
    if (dayOfMonth === 2) {
      scheduledTasks.push({
        id: `monthly-invoices-${year}-${month}-${dayOfMonth}`,
        text: 'Monthly Invoices',
        type: 'monthly',
        schedule: '2nd of every month',
        completed: false,
        createdAt: today.toISOString(),
        completedAt: null,
        fromScheduled: true
      });
    }

    // Media Buyer Profit & Loss - 2nd of every month
    if (dayOfMonth === 2) {
      scheduledTasks.push({
        id: `media-buyer-pl-${year}-${month}-${dayOfMonth}`,
        text: 'Media Buyer Profit & Loss',
        type: 'monthly',
        schedule: '2nd of every month',
        completed: false,
        createdAt: today.toISOString(),
        completedAt: null,
        fromScheduled: true
      });
    }

    // Company Profit & Loss - 2nd of every month
    if (dayOfMonth === 2) {
      scheduledTasks.push({
        id: `company-pl-${year}-${month}-${dayOfMonth}`,
        text: 'Company Profit & Loss',
        type: 'monthly',
        schedule: '2nd of every month',
        completed: false,
        createdAt: today.toISOString(),
        completedAt: null,
        fromScheduled: true
      });
    }

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