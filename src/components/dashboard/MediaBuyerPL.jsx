import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronDown, ChevronRight, HelpCircle, TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2, Percent } from 'lucide-react';
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

const MediaBuyerPL = ({ performanceData }) => {
  const [expandedMonths, setExpandedMonths] = useState(new Set());

  // Get trend status by comparing current month with previous month
  const getTrendStatus = (monthlyTotals) => {
    if (monthlyTotals.length < 2) return 'stable';
    const currentProfit = monthlyTotals[0].finalProfitWithDaily;
    const lastMonthProfit = monthlyTotals[1].finalProfitWithDaily;
    const percentChange = ((currentProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100;
    
    if (percentChange > 5) return 'up';
    if (percentChange < -5) return 'down';
    return 'stable';
  };

  // Get trend indicator components based on status
  const getTrendComponents = (status) => {
    const indicators = {
      up: {
        icon: '✅',
        text: 'Profitable – Up',
        bgGradient: 'from-white to-green-50/30',
        lineData: 'M0 15 L100 0',
      },
      stable: {
        icon: '🟢',
        text: 'Profitable – Stable',
        bgGradient: 'from-white to-gray-50/30',
        lineData: 'M0 10 L100 10',
      },
      down: {
        icon: '⚠️',
        text: 'Profitable – Down',
        bgGradient: 'from-white to-yellow-50/30',
        lineData: 'M0 0 L100 15',
      },
    };
    return indicators[status] || indicators.stable;
  };

  // Set the current month to be expanded by default
  React.useEffect(() => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    setExpandedMonths(new Set([currentMonthKey]));
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
            parsedDate = new Date(year, month - 1, day);
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

        const baseProfit = totalRevenue - totalAdSpend;
        const mediaBuyerCommission = baseProfit * 0.10; // 10% of profit
        const ringbaExpense = acaRevenue * 0.02; // 2% of ACA-ACA revenue
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
            dailyExpenses: totalDailyExpenses, // Use the total amount
            // For summary table (includes daily expenses)
            finalProfitWithDaily: _.sumBy(days, 'finalProfit') - totalDailyExpenses,
            // For breakdown table (excludes daily expenses)
            finalProfitWithoutDaily: _.sumBy(days, 'finalProfit'),
            // Calculate ROI using finalProfitWithDaily for summary table
            roi: _.sumBy(days, 'totalAdSpend') ? 
              ((_.sumBy(days, 'finalProfit') - totalDailyExpenses) / _.sumBy(days, 'totalAdSpend')) * 100 : 0,
            days: days.map(day => ({
              ...day,
              dailyExpenses: dailyExpenseAmount // Update each day's daily expenses
            }))
          };

          return monthTotal;
        } catch (error) {
          console.error('Error processing month:', monthKey, error);
          return null;
        }
      })
      .filter(Boolean) // Remove any null entries from failed month processing
      .orderBy(['monthStart'], ['desc'])
      .value();
  }, [performanceData]);

  return (
    <div className="space-y-6">
      {/* Current Month Status */}
      {monthlyTotals.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6">
            {(() => {
              const trendStatus = getTrendStatus(monthlyTotals);
              const { icon, text, bgGradient, lineData } = getTrendComponents(trendStatus);
              
              return (
                <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-6 transform transition-all duration-200 hover:shadow-lg relative overflow-hidden group`}>
                  {/* Background Line */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d={lineData}
                        stroke="#28a745"
                        strokeWidth="2"
                        fill="none"
                        className="group-hover:animate-slide-once"
                      />
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <div className="text-6xl font-bold text-[#28a745] mb-2">
                          {formatCurrency(monthlyTotals[0].finalProfitWithDaily)}
                        </div>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Profit/Loss</div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-4xl font-bold text-[#28a745]">
                            {formatPercent(monthlyTotals[0].roi)}
                          </div>
                          <svg className="w-8 h-8 text-[#28a745]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ROI</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm font-medium text-gray-700">{text}</span>
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
              <h3 className="text-lg font-semibold text-gray-900">Income – March 2024</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">Expenses – March 2024</h3>
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
                <span className="text-sm text-gray-600">Ringba Cost</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(monthlyTotals[0]?.ringbaExpense || 0)}
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
                      Ringba Cost
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
                        {formatCurrency(month.ringbaExpense)}**
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
              * MB Comm based on 10% of base profit | ** Ringba Cost based on 2% of ACA revenue | *** Daily Exp total $59,217 per month (prorated for current month based on days of data)
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
                                    Media Buyer Commission: 10% of base profit for each media buyer
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center justify-end gap-1">
                                Ringba Cost
                                <div className="group relative">
                                  <HelpCircle className="h-4 w-4 text-gray-400" />
                                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                    Ringba Cost: 2% of ACA revenue
                                  </div>
                                </div>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Profit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                                {formatCurrency(day.ringbaExpense)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                {formatCurrency(day.finalProfit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                {formatPercent(day.roi)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Monthly Totals</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                              {formatCurrency(month.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                              {formatCurrency(month.totalAdSpend)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                              {formatCurrency(month.baseProfit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                              {formatCurrency(month.mediaBuyerCommission)}*
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                              {formatCurrency(month.ringbaExpense)}**
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                              {formatCurrency(month.finalProfitWithoutDaily)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                              {formatPercent(month.roi)}
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