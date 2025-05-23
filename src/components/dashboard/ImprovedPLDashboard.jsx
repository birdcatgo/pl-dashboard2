import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import _ from 'lodash';
import PLWrapper from './PLWrapper';

const formatCurrency = (value) => {
  if (!value) return '$0';
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

const formatPercent = (value) => {
  if (!value || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};

const SummaryTable = ({ summaryData }) => {
  console.log('Summary Data:', summaryData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Year-to-Date Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 bg-gray-50">Month</th>
                <th className="text-right p-2 bg-gray-50">Revenue</th>
                <th className="text-right p-2 bg-gray-50">Costs</th>
                <th className="text-right p-2 bg-gray-50">Ad Spend</th>
                <th className="text-right p-2 bg-gray-50">Net Profit</th>
                <th className="text-right p-2 bg-gray-50">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summaryData.map((month, index) => {
                const revenue = parseFloat(month.Income || 0);
                const adSpend = parseFloat(month.Advertising || 0);
                const netProfit = parseFloat(month.NetProfit || 0);
                const costs = revenue - netProfit; // Calculate total costs
                const margin = parseFloat(month['Net%'] || 0);

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2">{month.Month}</td>
                    <td className="text-right p-2">{formatCurrency(revenue)}</td>
                    <td className="text-right p-2">{formatCurrency(costs)}</td>
                    <td className="text-right p-2">{formatCurrency(adSpend)}</td>
                    <td className="text-right p-2">{formatCurrency(netProfit)}</td>
                    <td className="text-right p-2">{formatPercent(margin)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="p-2">Total</td>
                <td className="text-right p-2">
                  {formatCurrency(_.sumBy(summaryData, m => parseFloat(m.Income || 0)))}
                </td>
                <td className="text-right p-2">
                  {formatCurrency(_.sumBy(summaryData, m => 
                    parseFloat(m.Income || 0) - parseFloat(m.Net_Rev || 0)
                  ))}
                </td>
                <td className="text-right p-2">
                  {formatCurrency(_.sumBy(summaryData, m => parseFloat(m.Advertising || 0)))}
                </td>
                <td className="text-right p-2">
                  {formatCurrency(_.sumBy(summaryData, m => parseFloat(m.Net_Rev || 0)))}
                </td>
                <td className="text-right p-2">
                  {formatPercent(
                    (_.sumBy(summaryData, m => parseFloat(m.Net_Rev || 0)) / 
                    _.sumBy(summaryData, m => parseFloat(m.Income || 0))) * 100
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const MonthlyDetails = ({ monthData, month }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Get the rows from the monthData structure
  const monthDataArray = monthData?.rows || [];
  
  const incomeData = monthDataArray.filter(item => item['Income/Expense'] === 'Income');
  const expenseData = monthDataArray.filter(item => item['Income/Expense'] === 'Expense');
  
  const totalIncome = _.sumBy(incomeData, item => parseFloat(item.AMOUNT) || 0);
  const totalExpenses = monthData?.totalExpenses || 0;

  // Group expenses by category
  const categories = _.groupBy(expenseData, 'CATEGORY');

  console.log('Processed Monthly Data:', {
    monthDataArray,
    incomeData,
    expenseData,
    totalIncome,
    totalExpenses,
    categories
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Income Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Income - {month}</span>
            <span className="text-green-600">{formatCurrency(totalIncome)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incomeData.map((item, index) => (
              <div key={index} className="flex justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">{item.DESCRIPTION}</span>
                <span className="text-green-600 font-medium">{formatCurrency(item.AMOUNT)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Expenses - {month}</span>
            <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="border rounded-lg">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {expandedCategory === category ? 
                      <ChevronDown className="h-4 w-4 mr-2" /> : 
                      <ChevronRight className="h-4 w-4 mr-2" />
                    }
                    <span className="font-medium">{category}</span>
                  </div>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(_.sumBy(items, item => Math.abs(parseFloat(item.AMOUNT))))}
                  </span>
                </button>
                {expandedCategory === category && (
                  <div className="p-2 space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded ml-6">
                        <span className="text-gray-700">{item.DESCRIPTION}</span>
                        <span className="text-red-600">{formatCurrency(Math.abs(item.AMOUNT))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ImprovedPLDashboard = ({ plData, summaryData }) => {
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (plData?.monthly) {
      // Set initial selected month to the most recent month
      const months = Object.keys(plData.monthly);
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[months.length - 1]);
      }
    }
  }, [plData]);

  // Get the selected month's data
  const selectedMonthData = plData?.monthly?.[selectedMonth];

  console.log('ImprovedPLDashboard data:', {
    selectedMonth,
    selectedMonthData,
    incomeData: selectedMonthData?.incomeData,
    expenseData: selectedMonthData?.expenseData,
    categories: selectedMonthData?.categories,
    totalIncome: selectedMonthData?.totalIncome,
    totalExpenses: selectedMonthData?.totalExpenses
  });

  return (
    <div className="space-y-6">
      <PLWrapper 
        plData={plData}
        monthlyData={plData?.monthly || {}}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedMonthData={selectedMonthData}
      />
    </div>
  );
};

export default ImprovedPLDashboard;