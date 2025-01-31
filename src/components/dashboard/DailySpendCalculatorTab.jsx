import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, Minus } from 'lucide-react';

const formatCurrency = (amount) => {
  // Round to nearest 100
  const rounded = Math.round(amount / 100) * 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
};

const analyzeTrend = (dailyData) => {
  if (dailyData.length < 3) return { type: 'insufficient', label: 'New' };

  const dailyROIs = dailyData.map(d => (d.margin / d.spend) * 100);
  const changes = [];
  for (let i = 1; i < dailyROIs.length; i++) {
    changes.push(dailyROIs[i] - dailyROIs[i - 1]);
  }

  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const stdDev = Math.sqrt(
    changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length
  );

  if (Math.abs(avgChange) < 5 && stdDev < 10) return { type: 'stable', label: 'Stable' };
  if (stdDev > 30) return { type: 'volatile', label: 'Volatile' };
  if (avgChange > 10) return { type: 'improving', label: 'Improving' };
  if (avgChange < -10) return { type: 'declining', label: 'Declining' };
  return { type: 'neutral', label: 'Neutral' };
};

const TrendIcon = ({ trend }) => {
  const icons = {
    improving: "⬆️",
    declining: "⬇️",
    stable: "➡️",
    volatile: "↕️",
    insufficient: "❔",
    neutral: "➡️"
  };
  return <span title={trend.label}>{icons[trend.type]}</span>;
};

const calculateSuggestedBudget = (lastSpend, roi, trend, network, offer, offerCaps) => {
  if (!lastSpend || isNaN(lastSpend)) return 0;
  
  let multiplier = 1;
  
  if (roi > 100 && trend.type === 'improving') multiplier = 1.5;
  else if (roi > 50 && trend.type === 'stable') multiplier = 1.25;
  else if (roi < 0 || trend.type === 'declining') multiplier = 0.5;
  else if (trend.type === 'volatile') multiplier = 0.75;
  
  let suggestedBudget = Math.round((lastSpend * multiplier) / 100) * 100;

  // Find matching network and offer in caps data
  const offerCap = offerCaps.find(cap => 
    cap.network === network && 
    cap.offer === offer
  );

  if (offerCap && offerCap.dailyCap) {
    const dailyCap = parseFloat(offerCap.dailyCap);
    if (dailyCap > 0) {
      suggestedBudget = Math.min(suggestedBudget, dailyCap);
    }
  }

  return suggestedBudget;
};

const getBudgetChangeIndicator = (suggested, current) => {
  // Round to nearest 100 to match our budget calculations
  const roundedSuggested = Math.round(suggested / 100) * 100;
  const roundedCurrent = Math.round(current / 100) * 100;
  
  if (roundedSuggested > roundedCurrent) {
    return <ArrowUpIcon className="h-6 w-6 text-green-600" strokeWidth={3} title={`Increase to ${formatCurrency(roundedSuggested)}`} />;
  } else if (roundedSuggested === roundedCurrent) {
    return <Minus className="h-6 w-6 text-orange-500" strokeWidth={3} title={`Maintain at ${formatCurrency(roundedSuggested)}`} />;
  } else {
    return <ArrowDownIcon className="h-6 w-6 text-red-600" strokeWidth={3} title={`Decrease to ${formatCurrency(roundedSuggested)}`} />;
  }
};

const DailySpendCalculatorTab = ({ cashManagementData, performanceData, offerCaps = [] }) => {
  console.log('Offer Caps Data:', offerCaps);

  // Calculate last 7 days average spend per buyer
  const calculateAverageSpends = () => {
    if (!performanceData?.length) return {};
    
    // Sort data by date descending
    const sortedData = [...performanceData].sort((a, b) => 
      new Date(b.Date) - new Date(a.Date)
    );

    // Get unique dates and take last 7
    const uniqueDates = [...new Set(sortedData.map(row => row.Date))].slice(0, 7);
    
    // Get all media buyers
    const mediaBuyers = [...new Set(sortedData.map(row => row['Media Buyer']))];

    // Calculate average spend for each buyer
    const averages = {};
    mediaBuyers.forEach(buyer => {
      const buyerData = sortedData.filter(row => 
        row['Media Buyer'] === buyer && 
        uniqueDates.includes(row.Date)
      );

      const totalSpend = buyerData.reduce((sum, row) => 
        sum + (parseFloat(row['Ad Spend']) || 0), 0
      );

      // Round average to nearest 100
      const averageSpend = Math.round((totalSpend / uniqueDates.length) / 100) * 100;
      
      // Only include buyers with non-zero spend
      if (averageSpend > 0) {
        averages[buyer] = averageSpend;
      }
    });

    return averages;
  };

  const [averageSpends, setAverageSpends] = useState({});
  const [spendAmounts, setSpendAmounts] = useState({});

  useEffect(() => {
    const averages = calculateAverageSpends();
    setAverageSpends(averages);
    setSpendAmounts(averages); // Initialize new spend amounts with current averages
  }, [performanceData]);

  const totalAvailable = Math.round((cashManagementData?.availableCash || 0) + (cashManagementData?.creditAvailable || 0));
  const totalDailySpend = Math.round(Object.values(spendAmounts).reduce((sum, spend) => sum + (parseFloat(spend) || 0), 0));
  const daysOfCoverage = Math.floor(totalAvailable / totalDailySpend) || 0;

  // Calculate maximum daily spend to maintain 14 days coverage
  const calculateMaxSpend = (currentSpend, totalBudget) => {
    const otherSpends = Object.values(spendAmounts).reduce((sum, spend) => 
      sum + (parseFloat(spend) || 0), 0) - (parseFloat(currentSpend) || 0);
    const maxTotalSpend = totalBudget / 14; // 14 days coverage
    // Round to nearest 100
    return Math.round(Math.max(0, maxTotalSpend - otherSpends) / 100) * 100;
  };

  const handleSpendChange = (buyerName, value) => {
    // Round input to nearest 100
    const roundedValue = Math.round(parseFloat(value || 0) / 100) * 100;
    setSpendAmounts(prev => ({
      ...prev,
      [buyerName]: roundedValue
    }));
  };

  const getDetailedPerformance = () => {
    if (!performanceData?.length) return [];

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const dates = [...new Set(performanceData
      .filter(row => 
        new Date(row.Date) >= sevenDaysAgo &&
        row['Media Buyer'] !== 'Unknown' &&
        row.Network !== 'Unknown' &&
        row.Offer !== 'Unknown'
      )
      .map(row => row.Date)
    )].sort();

    const lastDate = dates[dates.length - 1];

    const groupedData = performanceData
      .filter(row => 
        new Date(row.Date) >= sevenDaysAgo &&
        row['Media Buyer'] !== 'Unknown' &&
        row.Network !== 'Unknown' &&
        row.Offer !== 'Unknown'
      )
      .reduce((acc, row) => {
        const key = `${row['Media Buyer']}-${row.Network}-${row.Offer}`;
        if (!acc[key]) {
          const offerCap = offerCaps.find(cap => 
            cap.network === row.Network && 
            cap.offer === row.Offer
          );
          
          acc[key] = {
            mediaBuyer: row['Media Buyer'],
            network: row.Network,
            offer: row.Offer,
            dailyData: {},
            lastDaySpend: 0,
            lastDayRevenue: 0,
            lastDayMargin: 0,
            lastDayROI: 0,
            offerCap: offerCap?.dailyCap ? parseFloat(offerCap.dailyCap) : null,
            payPeriod: offerCap?.payPeriod || null,
            netTerms: offerCap?.netTerms || null
          };
        }

        const date = row.Date;
        if (!acc[key].dailyData[date]) {
          acc[key].dailyData[date] = {
            spend: 0,
            revenue: 0,
            margin: 0
          };
        }

        const spend = parseFloat(row['Ad Spend'] || 0);
        const revenue = parseFloat(row['Total Revenue'] || 0);
        const margin = parseFloat(row.Margin || 0);

        acc[key].dailyData[date].spend += spend;
        acc[key].dailyData[date].revenue += revenue;
        acc[key].dailyData[date].margin += margin;

        if (date === lastDate) {
          acc[key].lastDaySpend = spend;
          acc[key].lastDayRevenue = revenue;
          acc[key].lastDayMargin = margin;
          acc[key].lastDayROI = spend > 0 ? (margin / spend * 100) : 0;
        }

        return acc;
      }, {});

    // Filter out entries with no recent spend and process the rest
    return Object.values(groupedData)
      .filter(item => item.lastDaySpend > 0) // Only include items with recent spend
      .map(item => {
        const dailyMetrics = Object.values(item.dailyData);
        const trend = analyzeTrend(dailyMetrics);
        const suggestedBudget = calculateSuggestedBudget(
          item.lastDaySpend,
          item.lastDayROI,
          trend,
          item.network,
          item.offer,
          offerCaps
        );

        return {
          ...item,
          trend,
          suggestedBudget
        };
      })
      .sort((a, b) => b.lastDayROI - a.lastDayROI);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Available Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalAvailable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalDailySpend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Days of Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              daysOfCoverage >= 14 ? 'text-green-600' : 
              daysOfCoverage >= 7 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {daysOfCoverage} days
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Buyer Spend Calculator (14-Day Coverage)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">7-Day Average</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Daily Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Max Daily Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.keys(averageSpends).sort().map((buyer, index) => {
                const maxSpend = calculateMaxSpend(spendAmounts[buyer], totalAvailable);
                const isOverMax = (spendAmounts[buyer] || 0) > maxSpend;

                return (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{buyer}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatCurrency(averageSpends[buyer])}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="relative w-32">
                          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                          <input
                            type="text"
                            value={spendAmounts[buyer] || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              handleSpendChange(buyer, value);
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleSpendChange(buyer, value);
                            }}
                            className={`form-input rounded-md w-full text-right pl-8 ${
                              isOverMax ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm text-right ${
                      isOverMax ? 'text-red-600 font-bold' : 'text-gray-900'
                    }`}>
                      {formatCurrency(maxSpend)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="font-medium">
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm text-right">
                  {formatCurrency(Object.values(averageSpends).reduce((sum, spend) => sum + spend, 0))}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  {formatCurrency(totalDailySpend)}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {formatCurrency(Math.round(totalAvailable / 14 / 100) * 100)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detailed Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yesterday's Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yesterday's Rev</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yesterday's Margin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">7-Day Trend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getDetailedPerformance().map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.mediaBuyer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.network}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.offer}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(item.lastDaySpend)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(item.lastDayRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={item.lastDayMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item.lastDayMargin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={item.lastDayROI >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.lastDayROI.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendIcon trend={item.trend} />
                        <span className="text-xs text-gray-500">{item.trend.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {item.offerCap ? formatCurrency(item.offerCap) : 'Uncapped'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center">
                        {getBudgetChangeIndicator(item.suggestedBudget, item.lastDaySpend)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySpendCalculatorTab;