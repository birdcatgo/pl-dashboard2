// Slack webhook configuration
export const MEDIA_BUYER_WEBHOOKS = {
  RUTVIK: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_RUTVIK,
  DANIEL: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_DANIEL,
  AAKASH: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_AAKASH,
  ISHAAN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_ISHAAN,
  EMIL: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_EMIL,
  BIKKI: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_BIKKI,
};

// Helper function to get webhook URL by media buyer
export function getMediaBuyerWebhook(mediaBuyer) {
  const webhookKey = mediaBuyer.toUpperCase();
  const url = MEDIA_BUYER_WEBHOOKS[webhookKey];
  if (!url) {
    throw new Error(`Slack webhook URL not configured for media buyer: ${mediaBuyer}`);
  }
  return url;
}

// Validate webhook URL format
export function isValidWebhookUrl(url) {
  return url && url.startsWith('https://hooks.slack.com/services/');
}

// Default simple reminder message
export const DEFAULT_EOD_REMINDER_MESSAGE = `Hey team — quick reminder!
Please submit your EOD reports ASAP. These need to be in by 2pm PST each day.
Let me know if you're running into any issues.`;

// Default detailed message template for EOD reminders
export function getDefaultEODMessage(mediaBuyer, data) {
  const totalRevenue = data.subitems?.reduce((sum, subitem) => {
    const rev = parseFloat(subitem.adRev?.replace(/[^0-9.-]+/g, '') || 0);
    return sum + (isNaN(rev) ? 0 : rev);
  }, 0) || 0;

  const totalSpend = data.subitems?.reduce((sum, subitem) => {
    const spend = parseFloat(subitem.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
    return sum + (isNaN(spend) ? 0 : spend);
  }, 0) || 0;

  const campaignList = data.subitems?.map(subitem => 
    `• ${subitem.name} (${subitem.adAccount})\n   Rev: $${subitem.adRev} | Spend: $${subitem.adSpend}`
  ).join('\n') || 'No campaigns found';

  return {
    text: `EOD Report Reminder for ${data.latestEODDate}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 EOD Report Missing",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hi ${mediaBuyer}! I have data for your campaigns in my EOD report for *${data.latestEODDate}*, but I don't see your EOD report yet.\n\nYour latest report is from *${data.mostRecentDate}*.`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Campaign Summary:*\nTotal Revenue: $${totalRevenue.toFixed(2)}\nTotal Spend: $${totalSpend.toFixed(2)}\nTotal Campaigns: ${data.subitems?.length || 0}"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Active Campaigns:*\n" + campaignList
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Please submit your EOD report as soon as possible so we can ensure our data matches. 🙏"
        }
      }
    ]
  };
}