import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ChevronDown, ChevronRight, HelpCircle, TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2, Percent, Calendar, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  if (!value || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

const MediaBuyerPL = ({ performanceData, commissions = [] }) => {
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [notificationSent, setNotificationSent] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState(null);

  // Get trend status by comparing current month with previous month
  const getTrendStatus = (monthlyTotals) => {
    if (monthlyTotals.length < 2) return 'stable';
    
    // Calculate revenue trend (excluding expenses)
    const currentRevenue = monthlyTotals[0].totalRevenue;
    const lastMonthRevenue = monthlyTotals[1].totalRevenue;
    const revenuePercentChange = ((currentRevenue - lastMonthRevenue) / Math.abs(lastMonthRevenue)) * 100;
    
    // Calculate actual profit trend
    const currentProfit = monthlyTotals[0].finalProfitWithDaily;
    const lastMonthProfit = monthlyTotals[1].finalProfitWithDaily;
    const profitPercentChange = ((currentProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
    
    // Determine trend based on revenue
    if (revenuePercentChange > 5) return 'up';
    if (revenuePercentChange < -5) return 'down';
    return 'stable';
  };

  // Get trend indicator components based on status
  const getTrendComponents = (status, currentProfit, monthlyTotals) => {
    const currentMonth = monthlyTotals[0];
    const revenueToDate = currentMonth.totalRevenue;
    const adSpendToDate = currentMonth.totalAdSpend;
    const dailyProfit = revenueToDate - adSpendToDate;
    const dailyROI = adSpendToDate ? (dailyProfit / adSpendToDate) * 100 : 0;
    
    // Calculate break-even progress
    const totalExpenses = currentMonth.mediaBuyerCommission + currentMonth.ringbaExpense + currentMonth.dailyExpenses;
    const breakEvenPoint = totalExpenses;
    const progressToBreakEven = (currentProfit / breakEvenPoint) * 100;
    
    let statusText = '';
    let bgGradient = '';
    
    if (currentProfit >= 0) {
      // Already profitable
      statusText = status === 'up' ? 'Profitable – Up' : 
                   'Profitable – Stable';
      bgGradient = 'from-white to-green-50/30';
    } else {
      // Not yet profitable
      if (dailyProfit > 0) {
        // Positive daily profit
        if (progressToBreakEven >= 90) {
          statusText = 'Break Even';
          bgGradient = 'from-white to-yellow-50/30';
        } else if (progressToBreakEven >= 50) {
          statusText = 'On Track For A Profitable Month';
          bgGradient = 'from-white to-yellow-50/30';
        } else {
          statusText = 'On Track to Break Even';
          bgGradient = 'from-white to-yellow-50/30';
        }
      } else {
        // Negative daily profit
        statusText = status === 'up' ? 'Revenue Up, Loss MTD' :
                    status === 'down' ? 'Revenue Down, Loss MTD' :
                    'Revenue Stable, Loss MTD';
        bgGradient = 'from-white to-red-50/30';
      }
    }

    const indicators = {
      up: {
        icon: '✅',
        text: statusText,
        bgGradient: bgGradient,
        lineData: 'M0 15 L100 0',
        progressToBreakEven: progressToBreakEven
      },
      stable: {
        icon: '🟢',
        text: statusText,
        bgGradient: bgGradient,
        lineData: 'M0 10 L100 10',
        progressToBreakEven: progressToBreakEven
      },
      down: {
        icon: '📈',
        text: statusText,
        bgGradient: bgGradient,
        lineData: 'M0 0 L100 15',
        progressToBreakEven: progressToBreakEven
      },
    };
    return indicators[status] || indicators.stable;
  };

  const getCommissionRate = (buyerName) => {
    if (!buyerName) return 0.10;
    const commissionObj = commissions.find(
      c => c.mediaBuyer && c.mediaBuyer.trim().toLowerCase() === buyerName.trim().toLowerCase()
    );
    if (commissionObj && typeof commissionObj.commissionRate === 'number' && !isNaN(commissionObj.commissionRate)) {
      return commissionObj.commissionRate;
    }
    return 0.10;
  };

  // Set the current month to be expanded by default
  React.useEffect(() => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    setExpandedMonths(new Set([currentMonthKey]));
    
    // Check if a notification flag exists in localStorage
    const currentMonth = format(new Date(), 'yyyy-MM');
    const notificationSentFlag = localStorage.getItem(`breakeven-notification-${currentMonth}`);
    if (notificationSentFlag) {
      setNotificationSent(true);
    }
  }, []);

  const toggleMonth = (monthKey) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(monthKey)) {
      newExpandedMonths.delete(monthKey);
    } else {
      newExpandedMonths.add(monthKey);
    }
    setExpandedMonths(newExpandedMonths);
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    if (!performanceData || !Array.isArray(performanceData)) {
      console.log('Invalid performance data:', performanceData);
      return [];
    }

    // First, calculate daily totals
    const dailyTotals = _.chain(performanceData)
      .filter(entry => entry && entry.Date) // Filter out undefined or entries without Date
      .groupBy(entry => {
        // Parse the date correctly
        let parsedDate;
        try {
          if (entry.Date.includes('/')) {
            const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
            // Ensure we're using the correct year
            const fullYear = year < 100 ? 2000 + year : year;
            parsedDate = new Date(fullYear, month - 1, day);
          } else {
            parsedDate = new Date(entry.Date);
          }

          if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date:', entry.Date);
            return null;
          }
          return format(parsedDate, 'yyyy-MM-dd');
        } catch (error) {
          console.error('Error parsing date:', entry.Date, error);
          return null;
        }
      })
      .map((entries, dateKey) => {
        if (!dateKey) return null;

        // Aggregate all entries for this date
        const totalRevenue = entries.reduce((sum, entry) => {
          const revenue = typeof entry['Total Revenue'] === 'string' 
            ? parseFloat(entry['Total Revenue'].replace(/[$,]/g, '')) 
            : entry['Total Revenue'] || 0;
          return sum + revenue;
        }, 0);

        const totalAdSpend = entries.reduce((sum, entry) => {
          const spend = typeof entry['Ad Spend'] === 'string'
            ? parseFloat(entry['Ad Spend'].replace(/[$,]/g, ''))
            : entry['Ad Spend'] || 0;
          return sum + spend;
        }, 0);

        const acaRevenue = entries.reduce((sum, entry) => {
          return sum + (entry.Network?.toLowerCase().includes('aca') ? 
            (typeof entry['Total Revenue'] === 'string' 
              ? parseFloat(entry['Total Revenue'].replace(/[$,]/g, '')) 
              : entry['Total Revenue'] || 0) : 0);
        }, 0);

        // --- NEW LOGIC: Calculate commission for each media buyer ---
        // Group entries by media buyer
        const buyerGroups = _.groupBy(entries, entry => entry['Media Buyer'] || 'Unknown');
        let totalMediaBuyerCommission = 0;
        Object.entries(buyerGroups).forEach(([buyerName, buyerEntries]) => {
          const buyerRevenue = buyerEntries.reduce((sum, entry) => {
            const revenue = typeof entry['Total Revenue'] === 'string' 
              ? parseFloat(entry['Total Revenue'].replace(/[$,]/g, '')) 
              : entry['Total Revenue'] || 0;
            return sum + revenue;
          }, 0);
          const buyerAdSpend = buyerEntries.reduce((sum, entry) => {
            const spend = typeof entry['Ad Spend'] === 'string'
              ? parseFloat(entry['Ad Spend'].replace(/[$,]/g, ''))
              : entry['Ad Spend'] || 0;
            return sum + spend;
          }, 0);
          const buyerBaseProfit = buyerRevenue - buyerAdSpend;
          const commissionRate = getCommissionRate(buyerName);
          totalMediaBuyerCommission += buyerBaseProfit * commissionRate;
        });
        // --- END NEW LOGIC ---

        const baseProfit = totalRevenue - totalAdSpend;
        const mediaBuyerCommission = totalMediaBuyerCommission;
        // Only exclude Ringba expense for dates April 2024 and later
        const date = new Date(dateKey);
        const cutoffDate = new Date('2024-04-01');
        const ringbaExpense = date >= cutoffDate ? 0 : acaRevenue * 0.02; // 2% of ACA-ACA revenue before April 2024
        const dailyExpenses = 2819.81; // Fixed daily expenses amount (Payroll and General $59,217) / 21 working days
        const totalExpenses = mediaBuyerCommission + ringbaExpense; // Removed dailyExpenses from daily breakdown
        // Calculate final profit and ROI
        const finalProfit = baseProfit - totalExpenses;
        const roi = totalAdSpend ? (finalProfit / totalAdSpend) * 100 : 0;
        return {
          date: new Date(dateKey),
          totalRevenue,
          totalAdSpend,
          baseProfit,
          mediaBuyerCommission,
          ringbaExpense,
          dailyExpenses,
          finalProfit,
          roi
        };
      })
      .filter(Boolean) // Remove any null entries from failed date parsing
      .value();

    // Then group by month
    return _.chain(dailyTotals)
      .groupBy(day => {
        try {
          // Use the actual date from the data to determine the year
          return format(day.date, 'yyyy-MM');
        } catch (error) {
          console.error('Error formatting date:', day.date, error);
          return 'unknown';
        }
      })
      .map((days, monthKey) => {
        if (monthKey === 'unknown') return null;

        try {
          const monthStart = parseISO(monthKey + '-01'); // Add day to make it a valid date
          const monthEnd = endOfMonth(monthStart);
          
          // Calculate daily expenses based on whether it's the current month
          const isCurrentMonth = format(monthStart, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
          const daysInData = days.length;
          const dailyExpenseAmount = isCurrentMonth ? 59217 / daysInData : 59217 / 21; // For current month, divide by actual days. For past months, divide by 21
          const totalDailyExpenses = isCurrentMonth ? 59217 : 59217; // Current month shows actual total, past months show full amount
          
          const monthTotal = {
            monthStart,
            monthEnd,
            totalRevenue: _.sumBy(days, 'totalRevenue'),
            totalAdSpend: _.sumBy(days, 'totalAdSpend'),
            baseProfit: _.sumBy(days, 'baseProfit'),
            mediaBuyerCommission: _.sumBy(days, 'mediaBuyerCommission'),
            ringbaExpense: _.sumBy(days, 'ringbaExpense'),
            dailyExpenses: totalDailyExpenses,
            finalProfitWithDaily: _.sumBy(days, 'finalProfit') - totalDailyExpenses,
            finalProfitWithoutDaily: _.sumBy(days, 'finalProfit'),
            roi: _.sumBy(days, 'totalAdSpend') ? 
              ((_.sumBy(days, 'finalProfit') - totalDailyExpenses) / _.sumBy(days, 'totalAdSpend')) * 100 : 0,
            days: days.map(day => ({
              ...day,
              dailyExpenses: dailyExpenseAmount
            }))
          };

          return monthTotal;
        } catch (error) {
          console.error('Error processing month:', monthKey, error);
          return null;
        }
      })
      .filter(Boolean)
      .orderBy(['monthStart'], ['desc'])
      .value();
  }, [performanceData]);

  // Inside the MediaBuyerPL component, after the monthlyTotals calculation:
  const dailyProfitData = useMemo(() => {
    if (!monthlyTotals.length) return [];
    
    const currentMonth = monthlyTotals[0];
    return currentMonth.days.map(day => ({
      date: format(day.date, 'MMM d'),
      profit: day.baseProfit
    }));
  }, [monthlyTotals]);

  // Calculate YTD totals
  const ytdTotals = useMemo(() => {
    if (!monthlyTotals.length) return { revenue: 0, spend: 0, profit: 0, roi: 0 };
    
    const currentYear = new Date().getFullYear();
    
    // Filter for current year data
    const ytdMonths = monthlyTotals.filter(month => {
      const monthYear = month.monthStart.getFullYear();
      return monthYear === currentYear;
    });
    
    if (ytdMonths.length === 0) return { revenue: 0, spend: 0, profit: 0, roi: 0 };
    
    // Calculate totals
    const totals = ytdMonths.reduce((acc, month) => ({
      revenue: acc.revenue + month.totalRevenue,
      spend: acc.spend + month.totalAdSpend,
      profit: acc.profit + month.finalProfitWithDaily
    }), { revenue: 0, spend: 0, profit: 0 });
    
    // Calculate ROI
    totals.roi = totals.spend > 0 ? (totals.profit / totals.spend) * 100 : 0;
    
    return totals;
  }, [monthlyTotals]);

  // Function to send the break-even notification
  const sendBreakEvenNotification = async (currentProfit, breakEvenPoint, monthData) => {
    try {
      setIsSendingNotification(true);
      setNotificationError(null);
      
      const requestData = {
        type: 'break-even',
        data: {
          profit: currentProfit,
          expenses: breakEvenPoint,
          commissions: monthData.mediaBuyerCommission,
          dailyExpenses: monthData.dailyExpenses,
          roi: monthData.roi,
          revenue: monthData.totalRevenue,
          adSpend: monthData.totalAdSpend,
          projectedProfit: currentProfit * 1.2 // Simple projection based on current profit
        }
      };
      
      console.log('Sending notification with data:', requestData);
      
      const response = await fetch('/api/slack-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error response from server:', responseData);
        throw new Error(responseData.error || responseData.message || 'Server returned an error');
      }
      
      console.log('Break-even notification sent successfully:', responseData);
    } catch (error) {
      console.error('Detailed error sending break-even notification:', error);
      setNotificationError(error.message || 'Failed to send notification to Slack. Check console for details.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Function to manually send notification
  const handleManualNotification = async () => {
    if (monthlyTotals.length > 0) {
      const currentProfit = monthlyTotals[0].finalProfitWithDaily;
      const totalExpenses = (monthlyTotals[0]?.mediaBuyerCommission || 0) + (monthlyTotals[0]?.dailyExpenses || 0);
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // Check if notification was already sent this month
      const notificationSentFlag = localStorage.getItem(`breakeven-notification-${currentMonth}`);
      if (notificationSentFlag) {
        // Show already sent status without sending again
        setNotificationSent(true);
        return;
      }
      
      await sendBreakEvenNotification(currentProfit, totalExpenses, monthlyTotals[0]);
      
      // Mark as sent in state and localStorage
      localStorage.setItem(`breakeven-notification-${currentMonth}`, 'true');
      setNotificationSent(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* YTD Overview Widget */}
      {monthlyTotals.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Year-to-Date Performance</h3>
                <p className="text-sm text-gray-500">Performance summary for {new Date().getFullYear()}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>YTD</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* YTD Revenue */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">YTD Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(ytdTotals.revenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              {/* YTD Spend */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">YTD Spend</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(ytdTotals.spend)}
                    </p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-red-500" />
                </div>
              </div>
              
              {/* YTD Profit */}
              <div className={`bg-gradient-to-r ${ytdTotals.profit >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ytdTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      YTD Profit
                    </p>
                    <p className={`text-2xl font-bold ${ytdTotals.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(ytdTotals.profit)}
                    </p>
                  </div>
                  <TrendingUp className={`w-8 h-8 ${ytdTotals.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
              
              {/* YTD ROI */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">YTD ROI</p>
                    <p className={`text-2xl font-bold ${ytdTotals.roi >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatPercent(ytdTotals.roi)}
                    </p>
                  </div>
                  <Percent className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>
            
            {/* YTD Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Summary:</span> 
                  {ytdTotals.profit >= 0 ? (
                    <span className="text-green-600 ml-1">
                      Profitable year with {formatPercent(ytdTotals.roi)} return on ad spend
                    </span>
                  ) : (
                    <span className="text-red-600 ml-1">
                      Currently at a loss of {formatCurrency(Math.abs(ytdTotals.profit))} YTD
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {monthlyTotals.filter(month => month.monthStart.getFullYear() === new Date().getFullYear()).length} months of data
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Status */}
      {monthlyTotals.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6">
            {(() => {
              const trendStatus = getTrendStatus(monthlyTotals);
              const currentProfit = monthlyTotals[0].finalProfitWithDaily;
              const trendComponents = getTrendComponents(trendStatus, currentProfit, monthlyTotals);
              
              // Calculate total expenses for the current month
              const totalExpenses = (monthlyTotals[0]?.mediaBuyerCommission || 0) + (monthlyTotals[0]?.dailyExpenses || 0);

              // Show notification button only if profitable or close to break-even
              const showNotificationButton = currentProfit > 0 || 
                (currentProfit < 0 && (currentProfit / Math.abs(totalExpenses)) > -0.1);

              return (
                <div className={`bg-gradient-to-br ${trendComponents.bgGradient} rounded-xl p-6 transform transition-all duration-200 hover:shadow-lg relative overflow-hidden group`}>
                  {/* Background Line */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d={trendComponents.lineData}
                        stroke={currentProfit >= 0 ? "#28a745" : "#dc2626"}
                        strokeWidth="2"
                        fill="none"
                        className="group-hover:animate-slide-once"
                      />
                    </svg>
                  </div>
                  
                  {/* Notification Status */}
                  {currentProfit > 0 && (
                    <div className="absolute top-2 right-2">
                      {notificationSent ? (
                        <div className="flex items-center text-sm bg-green-50 px-3 py-1.5 rounded-md text-green-600">
                          <Bell className="w-4 h-4 mr-1.5" />
                          <span>Break-even notification sent</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleManualNotification}
                          disabled={isSendingNotification}
                          className="flex items-center text-sm px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
                        >
                          <Bell className="w-4 h-4 mr-1.5" />
                          {isSendingNotification ? 'Sending...' : 'Send Break-Even Alert'}
                        </button>
                      )}
                      {notificationError && (
                        <div className="mt-1.5 text-xs bg-red-50 text-red-600 p-1.5 rounded">
                          Error: {notificationError}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-col">
                          <div className="text-4xl font-bold text-[#28a745]">
                            +{formatCurrency(monthlyTotals[0].baseProfit)}
                          </div>
                          <div className="text-sm text-gray-500">this month</div>
                          <div className="text-sm text-gray-400 uppercase tracking-wider mt-1">Current Month Profit</div>
                        </div>
                        
                        {/* Progress to Profitability */}
                        <div className="mt-6">
                          <div className="text-sm text-gray-500">Progress to Break-even</div>
                          <div className="relative h-2 bg-gray-100 rounded-full overflow-visible mt-2">
                            {/* Break-even point marker (middle line) */}
                            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-300 z-10">
                              {/* Amount to go label */}
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                <span className="font-medium text-gray-700 text-sm">
                                  {currentProfit >= 0 
                                    ? `Profitable: +${formatCurrency(currentProfit)}` 
                                    : `${formatCurrency(Math.abs(currentProfit))} to go`}
                                </span>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div 
                              className="h-full transition-all duration-500 rounded-l-full"
                              style={{ 
                                width: currentProfit >= 0 
                                  ? `${50 + (Math.min(currentProfit, totalExpenses) / totalExpenses) * 50}%` 
                                  : `${50 * (1 + currentProfit/Math.abs(totalExpenses))}%`,
                                backgroundColor: currentProfit >= 0 ? '#28a745' : '#dc2626'
                              }}
                            />
                            
                            {/* Current Position Marker */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-sm z-20"
                              style={{ 
                                left: currentProfit >= 0 
                                  ? `${50 + (Math.min(currentProfit, totalExpenses) / totalExpenses) * 50}%` 
                                  : `${50 * (1 + currentProfit/Math.abs(totalExpenses))}%`,
                                transform: 'translate(-50%, -50%)',
                                borderColor: currentProfit >= 0 ? '#28a745' : '#dc2626'
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-red-500">Loss (-{formatCurrency(Math.abs(totalExpenses))})</span>
                            <span className="text-gray-500">Break-even ($0)</span>
                            <span className="text-[#28a745]">Target (+{formatCurrency(totalExpenses)})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        {/* Average Daily Profit & Break-even Projection */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-500">Average Daily Profit</div>
                            <div className={`text-2xl font-semibold ${monthlyTotals[0].days[0].baseProfit >= 0 ? 'text-[#28a745]' : 'text-red-600'}`}>
                              {formatCurrency(monthlyTotals[0].days[0].baseProfit)}
                            </div>
                          </div>
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dailyProfitData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 10 }}
                                  interval="preserveStartEnd"
                                />
                                <YAxis 
                                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                                  tick={{ fontSize: 10 }}
                                  width={60}
                                />
                                <Tooltip 
                                  formatter={(value) => formatCurrency(value)}
                                  labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Bar 
                                  dataKey="profit" 
                                  fill={monthlyTotals[0].days[0].baseProfit >= 0 ? '#28a745' : '#dc2626'}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          {monthlyTotals[0].days[0].baseProfit > 0 && currentProfit < 0 && (
                            <div>
                              <div className="text-sm text-gray-500">Projected Break-even Date</div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <div className="text-xl font-semibold text-gray-800">
                                  {format(
                                    addDays(new Date(), Math.ceil(Math.abs(currentProfit) / monthlyTotals[0].days[0].baseProfit)),
                                    'MMM d, yyyy'
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Monthly Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Income – {monthlyTotals[0] ? format(monthlyTotals[0].monthStart, 'MMMM yyyy') : 'Loading...'}
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(monthlyTotals[0]?.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ad Spend</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(monthlyTotals[0]?.totalAdSpend || 0)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Net Income</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(monthlyTotals[0]?.baseProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Expenses – {monthlyTotals[0] ? format(monthlyTotals[0].monthStart, 'MMMM yyyy') : 'Loading...'}
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Media Buyer Commission</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(monthlyTotals[0]?.mediaBuyerCommission || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Expenses</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(monthlyTotals[0]?.dailyExpenses || 0)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total Expenses</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(
                      (monthlyTotals[0]?.mediaBuyerCommission || 0) +
                      (monthlyTotals[0]?.ringbaExpense || 0) +
                      (monthlyTotals[0]?.dailyExpenses || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Media Buyer P&L */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
              <p className="text-sm text-gray-500 mt-1">
                6-month trend of revenue, expenses, and profitability
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="w-full overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-4 h-4" />
                      Revenue
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <Receipt className="w-4 h-4" />
                      Ad Spend
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    <div className="flex items-center justify-end gap-1">
                      <BarChart2 className="w-4 h-4" />
                      Base Profit
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    <div className="flex items-center justify-end gap-1">
                      <Percent className="w-4 h-4" />
                      Base ROI
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    <div className="flex items-center justify-end gap-1">
                      <Receipt className="w-4 h-4" />
                      MB Comm
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    <div className="flex items-center justify-end gap-1">
                      <Receipt className="w-4 h-4" />
                      Daily Exp
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    <div className="flex items-center justify-end gap-1">
                      <BarChart2 className="w-4 h-4" />
                      Final Profit
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    <div className="flex items-center justify-end gap-1">
                      <Percent className="w-4 h-4" />
                      Net %
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyTotals.map((month, index) => {
                  const isCurrentMonth = index === 0;
                  const roi = month.totalAdSpend ? (month.baseProfit / month.totalAdSpend) * 100 : 0;
                  const netRoi = month.roi;
                  
                  return (
                    <tr 
                      key={format(month.monthStart, 'yyyy-MM')} 
                      className={`hover:bg-gray-50 ${isCurrentMonth ? 'bg-gray-50' : ''}`}
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(month.monthStart, 'MMMM yyyy')}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(month.totalRevenue)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(month.totalAdSpend)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                        {formatCurrency(month.baseProfit)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                        {formatPercent(roi)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-600 bg-orange-50 border-l-2 border-gray-300">
                        {formatCurrency(month.mediaBuyerCommission)}*
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-600 bg-orange-50">
                        {formatCurrency(month.dailyExpenses)}***
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-medium bg-green-50">
                        {formatCurrency(month.finalProfitWithDaily)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-right bg-green-50">
                        <div className="flex items-center justify-end gap-1">
                          {netRoi >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          {formatPercent(netRoi)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-500 italic">
              * MB Comm based on individual commission rates per media buyer | ** Daily Exp total $59,217 per month (prorated for current month based on days of data)
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Breakdown</h3>
              <p className="text-sm text-gray-500 mt-1">
                Detailed daily performance metrics by month
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            {monthlyTotals.map((month) => {
              const monthKey = format(month.monthStart, 'yyyy-MM');
              const isExpanded = expandedMonths.has(monthKey);
              
              return (
                <div key={monthKey} className="mb-8 last:mb-0">
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
                  >
                    <h3 className="text-lg font-semibold">
                      {format(month.monthStart, 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {formatCurrency(month.finalProfitWithoutDaily)} Profit
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border border-t-0 border-gray-200 rounded-b-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Spend</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Base Profit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center justify-end gap-1">
                                MB Commission
                                <div className="group relative">
                                  <HelpCircle className="h-4 w-4 text-gray-400" />
                                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                    Media Buyer Commission: Individual commission rates per media buyer
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Profit</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {month.days.map((day) => (
                            <tr key={format(day.date, 'yyyy-MM-dd')} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(day.date, 'MMM d')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                                {formatCurrency(day.totalRevenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                {formatCurrency(day.totalAdSpend)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                {formatCurrency(day.baseProfit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                                {formatCurrency(day.mediaBuyerCommission)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                {formatCurrency(day.finalProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">Monthly Totals</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                              {formatCurrency(month.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                              {formatCurrency(month.totalAdSpend)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                              {formatCurrency(month.baseProfit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-bold">
                              {formatCurrency(month.mediaBuyerCommission)}*
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                              {formatCurrency(month.finalProfitWithoutDaily)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Update the styles section at the bottom of the file
const styles = `
  @keyframes slideOnce {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-once {
    animation: slideOnce 0.8s ease-out forwards;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default MediaBuyerPL; 