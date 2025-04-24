import fetch from 'node-fetch';

async function testSlackNotification() {
  try {
    console.log('Testing Slack notification API...');
    
    // Create a test message for midday check-in
    const payload = {
      type: 'midday-checkin',
      data: {
        message: "This is a test midday check-in message",
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    // Send the request to the local API endpoint
    const response = await fetch('http://localhost:3000/api/slack-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    // Log response status
    console.log('Response status:', response.status);
    
    // Try to get JSON response body
    const responseData = await response.json().catch(e => {
      console.error('Failed to parse JSON response:', e);
      return null;
    });
    
    console.log('Response data:', responseData);
    
    if (!response.ok) {
      console.error('Request failed with status:', response.status);
      console.error('Error details:', responseData);
    } else {
      console.log('Slack notification sent successfully!');
    }
  } catch (error) {
    console.error('Error testing Slack notification:', error);
  }
}

// Run the test
testSlackNotification(); 