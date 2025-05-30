import React, { useMemo, useState } from 'react';
import { Card } from '../ui/card';
import { format, startOfMonth, endOfMonth, isSameDay, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { TrendingUp, DollarSign, Target, ChevronDown, ChevronRight, ChevronDownSquare, ChevronRightSquare, ChevronUpSquare, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '../ui/input';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const EODReport = ({ performanceData }) => {
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [networkFilter, setNetworkFilter] = useState('all');
  const [offerFilter, setOfferFilter] = useState('all');
  const [mediaBuyerFilter, setMediaBuyerFilter] = useState('all');

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="text-center text-gray-500">
            No performance data available
          </div>
        </Card>
      </div>
    );
  }

  // Get unique values for filters
  const filters = useMemo(() => {
    const networks = new Set();
    const offers = new Set();
    const mediaBuyers = new Set();
    const eduOffers = new Set();

    performanceData.forEach(entry => {
      if (!entry.Date) return;

      const parseValue = (value) => {
        if (typeof value === 'string') {
          return parseFloat(value.replace(/[$,]/g, ''));
        }
        return typeof value === 'number' ? value : 0;
      };

      // Only add to filters if there's activity (revenue or spend)
      const hasActivity = (
        (entry['Total Revenue'] && parseValue(entry['Total Revenue']) !== 0) ||
        (entry['Ad Spend'] && parseValue(entry['Ad Spend']) !== 0)
      );

      if (!hasActivity) return;

      if (entry && entry.Network) {
        networks.add(entry.Network);
      }
      if (entry && entry.Offer) {
        offers.add(entry.Offer);
        // Collect EDU offers separately
        if (entry.Offer.toUpperCase().includes('EDU')) {
          eduOffers.add(entry.Offer);
        }
      }
      if (entry && entry['Media Buyer']) {
        mediaBuyers.add(entry['Media Buyer']);
      }
    });

    // Add EDU as a special filter if we have any EDU offers
    const offersList = Array.from(offers).sort();
    if (eduOffers.size > 0) {
      offersList.unshift('EDU');
    }

    return {
      networks: Array.from(networks).sort(),
      offers: offersList,
      mediaBuyers: Array.from(mediaBuyers).sort()
    };
  }, [performanceData]);

  // Get data with filters
  const yearData = useMemo(() => {
    if (!performanceData || !Array.isArray(performanceData)) {
      return [];
    }

    // Filter the data based on selected filters only (no date filtering)
    const filteredData = performanceData.filter(entry => {
      const matchesNetwork = networkFilter === 'all' || entry.Network === networkFilter;
      const matchesOffer = offerFilter === 'all' || 
        (offerFilter === 'EDU' ? entry.Offer.toUpperCase().includes('EDU') : entry.Offer === offerFilter);
      const matchesMediaBuyer = mediaBuyerFilter === 'all' || entry['Media Buyer'] === mediaBuyerFilter;
      return matchesNetwork && matchesOffer && matchesMediaBuyer;
    });

    // First, group by date
    const dailyData = filteredData.reduce((acc, entry) => {
      // Parse date in MM/DD/YYYY format
      if (!entry.Date) return acc;

      const [month, day, year] = entry.Date.split('/');
      const entryDate = new Date(year, month - 1, day);
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const monthKey = format(entryDate, 'yyyy-MM');
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthName: format(entryDate, 'MMMM yyyy'),
          totalRevenue: 0,
          totalSpend: 0,
          totalProfit: 0,
          days: {}
        };
      }
      
      if (!acc[monthKey].days[dateKey]) {
        acc[monthKey].days[dateKey] = {
          date: entryDate,
          totalRevenue: 0,
          totalSpend: 0,
          totalProfit: 0,
          details: new Map()
        };
      }
      
      const revenue = typeof entry['Total Revenue'] === 'string' 
        ? parseFloat(entry['Total Revenue'].replace(/[$,]/g, '')) 
        : typeof entry['Total Revenue'] === 'number' 
          ? entry['Total Revenue'] 
          : 0;

      const spend = typeof entry['Ad Spend'] === 'string'
        ? parseFloat(entry['Ad Spend'].replace(/[$,]/g, ''))
        : typeof entry['Ad Spend'] === 'number'
          ? entry['Ad Spend']
          : 0;

      const profit = revenue - spend;
      
      // Update month totals
      acc[monthKey].totalRevenue += revenue;
      acc[monthKey].totalSpend += spend;
      acc[monthKey].totalProfit += profit;
      
      // Update day totals
      acc[monthKey].days[dateKey].totalRevenue += revenue;
      acc[monthKey].days[dateKey].totalSpend += spend;
      acc[monthKey].days[dateKey].totalProfit += profit;
      
      // Create a unique key for this combination
      const detailKey = `${entry.Network}|${entry.Offer}|${entry['Media Buyer']}`;
      
      if (acc[monthKey].days[dateKey].details.has(detailKey)) {
        // Update existing combination
        const existing = acc[monthKey].days[dateKey].details.get(detailKey);
        existing.revenue += revenue;
        existing.spend += spend;
        existing.profit += profit;
      } else {
        // Add new combination
        acc[monthKey].days[dateKey].details.set(detailKey, {
          network: entry.Network,
          offer: entry.Offer,
          mediaBuyer: entry['Media Buyer'],
          revenue: revenue,
          spend: spend,
          profit: profit
        });
      }
      return acc;
    }, {});

    // Transform the data structure
    return Object.entries(dailyData)
      .map(([monthKey, monthData]) => ({
        monthKey,
        monthName: monthData.monthName,
        totalRevenue: monthData.totalRevenue,
        totalSpend: monthData.totalSpend,
        totalProfit: monthData.totalProfit,
        days: Object.entries(monthData.days)
          .map(([dateKey, dayData]) => ({
            dateKey,
            date: dayData.date,
            totalRevenue: dayData.totalRevenue,
            totalSpend: dayData.totalSpend,
            totalProfit: dayData.totalProfit,
            details: Array.from(dayData.details.values()).sort((a, b) => b.profit - a.profit)
          }))
          .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [performanceData, networkFilter, offerFilter, mediaBuyerFilter]);

  const ytdTotals = useMemo(() => {
    return yearData.reduce((acc, month) => ({
      revenue: acc.revenue + month.totalRevenue,
      spend: acc.spend + month.totalSpend,
      profit: acc.profit + month.totalProfit
    }), { revenue: 0, spend: 0, profit: 0 });
  }, [yearData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const toggleDayExpansion = (dateKey) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDays(newExpanded);
  };

  const toggleAllDays = () => {
    if (expandedDays.size === yearData.reduce((acc, month) => acc + month.days.length, 0)) {
      setExpandedDays(new Set());
    } else {
      setExpandedDays(new Set(yearData.flatMap(month => month.days.map(day => day.dateKey))));
    }
  };

  const toggleMonthExpansion = (monthKey) => {
    setExpandedMonths(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey);
      } else {
        newExpanded.add(monthKey);
      }
      return newExpanded;
    });
  };

  const toggleAllMonths = () => {
    if (expandedMonths.size === yearData.length) {
      setExpandedMonths(new Set());
    } else {
      setExpandedMonths(new Set(yearData.map(month => month.monthKey)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">2025 EOD Report</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleAllMonths}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {expandedMonths.size === yearData.length ? (
              <>
                <ChevronUpSquare className="h-4 w-4" />
                Collapse All Months
              </>
            ) : (
              <>
                <ChevronDownSquare className="h-4 w-4" />
                Expand All Months
              </>
            )}
          </button>
          <button
            onClick={toggleAllDays}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {expandedDays.size === yearData.reduce((acc, month) => acc + month.days.length, 0) ? (
              <>
                <ChevronUpSquare className="h-4 w-4" />
                Collapse All Days
              </>
            ) : (
              <>
                <ChevronDownSquare className="h-4 w-4" />
                Expand All Days
              </>
            )}
          </button>
        </div>
      </div>

      {/* YTD Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">YTD Revenue</p>
              <h3 className="text-3xl font-bold">{formatCurrency(ytdTotals.revenue)}</h3>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">YTD Spend</p>
              <h3 className="text-3xl font-bold">{formatCurrency(ytdTotals.spend)}</h3>
            </div>
            <Target className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">YTD Profit</p>
              <h3 className={`text-3xl font-bold ${ytdTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(ytdTotals.profit)}
              </h3>
            </div>
            <TrendingUp className={`h-10 w-10 ${ytdTotals.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </Card>
      </div>

      {/* YTD Profit Trend Graph */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">YTD Profit Trend</h3>
            <p className="text-sm text-gray-500">Month-over-month profit performance</p>
          </div>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
              Shows the monthly profit for each month in 2025
              <div className="absolute right-0 bottom-0 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData
              .slice()
              .reverse()
              .map(month => ({
                month: format(new Date(month.monthKey + '-01'), 'MMM'),
                profit: month.totalProfit
              }))}>
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                padding={{ left: 20, right: 20 }}
              />
              <Bar
                dataKey="profit"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow-lg">
                        <p className="text-sm font-medium">{payload[0].payload.month}</p>
                        <p className="text-sm text-green-600">
                          {formatCurrency(payload[0].value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-lg border">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Network</label>
          <div className="relative">
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg max-h-[200px] overflow-y-auto">
                <SelectItem value="all" className="hover:bg-gray-100">All Networks</SelectItem>
                {filters.networks.map(network => (
                  <SelectItem key={network} value={network} className="hover:bg-gray-100">
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {networkFilter !== 'all' && (
              <button
                onClick={() => setNetworkFilter('all')}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Offer</label>
          <div className="relative">
            <Select value={offerFilter} onValueChange={setOfferFilter}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue placeholder="All Offers" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg max-h-[200px] overflow-y-auto">
                <SelectItem value="all" className="hover:bg-gray-100">All Offers</SelectItem>
                {filters.offers.map(offer => (
                  <SelectItem key={offer} value={offer} className="hover:bg-gray-100">
                    {offer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {offerFilter !== 'all' && (
              <button
                onClick={() => setOfferFilter('all')}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Media Buyer</label>
          <div className="relative">
            <Select value={mediaBuyerFilter} onValueChange={setMediaBuyerFilter}>
              <SelectTrigger className="w-full bg-white border-gray-200">
                <SelectValue placeholder="All Media Buyers" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg max-h-[200px] overflow-y-auto">
                <SelectItem value="all" className="hover:bg-gray-100">All Media Buyers</SelectItem>
                {filters.mediaBuyers.map(buyer => (
                  <SelectItem key={buyer} value={buyer} className="hover:bg-gray-100">
                    {buyer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mediaBuyerFilter !== 'all' && (
              <button
                onClick={() => setMediaBuyerFilter('all')}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Performance Tables with Expandable Rows */}
      <div className="space-y-8">
        {yearData.map((month) => (
          <div key={month.monthKey} className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                {/* Month Header - Made Clickable */}
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  onClick={() => toggleMonthExpansion(month.monthKey)}
                >
                  <div className="flex items-center gap-2">
                    {expandedMonths.has(month.monthKey) ? 
                      <ChevronDown className="h-5 w-5" /> : 
                      <ChevronRight className="h-5 w-5" />
                    }
                    <h3 className="text-xl font-semibold text-gray-800">{month.monthName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Revenue: {formatCurrency(month.totalRevenue)}</span>
                    <span>Spend: {formatCurrency(month.totalSpend)}</span>
                    <span className={month.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Profit: {formatCurrency(month.totalProfit)}
                    </span>
                  </div>
                </div>

                {expandedMonths.has(month.monthKey) && (
                  <>
                    {/* Monthly Metrics - Smaller than YTD */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">MTD Revenue</p>
                            <p className="text-lg font-semibold">{formatCurrency(month.totalRevenue)}</p>
                          </div>
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">MTD Spend</p>
                            <p className="text-lg font-semibold">{formatCurrency(month.totalSpend)}</p>
                          </div>
                          <Target className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">MTD Profit</p>
                            <p className={`text-lg font-semibold ${month.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(month.totalProfit)}
                            </p>
                          </div>
                          <TrendingUp className={`h-5 w-5 ${month.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Daily table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 w-8"></th>
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2"></th>
                            <th className="text-left py-2"></th>
                            <th className="text-left py-2"></th>
                            <th className="text-right py-2">Revenue</th>
                            <th className="text-right py-2">Spend</th>
                            <th className="text-right py-2">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.days.map((day) => (
                            <React.Fragment key={day.dateKey}>
                              {/* Parent row (daily total) */}
                              <tr 
                                className={`border-b cursor-pointer hover:bg-gray-50 ${
                                  day.totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                                }`}
                                onClick={() => toggleDayExpansion(day.dateKey)}
                              >
                                <td className="py-2">
                                  {expandedDays.has(day.dateKey) ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                </td>
                                <td className="py-2 font-medium">{format(day.date, 'MMM d, yyyy')}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td className="text-right py-2">{formatCurrency(day.totalRevenue)}</td>
                                <td className="text-right py-2">{formatCurrency(day.totalSpend)}</td>
                                <td className={`text-right py-2 font-medium ${day.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(day.totalProfit)}
                                </td>
                              </tr>
                              
                              {/* Column headers for details when expanded */}
                              {expandedDays.has(day.dateKey) && (
                                <tr className="bg-gray-50 text-sm">
                                  <td></td>
                                  <td></td>
                                  <td className="py-1 font-bold">Network</td>
                                  <td className="py-1 font-bold">Offer</td>
                                  <td className="py-1 font-bold">Media Buyer</td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                </tr>
                              )}
                              
                              {/* Child rows (details) */}
                              {expandedDays.has(day.dateKey) && day.details.map((detail, idx) => (
                                <tr 
                                  key={`${day.dateKey}-${idx}`} 
                                  className={`border-b text-sm ${
                                    detail.profit >= 0 ? 'bg-green-50/50' : 'bg-red-50/50'
                                  }`}
                                >
                                  <td></td>
                                  <td></td>
                                  <td className="py-1">{detail.network}</td>
                                  <td className="py-1">{detail.offer}</td>
                                  <td className="py-1">{detail.mediaBuyer}</td>
                                  <td className="text-right py-1">{formatCurrency(detail.revenue)}</td>
                                  <td className="text-right py-1">{formatCurrency(detail.spend)}</td>
                                  <td className={`text-right py-1 ${detail.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(detail.profit)}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EODReport;