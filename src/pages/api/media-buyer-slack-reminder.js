import { getMediaBuyerWebhook, isValidWebhookUrl, getDefaultEODMessage } from '../../lib/slack-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mediaBuyer, buyerData, customMessage } = req.body;

    if (!mediaBuyer || !buyerData) {
      return res.status(400).json({ error: 'Media buyer and data are required' });
    }

    const webhookUrl = getMediaBuyerWebhook(mediaBuyer);
    
    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(500).json({ error: `Invalid Slack webhook URL configuration for ${mediaBuyer}` });
    }

    // Use custom message if provided, otherwise use default template
    const message = customMessage || getDefaultEODMessage(mediaBuyer, buyerData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status: ${response.status}`);
    }

    return res.status(200).json({ 
      success: true,
      mediaBuyer,
      message: `Reminder sent to ${mediaBuyer}`
    });
  } catch (error) {
    console.error(`Error sending Slack reminder to ${req.body?.mediaBuyer}:`, error);
    return res.status(500).json({ error: error.message });
  }
}