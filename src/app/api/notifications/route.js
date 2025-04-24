import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

export async function POST(request) {
  try {
    const { message, type = 'info' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize webhook only when needed
    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('NEXT_PUBLIC_SLACK_WEBHOOK_URL environment variable is not set');
    }
    const webhook = new IncomingWebhook(webhookUrl);

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
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
} 