import { IncomingWebhook } from '@slack/webhook';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, type = 'info' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize webhook only when needed
    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('NEXT_PUBLIC_SLACK_WEBHOOK_URL environment variable is not set');
    }
    const webhook = new IncomingWebhook(webhookUrl);

    // Format message based on type
    let formattedMessage = message;
    if (type === 'error') {
      formattedMessage = `❌ Error: ${message}`;
    } else if (type === 'success') {
      formattedMessage = `✅ Success: ${message}`;
    } else if (type === 'warning') {
      formattedMessage = `⚠️ Warning: ${message}`;
    }

    // Send to Slack
    await webhook.send({
      text: formattedMessage,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send notification'
    });
  }
} 