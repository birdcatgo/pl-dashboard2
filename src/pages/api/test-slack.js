import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Slack webhook URL not configured' });
    }

    const message = {
      text: "Test message from PL Dashboard",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Test Notification*\nThis is a test message to verify the Slack webhook is working correctly."
          }
        }
      ]
    };

    const response = await axios.post(webhookUrl, message);
    return res.status(200).json({ success: true, response: response.data });
  } catch (error) {
    console.error('Error sending test message:', error);
    return res.status(500).json({ 
      error: 'Failed to send test message',
      details: error.message,
      response: error.response?.data
    });
  }
} 