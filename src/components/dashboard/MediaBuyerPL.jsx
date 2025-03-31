import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
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

  // Process the data to calculate daily totals with additional expenses
  const monthlyTotals = React.useMemo(() => {
    // First, calculate daily totals
    const dailyTotals = _.chain(performanceData)
      .groupBy('Date')
      .map((dayData, date) => {
        // Parse the date from MM/DD/YYYY format
        const [month, day, year] = date.split('/').map(Number);
        const parsedDate = new Date(year, month - 1, day);

        // Calculate base metrics
        const totalRevenue = _.sumBy(dayData, 'Total Revenue');
        const totalAdSpend = _.sumBy(dayData, 'Ad Spend');
        const baseProfit = totalRevenue - totalAdSpend;

        // Calculate ACA-ACA specific revenue for Ringba costs
        const acaRevenue = _.sumBy(dayData.filter(row => 
          row.Network?.toLowerCase().includes('aca') && 
          row.Offer?.toLowerCase().includes('aca')
        ), 'Total Revenue');
        
        // Calculate additional expenses
        const mediaBuyerCommission = baseProfit * 0.10; // 10% of profit
        const ringbaExpense = acaRevenue * 0.02; // 2% of ACA-ACA revenue
        const dailyExpenses = 2819.81; // Fixed daily expenses amount (Payroll and General $59,217) / 21 working days
        const totalExpenses = mediaBuyerCommission + ringbaExpense; // Removed dailyExpenses from daily breakdown

        // Calculate final profit and ROI
        const finalProfit = baseProfit - totalExpenses;
        const roi = totalAdSpend ? (finalProfit / totalAdSpend) * 100 : 0;

        return {
          date: parsedDate,
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
      .value();

    // Then group by month
    return _.chain(dailyTotals)
      .groupBy(day => format(day.date, 'yyyy-MM'))
      .map((days, monthKey) => {
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
      })
      .orderBy(['monthStart'], ['desc'])
      .value();
  }, [performanceData]);

  return (
    <div>
      {/* Current Month Status */}
      {monthlyTotals.length > 0 && (
        <div className="mb-8">
          {(() => {
            const trendStatus = getTrendStatus(monthlyTotals);
            const { icon, text, bgGradient, lineData } = getTrendComponents(trendStatus);
            
            return (
              <div className={`bg-gradient-to-br ${bgGradient} rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:shadow-xl relative overflow-hidden group`}>
                {/* Background Line - Now only animates on hover */}
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

                {/* Title Section */}
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-800">📈 March Performance Summary</h2>
                  <div className="group relative">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="absolute left-full ml-2 top-0 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50">
                      <div className="absolute -left-2 top-3 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                      <div className="relative">
                        <p className="font-medium mb-1">Understanding this metric:</p>
                        <p className="text-gray-300 text-xs">Final profit includes revenue minus ad spend and all expenses (Media Buyer Commission, Ringba Costs, and Daily Expenses).</p>
                      </div>
                    </div>
                  </div>
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
      )}

      <Card>
        <CardHeader className="px-4">
          <CardTitle>Overall Media Buyer P&L</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <div className="w-full">
            {/* Monthly Summary Table */}
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Spend</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    <div className="flex items-center justify-end gap-1">
                      Base Profit
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Revenue minus Ad Spend (before expenses)
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    <div className="flex items-center justify-end gap-1">
                      Base ROI
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Base Profit / Ad Spend (before expenses)
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-300 bg-orange-50">
                    <div className="flex items-center justify-end gap-1">
                      MB Comm
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Media Buyer Commission: 10% of base profit for each media buyer
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
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
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    <div className="flex items-center justify-end gap-1">
                      Daily Exp
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Daily Expenses: Payroll and general expenses
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    <div className="flex items-center justify-end gap-1">
                      Final Profit
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Base Profit minus all expenses (MB Commission, Ringba Cost, Daily Expenses)
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    <div className="flex items-center justify-end gap-1">
                      Final ROI
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          Final Profit / Ad Spend (after all expenses)
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyTotals.map((month) => (
                  <tr key={format(month.monthStart, 'yyyy-MM')} className="hover:bg-gray-50">
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
                      {formatPercent(month.totalAdSpend ? (month.baseProfit / month.totalAdSpend) * 100 : 0)}
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
                      {formatPercent(month.roi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-500 italic">
              * MB Comm based on 10% of base profit | ** Ringba Cost based on 2% of ACA revenue | *** Daily Exp total $59,217 per month (prorated for current month based on days of data)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {monthlyTotals.map((month) => {
              const monthKey = format(month.monthStart, 'yyyy-MM');
              const isExpanded = expandedMonths.has(monthKey);
              
              return (
                <div key={monthKey} className="mb-8">
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
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
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
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