// Test script for sending weekly performance updates to Slack
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Sample data for weekly performance update
const testData = {
  type: 'weekly-performance',
  data: {
    topOffers: [
      { name: 'Keto Direct', revenue: 45000, profit: 12000, roi: 36.4 },
      { name: 'Sleep Well', revenue: 32000, profit: 9500, roi: 42.2 },
      { name: 'Green Detox', revenue: 28500, profit: 7800, roi: 37.7 }
    ],
    underperformingOffers: [
      { name: 'Weight Loss Pro', revenue: 8500, profit: -1200, roi: -12.4 },
      { name: 'Immune Boost', revenue: 7200, profit: -800, roi: -10.0 }
    ],
    topBuyers: [
      { name: 'Mike', spend: 65000, profit: 18500, roi: 28.5 },
      { name: 'Aakash', spend: 42000, profit: 11000, roi: 26.2 },
      { name: 'Ishaan', spend: 35000, profit: 8900, roi: 25.4 }
    ],
    strugglingBuyers: [
      { name: 'Jose/Matt', spend: 12000, profit: -1500, roi: -12.5 },
      { name: 'Edwin', spend: 8500, profit: -900, roi: -10.6 }
    ],
    totalProfit: 36000,
    totalRevenue: 142000,
    totalSpend: 106000,
    dateRange: 'March 22 - March 29, 2025'
  }
};

// Function to create a properly formatted Slack message
function createWeeklyPerformanceMessage(data) {
  const { 
    topOffers = [],
    underperformingOffers = [],
    topBuyers = [],
    strugglingBuyers = [],
    totalProfit,
    totalRevenue,
    totalSpend,
    dateRange
  } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formattedTotalProfit = formatCurrency(totalProfit || 0);
  const formattedTotalRevenue = formatCurrency(totalRevenue || 0);
  const formattedTotalSpend = formatCurrency(totalSpend || 0);
  
  const roi = totalSpend && totalRevenue ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(2) : '0.00';
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Build the message blocks
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 Weekly Performance Update 📊",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Weekly performance update for ${dateRange || 'the past week'}*\n*Generated on:* ${formattedDate}`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Revenue:*\n:large_green_square: ${formattedTotalRevenue}`
        },
        {
          type: "mrkdwn",
          text: `*Total Ad Spend:*\n:large_red_square: ${formattedTotalSpend}`
        }
      ]
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Profit:*\n:large_green_square: ${formattedTotalProfit}`
        },
        {
          type: "mrkdwn",
          text: `*Overall ROI:*\n:chart_with_upwards_trend: ${roi}%`
        }
      ]
    }
  ];

  // Add top offers section if we have data
  if (topOffers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Top Performing Offers* :rocket:"
        }
      }
    );

    // Add up to 5 top offers
    topOffers.slice(0, 5).forEach((offer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${offer.name || 'Unknown Offer'}*\nRevenue: ${formatCurrency(offer.revenue || 0)} | Profit: ${formatCurrency(offer.profit || 0)} | ROI: ${offer.roi || 0}%`
        }
      });
    });
  }

  // Add underperforming offers if we have data
  if (underperformingOffers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Underperforming Offers* :warning:"
        }
      }
    );

    // Add up to 5 underperforming offers
    underperformingOffers.slice(0, 5).forEach((offer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${offer.name || 'Unknown Offer'}*\nRevenue: ${formatCurrency(offer.revenue || 0)} | Profit: ${formatCurrency(offer.profit || 0)} | ROI: ${offer.roi || 0}%`
        }
      });
    });
  }

  // Add top media buyers if we have data
  if (topBuyers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Top Media Buyers* :trophy:"
        }
      }
    );

    // Add up to 5 top buyers
    topBuyers.slice(0, 5).forEach((buyer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${buyer.name || 'Unknown Buyer'}*\nSpend: ${formatCurrency(buyer.spend || 0)} | Profit: ${formatCurrency(buyer.profit || 0)} | ROI: ${buyer.roi || 0}%`
        }
      });
    });
  }

  // Add struggling media buyers if we have data
  if (strugglingBuyers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Struggling Media Buyers* :sos:"
        }
      }
    );

    // Add up to 5 struggling buyers
    strugglingBuyers.slice(0, 5).forEach((buyer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${buyer.name || 'Unknown Buyer'}*\nSpend: ${formatCurrency(buyer.spend || 0)} | Profit: ${formatCurrency(buyer.profit || 0)} | ROI: ${buyer.roi || 0}%`
        }
      });
    });
  }

  // Add footer
  blocks.push(
    {
      type: "divider"
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Sent from the PL Dashboard"
        }
      ]
    }
  );

  return { blocks };
}

// Directly send to the webhook URL (bypassing the local API)
async function sendDirectlyToSlack() {
  try {
    console.log('Sending test weekly performance notification directly to Slack webhook...');
    
    // Get webhook URL from env or use the new one directly
    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || 
                      'https://hooks.slack.com/services/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';
    
    // Create properly formatted message
    const message = createWeeklyPerformanceMessage(testData.data);
    
    // Send directly to webhook
    const response = await axios.post(webhookUrl, message);
    
    console.log('✅ Weekly performance notification sent directly to Slack:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Error sending direct notification to Slack:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Send via the API
async function testWeeklyPerformanceNotification() {
  try {
    console.log('Sending test weekly performance notification via API...');
    
    const response = await axios.post('http://localhost:3000/api/slack-notification', testData);
    
    console.log('✅ Weekly performance notification sent successfully via API:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending notification via API:', error.response?.data || error.message);
    return false;
  }
}

// Check command line args to determine which method to use
const args = process.argv.slice(2);
if (args.includes('--direct') || args.includes('-d')) {
  sendDirectlyToSlack();
} else {
  console.log('Using API method (use --direct flag to bypass API)');
  testWeeklyPerformanceNotification();
} 