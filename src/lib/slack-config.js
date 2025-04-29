// Slack webhook configuration
export const SLACK_WEBHOOKS = {
  // Main webhook for all notifications
  MAIN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  // Alias for different notification types
  BREAK_EVEN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  PERFORMANCE: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  EXPENSES: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  MIDDAY_CHECKIN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
};

// Helper function to get webhook URL by type
export function getWebhookUrl(type = 'MAIN') {
  const url = SLACK_WEBHOOKS[type] || SLACK_WEBHOOKS.MAIN;
  if (!url) {
    throw new Error(`Slack webhook URL not configured for type: ${type}`);
  }
  return url;
}

// Validate webhook URL format
export function isValidWebhookUrl(url) {
  return url && url.startsWith('https://hooks.slack.com/services/');
}

// Format message for Slack
export function formatSlackMessage(message, type = 'MAIN') {
  // For midday check-ins, format with tables and proper markdown
  if (type === 'MIDDAY_CHECKIN') {
    // Split the message into lines
    const lines = message.split('\n');
    const blocks = [];
    
    // Add header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: "Media Buyer Alerts",
        emoji: true
      }
    });
    
    // Add summary section
    const summaryLines = lines.filter(line => line.startsWith(':bar_chart:') || line.includes('Spend:') || line.includes('Projected'));
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: summaryLines.join('\n')
      }
    });
    
    // Add table section
    const tableLines = lines.filter(line => line.startsWith('|'));
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: tableLines.join('\n')
      }
    });
    
    return {
      text: message,
      blocks: blocks
    };
  }

  // Default format for other types
  return {
    text: message,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      }
    ]
  };
} 