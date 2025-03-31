import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

const BreakevenCalculator = ({ data }) => {
  const [adSpend, setAdSpend] = useState(100000);
  const [revenue, setRevenue] = useState(250000);
  const [monthDays, setMonthDays] = useState(30);

  // Constants
  const DAILY_EXPENSES = 1946.85; // Payroll $41,216 + General $18,000 / 21 working days
  const MB_COMMISSION_RATE = 0.10;
  const RINGBA_RATE = 0.02;
  const ACA_REVENUE_PERCENTAGE = 0.80; // Assuming 80% of revenue is ACA

  const calculateMetrics = () => {
    const monthlyDailyExpenses = DAILY_EXPENSES * monthDays;
    const baseProfit = revenue - adSpend;
    const mbCommission = baseProfit * MB_COMMISSION_RATE;
    const ringbaCost = revenue * RINGBA_RATE;
    const finalProfit = baseProfit - mbCommission - ringbaCost - monthlyDailyExpenses;
    const roi = adSpend ? (finalProfit / adSpend) * 100 : 0;

    return {
      monthlyDailyExpenses,
      baseProfit,
      mbCommission,
      ringbaCost,
      finalProfit,
      roi
    };
  };

  const metrics = calculateMetrics();

  // Calculate daily breakeven target
  const dailyAdSpend = adSpend / monthDays;
  const dailyBreakevenTarget = dailyAdSpend * 2.5; // Using 2.5x as minimum target

  // Process daily performance data from API
  const processDailyData = () => {
    console.log('Processing daily data from:', data);
    if (!data || !Array.isArray(data)) {
      console.log('No performance data available');
      return [];
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // First, aggregate data by day
    const dailyAggregates = data
      .filter(day => {
        const [month, dayOfMonth, year] = day.Date.split('/').map(num => parseInt(num, 10));
        // Only include data from current month and year
        return month === (currentMonth + 1) && year === currentYear;
      })
      .reduce((acc, day) => {
        // Use the date string as the key
        const date = day.Date;
        if (!acc[date]) {
          acc[date] = {
            date,
            parsedDate: new Date(...day.Date.split('/').map(num => parseInt(num, 10) - (num === day.Date.split('/')[0] ? 1 : 0))),
            revenue: 0,
            adSpend: 0,
            entries: 0
          };
        }
        
        acc[date].revenue += parseFloat(day['Total Revenue'] || 0);
        acc[date].adSpend += parseFloat(day['Ad Spend'] || 0);
        acc[date].entries += 1;
        return acc;
      }, {});

    // Then calculate metrics for each day
    return Object.values(dailyAggregates)
      .map(day => {
        const baseProfit = day.revenue - day.adSpend;
        const mbCommission = baseProfit * MB_COMMISSION_RATE;
        const ringbaCost = day.revenue * RINGBA_RATE;
        const finalProfit = baseProfit - mbCommission - ringbaCost - DAILY_EXPENSES;
        const roi = day.adSpend ? (finalProfit / day.adSpend) * 100 : 0;
        const hitTarget = day.revenue >= (day.adSpend * 2.5);

        return {
          ...day,
          baseProfit,
          mbCommission,
          ringbaCost,
          finalProfit,
          roi,
          hitTarget
        };
      })
      .sort((a, b) => a.parsedDate - b.parsedDate);
  };

  // Process offer performance data from API
  const processOfferData = () => {
    console.log('Processing offer data from:', data);
    if (!data || !Array.isArray(data)) {
      console.log('No performance data available for offers');
      return [];
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group performance data by offer and media buyer
    const offerData = data
      .filter(day => {
        const [month, dayOfMonth, year] = day.Date.split('/').map(num => parseInt(num, 10));
        // Only include data from current month and year
        return month === (currentMonth + 1) && year === currentYear;
      })
      .reduce((acc, day) => {
        const offerName = day.Offer || 'Unknown Offer';
        const mediaBuyer = day['Media Buyer'] || 'Unknown';
        const network = day.Network || 'Unknown';
        const key = `${mediaBuyer}-${network}-${offerName}`;
        
        if (!acc[key]) {
          acc[key] = {
            name: offerName,
            mediaBuyer,
            network,
            revenue: 0,
            adSpend: 0,
            entries: 0
          };
        }
        acc[key].revenue += parseFloat(day['Total Revenue'] || 0);
        acc[key].adSpend += parseFloat(day['Ad Spend'] || 0);
        acc[key].entries += 1;
        return acc;
      }, {});

    console.log('Grouped offer data:', offerData);

    // Convert to array and calculate metrics
    return Object.values(offerData).map(offer => {
      const baseProfit = offer.revenue - offer.adSpend;
      const mbCommission = baseProfit * MB_COMMISSION_RATE;
      const ringbaCost = offer.revenue * RINGBA_RATE;
      const finalProfit = baseProfit - mbCommission - ringbaCost - (DAILY_EXPENSES * monthDays / Object.keys(offerData).length);
      const roi = offer.adSpend ? (finalProfit / offer.adSpend) * 100 : 0;
      const hitTarget = offer.revenue >= (offer.adSpend * 2.5);

      return {
        ...offer,
        baseProfit,
        mbCommission,
        ringbaCost,
        finalProfit,
        roi,
        hitTarget
      };
    });
  };

  const dailyData = processDailyData();
  const offerData = processOfferData();

  console.log('Processed daily data:', dailyData);
  console.log('Processed offer data:', offerData);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Breakeven Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adSpend">Monthly Ad Spend</Label>
                <Input
                  id="adSpend"
                  type="number"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Monthly Revenue</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthDays">Days in Month</Label>
                <Input
                  id="monthDays"
                  type="number"
                  value={monthDays}
                  onChange={(e) => setMonthDays(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Base Profit</div>
                  <div className="text-lg font-semibold">{formatCurrency(metrics.baseProfit)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">MB Commission (10%)</div>
                  <div className="text-lg font-semibold text-orange-600">{formatCurrency(metrics.mbCommission)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Ringba Cost (2%)</div>
                  <div className="text-lg font-semibold text-orange-600">{formatCurrency(metrics.ringbaCost)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Daily Expenses</div>
                  <div className="text-lg font-semibold text-orange-600">{formatCurrency(metrics.monthlyDailyExpenses)}</div>
                </div>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-500">Final Profit</div>
                <div className={`text-lg font-semibold ${metrics.finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.finalProfit)}
                </div>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-500">ROI</div>
                <div className={`text-lg font-semibold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.roi.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Breakeven Analysis */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Breakeven Analysis</h3>
            <p className="text-sm text-gray-600">
              To breakeven, you need approximately 2.5-3x your ad spend in revenue. This accounts for:
            </p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              <li>Daily Expenses: {formatCurrency(DAILY_EXPENSES)} per day</li>
              <li>MB Commission: 10% of base profit</li>
              <li>Ringba Cost: 2% of ACA revenue (assuming 80% ACA revenue)</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              For example, with {formatCurrency(adSpend)} in ad spend, you need approximately {formatCurrency(adSpend * 2.5)} to {formatCurrency(adSpend * 3)} in revenue to breakeven.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Offer Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Media Buyer, Network, and Offer (MTD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Understanding the Data</h3>
            <p className="text-sm text-gray-600">
              This table shows Month-to-Date (MTD) performance metrics for each Media Buyer, Network, and Offer combination.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Hit Target:</strong> Indicates whether the revenue was at least 2.5x the ad spend, which is our minimum target for profitability.
              This accounts for daily expenses, media buyer commission, and Ringba costs.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ad Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Final Profit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hit Target</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offerData.map((offer) => (
                  <tr key={`${offer.mediaBuyer}-${offer.network}-${offer.name}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{offer.mediaBuyer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{offer.network}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{offer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(offer.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(offer.adSpend)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${offer.finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(offer.finalProfit)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${offer.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {offer.roi.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        offer.hitTarget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {offer.hitTarget ? 'Yes' : 'No'}
                      </span>
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

export default BreakevenCalculator;