import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text field in request body' });
    }

    const webhookUrl = 'https://hooks.slack.com/services/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';

    const response = await axios.post(webhookUrl, { text });

    if (response.status === 200) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Slack API error:', response.data);
      return res.status(response.status).json({ error: 'Failed to send message to Slack' });
    }
  } catch (error) {
    console.error('Error sending to Slack:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 