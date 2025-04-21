#!/usr/bin/env node
/**
 * This script can be scheduled to run weekly using cron or any scheduler
 * to send automated performance reports to Slack.
 * 
 * Example cron entry to run every Monday at 9am:
 * 0 9 * * 1 cd /path/to/pl-dashboard && node scheduled-updates.js
 * 
 * Can also be run with --direct flag to bypass the API:
 * node scheduled-updates.js --direct
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { format, subDays } = require('date-fns');

// Function to get date range for the last week
function getLastWeekDateRange() {
  const today = new Date();
  const endDate = subDays(today, 1); // Yesterday
  const startDate = subDays(endDate, 6); // 7 days before yesterday
  
  return {
    start: startDate,
    end: endDate,
    formatted: `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
  };
}

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

// Sample data for weekly performance update
// In a real scenario, you would fetch this data from your database or API
async function generateWeeklyReport() {
  const dateRange = getLastWeekDateRange();
  
  // This is sample data - in production, you would:
  // 1. Fetch performance data for the date range
  // 2. Calculate totals, profits, and ROI
  // 3. Identify top and underperforming offers/buyers
  const reportData = {
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
      dateRange: dateRange.formatted
    }
  };
  
  return reportData;
}

// Send directly to the Slack webhook
async function sendDirectToWebhook(reportData) {
  try {
    console.log('Sending report directly to Slack webhook...');
    
    // Use the webhook URL from environment or default to the new one
    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || 
                      'https://hooks.slack.com/services/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';
    
    // Format message for Slack
    const message = createWeeklyPerformanceMessage(reportData.data);
    
    // Send to webhook
    const response = await axios.post(webhookUrl, message);
    
    console.log('✅ Report sent directly to Slack webhook:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Error sending directly to webhook:', error.message);
    if (error.response) {
      console.error('Webhook response status:', error.response.status);
      console.error('Webhook response data:', error.response.data);
    }
    return false;
  }
}

// Send via the API endpoint
async function sendViaApi(reportData) {
  try {
    console.log('Sending report via API endpoint...');
    
    // Try to use the local API first
    const localUrl = 'http://localhost:3000/api/slack-notification';
    // For production, use your app's domain
    // const productionUrl = 'https://your-domain.com/api/slack-notification';
    
    const response = await axios.post(localUrl, reportData);
    
    console.log('✅ Report sent successfully via API:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending via API:', error.message);
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
    }
    return false;
  }
}

// Main function to send the weekly report
async function sendWeeklyReport() {
  try {
    console.log('Generating weekly performance report...');
    const reportData = await generateWeeklyReport();
    
    // Check if direct flag is provided
    const useDirect = process.argv.includes('--direct') || process.argv.includes('-d');
    
    if (useDirect) {
      // Use direct webhook method
      return await sendDirectToWebhook(reportData);
    } else {
      // Try API first, fall back to direct if it fails
      const apiSuccess = await sendViaApi(reportData);
      if (!apiSuccess) {
        console.log('API method failed, falling back to direct webhook...');
        return await sendDirectToWebhook(reportData);
      }
      return apiSuccess;
    }
  } catch (error) {
    console.error('❌ Unhandled error in sendWeeklyReport:', error.message);
    return false;
  }
}

// Execute the script
sendWeeklyReport();