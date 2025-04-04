import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, ReferenceArea } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const isCashInjection = (description) => {
  const injectionKeywords = [
    'cash injection',
    'capital injection',
    'owner investment',
    'shareholder loan',
    'owner contribution',
    'investment',
    'capital contribution',
    'loan from',
    'personal loan',
    'owner loan'
  ];
  
  const desc = description.toLowerCase();
  return injectionKeywords.some(keyword => desc.includes(keyword));
};

const parseAmount = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

export default function RevenueFlowAnalysis({ performanceData, networkTerms, invoicesData, plData }) {
  const INITIAL_CASH = 266291.92;
  const INITIAL_CREDIT_DEBT = 432848.44;
  const INITIAL_POSITION = INITIAL_CASH - INITIAL_CREDIT_DEBT;

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!plData?.monthly) return [];

    let runningBalance = 0;
    const monthlyEntries = Object.entries(plData.monthly)
      // Sort months chronologically
      .sort((a, b) => {
        const monthOrder = {
          'June': 6, 'July': 7, 'August': 8, 'September': 9,
          'October': 10, 'November': 11, 'December': 12, 
          'January': 13, 'February': 14, 'March': 15
        };
        return monthOrder[a[0]] - monthOrder[b[0]];
      })
      .map(([month, data]) => {
        // Calculate monthly revenue
        const revenue = data.monthDataArray
          ?.filter(row => row['Income/Expense'] === 'Income')
          .reduce((sum, row) => sum + parseAmount(row.AMOUNT), 0) || 0;

        // Calculate monthly expenses
        const expenses = data.monthDataArray
          ?.filter(row => row['Income/Expense'] === 'Expense')
          .reduce((sum, row) => sum + parseAmount(row.AMOUNT), 0) || 0;

        // Calculate net for the month
        const monthlyNet = revenue - expenses;
        runningBalance += monthlyNet;

        // Format date string correctly for 2024/2025
        const year = month === 'January' ? '2025' : '2024';
        return {
          month: format(new Date(`${month} 1, ${year}`), 'MMM yyyy'),
          revenue,
          expenses,
          monthlyNet,
          runningBalance
        };
      });

    return monthlyEntries;
  }, [plData]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!processedData.length) return {};

    return {
      totalRevenue: processedData.reduce((sum, month) => sum + month.revenue, 0),
      totalExpenses: processedData.reduce((sum, month) => sum + month.expenses, 0),
      netPosition: processedData[processedData.length - 1]?.runningBalance || 0,
      averageMonthlyRevenue: processedData.reduce((sum, month) => sum + month.revenue, 0) / processedData.length,
      averageMonthlyExpenses: processedData.reduce((sum, month) => sum + month.expenses, 0) / processedData.length
    };
  }, [processedData]);

  // Add bottomLineData calculation
  const bottomLineData = useMemo(() => {
    if (!plData?.monthly) return [];
    
    let runningBottomLine = INITIAL_POSITION;
    
    const monthlyEntries = Object.entries(plData.monthly)
      .sort((a, b) => {
        const monthOrder = {
          'June': 6, 'July': 7, 'August': 8, 'September': 9,
          'October': 10, 'November': 11, 'December': 12, 
          'January': 13, 'February': 14, 'March': 15
        };
        return monthOrder[a[0]] - monthOrder[b[0]];
      })
      .map(([month, data]) => {
        // Calculate monthly revenue and expenses
        const revenue = data.monthDataArray
          ?.filter(row => row['Income/Expense'] === 'Income')
          .reduce((sum, row) => sum + parseAmount(row.AMOUNT), 0) || 0;

        const expenses = data.monthDataArray
          ?.filter(row => row['Income/Expense'] === 'Expense')
          .reduce((sum, row) => sum + parseAmount(row.AMOUNT), 0) || 0;
        
        // Calculate monthly net and update running total
        const monthlyNet = revenue - expenses;
        runningBottomLine += monthlyNet;

        const year = month === 'January' ? '2025' : '2024';
        return {
          month: format(new Date(`${month} 1, ${year}`), 'MMM yyyy'),
          monthlyNet,
          bottomLine: runningBottomLine
        };
      });

    // Add initial position as first data point
    return [
      {
        month: 'Starting Position',
        monthlyNet: 0,
        bottomLine: INITIAL_POSITION
      },
      ...monthlyEntries
    ];
  }, [plData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Average Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(metrics.averageMonthlyRevenue)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Average Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(metrics.averageMonthlyExpenses)}</p>
            </div>
            <div className={`${metrics.netPosition >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
              <p className={`text-sm ${metrics.netPosition >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                Current Net Position
              </p>
              <p className={`text-2xl font-bold ${metrics.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(metrics.netPosition)}
              </p>
            </div>
          </div>

          {/* Revenue Flow Chart */}
          <div className="h-[400px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#2563eb" />
                <YAxis yAxisId="right" orientation="right" stroke="#dc2626" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#2563eb" />
                <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#dc2626" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="runningBalance"
                  name="Net Position"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                {processedData.map((entry, index) => (
                  entry.runningBalance < 0 && (
                    <ReferenceArea
                      key={index}
                      x1={entry.month}
                      x2={entry.month}
                      yAxisId="right"
                      y1={0}
                      y2={entry.runningBalance}
                      fill="#fecaca"
                      fillOpacity={0.3}
                    />
                  )
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Analysis Notes */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Analysis Notes</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Blue bars show monthly revenue</li>
              <li>• Red bars show monthly expenses</li>
              <li>• Purple line tracks cumulative net position</li>
              <li>• Pink shading indicates periods of negative net position</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Simpler Bottom Line Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bottom Line Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-gray-600">
              Starting Position (June 2024):
              <ul className="ml-4 mt-2">
                <li>Cash: {formatCurrency(INITIAL_CASH)}</li>
                <li>Credit Card Debt: {formatCurrency(INITIAL_CREDIT_DEBT)}</li>
                <li>Net Position: {formatCurrency(INITIAL_POSITION)}</li>
              </ul>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bottomLineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="monthlyNet" name="Monthly Profit/Loss" fill="#4f46e5" />
                <Line
                  type="monotone"
                  dataKey="bottomLine"
                  name="Bottom Line"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                {bottomLineData.map((entry, index) => (
                  entry.bottomLine < 0 && (
                    <ReferenceArea
                      key={index}
                      x1={entry.month}
                      x2={entry.month}
                      y1={0}
                      y2={entry.bottomLine}
                      fill="#fecaca"
                      fillOpacity={0.3}
                    />
                  )
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>• Bars show monthly profit/loss</p>
            <p>• Green line shows running bottom line</p>
            <p>• Pink shading indicates negative bottom line periods</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 