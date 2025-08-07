import { getWebhookUrl, isValidWebhookUrl } from '../../lib/slack-config';

// Media buyer Slack user IDs - you'll need to update these with actual Slack user IDs
const MEDIA_BUYER_SLACK_IDS = {
  'Mike': '@mike.user',
  'Sam': '@sam.user', 
  'Daniel': '@daniel.user',
  'Bikki': '@bikki.user',
  'Rutvik': '@rutvik.user',
  'Aakash': '@aakash.user',
  'Emil': '@emil.user',
  'Ishaan': '@ishaan.user'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { missingBuyers, latestEODDate } = req.body;

    if (!missingBuyers || !Array.isArray(missingBuyers) || missingBuyers.length === 0) {
      return res.status(400).json({ error: 'Missing buyers array is required' });
    }

    const webhookUrl = getWebhookUrl('MAIN');
    
    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(500).json({ error: 'Invalid Slack webhook URL configuration' });
    }

    // Create mention string for all missing media buyers
    const mentions = missingBuyers
      .map(buyer => MEDIA_BUYER_SLACK_IDS[buyer.name] || `@${buyer.name}`)
      .join(' ');

    // Create detailed message
    const messageBlocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 EOD Report Reminder",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${mentions}\n\nYour EOD reports for *${latestEODDate}* are missing, but I have ad spend/revenue data for you in my report.`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Missing Reports:*"
        }
      }
    ];

    // Add each missing buyer's details
    missingBuyers.forEach(buyer => {
      const totalRevenue = buyer.subitems?.reduce((sum, subitem) => {
        const rev = parseFloat(subitem.adRev?.replace(/[^0-9.-]+/g, '') || 0);
        return sum + (isNaN(rev) ? 0 : rev);
      }, 0) || 0;

      const totalSpend = buyer.subitems?.reduce((sum, subitem) => {
        const spend = parseFloat(subitem.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
        return sum + (isNaN(spend) ? 0 : spend);
      }, 0) || 0;

      messageBlocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• *${buyer.name}*: ${buyer.subitems?.length || 0} campaigns, $${totalRevenue.toFixed(2)} revenue, $${totalSpend.toFixed(2)} spend (Latest: ${buyer.mostRecentDate})`
        }
      });
    });

    // Add call to action
    messageBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Please submit your EOD reports ASAP to ensure accurate data reconciliation. 📊"
      }
    });

    const slackMessage = {
      text: `EOD Report Reminder for ${latestEODDate}`,
      blocks: messageBlocks
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status: ${response.status}`);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Reminder sent to ${missingBuyers.length} media buyers`
    });
  } catch (error) {
    console.error('Error sending EOD Slack reminder:', error);
    return res.status(500).json({ error: error.message });
  }
}