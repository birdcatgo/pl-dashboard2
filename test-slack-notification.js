// Test script for sending Slack notifications
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Mock data similar to what MediaBuyerPL would send
const testData = {
  type: 'break-even',
  data: {
    profit: 75000,
    expenses: 65000,
    commissions: 7500,
    dailyExpenses: 2200,
    roi: 15.5,
    revenue: 500000,
    adSpend: 425000,
    projectedProfit: 90000
  }
};

async function testSlackNotification() {
  try {
    console.log('Sending test Slack notification...');
    
    const response = await axios.post('http://localhost:3000/api/slack-notification', testData);
    
    console.log('✅ Notification sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Error sending notification:', error.response?.data || error.message);
  }
}

testSlackNotification(); 