export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, channel } = req.body;

    if (!message || !channel) {
      return res.status(400).json({ error: 'Message and channel are required' });
    }

    // Debug logging for environment variables
    console.log('Environment Variables:', {
      hasDailyUpdatesWebhook: !!process.env.NEXT_PUBLIC_DAILY_UPDATES_WEBHOOK,
      hasSlackWebhook: !!process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
      channel: channel
    });

    // Use different webhook URLs based on the channel
    const SLACK_WEBHOOK_URL = channel === 'daily-updates-mgmt' 
      ? process.env.NEXT_PUBLIC_DAILY_UPDATES_WEBHOOK 
      : process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;

    if (!SLACK_WEBHOOK_URL) {
      console.error('Slack webhook URL is not configured', {
        channel,
        dailyUpdatesWebhook: process.env.NEXT_PUBLIC_DAILY_UPDATES_WEBHOOK,
        slackWebhook: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
      });
      return res.status(500).json({ error: 'Slack webhook URL is not configured' });
    }

    console.log('Attempting to send message to Slack:', {
      channel,
      messageLength: message.length,
      webhookUrlConfigured: !!SLACK_WEBHOOK_URL
    });

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        channel: channel,
        username: 'Daily Update Bot',
        icon_emoji: ':robot_face:'
      }),
    });

    const responseText = await response.text();
    console.log('Slack API Response:', {
      status: response.status,
      statusText: response.statusText,
      responseText
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status: ${response.status} - ${responseText}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending to Slack:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      error: 'Failed to send message to Slack', 
      details: error.message
    });
  }
} 