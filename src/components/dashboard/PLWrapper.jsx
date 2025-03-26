import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  // Convert to number and handle string values
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  return `${Number(numValue).toFixed(1)}%`;
};

const parseAmount = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

const SummaryTable = ({ summaryData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatCurrency(row.Income)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatCurrency(row.Expenses)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(row.NetProfit)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatPercent(row['Net%'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const MonthlyDetails = ({ monthData, month }) => {
  const [expandedCategory, setExpandedCategory] = React.useState(null);

  if (!monthData) return null;

  const { incomeData, categories, totalIncome, totalExpenses } = monthData;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Income Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Income - {month}</CardTitle>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {incomeData.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 rounded-lg border"
              >
                <span className="font-medium">{item.DESCRIPTION}</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(item.AMOUNT)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Expenses - {month}</CardTitle>
            <span className="text-xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Object.entries(categories).map(([category, items]) => {
              const categoryTotal = items.reduce((sum, item) => 
                sum + parseAmount(item.AMOUNT), 0
              );
              
              return (
                <div key={category} className="border rounded-lg shadow-sm">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 rounded-t-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {expandedCategory === category ? 
                        <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      }
                      <span className="font-medium text-gray-900">{category}</span>
                    </div>
                    <span className="text-red-600 font-medium">
                      {formatCurrency(categoryTotal)}
                    </span>
                  </button>
                  {expandedCategory === category && (
                    <div className="border-t p-4 bg-gray-50">
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm"
                          >
                            <span className="text-gray-600">{item.DESCRIPTION}</span>
                            <span className="text-red-600">
                              {formatCurrency(item.AMOUNT)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
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

const PLWrapper = ({ plData, monthlyData, selectedMonth, onMonthChange }) => {
  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <SummaryTable summaryData={plData?.summary || []} />

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Monthly Details</h2>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(monthlyData).map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Details */}
      {selectedMonth && monthlyData[selectedMonth] && (
        <MonthlyDetails 
          monthData={monthlyData[selectedMonth]}
          month={selectedMonth}
        />
      )}
    </div>
  );
};

export default PLWrapper;