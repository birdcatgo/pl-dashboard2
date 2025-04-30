import { getWebhookUrl, isValidWebhookUrl, formatSlackMessage } from '../../lib/slack-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, type = 'MAIN' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const webhookUrl = getWebhookUrl(type);
    
    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(500).json({ error: 'Invalid Slack webhook URL configuration' });
    }

    const formattedMessage = formatSlackMessage(message, type);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status: ${response.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return res.status(500).json({ error: error.message });
  }
} 