import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { TrendingUp, DollarSign, Search, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays, subMonths, parseISO, isWithinInterval, addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkline } from '../ui/sparkline';
import { Input } from '../ui/input';
import InvoicesTable from './InvoicesTable';
import UpcomingExpensesTable from './UpcomingExpensesTable';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AIInsightsPage = ({ performanceData, invoiceData, expenseData, cashFlowData }) => {
  // Debug logging for invoice data
  console.log('AIInsightsPage received invoiceData:', {
    exists: !!invoiceData,
    isArray: Array.isArray(invoiceData),
    length: invoiceData?.length,
    sample: invoiceData?.slice(0, 2),
    type: typeof invoiceData
  });
  
  const [dateRange, setDateRange] = useState('mtd');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [analysisDateRange, setAnalysisDateRange] = useState('mtd');
  const [expandedCampaigns, setExpandedCampaigns] = useState(new Set());
  const [middayCheckInData, setMiddayCheckInData] = useState([]);

  // Load check-in data from localStorage
  useEffect(() => {
    const storedCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
    setMiddayCheckInData(storedCheckIns);
  }, []);

  // Get the most recent check-in data
  const recentCheckIn = useMemo(() => {
    if (middayCheckInData.length === 0) return null;
    return middayCheckInData[middayCheckInData.length - 1];
  }, [middayCheckInData]);

  // Calculate summary metrics for the most recent check-in
  const checkInMetrics = useMemo(() => {
    if (!recentCheckIn) return null;

    return recentCheckIn.campaigns.reduce((acc, campaign) => ({
      totalSpend: acc.totalSpend + campaign.spend,
      totalRevenue: acc.totalRevenue + campaign.revenue,
      totalProfit: acc.totalProfit + campaign.profit,
      totalLeads: acc.totalLeads + campaign.leads,
      scaleCount: acc.scaleCount + (campaign.roi >= 30 ? 1 : 0),
      watchCount: acc.watchCount + (campaign.roi >= 15 && campaign.roi < 30 ? 1 : 0),
      shutoffCount: acc.shutoffCount + (campaign.roi < 15 ? 1 : 0)
    }), {
      totalSpend: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalLeads: 0,
      scaleCount: 0,
      watchCount: 0,
      shutoffCount: 0
    });
  }, [recentCheckIn]);

  // Calculate the last data date from performance data
  const lastDataDate = useMemo(() => {
    if (!performanceData?.length) return new Date();
    
    const dates = performanceData
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      })
      .filter(Boolean);
    
    return dates.length ? new Date(Math.max(...dates)) : new Date();
  }, [performanceData]);

  // Media Buyer Categories
  const mediaBuyerCategories = {
    new: ['Ishaan', 'Edwin', 'Gagan', 'Nick N', 'Jose/Matt', 'Isha', 'Mike C', 'Emil'],
    active: ['Aakash', 'Mike', 'Zel'],
    unknown: ['Unknown'],
    inactive: ['Dave', 'Asheesh']
  };

  // Helper function to get media buyer category
  const getMediaBuyerCategory = (buyer) => {
    if (mediaBuyerCategories.new.includes(buyer)) return 'New';
    if (mediaBuyerCategories.active.includes(buyer)) return 'Active';
    if (mediaBuyerCategories.unknown.includes(buyer)) return 'Unknown';
    if (mediaBuyerCategories.inactive.includes(buyer)) return 'Inactive';
    return 'Unknown';
  };

  // Helper function to group data by media buyer category
  const groupDataByCategory = (data) => {
    return data.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    }, {});
  };

  // Calculate date ranges based on selection and last data date
  const dateRanges = useMemo(() => {
    try {
      if (!performanceData?.length) {
        console.warn('No performance data available for date range calculation');
        return {
          start: new Date(),
          end: new Date(),
          label: 'No Data'
        };
      }

      const ranges = {
        lastMonth: {
          start: startOfMonth(subDays(lastDataDate, lastDataDate.getDate())),
          end: endOfMonth(subDays(lastDataDate, lastDataDate.getDate())),
          label: 'Last Month'
        },
        mtd: {
          start: startOfMonth(lastDataDate),
          end: lastDataDate,
          label: 'Month to Date'
        },
        last7: {
          start: subDays(lastDataDate, 6),
          end: lastDataDate,
          label: 'Last 7 Days'
        },
        last30: {
          start: subDays(lastDataDate, 29),
          end: lastDataDate,
          label: 'Last 30 Days'
        },
        allTime: {
          start: new Date(Math.min(...performanceData.map(entry => {
            try {
              const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day).getTime();
            } catch (error) {
              console.error('Error parsing date:', entry.Date);
              return Infinity;
            }
          }))),
          end: lastDataDate,
          label: 'All Time'
        }
      };

      const selectedRange = ranges[dateRange];
      if (!selectedRange) {
        console.warn('Invalid date range selection:', dateRange);
        return ranges.last7; // Default to last 7 days
      }

      // Validate dates
      if (isNaN(selectedRange.start.getTime()) || isNaN(selectedRange.end.getTime())) {
        console.error('Invalid date range calculated:', selectedRange);
        return ranges.last7; // Default to last 7 days
      }

      return selectedRange;
    } catch (error) {
      console.error('Error calculating date ranges:', error);
      return {
        start: subDays(new Date(), 6),
        end: new Date(),
        label: 'Last 7 Days'
      };
    }
  }, [dateRange, lastDataDate, performanceData]);

  // Calculate analysis date range
  const analysisDateRanges = useMemo(() => {
    const ranges = {
      lastMonth: {
        start: startOfMonth(subDays(lastDataDate, lastDataDate.getDate())),
        end: endOfMonth(subDays(lastDataDate, lastDataDate.getDate())),
        label: 'Last Month'
      },
      mtd: {
        start: startOfMonth(lastDataDate),
        end: lastDataDate,
        label: 'Month to Date'
      },
      last7: {
        start: subDays(lastDataDate, 6),
        end: lastDataDate,
        label: 'Last 7 Days'
      },
      last30: {
        start: subDays(lastDataDate, 29),
        end: lastDataDate,
        label: 'Last 30 Days'
      },
      allTime: {
        start: new Date(Math.min(...performanceData.map(entry => new Date(entry.Date)))),
        end: lastDataDate,
        label: 'All Time'
      }
    };
    return ranges[analysisDateRange];
  }, [analysisDateRange, lastDataDate, performanceData]);

  // Filter data based on selected date range
  const getFilteredData = (data, dateRange) => {
    if (!data || data.length === 0) return [];
    
    try {
      const { start, end } = dateRange;
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date range in getFilteredData:', { start, end });
        return [];
      }

      return data.filter(entry => {
        try {
          if (!entry.Date) return false;
          const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
          if (isNaN(month) || isNaN(day) || isNaN(year)) {
            console.error('Invalid date format:', entry.Date);
            return false;
          }
          const entryDate = new Date(year, month - 1, day);
          if (isNaN(entryDate.getTime())) {
            console.error('Invalid parsed date:', entryDate);
            return false;
          }
          return entryDate >= start && entryDate <= end;
        } catch (error) {
          console.error('Error processing entry:', error, entry);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in getFilteredData:', error);
      return [];
    }
  };

  const getDateRange = (range) => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      switch (range) {
        case 'yesterday':
          return {
            startDate: yesterday,
            endDate: yesterday,
            label: 'Yesterday'
          };
        case '7d':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return {
            startDate: sevenDaysAgo,
            endDate: today,
            label: 'Last 7 Days'
          };
        case '30d':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return {
            startDate: thirtyDaysAgo,
            endDate: today,
            label: 'Last 30 Days'
          };
        case 'mtd':
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return {
            startDate: firstDayOfMonth,
            endDate: today,
            label: 'Month to Date'
          };
        case 'lastMonth':
          const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          return {
            startDate: firstDayOfLastMonth,
            endDate: lastDayOfLastMonth,
            label: 'Last Month'
          };
        case 'all':
          // Find the earliest date in the performance data
          const earliestDate = new Date(Math.min(...performanceData.map(entry => {
            try {
              const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day).getTime();
            } catch (error) {
              console.error('Error parsing date:', entry.Date);
              return Infinity;
            }
          })));
          return {
            startDate: earliestDate,
            endDate: today,
            label: 'All Time'
          };
        default:
          console.warn('Invalid date range:', range);
          return {
            startDate: yesterday,
            endDate: yesterday,
            label: 'Yesterday'
          };
      }
    } catch (error) {
      console.error('Error in getDateRange:', error);
      // Return yesterday as a safe fallback
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: yesterday,
        label: 'Yesterday'
      };
    }
  };

  // Calculate performance metrics for the selected date range
  const metrics = useMemo(() => {
    if (!performanceData?.length) return {
      spend: 0,
      revenue: 0,
      profit: 0,
      roi: 0
    };

    const filteredData = getFilteredData(performanceData, dateRanges);

    const totals = filteredData.reduce((acc, entry) => {
      acc.spend += parseFloat(entry['Ad Spend'] || 0);
      acc.revenue += parseFloat(entry['Total Revenue'] || 0);
      return acc;
    }, { spend: 0, revenue: 0 });

    return {
      spend: totals.spend,
      revenue: totals.revenue,
      profit: totals.revenue - totals.spend,
      roi: totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0
    };
  }, [performanceData, dateRanges]);

  // Calculate media buyer performance data
  const mediaBuyerData = useMemo(() => {
    if (!performanceData?.length) return [];

    const filteredData = getFilteredData(performanceData, dateRanges);

    // Group data by category and buyer
    const groupedData = filteredData.reduce((acc, entry) => {
      const buyer = entry['Media Buyer'];
      const category = getMediaBuyerCategory(buyer);
      const key = `${category}-${buyer}-${entry.Network}-${entry.Offer}`;
      
      if (!acc[key]) {
        acc[key] = {
          category,
          mediaBuyer: buyer,
          network: entry.Network,
          offer: entry.Offer,
          profit: 0,
          dailyProfits: {}
        };
      }
      
      const profit = parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
      acc[key].profit += profit;
      acc[key].dailyProfits[entry.Date] = (acc[key].dailyProfits[entry.Date] || 0) + profit;
      return acc;
    }, {});

    // Convert to array and sort by category and profit
    return Object.values(groupedData)
      .sort((a, b) => {
        // First sort by category order
        const categoryOrder = ['New', 'Active', 'Unknown', 'Inactive'];
        const categoryCompare = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (categoryCompare !== 0) return categoryCompare;
        // Then sort by profit within category
        return b.profit - a.profit;
      });
  }, [performanceData, dateRanges]);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
      maximumFractionDigits: 0
  }).format(value);
};

  // Group questions by category
  const questionCategories = {
    topPerformers: [
      { id: 'top-buyers', text: 'Show Top Media Buyers', color: 'text-green-500' },
      { id: 'top-offers', text: 'Show Top Performing Offers', color: 'text-green-500' },
      { id: 'highest-roi-mtd', text: 'Show Highest ROI Offers MTD', color: 'text-green-500' },
      { id: 'best-buyers-margin', text: 'Show Best Media Buyers By Margin', color: 'text-green-500' },
      { id: 'buyers-30-challenge', text: 'Show Media Buyers 30 Day Challenge', color: 'text-green-500' }
    ],
    underperforming: [
      { id: 'lowest-roi', text: 'Show Lowest ROI Offers', color: 'text-red-500' },
      { id: 'worst-buyers', text: 'Show Underperforming Media Buyers', color: 'text-red-500' },
      { id: 'negative-margin', text: 'Show Offers With Negative Margin', color: 'text-red-500' },
      { id: 'declining-performance', text: 'Show Declining Performance', color: 'text-red-500' }
    ],
    upcoming: [
      { id: 'upcoming-invoices', text: 'Show Upcoming Invoices', color: 'text-blue-500' },
      { id: 'upcoming-expenses', text: 'Show Upcoming Expenses', color: 'text-blue-500' }
    ]
  };

  // Filter questions based on search query
  const getFilteredQuestions = (questions) => {
    return questions;
  };

  const generateAnswer = (questionId) => {
    const dateRange = getDateRange(analysisDateRange);
    const filteredData = getFilteredData(performanceData, dateRange);

    switch (questionId) {
      case 'top-offers-week': {
        const lastWeek = subDays(lastDataDate, 7);
        const offerData = performanceData
          .filter(entry => new Date(entry.Date) >= lastWeek)
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const topOffers = Object.values(offerData)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5);

  return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(lastWeek, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
        </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {topOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.revenue)}</td>
                    <td className="text-right py-2">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2">
                      {((offer.profit / offer.spend) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
    </div>
  );
      }

      case 'struggling-buyers': {
        const lastWeek = subDays(lastDataDate, 7);
        const buyerData = performanceData
          .filter(entry => new Date(entry.Date) >= lastWeek)
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { buyer: key, profit: 0, revenue: 0, spend: 0, consecutiveLosses: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const strugglingBuyers = Object.values(buyerData)
          .filter(buyer => buyer.profit < 0 || buyer.consecutiveLosses >= 3)
          .sort((a, b) => a.profit - b.profit);

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(lastWeek, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {strugglingBuyers.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.spend)}</td>
                    <td className="text-right py-2 text-red-600">{formatCurrency(buyer.profit)}</td>
                    <td className="text-right py-2 text-red-600">
                      {((buyer.profit / buyer.spend) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'network-risk': {
        const networkData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Network;
            if (!acc[key]) {
              acc[key] = { network: key, spend: 0, revenue: 0, profit: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const networks = Object.values(networkData)
          .sort((a, b) => b.spend - a.spend);

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Network Exposure Analysis</h3>
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Network</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((network, index) => {
                  const riskLevel = network.spend > 50000 ? 'High' : network.spend > 25000 ? 'Medium' : 'Low';
                  const riskColor = riskLevel === 'High' ? 'text-red-600' : riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600';
                  
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2">{network.network}</td>
                      <td className="text-right py-2">{formatCurrency(network.spend)}</td>
                      <td className="text-right py-2">{formatCurrency(network.revenue)}</td>
                      <td className={`text-right py-2 font-medium ${riskColor}`}>
                        {riskLevel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      case 'best-buyers-month': {
        const startOfThisMonth = startOfMonth(lastDataDate);
        const buyerData = performanceData
          .filter(entry => new Date(entry.Date) >= startOfThisMonth)
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { buyer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        // Group buyers by category
        const categorizedBuyers = Object.values(buyerData).reduce((acc, buyer) => {
          const category = getMediaBuyerCategory(buyer.buyer);
          if (category === 'New' || category === 'Active') {
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(buyer);
          }
          return acc;
        }, {});

        // Sort buyers within each category by profit
        Object.keys(categorizedBuyers).forEach(category => {
          categorizedBuyers[category].sort((a, b) => b.profit - a.profit);
        });

  return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(startOfThisMonth, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                      <th className="text-left py-2">New Media Buyers</th>
                      <th className="text-right py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
                    {(categorizedBuyers['New'] || []).map((buyer, index) => (
                      <tr key={buyer.buyer} className="border-b">
                        <td className="py-2">{buyer.buyer}</td>
                        <td className={`text-right py-2 ${buyer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(buyer.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Active Media Buyers</th>
                      <th className="text-right py-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categorizedBuyers['Active'] || []).map((buyer, index) => (
                      <tr key={buyer.buyer} className="border-b">
                        <td className="py-2">{buyer.buyer}</td>
                        <td className={`text-right py-2 ${buyer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(buyer.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            </div>
          </div>
        );
      }

      case 'worst-offers-week': {
        const lastWeek = subDays(lastDataDate, 7);
        const offerData = performanceData
          .filter(entry => new Date(entry.Date) >= lastWeek)
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const worstOffers = Object.values(offerData)
          .sort((a, b) => a.profit - b.profit)
          .slice(0, 5);

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(lastWeek, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Loss</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {worstOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.spend)}</td>
                    <td className="text-right py-2 text-red-600">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2 text-red-600">
                      {((offer.profit / offer.spend) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'low-roi-offers': {
        const offerData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const lowRoiOffers = Object.values(offerData)
          .filter(offer => offer.spend > 0 && ((offer.profit / offer.spend) * 100) < 15)
          .sort((a, b) => (a.profit / a.spend) - (b.profit / b.spend));

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {lowRoiOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.spend)}</td>
                    <td className="text-right py-2">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2 text-yellow-600">
                      {((offer.profit / offer.spend) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'cumulative-losses': {
        const buyerData = performanceData
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { 
                buyer: key, 
                profit: 0, 
                revenue: 0, 
                spend: 0,
                lossStreak: 0,
                maxLossStreak: 0
              };
            }
            const profit = parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit += profit;
            
            if (profit < 0) {
              acc[key].lossStreak++;
              acc[key].maxLossStreak = Math.max(acc[key].maxLossStreak, acc[key].lossStreak);
            } else {
              acc[key].lossStreak = 0;
            }
            
            return acc;
          }, {});

        const buyersWithLosses = Object.values(buyerData)
          .filter(buyer => buyer.profit < 0)
          .sort((a, b) => a.profit - b.profit);

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Total Spend</th>
                  <th className="text-right py-2">Total Revenue</th>
                  <th className="text-right py-2">Cumulative Loss</th>
                  <th className="text-right py-2">Max Loss Streak</th>
                </tr>
              </thead>
              <tbody>
                {buyersWithLosses.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.spend)}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.revenue)}</td>
                    <td className="text-right py-2 text-red-600">
                      {formatCurrency(buyer.profit)}
                    </td>
                    <td className="text-right py-2 text-red-600">
                      {buyer.maxLossStreak} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'network-revenue': {
        const networkData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Network;
            if (!acc[key]) {
              acc[key] = { 
                network: key, 
                revenue: 0, 
                profit: 0, 
                offers: new Set(),
                dailyRevenue: {}
              };
            }
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit += parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
            acc[key].offers.add(entry.Offer);
            
            if (!acc[key].dailyRevenue[entry.Date]) {
              acc[key].dailyRevenue[entry.Date] = 0;
            }
            acc[key].dailyRevenue[entry.Date] += parseFloat(entry['Total Revenue'] || 0);
            
            return acc;
          }, {});

        const networks = Object.values(networkData)
          .map(network => ({
            ...network,
            offerCount: network.offers.size,
            avgDailyRevenue: Object.values(network.dailyRevenue).reduce((a, b) => a + b, 0) / 
                           Object.keys(network.dailyRevenue).length
          }))
          .sort((a, b) => b.revenue - a.revenue);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Network Revenue Breakdown</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Network Revenue Analysis</h3>
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Network</th>
                  <th className="text-right py-2">Total Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Active Offers</th>
                  <th className="text-right py-2">Avg Daily Revenue</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((network, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{network.network}</td>
                    <td className="text-right py-2">{formatCurrency(network.revenue)}</td>
                    <td className={`text-right py-2 ${network.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(network.profit)}
                    </td>
                    <td className="text-right py-2">{network.offerCount}</td>
                    <td className="text-right py-2">{formatCurrency(network.avgDailyRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'network-caps': {
        const networkDailySpend = performanceData
          .reduce((acc, entry) => {
            const network = entry.Network;
            const date = entry.Date;
            if (!acc[network]) {
              acc[network] = { network, dailySpend: {}, avgSpend: 0, maxSpend: 0 };
            }
            if (!acc[network].dailySpend[date]) {
              acc[network].dailySpend[date] = 0;
            }
            acc[network].dailySpend[date] += parseFloat(entry['Ad Spend'] || 0);
            return acc;
          }, {});

        // Calculate average and max daily spend
        Object.values(networkDailySpend).forEach(network => {
          const spends = Object.values(network.dailySpend);
          network.avgSpend = spends.reduce((a, b) => a + b, 0) / spends.length;
          network.maxSpend = Math.max(...spends);
          network.daysNearCap = spends.filter(spend => spend >= network.avgSpend * 0.9).length;
        });

        const networksNearCap = Object.values(networkDailySpend)
          .filter(network => network.daysNearCap > 0)
          .sort((a, b) => b.maxSpend - a.maxSpend);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Network Hitting Caps</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Networks Approaching Daily Caps</h3>
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Network</th>
                  <th className="text-right py-2">Avg Daily Spend</th>
                  <th className="text-right py-2">Max Daily Spend</th>
                  <th className="text-right py-2">Days Near Cap</th>
                </tr>
              </thead>
              <tbody>
                {networksNearCap.map((network, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{network.network}</td>
                    <td className="text-right py-2">{formatCurrency(network.avgSpend)}</td>
                    <td className="text-right py-2">{formatCurrency(network.maxSpend)}</td>
                    <td className="text-right py-2 text-yellow-600">
                      {network.daysNearCap} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'network-trend': {
        const networkTrends = performanceData
          .reduce((acc, entry) => {
            const network = entry.Network;
            const date = entry.Date;
            if (!acc[network]) {
              acc[network] = { 
                network, 
                dailyData: {},
                totalRevenue: 0,
                totalSpend: 0
              };
            }
            if (!acc[network].dailyData[date]) {
              acc[network].dailyData[date] = {
                revenue: 0,
                spend: 0,
                profit: 0
              };
            }
            const revenue = parseFloat(entry['Total Revenue'] || 0);
            const spend = parseFloat(entry['Ad Spend'] || 0);
            acc[network].dailyData[date].revenue += revenue;
            acc[network].dailyData[date].spend += spend;
            acc[network].dailyData[date].profit += revenue - spend;
            acc[network].totalRevenue += revenue;
            acc[network].totalSpend += spend;
            return acc;
          }, {});

        const networkPerformance = Object.values(networkTrends)
          .map(network => {
            const dailyData = Object.values(network.dailyData);
            const dates = Object.keys(network.dailyData).sort();
            const trend = dailyData.length >= 2 ? 
              (dailyData[dailyData.length - 1].profit - dailyData[0].profit) / dailyData.length : 0;
  return {
              ...network,
              trend,
              profitMargin: (network.totalRevenue - network.totalSpend) / network.totalRevenue * 100,
              dateRange: `${dates[0]} - ${dates[dates.length - 1]}`
            };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Network Performance Trend</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Network Performance Analysis</h3>
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
            </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                  <th className="text-left py-2">Network</th>
                  <th className="text-right py-2">Total Revenue</th>
                  <th className="text-right py-2">Profit Margin</th>
                  <th className="text-right py-2">Daily Trend</th>
                  <th className="text-right py-2">Date Range</th>
              </tr>
            </thead>
            <tbody>
                {networkPerformance.map((network, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{network.network}</td>
                    <td className="text-right py-2">{formatCurrency(network.totalRevenue)}</td>
                    <td className={`text-right py-2 ${network.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {network.profitMargin.toFixed(1)}%
                  </td>
                    <td className={`text-right py-2 ${network.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(network.trend)}/day
                  </td>
                    <td className="text-right py-2 text-gray-500">
                      {network.dateRange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        );
      }

      case 'network-payment': {
        const today = new Date();
        const invoiceData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Network;
            if (!acc[key]) {
              acc[key] = {
                network: key,
                invoices: []
              };
            }
            
            // Only add if it's an actual invoice entry with InvoiceNumber
            if (entry.InvoiceNumber) {
              acc[key].invoices.push({
                invoiceNumber: entry.InvoiceNumber,
                amount: parseFloat(entry['Amount Due'] || 0),
                dueDate: new Date(entry['Due Date']),
                periodStart: new Date(entry['Period Start']),
                periodEnd: new Date(entry['Period End']),
                status: new Date(entry['Due Date']) < today ? 'Overdue' : 'Pending'
              });
            }
            
            return acc;
          }, {});

        const networkInvoices = Object.values(invoiceData)
          .map(network => ({
            ...network,
            totalAmount: network.invoices.reduce((sum, inv) => sum + inv.amount, 0),
            overdueInvoices: network.invoices.filter(inv => inv.status === 'Overdue'),
            pendingInvoices: network.invoices.filter(inv => inv.status === 'Pending')
          }))
          .filter(network => network.invoices.length > 0) // Only show networks with actual invoices
          .sort((a, b) => b.totalAmount - a.totalAmount);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Network Payment Status</h2>
            <p className="text-gray-600 mb-4">
              This analysis displays all unpaid invoices across networks, with special highlighting for overdue payments. This helps track payment status and identify potential payment issues early.
            </p>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Network Invoice Status</h3>
              <p className="text-sm text-gray-500">
                As of {format(today, 'MMM d, yyyy')}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Network</th>
                  <th className="text-right py-2">Total Amount</th>
                  <th className="text-right py-2">Overdue</th>
                  <th className="text-right py-2">Pending</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {networkInvoices.map((network, index) => {
                  const overdueTotal = network.overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                  const pendingTotal = network.pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                  const hasOverdue = network.overdueInvoices.length > 0;
                  
                  return (
                    <tr key={index} className={`border-b ${hasOverdue ? 'bg-red-50' : ''}`}>
                      <td className="py-2">{network.network}</td>
                      <td className="text-right py-2">{formatCurrency(network.totalAmount)}</td>
                      <td className={`text-right py-2 ${hasOverdue ? 'text-red-600' : ''}`}>
                        {formatCurrency(overdueTotal)}
                      </td>
                      <td className="text-right py-2 text-green-600">
                        {formatCurrency(pendingTotal)}
                      </td>
                      <td className="text-right py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hasOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {hasOverdue ? 'Overdue' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Detailed Invoice List */}
            <div className="mt-8">
              <h3 className="font-medium mb-4">Detailed Invoice List</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
                    <th className="text-left py-2">Network</th>
                    <th className="text-left py-2">Invoice #</th>
                    <th className="text-right py-2">Amount Due</th>
                    <th className="text-right py-2">Period</th>
                    <th className="text-right py-2">Due Date</th>
                    <th className="text-right py-2">Status</th>
            </tr>
          </thead>
          <tbody>
                  {networkInvoices.flatMap(network => 
                    network.invoices.map((invoice, index) => {
                      const isOverdue = invoice.status === 'Overdue';
                      return (
                        <tr key={`${network.network}-${invoice.invoiceNumber}-${index}`} 
                            className={`border-b ${isOverdue ? 'bg-red-50' : ''}`}>
                          <td className="py-2">{network.network}</td>
                          <td className="py-2">{invoice.invoiceNumber}</td>
                          <td className={`text-right py-2 ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(invoice.amount)}
                </td>
                          <td className="text-right py-2">
                            {format(invoice.periodStart, 'MMM d')} - {format(invoice.periodEnd, 'MMM d, yyyy')}
                </td>
                          <td className="text-right py-2">
                            {format(invoice.dueDate, 'MMM d, yyyy')}
                </td>
                          <td className="text-right py-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {invoice.status}
                  </span>
                </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'top-offers-30': {
        const thirtyDaysAgo = subDays(lastDataDate, 30);
        const offerData = performanceData
          .filter(entry => new Date(entry.Date) >= thirtyDaysAgo)
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const topOffers = Object.values(offerData)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 10);

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(thirtyDaysAgo, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {topOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.revenue)}</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2">
                      {((offer.profit / offer.spend) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        );
      }

      case 'highest-roi-mtd': {
        const startOfThisMonth = startOfMonth(lastDataDate);
        const offerData = performanceData
          .filter(entry => new Date(entry.Date) >= startOfThisMonth)
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const highRoiOffers = Object.values(offerData)
          .filter(offer => offer.spend >= 1000)
          .map(offer => ({
            ...offer,
            roi: (offer.profit / offer.spend) * 100
          }))
          .sort((a, b) => b.roi - a.roi)
          .slice(0, 10);

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(startOfThisMonth, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
          </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ROI</th>
              </tr>
            </thead>
            <tbody>
                {highRoiOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.spend)}</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2 text-green-600">
                      {offer.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        );
      }

      case 'best-buyers-margin': {
        const buyerData = performanceData
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { buyer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const buyersByMargin = Object.values(buyerData)
          .filter(buyer => buyer.spend >= 10000)
          .map(buyer => ({
            ...buyer,
            margin: (buyer.profit / buyer.revenue) * 100
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 10);

  return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                All Time Data (Min $10,000 Spend)
              </p>
            </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Margin</th>
              </tr>
            </thead>
            <tbody>
                {buyersByMargin.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.revenue)}</td>
                    <td className="text-right py-2 text-green-600">{formatCurrency(buyer.profit)}</td>
                    <td className="text-right py-2 text-green-600">
                      {buyer.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
        );
      }

      case 'buyers-30-challenge': {
        const thirtyDaysAgo = subDays(lastDataDate, 30);
        const buyerData = performanceData
          .filter(entry => new Date(entry.Date) >= thirtyDaysAgo)
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { 
                buyer: key, 
                profit: 0, 
                revenue: 0, 
                spend: 0,
                dailyProfits: {}
              };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            acc[key].dailyProfits[entry.Date] = (acc[key].dailyProfits[entry.Date] || 0) + 
              (parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0));
            return acc;
          }, {});

        const challengeResults = Object.values(buyerData)
          .map(buyer => ({
            ...buyer,
            profitMargin: buyer.revenue > 0 ? (buyer.profit / buyer.revenue) * 100 : 0,
            consistency: Object.values(buyer.dailyProfits).filter(p => p > 0).length / 
                        Object.keys(buyer.dailyProfits).length * 100
          }))
          .sort((a, b) => b.profit - a.profit);
                
                return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                {format(thirtyDaysAgo, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
                      </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Margin</th>
                  <th className="text-right py-2">Consistency</th>
                </tr>
              </thead>
              <tbody>
                {challengeResults.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.revenue)}</td>
                    <td className={`text-right py-2 ${buyer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(buyer.profit)}
                    </td>
                    <td className={`text-right py-2 ${buyer.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {buyer.profitMargin.toFixed(1)}%
                    </td>
                    <td className="text-right py-2">
                      {buyer.consistency.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">
                    {formatCurrency(challengeResults.reduce((sum, buyer) => sum + buyer.revenue, 0))}
                    </td>
                  <td className="text-right py-2">
                    {formatCurrency(challengeResults.reduce((sum, buyer) => sum + buyer.profit, 0))}
                    </td>
                  <td className="py-2"></td>
                  <td className="py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      }

      case 'high-volatility': {
        const offerData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Offer;
            const date = entry.Date;
            if (!acc[key]) {
              acc[key] = { 
                offer: key, 
                dailyProfits: {},
                totalSpend: 0,
                totalProfit: 0
              };
            }
            const dailyProfit = parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
            acc[key].dailyProfits[date] = dailyProfit;
            acc[key].totalSpend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].totalProfit += dailyProfit;
            return acc;
          }, {});

        const volatileOffers = Object.values(offerData)
          .filter(offer => Object.keys(offer.dailyProfits).length >= 7 && offer.totalSpend >= 1000)
          .map(offer => {
            const profits = Object.values(offer.dailyProfits);
            const mean = profits.reduce((a, b) => a + b, 0) / profits.length;
            const variance = profits.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / profits.length;
            const volatility = Math.sqrt(variance);
            return {
              ...offer,
              volatility,
              profitMargin: (offer.totalProfit / offer.totalSpend) * 100
            };
          })
          .sort((a, b) => b.volatility - a.volatility)
          .slice(0, 10);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">High Volatility Offers</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Top 10 High Volatility Offers</h3>
              <p className="text-sm text-gray-500">
                All Time Data (Min 7 Days Data, $1,000 Spend)
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Volatility</th>
                  <th className="text-right py-2">Total Spend</th>
                  <th className="text-right py-2">Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {volatileOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2 text-yellow-600">
                      {formatCurrency(offer.volatility)}
                    </td>
                    <td className="text-right py-2">{formatCurrency(offer.totalSpend)}</td>
                    <td className={`text-right py-2 ${offer.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {offer.profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        );
      }

      case 'compensation-guidelines': {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Media Buyer Compensation Guidelines</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Media Buyer Commission Structure</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mike's Commission Structure</h4>
                  <p className="text-gray-600">Flat 10% commission rate on all profits</p>
            </div>
                <div>
                  <h4 className="font-medium mb-2">New Media Buyers Commission Structure</h4>
                  <p className="text-gray-600">Sliding scale based on profit:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-2">
                    <li>First $1,000 profit: 15%</li>
                    <li>Next $1,000 profit: 12%</li>
                    <li>Remaining profit: 10%</li>
                  </ul>
            </div>
                <div>
                  <h4 className="font-medium mb-2">ACA Deduction</h4>
                  <p className="text-gray-600">2% deduction from commission based on ACA revenue</p>
            </div>
          </div>
        </div>
          </div>
        );
      }

      case 'last-month-commissions': {
        const startOfLastMonth = startOfMonth(subMonths(lastDataDate, 1));
        const endOfLastMonth = endOfMonth(startOfLastMonth);
        
        const lastMonthData = performanceData
          .filter(entry => {
            const entryDate = new Date(entry.Date);
            return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
          });

        const buyerData = lastMonthData
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { 
                buyer: key, 
                profit: 0, 
                revenue: 0, 
                spend: 0,
                acaRevenue: 0
              };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            acc[key].acaRevenue += parseFloat(entry['ACA Revenue'] || 0);
            return acc;
          }, {});

        const commissionStructures = {
          'Mike': {
            rate: 0.10,
            type: 'flat'
          },
          'default': {
            rates: [
              { threshold: 1000, rate: 0.15 },
              { threshold: 2000, rate: 0.12 },
              { threshold: Infinity, rate: 0.10 }
            ],
            type: 'sliding'
          }
        };

        const commissionData = Object.values(buyerData)
          .map(buyer => {
            const structure = commissionStructures[buyer.buyer] || commissionStructures.default;
            let commission = 0;

            if (buyer.profit > 0) {
              if (structure.type === 'flat') {
                commission = buyer.profit * structure.rate;
              } else {
                let remainingProfit = buyer.profit;
                commission = structure.rates.reduce((total, tier) => {
                  if (remainingProfit <= 0) return total;
                  const amount = Math.min(remainingProfit, tier.threshold - (tier.threshold === Infinity ? 0 : tier.threshold - 1000));
                  remainingProfit -= amount;
                  return total + (amount * tier.rate);
                }, 0);
              }

              // Apply ACA deduction
              const acaDeduction = buyer.acaRevenue * 0.02;
              commission -= acaDeduction;
            }

      return {
              ...buyer,
              commission: Math.max(0, commission),
              acaDeduction: buyer.acaRevenue * 0.02,
              commissionRate: structure.type === 'flat' ? structure.rate : 
                (commission / buyer.profit) * 100
            };
          })
          .sort((a, b) => b.commission - a.commission);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Last Month Media Buyer Commissions</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Last Month Commission Report</h3>
              <p className="text-sm text-gray-500">
                {format(startOfLastMonth, 'MMM d')} - {format(endOfLastMonth, 'MMM d, yyyy')}
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Total Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ACA Revenue</th>
                  <th className="text-right py-2">ACA Deduction</th>
                  <th className="text-right py-2">Commission Rate</th>
                  <th className="text-right py-2">Final Commission</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.revenue)}</td>
                    <td className={`text-right py-2 ${buyer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(buyer.profit)}
                    </td>
                    <td className="text-right py-2">{formatCurrency(buyer.acaRevenue)}</td>
                    <td className="text-right py-2 text-red-600">
                      {formatCurrency(buyer.acaDeduction)}
                    </td>
                    <td className="text-right py-2">
                      {buyer.profit > 0 ? `${buyer.commissionRate.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="text-right py-2 text-green-600">
                      {formatCurrency(buyer.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.revenue, 0))}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.profit, 0))}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.acaRevenue, 0))}
                  </td>
                  <td className="text-right py-2 text-red-600">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.acaDeduction, 0))}
                  </td>
                  <td className="py-2"></td>
                  <td className="text-right py-2 text-green-600">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.commission, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      }

      case 'current-month-projections': {
        const startOfThisMonth = startOfMonth(lastDataDate);
        
        const currentMonthData = performanceData
          .filter(entry => {
            const entryDate = new Date(entry.Date);
            return entryDate >= startOfThisMonth && entryDate <= lastDataDate;
          });

        const buyerData = currentMonthData
          .reduce((acc, entry) => {
            const key = entry['Media Buyer'];
            if (!acc[key]) {
              acc[key] = { 
                buyer: key, 
                profit: 0, 
                revenue: 0, 
                spend: 0,
                acaRevenue: 0
              };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            acc[key].acaRevenue += parseFloat(entry['ACA Revenue'] || 0);
            return acc;
          }, {});

        const commissionStructures = {
          'Mike': {
            rate: 0.10,
            type: 'flat'
          },
          'default': {
            rates: [
              { threshold: 1000, rate: 0.15 },
              { threshold: 2000, rate: 0.12 },
              { threshold: Infinity, rate: 0.10 }
            ],
            type: 'sliding'
          }
        };

        const commissionData = Object.values(buyerData)
          .map(buyer => {
            const structure = commissionStructures[buyer.buyer] || commissionStructures.default;
            let commission = 0;

            if (buyer.profit > 0) {
              if (structure.type === 'flat') {
                commission = buyer.profit * structure.rate;
        } else {
                let remainingProfit = buyer.profit;
                commission = structure.rates.reduce((total, tier) => {
                  if (remainingProfit <= 0) return total;
                  const amount = Math.min(remainingProfit, tier.threshold - (tier.threshold === Infinity ? 0 : tier.threshold - 1000));
                  remainingProfit -= amount;
                  return total + (amount * tier.rate);
                }, 0);
              }

              // Apply ACA deduction
              const acaDeduction = buyer.acaRevenue * 0.02;
              commission -= acaDeduction;
            }

            return {
              ...buyer,
              commission: Math.max(0, commission),
              acaDeduction: buyer.acaRevenue * 0.02,
              commissionRate: structure.type === 'flat' ? structure.rate : 
                (commission / buyer.profit) * 100
            };
          })
          .sort((a, b) => b.commission - a.commission);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Current Month Commission Projections</h2>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Current Month Commission Projections</h3>
              <p className="text-sm text-gray-500">
                {format(startOfThisMonth, 'MMM d')} - {format(lastDataDate, 'MMM d, yyyy')}
              </p>
            </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                  <th className="text-left py-2">Media Buyer</th>
                  <th className="text-right py-2">Total Revenue</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">ACA Revenue</th>
                  <th className="text-right py-2">ACA Deduction</th>
                  <th className="text-right py-2">Commission Rate</th>
                  <th className="text-right py-2">Projected Commission</th>
              </tr>
            </thead>
            <tbody>
                {commissionData.map((buyer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{buyer.buyer}</td>
                    <td className="text-right py-2">{formatCurrency(buyer.revenue)}</td>
                    <td className={`text-right py-2 ${buyer.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(buyer.profit)}
                  </td>
                    <td className="text-right py-2">{formatCurrency(buyer.acaRevenue)}</td>
                    <td className="text-right py-2 text-red-600">
                      {formatCurrency(buyer.acaDeduction)}
                  </td>
                    <td className="text-right py-2">
                      {buyer.profit > 0 ? `${buyer.commissionRate.toFixed(1)}%` : 'N/A'}
                  </td>
                    <td className="text-right py-2 text-green-600">
                      {formatCurrency(buyer.commission)}
                  </td>
                </tr>
              ))}
            </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.revenue, 0))}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.profit, 0))}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.acaRevenue, 0))}
                  </td>
                  <td className="text-right py-2 text-red-600">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.acaDeduction, 0))}
                  </td>
                  <td className="py-2"></td>
                  <td className="text-right py-2 text-green-600">
                    {formatCurrency(commissionData.reduce((sum, buyer) => sum + buyer.commission, 0))}
                  </td>
                </tr>
              </tfoot>
          </table>
        </div>
        );
      }

      case 'negative-margin': {
        const offerData = performanceData
          .reduce((acc, entry) => {
            const key = entry.Offer;
            if (!acc[key]) {
              acc[key] = { offer: key, profit: 0, revenue: 0, spend: 0 };
            }
            acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
            acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
            acc[key].profit = acc[key].revenue - acc[key].spend;
            return acc;
          }, {});

        const negativeMarginOffers = Object.values(offerData)
          .filter(offer => offer.revenue > 0 && (offer.profit / offer.revenue) < 0)
          .sort((a, b) => (a.profit / a.revenue) - (b.profit / b.revenue));

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="text-sm text-gray-500">
                All Time Data
              </p>
                    </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Offer</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {negativeMarginOffers.map((offer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{offer.offer}</td>
                    <td className="text-right py-2">{formatCurrency(offer.revenue)}</td>
                    <td className="text-right py-2">{formatCurrency(offer.spend)}</td>
                    <td className="text-right py-2 text-red-600">{formatCurrency(offer.profit)}</td>
                    <td className="text-right py-2 text-red-600">
                      {((offer.profit / offer.revenue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
        );
      }

      case 'overdue-invoices': {
        const today = new Date();
        console.log('Invoice Data Sample:', invoiceData?.slice(0, 2));
        
        // Filter for overdue invoices
        const filteredInvoices = invoiceData
          ?.filter(invoice => {
            const dueDate = new Date(invoice['Due Date']);
            return dueDate < today;
          })
          .map(invoice => ({
            Network: invoice.Network,
            InvoiceNumber: invoice['Invoice Number'],
            AmountDue: parseFloat(invoice['Amount Due']?.replace(/[$,]/g, '') || 0),
            DueDate: new Date(invoice['Due Date']),
            PeriodStart: new Date(invoice['Period Start']),
            PeriodEnd: new Date(invoice['Period End'])
          }))
          .sort((a, b) => a.DueDate - b.DueDate) || [];

        console.log('Final Invoice Data:', filteredInvoices);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Overdue Invoices</h2>
            <p className="text-gray-600 mb-4">
              This analysis displays all overdue invoices across networks, sorted by days overdue. This helps track payment issues that need immediate attention.
            </p>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Overdue Invoices</h3>
              <p className="text-sm text-gray-500">
                As of {format(today, 'MMM d, yyyy')}
                    </p>
                  </div>
            {filteredInvoices.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Network</th>
                    <th className="text-left py-2">Invoice #</th>
                    <th className="text-right py-2">Amount Due</th>
                    <th className="text-right py-2">Due Date</th>
                    <th className="text-right py-2">Days Overdue</th>
                    <th className="text-right py-2">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => {
                    const daysOverdue = Math.floor((today - invoice.DueDate) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={index} className="border-b bg-red-50">
                        <td className="py-2">{invoice.Network}</td>
                        <td className="py-2">{invoice.InvoiceNumber}</td>
                        <td className="text-right py-2 text-red-600">
                          {formatCurrency(invoice.AmountDue)}
                        </td>
                        <td className="text-right py-2">
                          {format(invoice.DueDate, 'MMM d, yyyy')}
                        </td>
                        <td className="text-right py-2 text-red-600">
                          {daysOverdue} days
                        </td>
                        <td className="text-right py-2">
                          {format(invoice.PeriodStart, 'MMM d')} - {format(invoice.PeriodEnd, 'MMM d, yyyy')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td colSpan="2" className="py-2">Total Overdue</td>
                    <td className="text-right py-2 text-red-600">
                      {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.AmountDue, 0))}
                    </td>
                    <td colSpan="3" className="py-2"></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-gray-500">No overdue invoices found.</p>
            )}
                </div>
        );
      }

      case 'current-invoices': {
        const today = new Date();
        console.log('Invoice Data Sample:', invoiceData?.slice(0, 2));
        
        const filteredInvoices = invoiceData
          ?.filter(invoice => {
            const dueDate = new Date(invoice['Due Date']);
            return dueDate >= today;
          })
          .map(invoice => ({
            Network: invoice.Network || invoice['Network'] || '',
            InvoiceNumber: invoice['Invoice Number'] || invoice.InvoiceNumber || '',
            AmountDue: parseFloat((invoice['Amount Due'] || invoice.AmountDue || invoice.Amount || '0').toString().replace(/[$,]/g, '')),
            DueDate: new Date(invoice['Due Date'] || invoice.DueDate || today),
            PeriodStart: new Date(invoice['Period Start'] || invoice.PeriodStart || subDays(today, 30)),
            PeriodEnd: new Date(invoice['Period End'] || invoice.PeriodEnd || subDays(today, 1))
          }))
          .sort((a, b) => a.DueDate - b.DueDate) || [];

        console.log('Final Invoice Data:', filteredInvoices);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Show Current Unpaid Invoices</h2>
            <p className="text-gray-600 mb-4">
              This analysis displays all current unpaid invoices across networks, sorted by days until due. This helps track upcoming payments and manage cash flow.
            </p>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Current Unpaid Invoices</h3>
              <p className="text-sm text-gray-500">
                As of {format(today, 'MMM d, yyyy')}
                    </p>
                  </div>
            {filteredInvoices.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Network</th>
                    <th className="text-left py-2">Invoice #</th>
                    <th className="text-right py-2">Amount Due</th>
                    <th className="text-right py-2">Due Date</th>
                    <th className="text-right py-2">Days Until Due</th>
                    <th className="text-right py-2">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => {
                    const daysUntilDue = Math.floor((invoice.DueDate - today) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2">{invoice.Network}</td>
                        <td className="py-2">{invoice.InvoiceNumber}</td>
                        <td className="text-right py-2 text-green-600">
                          {formatCurrency(invoice.AmountDue)}
                        </td>
                        <td className="text-right py-2">
                          {format(invoice.DueDate, 'MMM d, yyyy')}
                        </td>
                        <td className="text-right py-2">
                          {daysUntilDue} days
                        </td>
                        <td className="text-right py-2">
                          {format(invoice.PeriodStart, 'MMM d')} - {format(invoice.PeriodEnd, 'MMM d, yyyy')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td colSpan="2" className="py-2">Total Current</td>
                    <td className="text-right py-2 text-green-600">
                      {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.AmountDue, 0))}
                    </td>
                    <td colSpan="3" className="py-2"></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-gray-500">No current unpaid invoices found.</p>
            )}
          </div>
        );
      }

      case 'upcoming-invoices': {
        const today = new Date();
        
        console.log('Raw invoiceData in upcoming-invoices case:', invoiceData);
        
        // Check if invoiceData exists and has proper structure
        if (!invoiceData || (Array.isArray(invoiceData) && invoiceData.length === 0)) {
          console.log('No invoice data available, generating sample data for demonstration');
          
          // If no data is available, create sample data for demonstration
          const sampleInvoices = [
            {
              Network: 'Sample Network 1',
              InvoiceNumber: 'INV-001',
              AmountDue: 1250.00,
              DueDate: addDays(today, 5),
              PeriodStart: subDays(today, 25),
              PeriodEnd: subDays(today, 10)
            },
            {
              Network: 'Sample Network 2',
              InvoiceNumber: 'INV-002',
              AmountDue: 3450.00,
              DueDate: addDays(today, 12),
              PeriodStart: subDays(today, 20),
              PeriodEnd: subDays(today, 5)
            },
            {
              Network: 'Sample Network 3',
              InvoiceNumber: 'INV-003',
              AmountDue: 780.00,
              DueDate: subDays(today, 2), // Overdue
              PeriodStart: subDays(today, 35),
              PeriodEnd: subDays(today, 20)
            }
          ];
          
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Upcoming Invoices (Sample Data)</h3>
                <p className="text-sm text-gray-500">
                  Next 30 Days
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md mb-4 text-sm text-yellow-700">
                Note: Displaying sample data for demonstration. No actual invoice data is available.
              </div>
              <InvoicesTable data={sampleInvoices} />
            </div>
          );
        }
        
        // Determine data format and transform accordingly
        let formattedInvoices = [];
        
        if (Array.isArray(invoiceData)) {
          formattedInvoices = invoiceData.map(invoice => ({
            Network: invoice.Network || invoice['Network'] || '',
            InvoiceNumber: invoice['Invoice Number'] || invoice.InvoiceNumber || '',
            AmountDue: parseFloat((invoice['Amount Due'] || invoice.AmountDue || invoice.Amount || '0').toString().replace(/[$,]/g, '')),
            DueDate: new Date(invoice['Due Date'] || invoice.DueDate || today),
            PeriodStart: new Date(invoice['Period Start'] || invoice.PeriodStart || subDays(today, 30)),
            PeriodEnd: new Date(invoice['Period End'] || invoice.PeriodEnd || subDays(today, 1))
          }));
        } else if (invoiceData?.rawData?.invoices) {
          formattedInvoices = invoiceData.rawData.invoices;
        }
        
        console.log('Formatted Invoices for InvoicesTable:', formattedInvoices);
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Upcoming Invoices</h3>
              <p className="text-sm text-gray-500">
                Next 30 Days
              </p>
            </div>
            <InvoicesTable data={formattedInvoices} />
          </div>
        );
      }

      case 'upcoming-expenses': {
        // Log the expense data to see what format it's in
        console.log('Raw expenseData in upcoming-expenses case:', expenseData);
        
        // Check if expenseData exists and has proper structure
        if (!expenseData || (Array.isArray(expenseData) && expenseData.length === 0)) {
          console.log('No expense data available, generating sample data for demonstration');
          
          // Create sample data for demonstration
          const sampleExpenses = [
            [
              'Payroll', 'Employee Salaries', '35000', format(addDays(new Date(), 3), 'MM/dd/yyyy')
            ],
            [
              'Credit Card', 'American Express', '12500', format(addDays(new Date(), 8), 'MM/dd/yyyy')
            ],
            [
              'Rent', 'Office Space', '8500', format(addDays(new Date(), 15), 'MM/dd/yyyy')
            ],
            [
              'Utilities', 'Electricity & Internet', '1200', format(addDays(new Date(), 10), 'MM/dd/yyyy')
            ],
            [
              'Software', 'SaaS Subscriptions', '3500', format(addDays(new Date(), 21), 'MM/dd/yyyy')
            ]
          ];
          
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Upcoming Expenses (Sample Data)</h3>
                <p className="text-sm text-gray-500">
                  Next 30 Days
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md mb-4 text-sm text-yellow-700">
                Note: Displaying sample data for demonstration. No actual expense data is available.
              </div>
              <UpcomingExpensesTable data={sampleExpenses} />
            </div>
          );
        }
        
        // Determine data format and transform accordingly
        let formattedExpenses = [];
        
        if (Array.isArray(expenseData)) {
          // If the data is already an array of arrays, use it directly
          if (Array.isArray(expenseData[0])) {
            formattedExpenses = expenseData;
          } 
          // If it's an array of objects, convert to the format expected by UpcomingExpensesTable
          else {
            formattedExpenses = expenseData.map(expense => [
              expense.Category || expense.category || '',
              expense.Description || expense.description || '',
              expense.Amount?.toString() || expense.amount?.toString() || '0',
              expense.Date || expense.date || format(new Date(), 'MM/dd/yyyy')
            ]);
          }
        } else if (expenseData?.rawData) {
          formattedExpenses = expenseData.rawData;
        }
        
        console.log('Formatted Expenses for UpcomingExpensesTable:', formattedExpenses);
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Upcoming Expenses</h3>
              <p className="text-sm text-gray-500">
                Next 30 Days
              </p>
            </div>
            <UpcomingExpensesTable data={formattedExpenses} />
          </div>
        );
      }

      // Update the default case to show the selected question
      default:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {questionCategories.topPerformers.find(q => q.id === questionId)?.text ||
               questionCategories.underperforming.find(q => q.id === questionId)?.text ||
               questionCategories.upcoming.find(q => q.id === questionId)?.text}
            </h2>
            <p className="text-gray-500">Analysis coming soon...</p>
      </div>
    );
    }
  };

  const handleQuestionClick = (questionId) => {
    setSelectedQuestion(questionId);
    setAnswer(generateAnswer(questionId));
  };

  // Calculate profit changes for each campaign
  const getProfitChange = (campaign) => {
    if (!recentCheckInData || !checkIns.length) return null;
    
    const previousCheckIn = checkIns[checkIns.length - 2];
    if (!previousCheckIn) return null;

    const previousCampaign = previousCheckIn.campaigns.find(
      c => c.campaignName === campaign.campaignName
    );

    if (!previousCampaign) return null;

    const change = campaign.profit - previousCampaign.profit;
    return {
      value: change,
      formatted: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
      isPositive: change >= 0
    };
  };

  const toggleCampaignExpansion = (campaignName) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(campaignName)) {
      newExpanded.delete(campaignName);
    } else {
      newExpanded.add(campaignName);
    }
    setExpandedCampaigns(newExpanded);
  };

  return (
    <div className="space-y-8">
      {/* Questions Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getFilteredQuestions(questionCategories.topPerformers).map((question) => (
                    <button
              key={question.id}
              onClick={() => handleQuestionClick(question.id)}
              className={`text-left px-3 py-2 border rounded-md hover:bg-blue-50 transition-colors text-sm font-medium ${
                selectedQuestion === question.id ? 'text-blue-600 border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {question.text}
                    </button>
                  ))}
          {getFilteredQuestions(questionCategories.underperforming).map((question) => (
                    <button
              key={question.id}
              onClick={() => handleQuestionClick(question.id)}
              className={`text-left px-3 py-2 border rounded-md hover:bg-blue-50 transition-colors text-sm font-medium ${
                selectedQuestion === question.id ? 'text-blue-600 border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {question.text}
                    </button>
                  ))}
          {getFilteredQuestions(questionCategories.upcoming).map((question) => (
                    <button
              key={question.id}
              onClick={() => handleQuestionClick(question.id)}
              className={`text-left px-3 py-2 border rounded-md hover:bg-blue-50 transition-colors text-sm font-medium ${
                selectedQuestion === question.id ? 'text-blue-600 border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {question.text}
                    </button>
                  ))}
                </div>
        {/* Answer Display */}
        {selectedQuestion && answer && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {questionCategories.topPerformers.find(q => q.id === selectedQuestion)?.text ||
                 questionCategories.underperforming.find(q => q.id === selectedQuestion)?.text ||
                 questionCategories.upcoming.find(q => q.id === selectedQuestion)?.text}
              </h2>
                    <button
                onClick={() => {
                  setSelectedQuestion(null);
                  setAnswer(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
                    </button>
                </div>
            <div className="answer-content">
              {answer}
            </div>
            </div>
        )}
          </div>

      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Performance Overview</h2>
                <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last data: {format(lastDataDate, 'MMM d, yyyy')}
          </span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
            </SelectContent>
          </Select>
                </div>
                </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
              <div>
              <h3 className="text-sm font-medium text-gray-500">Spend</h3>
              <p className="text-2xl font-bold">{formatCurrency(metrics.spend)}</p>
                </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</p>
              </div>
            <DollarSign className="w-8 h-8 text-green-600" />
            </div>
      </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Profit</h3>
              <p className={`text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.profit)}
              </p>
          </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
      </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ROI</h3>
              <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.roi.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
        </Card>
              </div>

      {/* Media Buyer Performance Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Media Buyer Performance</h2>
        <div className="space-y-6">
          {Object.entries(groupDataByCategory(mediaBuyerData)).map(([category, buyers]) => (
            <div key={category} className="space-y-2">
              <h3 className="font-medium text-lg">{category} Media Buyers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Media Buyer</th>
                      <th className="text-left py-2">Network</th>
                      <th className="text-left py-2">Offer</th>
                      <th className="text-right py-2">Profit</th>
                      <th className="text-right py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{row.mediaBuyer}</td>
                        <td className="py-2">{row.network}</td>
                        <td className="py-2">{row.offer}</td>
                        <td className={`text-right py-2 ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.profit)}
                        </td>
                        <td className="text-right py-2">
                          <Sparkline 
                            data={Object.values(row.dailyProfits)} 
                            width={100} 
                            height={30}
                            color={row.profit >= 0 ? '#22c55e' : '#ef4444'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
          ))}
            </div>
        </Card>

      {/* Mid-Day Check-In Summary */}
      {recentCheckIn && checkInMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Latest Check-In: {format(new Date(recentCheckIn.timestamp), 'MMM d, yyyy h:mm a')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Spend</div>
                <div className="text-2xl font-semibold">
                  ${checkInMetrics.totalSpend.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-2xl font-semibold">
                  ${checkInMetrics.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Profit</div>
                <div className={`text-2xl font-semibold ${checkInMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${checkInMetrics.totalProfit.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Leads</div>
                <div className="text-2xl font-semibold">
                  {checkInMetrics.totalLeads.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Scale</div>
                <div className="text-2xl font-semibold text-green-600">
                  {checkInMetrics.scaleCount}
                </div>
                <div className="text-xs text-green-500">ROI ≥ 30%</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Watch</div>
                <div className="text-2xl font-semibold text-yellow-600">
                  {checkInMetrics.watchCount}
                </div>
                <div className="text-xs text-yellow-500">15% ≤ ROI &lt; 30%</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Shutoff</div>
                <div className="text-2xl font-semibold text-red-600">
                  {checkInMetrics.shutoffCount}
                </div>
                <div className="text-xs text-red-500">ROI &lt; 15%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Campaign</th>
                    <th className="text-right py-2">Spend</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Profit</th>
                    <th className="text-right py-2">ROI</th>
                    <th className="text-right py-2">Leads</th>
                    <th className="text-right py-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckIn.campaigns.map((campaign) => (
                    <tr key={campaign.name} className="border-b hover:bg-gray-50">
                      <td className="py-2">{campaign.name}</td>
                      <td className="text-right py-2">
                        ${(campaign.spend || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-2">
                        ${(campaign.revenue || 0).toLocaleString()}
                      </td>
                      <td className={`text-right py-2 ${campaign.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${campaign.profit.toLocaleString()}
                      </td>
                      <td className={`text-right py-2 ${(campaign.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(campaign.roi || 0).toFixed(2)}%
                      </td>
                      <td className="text-right py-2">
                        {(campaign.leads || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-2">
                        {campaign.trend === 'up' ? '📈' : 
                         campaign.trend === 'down' ? '📉' : '➡️'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIInsightsPage; 