import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import _ from 'lodash';

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

const SummaryTable = ({ summaryData }) => (
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
            {summaryData.map((month, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2">{month.Month}</td>
                <td className="text-right p-2">{formatCurrency(month.Revenue)}</td>
                <td className="text-right p-2">{formatCurrency(month.Costs)}</td>
                <td className="text-right p-2">{formatCurrency(month['Ad Spend'])}</td>
                <td className="text-right p-2">{formatCurrency(month['Net Profit'])}</td>
                <td className="text-right p-2">{formatPercent((month['Net Profit'] / month.Revenue) * 100)}</td>
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>
    </CardContent>
  </Card>
);

const MonthlyDetails = ({ monthData, month }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  const incomeData = monthData.filter(item => item['Income/Expense'] === 'Income');
  const expenseData = monthData.filter(item => item['Income/Expense'] === 'Expense');
  
  const totalIncome = _.sumBy(incomeData, item => parseFloat(item.AMOUNT) || 0);
  const totalExpenses = _.sumBy(expenseData, item => Math.abs(parseFloat(item.AMOUNT)) || 0);
  const netProfit = totalIncome - totalExpenses;

  const categories = _.groupBy(expenseData, 'CATEGORY');

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
  const [monthlyData, setMonthlyData] = useState(null);

  useEffect(() => {
    if (plData?.monthly) {
      const months = Object.keys(plData.monthly);
      setSelectedMonth(months[months.length - 1] || '');
      setMonthlyData(plData.monthly);
    }
  }, [plData]);

  if (!monthlyData || !selectedMonth) {
    return (
      <div className="text-gray-500 p-4">
        Loading P&L data...
      </div>
    );
  }

  const currentMonthData = monthlyData[selectedMonth] || [];

  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <SummaryTable summaryData={summaryData} />

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Monthly Details</h2>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-500"
          >
            {Object.keys(monthlyData).map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Details */}
      <MonthlyDetails 
        monthData={currentMonthData}
        month={selectedMonth}
      />
    </div>
  );
};

export default ImprovedPLDashboard;