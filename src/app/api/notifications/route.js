import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

// Initialize Slack webhook
const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

export async function POST(request) {
  try {
    const { message, type = 'info' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Format message based on type
    let formattedMessage = message;
    if (type === 'error') {
      formattedMessage = `❌ Error: ${message}`;
    } else if (type === 'success') {
      formattedMessage = `✅ Success: ${message}`;
    } else if (type === 'warning') {
      formattedMessage = `⚠️ Warning: ${message}`;
    }

    // Send to Slack
    await webhook.send({
      text: formattedMessage,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 