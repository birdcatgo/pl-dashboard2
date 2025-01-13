import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import _ from 'lodash';

const formatCurrency = (value) => {
  if (!value) return '$0';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const PLDashboard = ({ plData }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    if (plData?.summary) {
      // Debug the incoming data
      console.log('Raw Summary Data:', plData.summary);
      console.log('Sample Row:', {
        Month: plData.summary[0]?.Month,
        Income: plData.summary[0]?.Income,
        Cash_Injection: plData.summary[0]?.Cash_Injection,
        // ... log all fields to see what we're getting
      });

      setSummaryData(plData.summary);
      const latestMonth = plData.summary[plData.summary.length - 1]?.Month || '';
      setSelectedMonth(latestMonth);
      setMonthlyData(plData.monthly || {});
    }
  }, [plData]);

  // Let's see what's in plData
  console.log('plData structure:', {
    summary: plData?.summary,
    summaryKeys: plData?.summary ? Object.keys(plData.summary[0]) : [],
    rawSummary: JSON.stringify(plData?.summary, null, 2)
  });

  if (!summaryData.length || !selectedMonth || !monthlyData) {
    return <div className="text-gray-500 p-4">Loading P&L data...</div>;
  }

  // Prepare data for the graph
  const graphData = summaryData.map((month) => {
    const income = parseFloat(month.Income || 0) + parseFloat(month.Cash_Injection || 0);
    const expenses = [
      'Payroll',
      'Advertising',
      'Software',
      'Training',
      'Once_Off',
      'Memberships',
      'Contractors',
      'Tax',
      'Bank_Fees',
      'Utilities',
      'Travel',
      'Capital_One',
      'Barclay',
      'Business_Loan',
      'Unknown Expense'
    ].reduce((sum, category) => sum + parseFloat(month[category] || 0), 0);
    const netProfit = income - expenses;
    return {
      Month: month.Month,
      NetProfit: netProfit,
    };
  });

  // Get Monthly Detail Data
  const currentMonthDetails = monthlyData[selectedMonth] || [];
  const currentMonthRows = currentMonthDetails.rows || [];
  const incomeDetails = currentMonthRows.filter((item) => item['Income/Expense'] === 'Income');
  const expenseDetails = currentMonthRows.filter((item) => item['Income/Expense'] === 'Expense');

  const getMonthlyBreakdown = (monthData) => {
    if (!monthData) return {};

    // Group expenses by category
    const expensesByCategory = expenseDetails.reduce((acc, item) => {
      const category = item.CATEGORY;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += item.AMOUNT;
      return acc;
    }, {});

    // Calculate total income
    const totalIncome = incomeDetails.reduce((sum, item) => sum + item.AMOUNT, 0);

    // Calculate total expenses
    const totalExpenses = currentMonthDetails.totalExpenses || 0;

    return {
      expensesByCategory,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Profit & Loss</h2>
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Net Profit Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Month" />
            <YAxis domain={['auto', 'auto']} tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <ReferenceLine y={0} stroke="red" strokeDasharray="5 5" label="Breakeven" />
            <Line type="monotone" dataKey="NetProfit" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Summary Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Income</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Net Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summaryData.map((month) => {
                const income = parseFloat(month.Income || 0) + parseFloat(month.Cash_Injection || 0);
                const expenses = [
                  'Payroll',
                  'Advertising',
                  'Software',
                  'Training',
                  'Once_Off',
                  'Memberships',
                  'Contractors',
                  'Tax',
                  'Bank_Fees',
                  'Utilities',
                  'Travel',
                  'Capital_One',
                  'Barclay',
                  'Business_Loan',
                  'Unknown Expense'
                ].reduce((sum, category) => sum + parseFloat(month[category] || 0), 0);
                const netProfit = income - expenses;
                return (
                  <tr
                    key={month.Month}
                    className="hover:bg-gray-50"
                    onClick={() => setSelectedMonth(month.Month)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={`px-6 py-4 text-sm text-gray-900 ${
                      selectedMonth === month.Month ? 'font-bold' : ''
                    }`}>{month.Month}</td>
                    <td className={`px-6 py-4 text-sm text-right text-green-600 ${
                      selectedMonth === month.Month ? 'font-bold' : ''
                    }`}>
                      {formatCurrency(income)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right text-red-600 ${
                      selectedMonth === month.Month ? 'font-bold' : ''
                    }`}>
                      {formatCurrency(expenses)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right text-blue-600 ${
                      selectedMonth === month.Month ? 'font-bold' : ''
                    }`}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right text-gray-900 ${
                      selectedMonth === month.Month ? 'font-bold' : ''
                    }`}>
                      {income > 0 ? ((netProfit / income) * 100).toFixed(2) : '0.00'}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Income for {selectedMonth}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomeDetails.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.DESCRIPTION}</td>
                    <td className="px-6 py-4 text-sm text-right text-green-600">
                      {formatCurrency(item.AMOUNT)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expenses for {selectedMonth}</h3>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(_.groupBy(expenseDetails, 'CATEGORY')).map(([category, items]) => (
              <div key={category} className="border rounded-lg">
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === category ? null : category)
                  }
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
                >
                  <span className="font-medium">{category}</span>
                  <span className="text-red-600">
                    {formatCurrency(_.sumBy(items, (item) => Math.abs(item.AMOUNT)))}
                  </span>
                </button>
                {expandedCategory === category && (
                  <div className="border-t divide-y">
                    {items.map((item, idx) => (
                      <div key={idx} className="px-6 py-3 flex justify-between bg-gray-50">
                        <span className="text-sm text-gray-600">{item.DESCRIPTION}</span>
                        <span className="text-sm text-red-600">
                          {formatCurrency(Math.abs(item.AMOUNT))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Financial Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 border-r">Month</th>
                <th colSpan="2" className="px-4 py-2 text-center text-xs font-medium text-gray-500 border-b">Revenue</th>
                <th colSpan="15" className="px-4 py-2 text-center text-xs font-medium text-gray-500 border-b">Expenses</th>
                <th colSpan="2" className="px-4 py-2 text-center text-xs font-medium text-gray-500 border-b">Results</th>
              </tr>
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 border-r"></th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-700">Income</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-green-700 border-r">Cash Injection</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Payroll</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Advertising</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Software</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Training</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Once_Off</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Memberships</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Contractors</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Tax</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Bank_Fees</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Utilities</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Travel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Capital_One</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Barclay</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Business_Loan</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-700">Unknown Expense</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-700 border-l">Net Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-700">Net %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summaryData.map((row) => (
                <tr key={row.Month} className="hover:bg-gray-50 group">
                  <td className="sticky left-0 bg-white group-hover:bg-gray-50 px-4 py-4 text-sm font-medium text-gray-900 border-r">{row.Month}</td>
                  <td className="px-4 py-4 text-sm text-right text-green-600 font-medium">
                    {formatCurrency(row.Income)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-green-600 font-medium border-r">
                    {formatCurrency(row.Cash_Injection)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Payroll)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Advertising)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Software)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Training)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Once_Off)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Memberships)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Contractors)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Tax)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Bank_Fees)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Utilities)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Travel)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Capital_One)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Barclay)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row.Business_Loan)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-red-600">
                    {formatCurrency(row['Unknown Expense'])}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-medium text-blue-600 border-l">
                    {formatCurrency(row.Net_Rev)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-medium text-gray-900">
                    {parseFloat(row['Net%']).toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="sticky left-0 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-900 border-r">Total</td>
                {/* Calculate and display totals for each column */}
                {/* ... totals cells ... */}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PLDashboard;
