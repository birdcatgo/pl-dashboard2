# Break-Even Slack Notifications

This feature provides manual notifications to Slack when your business reaches the break-even point for the current month. It's integrated with the MediaBuyerPL component.

## How It Works

1. The `MediaBuyerPL` component displays the current month's profit and expense metrics.
2. When your business becomes profitable, a "Send Break-Even Alert" button appears.
3. Clicking this button sends a notification to Slack with comprehensive financial data.
4. A notification flag is saved in localStorage to prevent duplicate notifications for the same month.
5. After sending a notification, the button is replaced with a "Break-even notification sent" indicator.

## Message Content

The Slack notification includes:
- Current profit amount
- Break-even point (total expenses)
- Media buyer commission amount
- Daily expenses
- ROI (Return on Investment)
- Total revenue 
- Total ad spend
- Projected month-end profit

## Implementation Details

### MediaBuyerPL Component

The MediaBuyerPL component has two main functions related to break-even notifications:

1. `sendBreakEvenNotification()` - Formats and sends the notification data to the API
2. `handleManualNotification()` - Triggered when the user clicks the notification button

### API Endpoint

The notification is sent through the `/api/slack-notification` API endpoint, which:
1. Validates the incoming request
2. Formats the message for Slack using the Slack Block Kit format
3. Sends the message to the configured Slack webhook URL

## Configuration

To set up Slack notifications:

1. Create a Slack app in your workspace
2. Create an incoming webhook
3. Add the webhook URL to your environment variables as `NEXT_PUBLIC_SLACK_WEBHOOK_URL`

Example in `.env.local`:
```
NEXT_PUBLIC_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## Testing

You can test the notification system by:

1. Starting the development server (`npm run dev`)
2. Running the test script (`node test-slack-notification.js`)

The test script sends a sample break-even notification to validate the entire flow.

## Extending the System

This notification system can be extended to support other types of notifications by:

1. Adding new notification types to the API endpoint
2. Creating corresponding message formatting functions
3. Building components that trigger these notifications

## Troubleshooting

If notifications aren't working:

1. Check that the Slack webhook URL is correctly configured in your environment
2. Verify that the MediaBuyerPL component is receiving valid performance data
3. Check browser console and server logs for any errors
4. Ensure your Slack webhook hasn't been revoked or expired 