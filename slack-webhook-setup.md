# Setting Up Slack Webhook for Break-Even Notifications

The current Slack webhook URL is returning a `404 error`, which means it's no longer valid or has been deactivated. You'll need to create a new webhook URL by following these steps:

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Break-Even Notifier") and select your workspace
5. Click "Create App"

## Step 2: Enable Incoming Webhooks

1. From your app's Basic Information page, scroll down to "Add features and functionality"
2. Click on "Incoming Webhooks"
3. Toggle the switch to "On" at the top of the page
4. Click "Add New Webhook to Workspace" at the bottom
5. Select the channel where you want notifications to appear
6. Click "Allow"

## Step 3: Copy Your Webhook URL

1. After authorizing, you'll be taken back to the Incoming Webhooks page
2. Find your new webhook URL under the "Webhook URLs for Your Workspace" section
3. Click the "Copy" button next to the URL

## Step 4: Update Your Environment Configuration

1. Open your project's `.env.local` file
2. Replace the current webhook URL with your new one:

```
NEXT_PUBLIC_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/NEW/WEBHOOK"
```

3. Save the file
4. Restart your development server

## Step 5: Test the Webhook

Run the test script to verify your webhook is working correctly:

```
node test-slack-webhook.js
```

You should see a test message appear in the selected Slack channel and a success message in your terminal.

## Troubleshooting

If you continue to experience issues:

1. **Check Channel Permissions**: Ensure the Slack app has permission to post in the selected channel
2. **Verify Webhook Format**: The URL should start with `https://hooks.slack.com/services/`
3. **App Activation**: Make sure the app is installed and active in your workspace
4. **Workspace Restrictions**: Some workspaces have restrictions on app installations 