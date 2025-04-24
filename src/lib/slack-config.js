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
  return SLACK_WEBHOOKS[type] || SLACK_WEBHOOKS.MAIN;
}

// Validate webhook URL format
export function isValidWebhookUrl(url) {
  return url && url.startsWith('https://hooks.slack.com/services/');
} 