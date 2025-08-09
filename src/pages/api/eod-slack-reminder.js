import { getMediaBuyerWebhook, isValidWebhookUrl, DEFAULT_EOD_REMINDER_MESSAGE } from '../../lib/slack-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { missingBuyers } = req.body;

    if (!missingBuyers || !Array.isArray(missingBuyers) || missingBuyers.length === 0) {
      return res.status(400).json({ error: 'Missing buyers array is required' });
    }

    // Send a simple text-only reminder to each missing buyer's dedicated webhook
    const results = await Promise.all(missingBuyers.map(async (buyer) => {
      const webhookUrl = getMediaBuyerWebhook(buyer.name);
      if (!isValidWebhookUrl(webhookUrl)) {
        throw new Error(`Invalid Slack webhook URL for ${buyer.name}`);
      }
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: DEFAULT_EOD_REMINDER_MESSAGE })
      });
      if (!response.ok) {
        throw new Error(`Slack API responded with status: ${response.status} for ${buyer.name}`);
      }
      return buyer.name;
    }));

    return res.status(200).json({
      success: true,
      message: `Reminders sent to: ${results.join(', ')}`
    });
  } catch (error) {
    console.error('Error sending EOD Slack reminder:', error);
    return res.status(500).json({ error: error.message });
  }
}