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
      setSummaryData(plData.summary);
      const latestMonth = plData.summary[plData.summary.length - 1]?.Month || '';
      setSelectedMonth(latestMonth);
      setMonthlyData(plData.monthly || {});
    }
  }, [plData]);

  if (!summaryData.length || !selectedMonth || !monthlyData) {
    return <div className="text-gray-500 p-4">Loading P&L data...</div>;
  }

  // Prepare data for the graph
  const graphData = summaryData.map((month) => {
    const income = parseFloat(month.Income || 0) + parseFloat(month.Cash_Injection || 0);
    const expenses = parseFloat(month.Expenses || 0);
    const netProfit = income - expenses;
    return {
      Month: month.Month,
      NetProfit: netProfit,
    };
  });

  // Get Monthly Detail Data
  const currentMonthDetails = monthlyData[selectedMonth] || [];
  const incomeDetails = currentMonthDetails.filter((item) => item['Income/Expense'] === 'Income');
  const expenseDetails = currentMonthDetails.filter((item) => item['Income/Expense'] === 'Expense');

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
            {/* Breakeven Line */}
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
                const income =
                  parseFloat(month.Income || 0) + parseFloat(month.Cash_Injection || 0);
                const expenses = parseFloat(month.Expenses || 0);
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

      {/* Month Selector */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">View Details for Month</h3>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="form-select rounded-md border-gray-300 p-2"
        >
          {summaryData.map((month) => (
            <option key={month.Month} value={month.Month}>
              {month.Month}
            </option>
          ))}
        </select>
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
    </div>
  );
};

export default PLDashboard;
