import axios from 'axios';

export async function sendNotification(message, type = 'info') {
  try {
    const response = await axios.post('/api/notifications', {
      message,
      type,
    });

    if (response.data.success) {
      console.log('Notification sent successfully');
    } else {
      console.error('Failed to send notification:', response.data.error);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
} 