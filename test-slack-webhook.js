// Direct test of Slack webhook
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get the webhook URL from the environment
const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('ERROR: NEXT_PUBLIC_SLACK_WEBHOOK_URL is not defined in .env.local file');
  process.exit(1);
}

// Log first and last part of webhook (for security)
const maskedUrl = webhookUrl.substring(0, 30) + '...' + webhookUrl.substring(webhookUrl.length - 5);
console.log(`Using webhook URL: ${maskedUrl}`);

// Simple message for testing
const message = {
  text: "Test message from webhook test script",
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Test Notification*\nThis is a direct test of the Slack webhook."
      }
    }
  ]
};

// Send the test message
async function testWebhook() {
  try {
    console.log('Sending test message directly to Slack webhook...');
    const response = await axios.post(webhookUrl, message);
    console.log('Response:', response.status, response.statusText);
    console.log('✅ Direct message sent successfully to Slack!');
  } catch (error) {
    console.error('❌ Error sending direct message to Slack:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWebhook(); 