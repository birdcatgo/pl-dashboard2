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

// Main webhook URLs
export const MAIN_WEBHOOKS = {
  MAIN: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
  DAILY_UPDATES: process.env.NEXT_PUBLIC_DAILY_UPDATES_WEBHOOK
};

// Helper function to get webhook URL by type
export function getWebhookUrl(type = 'MAIN') {
  const url = MAIN_WEBHOOKS[type.toUpperCase()];
  if (!url) {
    throw new Error(`Slack webhook URL not configured for type: ${type}`);
  }
  return url;
}

// Format message for Slack
export function formatSlackMessage(message, type = 'info') {
  let formattedMessage = message;
  
  if (type === 'error') {
    formattedMessage = `❌ Error: ${message}`;
  } else if (type === 'success') {
    formattedMessage = `✅ Success: ${message}`;
  } else if (type === 'warning') {
    formattedMessage = `⚠️ Warning: ${message}`;
  }
  
  return formattedMessage;
}

// Default detailed message template for EOD reminders
export function getDefaultEODMessage(mediaBuyer, data) {
  // Simplified: send only the default text message, no numbers or extra details
  return {
    text: DEFAULT_EOD_REMINDER_MESSAGE
  };
}