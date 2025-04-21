# Slack Break-Even Notifications

This feature sends notifications to Slack when your business reaches the break-even point for the current month.

## How It Works

1. The `MediaBuyerPL` component automatically tracks your profit and expenses for the current month
2. When your profit crosses from negative to positive (break-even point), a notification is automatically sent to Slack
3. The notification includes:
   - Current profit amount
   - Break-even point (total expenses)
   - Media buyer commission
   - Daily expenses
   - ROI
   - Total revenue and ad spend
   - Projected month-end profit

## Manual Notifications

You can also manually trigger a break-even notification:
- A "Send Notification" button appears when you're profitable or close to break-even (within 10%)
- Once a notification is sent (automatically or manually), it won't send duplicate notifications for the same month
- Notification status is saved in localStorage to persist across page refreshes

## Configuration

To set up Slack notifications:

1. Create a Slack app and incoming webhook URL in your Slack workspace
2. Add the webhook URL to your environment variables as `SLACK_WEBHOOK_URL`

## API Route

The notification is sent through the `/api/slack-notification` endpoint, which can be used for other notification types in the future by specifying a different `type` parameter.

## Extending the Feature

To add new notification types:
1. Create a new case in the `/api/slack-notification.js` file for your notification type
2. Build the appropriate message structure
3. Call the API with the required data and your new notification type

The API supports dynamic message formatting based on the notification type and provided data.

## Scheduled Reports

A scheduled script is provided to automatically send weekly performance reports. You can schedule this script to run using cron or any other scheduler.

### Using the scheduled-updates.js script

1. Make sure all dependencies are installed:
   ```
   npm install date-fns axios dotenv
   ```

2. Edit the `scheduled-updates.js` file to customize the report data or integrate with your actual data sources.

3. Test the script manually:
   ```
   node scheduled-updates.js
   ```

4. Set up a cron job to run it weekly (example for running every Monday at 9am):
   ```
   0 9 * * 1 cd /path/to/pl-dashboard && node scheduled-updates.js
   ```

5. For production use, modify the URL in the script to point to your deployed application instead of localhost.

## Troubleshooting

If you encounter issues with Slack notifications:

1. Check that your Slack webhook URL is correctly set in `.env.local`
2. Ensure the webhook URL is still valid and active in your Slack workspace
3. Check for any errors in the browser or server console
4. Verify that your application is able to make outgoing HTTP requests to the Slack API

For more help, see the [Slack API documentation on Incoming Webhooks](https://api.slack.com/messaging/webhooks).