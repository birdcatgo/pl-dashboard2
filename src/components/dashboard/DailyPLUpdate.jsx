import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const DailyPLUpdate = ({ performanceData }) => {
  const [selectedSections, setSelectedSections] = useState({
    overall: true,
    mediaBuyers: false,
    offers: false,
    networks: false,
    insights: false
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    period: 'yesterday'
  });
  const [insightDateRange, setInsightDateRange] = useState({
    startDate: null,
    endDate: null,
    period: 'last7'
  });
  const [selectedInsights, setSelectedInsights] = useState(new Set());

  // Get the latest date from performance data
  const getLatestDataDate = () => {
    if (!performanceData?.data?.length) return new Date();
    
    const dates = performanceData.data
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      })
      .filter(Boolean);
    
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };

  // Get the earliest date from performance data
  const getEarliestDataDate = () => {
    if (!performanceData?.data?.length) return new Date();
    
    const dates = performanceData.data
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      })
      .filter(Boolean);
    
    return new Date(Math.min(...dates.map(d => d.getTime())));
  };

  // Helper function to validate dates
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn('Invalid dates:', { startDate, endDate });
      return false;
    }
    return true;
  };

  // Helper function to calculate previous period dates
  const calculatePreviousPeriodDates = (startDate, endDate) => {
    if (!validateDates(startDate, endDate)) {
      return { previousStartDate: null, previousEndDate: null };
    }
    
    const periodLength = endDate.getTime() - startDate.getTime();
    return {
      previousStartDate: new Date(startDate.getTime() - periodLength),
      previousEndDate: new Date(startDate.getTime() - 1)
    };
  };

  const handleDateRangeChange = (period) => {
    const latestDate = getLatestDataDate();
    let startDate, endDate;

    if (!latestDate) {
      console.warn('Invalid latest date');
      return;
    }

    switch (period) {
      case 'yesterday':
        startDate = latestDate;
        endDate = latestDate;
        break;
      case 'last7':
        startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 6);
        endDate = latestDate;
        break;
      case 'last30':
        startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 29);
        endDate = latestDate;
        break;
      case 'last60':
        startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 59);
        endDate = latestDate;
        break;
      case 'last90':
        startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 89);
        endDate = latestDate;
        break;
      case 'mtd':
        startDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        endDate = latestDate;
        break;
      case 'ytd':
        startDate = new Date(latestDate.getFullYear(), 0, 1);
        endDate = latestDate;
        break;
      default:
        startDate = latestDate;
        endDate = latestDate;
    }

    if (!validateDates(startDate, endDate)) {
      console.warn('Invalid dates after period calculation:', { startDate, endDate, period });
      return;
    }

    setDateRange({ startDate, endDate, period });
    setInsightDateRange({ startDate, endDate, period });

    // Handle sections based on period
    if (period === 'yesterday') {
      setSelectedSections({
        overall: true,
        mediaBuyers: true,
        offers: true,
        networks: true,
        insights: false
      });
      setSelectedInsights(new Set());
    } else {
      // For all other periods, only select insights section
      setSelectedSections({
        overall: false,
        mediaBuyers: false,
        offers: false,
        networks: false,
        insights: true
      });
      // Select ALL insights for other periods
      const allInsights = generateInsights().map(insight => insight.id);
      setSelectedInsights(new Set(allInsights));
    }
  };

  // Initialize date ranges when component mounts
  useEffect(() => {
    handleDateRangeChange('yesterday');
  }, [performanceData]);

  // Calculate metrics for a specific date range
  const calculateMetricsForDateRange = (startDate, endDate) => {
    // Safety check for dates
    if (!startDate || !endDate) {
      console.warn('Invalid date range in calculateMetricsForDateRange:', { startDate, endDate });
      return {
        mediaBuyers: {},
        offers: {},
        networks: {}
      };
    }

    const filteredData = performanceData.data.filter(entry => {
      const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
      const entryDate = new Date(year, month - 1, day);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Media Buyer metrics
    const mediaBuyerMap = filteredData.reduce((acc, entry) => {
      const buyer = entry['Media Buyer'] || 'Unknown';
      if (!acc[buyer]) {
        acc[buyer] = { revenue: 0, spend: 0, profit: 0 };
      }
      acc[buyer].revenue += entry['Total Revenue'] || 0;
      acc[buyer].spend += entry['Ad Spend'] || 0;
      acc[buyer].profit += (entry['Total Revenue'] || 0) - (entry['Ad Spend'] || 0);
      return acc;
    }, {});

    // Offer metrics
    const offerMap = filteredData.reduce((acc, entry) => {
      const offer = entry.Offer || 'Unknown';
      if (!acc[offer]) {
        acc[offer] = { revenue: 0, spend: 0, profit: 0 };
      }
      acc[offer].revenue += entry['Total Revenue'] || 0;
      acc[offer].spend += entry['Ad Spend'] || 0;
      acc[offer].profit += (entry['Total Revenue'] || 0) - (entry['Ad Spend'] || 0);
      return acc;
    }, {});

    // Network metrics
    const networkMap = filteredData.reduce((acc, entry) => {
      const network = entry.Network || 'Unknown';
      if (!acc[network]) {
        acc[network] = { revenue: 0, spend: 0, profit: 0 };
      }
      acc[network].revenue += entry['Total Revenue'] || 0;
      acc[network].spend += entry['Ad Spend'] || 0;
      acc[network].profit += (entry['Total Revenue'] || 0) - (entry['Ad Spend'] || 0);
      return acc;
    }, {});

    return {
      mediaBuyers: mediaBuyerMap,
      offers: offerMap,
      networks: networkMap
    };
  };

  // Get all unique media buyers, offers, and networks
  const getAllEntities = () => {
    const mediaBuyers = new Set();
    const offers = new Set();
    const networks = new Set();

    performanceData.data.forEach(entry => {
      if (entry['Media Buyer']) mediaBuyers.add(entry['Media Buyer']);
      if (entry.Offer) offers.add(entry.Offer);
      if (entry.Network) networks.add(entry.Network);
    });

    return {
      mediaBuyers: Array.from(mediaBuyers).sort(),
      offers: Array.from(offers).sort(),
      networks: Array.from(networks).sort()
    };
  };

  // Calculate metrics for all time periods
  const calculateAllTimePeriods = () => {
    const latestDate = getLatestDataDate();
    const yesterday = new Date(latestDate);
    const last7Days = new Date(latestDate);
    last7Days.setDate(last7Days.getDate() - 6);
    const last30Days = new Date(latestDate);
    last30Days.setDate(last30Days.getDate() - 29);
    const ytd = new Date(latestDate.getFullYear(), 0, 1);

    return {
      yesterday: calculateMetricsForDateRange(yesterday, latestDate),
      last7Days: calculateMetricsForDateRange(last7Days, latestDate),
      last30Days: calculateMetricsForDateRange(last30Days, latestDate),
      ytd: calculateMetricsForDateRange(ytd, latestDate)
    };
  };

  // Calculate overall metrics
  const calculateOverallMetrics = () => {
    if (!performanceData?.data || !dateRange.startDate || !dateRange.endDate) {
      console.warn('Invalid data in calculateOverallMetrics:', {
        hasPerformanceData: !!performanceData?.data,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      return { revenue: 0, spend: 0, profit: 0 };
    }
    
    const filteredData = performanceData.data.filter(entry => {
      const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
      const entryDate = new Date(year, month - 1, day);
      return entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
    });

    return filteredData.reduce((acc, entry) => ({
      revenue: acc.revenue + (entry['Total Revenue'] || 0),
      spend: acc.spend + (entry['Ad Spend'] || 0),
      profit: acc.profit + ((entry['Total Revenue'] || 0) - (entry['Ad Spend'] || 0))
    }), { revenue: 0, spend: 0, profit: 0 });
  };

  // Toggle insight selection
  const toggleInsight = (id) => {
    if (!selectedSections.insights) return;
    
    setSelectedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get selected insights text
  const getSelectedInsightsText = () => {
    const insights = generateInsights();
    return insights
      .filter(insight => selectedInsights.has(insight.id))
      .map(insight => insight.text)
      .join('\n');
  };

  // Update the getPeriodText function to use simpler period descriptions
  const getPeriodText = () => {
    if (!dateRange.startDate || !dateRange.endDate) return 'this period';
    
    switch (dateRange.period) {
      case 'yesterday':
        return 'yesterday';
      case 'last7':
        return 'the last 7 days';
      case 'last30':
        return 'the last 30 days';
      case 'mtd':
        return 'month to date';
      case 'ytd':
        return 'year to date';
      default:
        return 'this period';
    }
  };

  // Update the formatCurrency function to round to whole numbers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Update the getTrendIcon function to be simpler
  const getTrendIcon = (current, previous) => {
    if (!previous) return ''; // No icon if no previous data
    const change = ((current - previous) / Math.abs(previous)) * 100;
    if (change > 5) return '↑'; // Up
    if (change < -5) return '↓'; // Down
    return ''; // No icon for stable
  };

  // Update the renderTrendCell function to only show trend on profit
  const renderTrendCell = (current, previous, isProfit = false) => {
    const trendIcon = isProfit ? getTrendIcon(current, previous) : '';
    return (
      <div className="flex items-center justify-end space-x-1">
        <span>{formatCurrency(current)}</span>
        {trendIcon && <span className="text-lg">{trendIcon}</span>}
      </div>
    );
  };

  // Update the formatTrendAndConsistency function
  const formatTrendAndConsistency = (insight) => {
    let trend = '';
    if (insight.trend === 'strong_up') trend = '↑↑';
    else if (insight.trend === 'up') trend = '↑';
    else if (insight.trend === 'down') trend = '↓';
    else if (insight.trend === 'strong_down') trend = '↓↓';
    else trend = '→';

    let consistency = '';
    if (insight.consistency === 'very_stable') consistency = 'Very Stable';
    else if (insight.consistency === 'stable') consistency = 'Stable';
    else if (insight.consistency === 'moderate') consistency = 'Moderate';
    else if (insight.consistency === 'inconsistent') consistency = 'Inconsistent';
    else consistency = 'Stable';

    return { trend, consistency };
  };

  // Update the calculateColumnWidths function
  const calculateColumnWidths = (insights) => {
    return {
      name: 12,      // Fixed width for Name column
      profit: 8,     // Fixed width for Profit column
      trend: 4,      // Fixed width for Trend column
      performance: 15 // Fixed width for Performance column
    };
  };

  // Update the formatRow function
  const formatRow = (name, profit, trend, performance, dot, widths) => {
    // Truncate name if it's too long
    const truncatedName = name.length > widths.name ? name.substring(0, widths.name - 3) + '...' : name;
    const namePad = truncatedName.padEnd(widths.name);
    
    // Right-align profit with proper spacing for negative numbers
    const profitPad = profit.padStart(widths.profit);
    
    // Center trend arrows
    const trendPad = trend.padStart(Math.floor((widths.trend + trend.length) / 2)).padEnd(widths.trend);
    
    // Left-align performance and add space before dot
    const performancePad = performance.padEnd(widths.performance);
    
    return `${namePad} | ${profitPad} | ${trendPad} | ${performancePad} ${dot}`;
  };

  // Update the formatMessage function
  const formatMessage = () => {
    const latestDate = getLatestDataDate();
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;

    if (!validateDates(startDate, endDate)) {
      return "Error: Invalid date range";
    }

    const { previousStartDate, previousEndDate } = calculatePreviousPeriodDates(startDate, endDate);
    
    if (!previousStartDate || !previousEndDate) {
      return "Error: Could not calculate previous period dates";
    }

    const currentPeriod = calculateMetricsForDateRange(startDate, endDate);
    const previousPeriod = calculateMetricsForDateRange(previousStartDate, previousEndDate);
    const overall = calculateOverallMetrics();

    let message = "📊 P&L Update (" + getPeriodText() + ")\n";
    
    // Add overall profit and margin
    const profit = overall.revenue - overall.spend;
    const margin = overall.revenue > 0 ? (profit / overall.revenue) * 100 : 0;
    const profitStr = profit >= 0 ? "+" + formatCurrency(profit) : formatCurrency(profit);
    message += `Overall Profit: ${profitStr} | Margin: ${margin.toFixed(1)}%\n\n`;

    // For Last Day's Data, include all sections
    if (dateRange.period === 'yesterday') {
      // Overall Performance
      message += "📈 Overall Performance\n";
      message += `Revenue: ${formatCurrency(overall.revenue)}\n`;
      message += `Spend: ${formatCurrency(overall.spend)}\n`;
      message += `Profit: ${profitStr}\n\n`;

      // Media Buyer Performance
      if (selectedSections.mediaBuyers) {
        const widths = { name: 12, profit: 8 };
        message += "```\n👥 Media Buyer Performance\n";
        message += "Name        | Profit  |  \n";
        message += "------------|---------|---\n";
        
        Object.entries(currentPeriod.mediaBuyers)
          .sort(([, a], [, b]) => b.profit - a.profit)
          .forEach(([buyer, data]) => {
            const dot = data.profit > 0 ? '🟢' : data.profit < 0 ? '🔴' : '🟡';
            const profitStr = formatCurrency(data.profit).padStart(8);
            message += `${buyer.padEnd(12)} | ${profitStr} | ${dot}\n`;
          });
        message += "```\n\n";
      }

      // Offer Performance
      if (selectedSections.offers) {
        const widths = { name: 12, profit: 8 };
        message += "```\n📦 Offer Performance\n";
        message += "Name        | Profit  |  \n";
        message += "------------|---------|---\n";
        
        Object.entries(currentPeriod.offers)
          .sort(([, a], [, b]) => b.profit - a.profit)
          .forEach(([offer, data]) => {
            const dot = data.profit > 0 ? '🟢' : data.profit < 0 ? '🔴' : '🟡';
            const profitStr = formatCurrency(data.profit).padStart(8);
            message += `${offer.padEnd(12)} | ${profitStr} | ${dot}\n`;
          });
        message += "```\n\n";
      }

      // Network Performance
      if (selectedSections.networks) {
        const widths = { name: 12, profit: 8 };
        message += "```\n🌐 Network Performance\n";
        message += "Name        | Profit  |  \n";
        message += "------------|---------|---\n";
        
        Object.entries(currentPeriod.networks)
          .sort(([, a], [, b]) => b.profit - a.profit)
          .forEach(([network, data]) => {
            const dot = data.profit > 0 ? '🟢' : data.profit < 0 ? '🔴' : '🟡';
            const profitStr = formatCurrency(data.profit).padStart(8);
            message += `${network.padEnd(12)} | ${profitStr} | ${dot}\n`;
          });
        message += "```\n\n";
      }
    }

    // Add insights section if selected
    if (selectedSections.insights) {
      // Add legend only for insights section
      message += "```\nLegend:\n";
      message += "↑↑ = Strong upward trend (>20% increase)\n";
      message += "↑ = Upward trend (5-20% increase)\n";
      message += "→ = Stable (within ±5%)\n";
      message += "↓ = Downward trend (5-20% decrease)\n";
      message += "↓↓ = Strong downward trend (>20% decrease)\n\n";
      message += "🟢 = Profitable (Profit > $0)\n";
      message += "🔴 = Unprofitable (Profit < $0)\n";
      message += "🟡 = Break-even or unclear (Profit = $0 or insufficient data)\n```\n\n";

      const insights = generateInsights();
      
      // Media Buyer Insights
      const mediaBuyerInsights = insights
        .filter(insight => insight.id.startsWith('media-buyer-'))
        .sort((a, b) => b.profit - a.profit);

      if (mediaBuyerInsights.length > 0) {
        const widths = calculateColumnWidths(mediaBuyerInsights);
        message += "```\n💡 Media Buyer Performance\n";
        const trendHeader = "Trend".padStart(Math.floor((widths.trend + 4) / 2)).padEnd(widths.trend);
        message += formatRow("Name", "Profit", trendHeader, "Performance", "", widths) + "\n";
        message += "-".repeat(widths.name) + " | " + "-".repeat(widths.profit) + " | " + 
                  "-".repeat(widths.trend) + " | " + "-".repeat(widths.performance) + "\n";
        
        mediaBuyerInsights.forEach(insight => {
          const parts = insight.text.split(': ');
          const name = parts[0];
          const profitStr = formatCurrency(insight.profit);
          const { trend, consistency } = formatTrendAndConsistency(insight);
          const dot = insight.profit > 0 ? '🟢' : insight.profit < 0 ? '🔴' : '🟡';
          message += formatRow(name, profitStr, trend, consistency, dot, widths) + "\n";
        });
        message += "```\n\n";
      }

      // Offer Insights
      const offerInsights = insights
        .filter(insight => insight.id.startsWith('offer-'))
        .sort((a, b) => b.profit - a.profit);

      if (offerInsights.length > 0) {
        const widths = calculateColumnWidths(offerInsights);
        message += "```\n📦 Offer Performance\n";
        const trendHeader = "Trend".padStart(Math.floor((widths.trend + 4) / 2)).padEnd(widths.trend);
        message += formatRow("Name", "Profit", trendHeader, "Performance", "", widths) + "\n";
        message += "-".repeat(widths.name) + " | " + "-".repeat(widths.profit) + " | " + 
                  "-".repeat(widths.trend) + " | " + "-".repeat(widths.performance) + "\n";
        
        offerInsights.forEach(insight => {
          const parts = insight.text.split(': ');
          const name = parts[0];
          const profitStr = formatCurrency(insight.profit);
          const { trend, consistency } = formatTrendAndConsistency(insight);
          let dot = '🟡';
          if (insight.profit > 0) {
            dot = '🟢';
          } else if (insight.profit < 0) {
            dot = '🔴';
          }
          if (!insight.hasData) dot = '🟡';
          message += formatRow(name, profitStr, trend, consistency, dot, widths) + "\n";
        });
        message += "```\n\n";
      }

      // Network Insights
      const networkInsights = insights
        .filter(insight => insight.id.startsWith('network-'))
        .sort((a, b) => b.profit - a.profit);

      if (networkInsights.length > 0) {
        const widths = calculateColumnWidths(networkInsights);
        message += "```\n🌐 Network Performance\n";
        const trendHeader = "Trend".padStart(Math.floor((widths.trend + 4) / 2)).padEnd(widths.trend);
        message += formatRow("Name", "Profit", trendHeader, "Performance", "", widths) + "\n";
        message += "-".repeat(widths.name) + " | " + "-".repeat(widths.profit) + " | " + 
                  "-".repeat(widths.trend) + " | " + "-".repeat(widths.performance) + "\n";
        
        networkInsights.forEach(insight => {
          const parts = insight.text.split(': ');
          const name = parts[0];
          const profitStr = formatCurrency(insight.profit);
          const { trend, consistency } = formatTrendAndConsistency(insight);
          let dot = '🟡';
          if (insight.profit > 0) {
            dot = '🟢';
          } else if (insight.profit < 0) {
            dot = '🔴';
          }
          message += formatRow(name, profitStr, trend, consistency, dot, widths) + "\n";
        });
        message += "```\n\n";
      }

      if (notes.trim()) {
        message += "📝 Additional Notes\n" + notes + "\n";
      }
    }

    return message;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const message = formatMessage();
      console.log('Sending P&L update to Slack:', {
        messageLength: message.length,
        channel: 'daily-pl-updates'
      });

      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          channel: 'daily-pl-updates'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message to Slack');
      }

      toast.success('P&L update sent successfully!');
      setNotes('');
    } catch (error) {
      console.error('Error sending to Slack:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to send P&L update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate metrics for the current date range
  const calculateCurrentMetrics = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return {
        mediaBuyers: [],
        offers: [],
        networks: []
      };
    }

    const metrics = calculateMetricsForDateRange(dateRange.startDate, dateRange.endDate);
    
    // Transform the metrics into the format expected by the tables
    return {
      mediaBuyers: Object.entries(metrics.mediaBuyers).map(([buyer, data]) => ({
        buyer,
        revenue: data.revenue,
        spend: data.spend,
        profit: data.profit
      })),
      offers: Object.entries(metrics.offers).map(([offer, data]) => ({
        offer,
        revenue: data.revenue,
        spend: data.spend,
        profit: data.profit
      })),
      networks: Object.entries(metrics.networks).map(([network, data]) => ({
        network,
        revenue: data.revenue,
        spend: data.spend,
        profit: data.profit
      }))
    };
  };

  const overall = calculateOverallMetrics();
  const currentMetrics = calculateCurrentMetrics();
  const mediaBuyers = currentMetrics.mediaBuyers;
  const offers = currentMetrics.offers;
  const networks = currentMetrics.networks;

  // Calculate trend direction
  const calculateTrend = (current, previous) => {
    if (!previous) return 'neutral';
    const change = ((current - previous) / Math.abs(previous)) * 100;
    if (change > 20) return 'strong_up';
    if (change > 5) return 'up';
    if (change < -20) return 'strong_down';
    if (change < -5) return 'down';
    return 'stable';
  };

  // Calculate consistency
  const calculateConsistency = (values) => {
    if (values.length < 2) return 'insufficient_data';
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = (stdDev / Math.abs(avg)) * 100;
    
    if (coefficient < 20) return 'very_stable';
    if (coefficient < 40) return 'stable';
    if (coefficient < 60) return 'moderate';
    return 'inconsistent';
  };

  // Determine if we have enough data to make a decision
  const hasEnoughData = (metrics) => {
    const minSpend = 1000; // Minimum spend to make a determination
    const minDays = 3; // Minimum days of data needed
    return metrics.spend >= minSpend && metrics.days >= minDays;
  };

  // Helper function to check if entity is active
  const isEntityActive = (metrics) => {
    return metrics.spend > 0;
  };

  // Update the generateInsights function to use the current date range
  const generateInsights = () => {
    const insights = [];
    const latestDate = getLatestDataDate();
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;

    if (!validateDates(startDate, endDate)) {
      return insights;
    }

    const { previousStartDate, previousEndDate } = calculatePreviousPeriodDates(startDate, endDate);
    
    if (!previousStartDate || !previousEndDate) {
      return insights;
    }

    const periods = {
      current: calculateMetricsForDateRange(startDate, endDate),
      previous: calculateMetricsForDateRange(previousStartDate, previousEndDate)
    };

    const entities = getAllEntities();
    const overall = calculateOverallMetrics();

    // Media Buyer Analysis
    const mediaBuyerInsights = entities.mediaBuyers
      .filter(buyer => buyer !== 'Unknown')
      .map(buyer => {
        const currentMetrics = periods.current.mediaBuyers[buyer] || { revenue: 0, spend: 0, profit: 0 };
        const previousMetrics = periods.previous.mediaBuyers[buyer] || { revenue: 0, spend: 0, profit: 0 };

        // Skip if not active in current period
        if (!isEntityActive(currentMetrics)) return null;

        const trend = calculateTrend(currentMetrics.profit, previousMetrics.profit);
        const consistency = calculateConsistency([
          currentMetrics.profit,
          previousMetrics.profit
        ]);

        let status = '';
        if (currentMetrics.profit > 0) {
          if (trend === 'strong_up') status = 'Highly profitable and trending up';
          else if (trend === 'up') status = 'Profitable and improving';
          else if (trend === 'stable') status = 'Consistently profitable';
          else status = 'Profitable but declining';
        } else {
          if (trend === 'strong_down') status = 'Significant losses and declining';
          else if (trend === 'down') status = 'Losing money and getting worse';
          else if (trend === 'stable') status = 'Consistently unprofitable';
          else status = 'Losing money but improving';
        }

        return {
          id: `media-buyer-${buyer}`,
          text: `${buyer}: ${status}. ${formatCurrency(currentMetrics.profit)} profit over ${getPeriodText()} (${consistency} performance)`,
          profit: currentMetrics.profit,
          trend,
          consistency
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.profit - a.profit);

    if (mediaBuyerInsights.length > 0) {
      insights.push(...mediaBuyerInsights);
    }

    // Offer Analysis
    const offerInsights = entities.offers
      .filter(offer => offer !== 'Unknown')
      .map(offer => {
        const currentMetrics = periods.current.offers[offer] || { revenue: 0, spend: 0, profit: 0 };
        const previousMetrics = periods.previous.offers[offer] || { revenue: 0, spend: 0, profit: 0 };

        // Skip if not active in current period
        if (!isEntityActive(currentMetrics)) return null;

        const trend = calculateTrend(currentMetrics.profit, previousMetrics.profit);
        const consistency = calculateConsistency([
          currentMetrics.profit,
          previousMetrics.profit
        ]);
        const hasData = hasEnoughData({ spend: currentMetrics.spend, days: (endDate - startDate) / (1000 * 60 * 60 * 24) });

        let status = '';
        if (!hasData) {
          status = 'Insufficient data to make determination';
        } else if (currentMetrics.profit > 0) {
          if (trend === 'strong_up') status = 'Highly profitable with strong upward trend';
          else if (trend === 'up') status = 'Profitable and improving';
          else if (trend === 'stable') status = 'Consistently profitable';
          else status = 'Profitable but declining';
        } else {
          if (trend === 'strong_down') status = 'Significant losses and declining';
          else if (trend === 'down') status = 'Losing money and getting worse';
          else if (trend === 'stable') status = 'Consistently unprofitable';
          else status = 'Losing money but improving';
        }

        const profitMargin = currentMetrics.revenue > 0 ? (currentMetrics.profit / currentMetrics.revenue) * 100 : 0;
        const scalingPotential = profitMargin > 20 && trend !== 'down' ? 'High scaling potential' : '';

        return {
          id: `offer-${offer}`,
          text: `${offer}: ${status}. ${formatCurrency(currentMetrics.profit)} profit (${profitMargin.toFixed(1)}% margin) over ${getPeriodText()}. ${scalingPotential}`,
          profit: currentMetrics.profit,
          trend,
          consistency,
          hasData
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.profit - a.profit);

    if (offerInsights.length > 0) {
      insights.push(...offerInsights);
    }

    // Network Analysis
    const networkInsights = entities.networks
      .filter(network => network !== 'Unknown')
      .map(network => {
        const currentMetrics = periods.current.networks[network] || { revenue: 0, spend: 0, profit: 0 };
        const previousMetrics = periods.previous.networks[network] || { revenue: 0, spend: 0, profit: 0 };

        // Skip if not active in current period
        if (!isEntityActive(currentMetrics)) return null;

        const trend = calculateTrend(currentMetrics.profit, previousMetrics.profit);
        const consistency = calculateConsistency([
          currentMetrics.profit,
          previousMetrics.profit
        ]);

        let status = '';
        if (currentMetrics.profit > 0) {
          if (trend === 'strong_up') status = 'Highly profitable with strong upward trend';
          else if (trend === 'up') status = 'Profitable and improving';
          else if (trend === 'stable') status = 'Consistently profitable';
          else status = 'Profitable but declining';
        } else {
          if (trend === 'strong_down') status = 'Significant losses and declining';
          else if (trend === 'down') status = 'Losing money and getting worse';
          else if (trend === 'stable') status = 'Consistently unprofitable';
          else status = 'Losing money but improving';
        }

        const profitMargin = currentMetrics.revenue > 0 ? (currentMetrics.profit / currentMetrics.revenue) * 100 : 0;

        return {
          id: `network-${network}`,
          text: `${network}: ${status}. ${formatCurrency(currentMetrics.profit)} profit (${profitMargin.toFixed(1)}% margin) over ${getPeriodText()}.`,
          profit: currentMetrics.profit,
          trend,
          consistency
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.profit - a.profit);

    if (networkInsights.length > 0) {
      insights.push(...networkInsights);
    }

    // Overall Performance
    const overallProfitMargin = overall.revenue > 0 ? (overall.profit / overall.revenue) * 100 : 0;
    insights.push({
      id: 'overall-performance',
      text: `Overall Performance: ${formatCurrency(overall.profit)} profit (${overallProfitMargin.toFixed(1)}% margin) over ${getPeriodText()}`
    });

    return insights;
  };

  // Update the handleInsightsCheckbox to always select all insights when checked
  const handleInsightsCheckbox = (checked) => {
    setSelectedSections(prev => ({ ...prev, insights: true }));
    // Always select all insights when the section is checked
    const allInsights = generateInsights().map(insight => insight.id);
    setSelectedInsights(new Set(allInsights));
  };

  // Add useEffect to ensure insights stay selected for non-yesterday periods
  useEffect(() => {
    if (dateRange.period !== 'yesterday' && selectedSections.insights) {
      const allInsights = generateInsights().map(insight => insight.id);
      setSelectedInsights(new Set(allInsights));
    }
  }, [dateRange.period, selectedSections.insights]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">P&L Update</h2>
        <p className="text-sm text-gray-500">
          Select the date range and sections you want to include in your P&L update
        </p>
      </div>

      <div className="space-y-6">
        {/* Date Range Selection */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <Select
              value={dateRange.period}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="yesterday">Last Day's Data</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              {dateRange.startDate && dateRange.endDate ? (
                <>
                  {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
                  {dateRange.period === 'yesterday' && ' (Last Day\'s Data)'}
                </>
              ) : 'Loading...'}
            </div>
          </div>
        </Card>

        {/* Overall Performance */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="overall"
              checked={selectedSections.overall}
              onCheckedChange={(checked) => 
                setSelectedSections(prev => ({ ...prev, overall: checked }))
              }
            />
            <label htmlFor="overall" className="font-medium">Overall Performance</label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Revenue</TableCell>
                <TableCell className="text-right">{formatCurrency(overall.revenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Spend</TableCell>
                <TableCell className="text-right">{formatCurrency(overall.spend)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Profit</TableCell>
                <TableCell className="text-right">{formatCurrency(overall.profit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        {/* Media Buyer Performance */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="mediaBuyers"
              checked={selectedSections.mediaBuyers}
              onCheckedChange={(checked) => 
                setSelectedSections(prev => ({ ...prev, mediaBuyers: checked }))
              }
            />
            <label htmlFor="mediaBuyers" className="font-medium">Media Buyer Performance</label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Media Buyer</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediaBuyers.map((buyer) => {
                const previousMetrics = calculateMetricsForDateRange(
                  new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
                  new Date(dateRange.startDate.getTime() - 1)
                ).mediaBuyers[buyer.buyer] || { revenue: 0, spend: 0, profit: 0 };

                return (
                  <TableRow key={buyer.buyer}>
                    <TableCell>
                      {buyer.buyer}
                      {buyer.buyer === 'Unknown' && (
                        <span className="text-xs text-gray-500 ml-2">*</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(buyer.revenue, previousMetrics.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(buyer.spend, previousMetrics.spend)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(buyer.profit, previousMetrics.profit, true)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {mediaBuyers.some(b => b.buyer === 'Unknown') && (
            <p className="text-xs text-gray-500 mt-2">* Unknown entries show differences between Redtrack and Network Dashboard revenue</p>
          )}
        </Card>

        {/* Offer Performance */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="offers"
              checked={selectedSections.offers}
              onCheckedChange={(checked) => 
                setSelectedSections(prev => ({ ...prev, offers: checked }))
              }
            />
            <label htmlFor="offers" className="font-medium">Offer Performance</label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const previousMetrics = calculateMetricsForDateRange(
                  new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
                  new Date(dateRange.startDate.getTime() - 1)
                ).offers[offer.offer] || { revenue: 0, spend: 0, profit: 0 };

                return (
                  <TableRow key={offer.offer}>
                    <TableCell>
                      {offer.offer}
                      {offer.offer === 'Unknown' && (
                        <span className="text-xs text-gray-500 ml-2">*</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(offer.revenue, previousMetrics.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(offer.spend, previousMetrics.spend)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(offer.profit, previousMetrics.profit, true)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {offers.some(o => o.offer === 'Unknown') && (
            <p className="text-xs text-gray-500 mt-2">* Unknown entries show differences between Redtrack and Network Dashboard revenue</p>
          )}
        </Card>

        {/* Network Performance */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="networks"
              checked={selectedSections.networks}
              onCheckedChange={(checked) => 
                setSelectedSections(prev => ({ ...prev, networks: checked }))
              }
            />
            <label htmlFor="networks" className="font-medium">Network Performance</label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networks.map((network) => {
                const previousMetrics = calculateMetricsForDateRange(
                  new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
                  new Date(dateRange.startDate.getTime() - 1)
                ).networks[network.network] || { revenue: 0, spend: 0, profit: 0 };

                return (
                  <TableRow key={network.network}>
                    <TableCell>
                      {network.network}
                      {network.network === 'Unknown' && (
                        <span className="text-xs text-gray-500 ml-2">*</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(network.revenue, previousMetrics.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(network.spend, previousMetrics.spend)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderTrendCell(network.profit, previousMetrics.profit, true)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {networks.some(n => n.network === 'Unknown') && (
            <p className="text-xs text-gray-500 mt-2">* Unknown entries show differences between Redtrack and Network Dashboard revenue</p>
          )}
        </Card>

        {/* Insights & Notes Section - Always Expanded */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="insights"
                checked={true}
                disabled={true}
              />
              <label htmlFor="insights" className="font-medium">Performance Insights</label>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Insights Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Insights to Include</h3>
              <div className="space-y-6">
                {/* Media Buyer Insights */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Media Buyer Performance</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {generateInsights()
                      .filter(insight => insight.id.startsWith('media-buyer-'))
                      .map((insight) => (
                        <div key={insight.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={insight.id}
                            checked={selectedInsights.has(insight.id)}
                            onCheckedChange={() => toggleInsight(insight.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={insight.id}
                            className="text-sm text-gray-700"
                          >
                            {insight.text}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Offer Insights */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Offer Performance</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {generateInsights()
                      .filter(insight => insight.id.startsWith('offer-'))
                      .map((insight) => (
                        <div key={insight.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={insight.id}
                            checked={selectedInsights.has(insight.id)}
                            onCheckedChange={() => toggleInsight(insight.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={insight.id}
                            className="text-sm text-gray-700"
                          >
                            {insight.text}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Network Insights */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Network Performance</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {generateInsights()
                      .filter(insight => insight.id.startsWith('network-'))
                      .map((insight) => (
                        <div key={insight.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={insight.id}
                            checked={selectedInsights.has(insight.id)}
                            onCheckedChange={() => toggleInsight(insight.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={insight.id}
                            className="text-sm text-gray-700"
                          >
                            {insight.text}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Overall Performance */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Overall Performance</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {generateInsights()
                      .filter(insight => insight.id === 'overall-performance')
                      .map((insight) => (
                        <div key={insight.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={insight.id}
                            checked={selectedInsights.has(insight.id)}
                            onCheckedChange={() => toggleInsight(insight.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={insight.id}
                            className="text-sm text-gray-700"
                          >
                            {insight.text}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or insights..."
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            {/* Preview Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Message Preview</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {formatMessage()}
                </pre>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send P&L Update'}
        </Button>
      </div>
    </div>
  );
};

export default DailyPLUpdate; 