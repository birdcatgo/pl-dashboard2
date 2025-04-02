import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const PLDashboard = ({ plData, selectedMonth }) => {
  const [monthlyData, setMonthlyData] = useState({
    selectedMonth: '',
    hasMonthlyData: false,
    monthlyRows: [],
    availableMonths: []
  });

  useEffect(() => {
    if (!plData?.summary) {
      console.log('No PL data available');
      return;
    }

    // Extract available months from summary data
    const availableMonths = plData.summary
      .filter(item => item.Month) // Filter out items without Month
      .map(item => item.Month);
    
    // Find the data for selected month
    const monthData = plData.summary.find(item => 
      item.Month?.toLowerCase() === selectedMonth?.toLowerCase()
    );

    // Process monthly data if available
    if (monthData) {
      const monthlyRows = [
        { label: 'Income', value: monthData.Income || 0 },
        { label: 'Expenses', value: -(
          (monthData.Payroll || 0) + 
          (monthData.Advertising || 0) + 
          (monthData.Software || 0) + 
          (monthData.Training || 0) + 
          (monthData.Once_Off || 0) + 
          (monthData.Memberships || 0) + 
          (monthData.Contractors || 0) + 
          (monthData.Tax || 0) + 
          (monthData.Bank_Fees || 0) + 
          (monthData.Utilities || 0) + 
          (monthData.Travel || 0)
        )},
        { label: 'Net Revenue', value: monthData.Net_Rev || 0 },
        { label: 'Net %', value: parseFloat(monthData.Net || 0) }
      ];

      setMonthlyData({
        selectedMonth,
        hasMonthlyData: true,
        monthlyRows,
        availableMonths
      });
    } else {
      setMonthlyData({
        selectedMonth,
        hasMonthlyData: false,
        monthlyRows: [],
        availableMonths
      });
    }
  }, [plData, selectedMonth]);

  // Debug logs
  console.log('Selected Month:', monthlyData.selectedMonth);
  console.log('Available Months:', monthlyData.availableMonths);
  console.log('Monthly Data Structure:', plData?.monthly || {});
  
  if (!monthlyData.hasMonthlyData) {
    console.log('Missing data:', monthlyData);
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">P&L Dashboard</h2>
        <div className="text-gray-500">
          No data available for {selectedMonth || 'selected month'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthlyData.availableMonths.map(month => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Net Profit Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Net Profit Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plData?.summary || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <ReferenceLine y={0} stroke="#000" />
              <Line type="monotone" dataKey="Net_Rev" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Net Result Card - Full Width */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Net Result - {selectedMonth}</h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              monthlyData.monthlyRows.find(row => row.label === 'Net Revenue')?.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(monthlyData.monthlyRows.find(row => row.label === 'Net Revenue')?.value)}
            </div>
            <div className="text-sm text-gray-500">
              Margin: {monthlyData.monthlyRows.find(row => row.label === 'Net %')?.value.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Income and Expense Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Revenue Breakdown - {selectedMonth}</h2>
            <span className="text-xl font-semibold text-green-600">
              Total: {formatCurrency(monthlyData.monthlyRows.find(row => row.label === 'Income')?.value)}
            </span>
          </div>

          <div className="space-y-6">
            {monthlyData.monthlyRows.filter(row => row.label !== 'Net Revenue' && row.label !== 'Net %').map((row, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{row.label}</span>
                <span className={`font-semibold ${
                  row.label === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Expense Breakdown */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Expense Breakdown - {selectedMonth}</h2>
            <span className="text-xl font-semibold text-red-600">
              Total: {formatCurrency(monthlyData.monthlyRows.find(row => row.label === 'Expenses')?.value)}
            </span>
          </div>

          <div className="space-y-6">
            {monthlyData.monthlyRows.filter(row => row.label !== 'Net Revenue' && row.label !== 'Net %').map((row, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{row.label}</span>
                <span className={`font-semibold ${
                  row.label === 'Expenses' ? 'text-red-600' : ''
                }`}>
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PLDashboard;
