// Slack webhook configuration
export const SLACK_WEBHOOKS = {
  // Main webhook for general notifications
  MAIN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  // Webhook for break-even notifications
  BREAK_EVEN: process.env.SLACK_WEBHOOK_BREAKEVEN_URL,
  // Webhook for performance reports
  PERFORMANCE: process.env.SLACK_WEBHOOK_PERFORMANCE_URL,
  // Webhook for expense notifications
  EXPENSES: process.env.SLACK_WEBHOOK_EXPENSES_URL
};

// Helper function to get webhook URL by type
export function getWebhookUrl(type = 'MAIN') {
  return SLACK_WEBHOOKS[type] || SLACK_WEBHOOKS.MAIN;
}

// Validate webhook URL format
export function isValidWebhookUrl(url) {
  return url && url.startsWith('https://hooks.slack.com/services/');
} 