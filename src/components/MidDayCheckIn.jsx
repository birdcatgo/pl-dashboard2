const response = await fetch('/api/slack-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'midday-checkin',
    data: {
      message: `Midday Check-in: ${message}`,
    },
  }),
}); 