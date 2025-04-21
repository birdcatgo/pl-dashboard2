import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    console.log('Received notification request:', { type, data });

    if (!type || !data) {
      console.error('Missing required parameters:', { type, data });
      return res.status(400).json({ error: 'Missing required parameters', details: { hasType: !!type, hasData: !!data } });
    }

    const slackWebhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
    
    if (!slackWebhookUrl) {
      console.error('Slack webhook URL not configured');
      return res.status(500).json({ error: 'Slack webhook URL not configured' });
    }

    // Validate webhook URL format
    if (!slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
      console.error('Invalid Slack webhook URL format');
      return res.status(500).json({ error: 'Invalid Slack webhook URL format. Must start with https://hooks.slack.com/' });
    }

    let message;

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
      // Add more notification types here in the future
      default:
        console.error('Invalid notification type:', type);
        return res.status(400).json({ error: 'Invalid notification type', receivedType: type });
    }

    console.log('Sending message to Slack:', JSON.stringify(message, null, 2));
    
    try {
      const response = await axios.post(slackWebhookUrl, message);
      console.log('Successfully sent message to Slack, status:', response.status);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error from Slack API:', error.message);
      
      if (error.response) {
        console.error('Slack API response status:', error.response.status);
        console.error('Slack API response data:', error.response.data);
        return res.status(502).json({ 
          error: 'Error from Slack API', 
          status: error.response.status,
          details: error.response.data || error.message
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to send to Slack API', 
        details: error.message 
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
} 