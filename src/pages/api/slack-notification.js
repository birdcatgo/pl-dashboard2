import axios from 'axios';
import { getWebhookUrl, isValidWebhookUrl } from '../../lib/slack-config';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    console.log('Received notification request:', { 
      type, 
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      messageLength: data?.message?.length || 0
    });

    if (!type || !data) {
      console.error('Missing required parameters:', { type, hasData: !!data });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get the appropriate webhook URL based on notification type
    const webhookUrl = getWebhookUrl(type);
    
    // Log environment check
    console.log('Environment check:', {
      hasWebhookUrl: !!webhookUrl,
      webhookLength: webhookUrl?.length || 0,
      webhookPrefix: webhookUrl?.substring(0, 20) || ''
    });

    if (!webhookUrl || !isValidWebhookUrl(webhookUrl)) {
      console.error('Invalid or missing webhook URL');
      return res.status(500).json({ error: 'Slack webhook URL not configured' });
    }

    let message;

    try {
      switch (type.toLowerCase()) {
        case 'break-even':
          message = createBreakEvenMessage(data);
          break;
        case 'weekly-performance':
          message = createWeeklyPerformanceMessage(data);
          break;
        case 'offer-performance':
          message = createOfferPerformanceMessage(data);
          break;
        case 'midday-checkin':
        case 'middaycheckin':
          message = createMiddayCheckinMessage(data);
          break;
        default:
          console.error('Invalid notification type:', type);
          return res.status(400).json({ error: 'Invalid notification type', receivedType: type });
      }

      console.log('Prepared message for Slack:', JSON.stringify(message, null, 2));
      
      const response = await axios.post(webhookUrl, message);
      console.log('Slack API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending to Slack:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack
      });
      
      return res.status(500).json({ 
        error: 'Failed to send to Slack', 
        details: error.message,
        response: error.response?.data
      });
    }
  } catch (error) {
    console.error('Unhandled error in slack-notification API:', error);
    return res.status(500).json({ error: 'Unhandled error in notification API', details: error.message });
  }
}

function createBreakEvenMessage(data) {
  console.log('Creating break-even message with data:', data);
  
  const { 
    profit, 
    expenses, 
    commissions, 
    dailyExpenses, 
    revenue, 
    adSpend,
    projectedProfit
  } = data;

  const formattedProfit = formatCurrency(profit);
  const formattedExpenses = formatCurrency(expenses);
  const formattedCommissions = formatCurrency(commissions);
  const formattedDailyExpenses = formatCurrency(dailyExpenses);
  const formattedRevenue = formatCurrency(revenue);
  const formattedAdSpend = formatCurrency(adSpend);
  const formattedProjectedProfit = formatCurrency(projectedProfit);

  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 Break-Even Alert! 🎉",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*The business has reached the break-even point for this month!*\n*Date:* ${formattedDate} at ${formattedTime}`
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
            text: `*Current Profit:*\n:large_green_square: ${formattedProfit}`
          },
          {
            type: "mrkdwn",
            text: `*Break-Even Point:*\n:large_red_square: ${formattedExpenses}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Total Revenue:*\n:large_green_square: ${formattedRevenue}`
          },
          {
            type: "mrkdwn",
            text: `*Total Ad Spend:*\n:large_red_square: ${formattedAdSpend}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Media Buyer Commission:*\n:large_red_square: ${formattedCommissions}`
          },
          {
            type: "mrkdwn",
            text: `*Projected Month-End:*\n:large_green_square: ${formattedProjectedProfit}`
          }
        ]
      },
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
    ]
  };
}

function createWeeklyPerformanceMessage(data) {
  console.log('Creating weekly performance message with data:', data);
  
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

function createOfferPerformanceMessage(data) {
  console.log('Creating offer performance message with data:', data);
  
  const { 
    topOffers = [],
    underperformingOffers = [],
    allOffers = [],
    topMediaBuyers = [],
    underperformingMediaBuyers = [],
    allMediaBuyers = [],
    totalProfit,
    totalRevenue,
    totalSpend,
    dateRange
  } = data;

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
        text: "📊 Offer Performance Report 📊",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Offer performance report for ${dateRange || 'the selected period'}*\n*Generated on:* ${formattedDate}`
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
          text: `*${index + 1}. ${offer.name || offer.offer || 'Unknown Offer'}*\nRevenue: ${formatCurrency(offer.revenue || 0)} | Profit: ${formatCurrency(offer.profit || 0)} | ROI: ${offer.roi || 0}%`
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
          text: `*${index + 1}. ${offer.name || offer.offer || 'Unknown Offer'}*\nRevenue: ${formatCurrency(offer.revenue || 0)} | Profit: ${formatCurrency(offer.profit || 0)} | ROI: ${offer.roi || 0}%`
        }
      });
    });
  }

  // Add top media buyers section if we have data
  if (topMediaBuyers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Top Performing Media Buyers* :trophy:"
        }
      }
    );

    // Add up to 5 top media buyers
    topMediaBuyers.slice(0, 5).forEach((buyer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${buyer.name || 'Unknown Media Buyer'}*\nRevenue: ${formatCurrency(buyer.revenue || 0)} | Profit: ${formatCurrency(buyer.profit || 0)} | ROI: ${buyer.roi || 0}%`
        }
      });
    });
  }

  // Add underperforming media buyers if we have data
  if (underperformingMediaBuyers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Underperforming Media Buyers* :sos:"
        }
      }
    );

    // Add up to 5 underperforming media buyers
    underperformingMediaBuyers.slice(0, 5).forEach((buyer, index) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1}. ${buyer.name || 'Unknown Media Buyer'}*\nRevenue: ${formatCurrency(buyer.revenue || 0)} | Profit: ${formatCurrency(buyer.profit || 0)} | ROI: ${buyer.roi || 0}%`
        }
      });
    });
  }
  
  // Add all active offers
  if (allOffers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*All Active Offers During Period* :bar_chart:"
        }
      }
    );
    
    // Create a compact list of all offers
    let offerListText = "";
    allOffers.forEach((offer, index) => {
      const offerName = offer.name || offer.offer || 'Unknown Offer';
      const offerProfit = formatCurrency(offer.profit || 0);
      const offerRoi = (offer.roi || 0).toFixed(1) + '%';
      
      offerListText += `*${offerName}*: ${offerProfit} (${offerRoi} ROI)\n`;
      
      // Slack messages have a limit, so we split into multiple blocks if needed
      if ((index + 1) % 10 === 0 || index === allOffers.length - 1) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: offerListText
          }
        });
        offerListText = "";
      }
    });
  }

  // Add all active media buyers
  if (allMediaBuyers.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*All Active Media Buyers During Period* :busts_in_silhouette:"
        }
      }
    );
    
    // Create a compact list of all media buyers
    let buyerListText = "";
    allMediaBuyers.forEach((buyer, index) => {
      const buyerName = buyer.name || 'Unknown Media Buyer';
      const buyerProfit = formatCurrency(buyer.profit || 0);
      const buyerRoi = (buyer.roi || 0).toFixed(1) + '%';
      
      buyerListText += `*${buyerName}*: ${buyerProfit} (${buyerRoi} ROI)\n`;
      
      // Slack messages have a limit, so we split into multiple blocks if needed
      if ((index + 1) % 10 === 0 || index === allMediaBuyers.length - 1) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: buyerListText
          }
        });
        buyerListText = "";
      }
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

function createMiddayCheckinMessage(data) {
  const now = new Date();
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const formattedDateTime = pstTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  });

  // If the data only contains a message field, display it directly
  if (data.message && !data.campaigns) {
    return {
      text: "Midday Check-In Report",
      blocks: [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": `📍 Media Buyer Alerts — ${formattedDateTime}`,
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": data.message
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "Sent from the PL Dashboard"
            }
          ]
        }
      ]
    };
  }

  // Initialize totals
  let totalSpend = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalLeads = 0;

  // Process campaigns from the data object
  const campaigns = data.campaigns || [];
  const previousCheckIns = data.previousCheckIns || [];

  // Process each campaign
  const processedCampaigns = campaigns.map(campaign => {
    // Extract values from campaign object
    const spend = parseFloat(campaign.spend) || 0;
    const revenue = parseFloat(campaign.revenue) || 0;
    // Calculate profit correctly
    const profit = revenue - spend;
    const leads = parseInt(campaign.leads) || 0;

    // Update totals
    totalSpend += spend;
    totalRevenue += revenue;
    totalProfit += profit;
    totalLeads += leads;

    // Calculate ROI
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

    // Find previous check-in data
    const previousCheckIn = previousCheckIns.find(checkIn => 
      checkIn.campaigns.some(prevCampaign => 
        prevCampaign.campaignName === campaign.campaignName
      )
    );

    // Get previous profit
    let previousProfit = 0;
    if (previousCheckIn) {
      const prevCampaign = previousCheckIn.campaigns.find(
        prev => prev.campaignName === campaign.campaignName
      );
      if (prevCampaign) {
        previousProfit = parseFloat(prevCampaign.profit) || 0;
      }
    }

    // Calculate trend
    let trend = 'Stable';
    if (!previousCheckIn) {
      trend = 'New';
    } else if (profit > previousProfit) {
      trend = 'Improving';
    } else if (profit < previousProfit) {
      trend = 'Declining';
    }

    return {
      campaignName: campaign.campaignName,
      profit: profit,
      trend: trend,
      spend: spend,
      revenue: revenue,
      leads: leads,
      roi: roi
    };
  });

  // Sort campaigns by profit
  const sortedCampaigns = processedCampaigns.sort((a, b) => b.profit - a.profit);

  // Calculate total ROI correctly
  const totalRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100).toFixed(2) : 0;
  
  // Format message for Slack blocks format
  const blocks = [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": `📍 Media Buyer Alerts — ${formattedDateTime}`,
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `📊 *Daily Summary*\nSpend: $${totalSpend.toFixed(2)} | Revenue: $${totalRevenue.toFixed(2)} | Profit: $${totalProfit.toFixed(2)} | ROI: ${totalRoi}% | Leads: ${totalLeads}\nProjected EOD Profit: ~$${Math.round(totalProfit * 1.2)} (if trends hold)`
      }
    }
  ];

  // Build campaign table
  let tableHeader = "| Campaign Name                                         | Profit | Trend |\n|------------------------------------------------------|--------|-------|";
  let tableRows = sortedCampaigns.map(campaign => {
    const name = campaign.campaignName.length > 55 ? campaign.campaignName.substring(0, 52) + '...' : campaign.campaignName.padEnd(55);
    const profit = `$${Math.abs(Math.round(campaign.profit))}`.padEnd(6);
    const profitSign = campaign.profit >= 0 ? '+' : '-';
    return `| ${name} | ${profitSign}${profit} | ${campaign.trend.padEnd(5)} |`;
  }).join('\n');

  // Add campaign performance table
  blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `📋 *Campaign Performance*\n\`\`\`\n${tableHeader}\n${tableRows}\n\`\`\``
    }
  });

  // Remove the Critical Alerts section
  // Add footer instead
  blocks.push({
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": "Sent from the PL Dashboard"
      }
    ]
  });

  return { 
    text: "Midday Check-In Report",
    blocks: blocks
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
} 