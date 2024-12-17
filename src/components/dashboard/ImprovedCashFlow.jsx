import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const parseDate = (dateString) => {
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? null : parsedDate;
};

const parseAmount = (amountString) => {
  if (typeof amountString === 'number') return amountString;
  return parseFloat(amountString?.replace(/[$,]/g, '') || '0') || 0;
};

const generateProjections = (invoices, payroll, initialBalance) => {
  const projectionDays = {};
  let runningBalance = initialBalance;

  // Process invoices
  invoices.slice(1).forEach((row) => { // Skip header row
    const date = parseDate(row[2]); // Date in third column
    if (!date) {
      console.warn('Skipping invoice due to invalid date:', row);
      return;
    }

    const amount = parseAmount(row[1]); // Amount in second column
    const network = row[0]; // Network in first column
    const key = date.toISOString().split('T')[0];
    
    if (!projectionDays[key]) {
      projectionDays[key] = { 
        date, 
        inflows: [], 
        outflows: [], 
        invoicePayment: 0, 
        payroll: 0, 
        creditCardPayment: 0, 
        balance: runningBalance 
      };
    }
    projectionDays[key].inflows.push({ network, amount });
    projectionDays[key].invoicePayment += amount;
  });

  // Process payroll
  payroll.slice(1).forEach((row) => { // Skip header row
    const date = parseDate(row[3]); // Date in fourth column
    if (!date) {
      console.warn('Skipping payroll entry due to invalid date:', row);
      return;
    }

    const amount = parseAmount(row[2]); // Amount in third column
    const type = row[0]; // Type in first column
    const description = row[1]; // Description in second column
    const key = date.toISOString().split('T')[0];
    
    if (!projectionDays[key]) {
      projectionDays[key] = { 
        date, 
        inflows: [], 
        outflows: [], 
        invoicePayment: 0, 
        payroll: 0, 
        creditCardPayment: 0, 
        balance: runningBalance 
      };
    }
    projectionDays[key].outflows.push({ type, description, amount });
    if (type === 'credit_card') {
      projectionDays[key].creditCardPayment += amount;
    } else {
      projectionDays[key].payroll += amount;
    }
  });

  // Calculate running balance and sort by date
  const sortedDays = Object.values(projectionDays)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedDays.forEach((day) => {
    runningBalance += day.invoicePayment - day.payroll - day.creditCardPayment;
    day.balance = runningBalance;
  });

  return sortedDays;
};

const ImprovedCashFlow = ({ startingBalance = 0 }) => {
  const [projections, setProjections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/sheets');
        if (!response.ok) throw new Error(`API failed with status ${response.status}`);
        
        const responseData = await response.json();
        const processedProjections = generateProjections(
          responseData.rawData?.invoices || [],
          responseData.rawData?.payroll || [],
          startingBalance
        );
        setProjections(processedProjections);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [startingBalance]);

  const toggleRowExpansion = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getBalanceColor = (balance) => {
    if (balance >= 100000) return 'text-green-600';
    if (balance >= 50000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartData = projections.map(day => ({
    name: format(new Date(day.date), 'MMM dd'),
    balance: day.balance,
   
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalInflows = projections.reduce((sum, day) => sum + day.invoicePayment, 0);
  const totalOutflows = projections.reduce((sum, day) => sum + day.payroll + day.creditCardPayment, 0);
  const finalBalance = projections[projections.length - 1]?.balance || startingBalance;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header Section with Summary Metrics */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow Projections</h3>
          <span className="text-sm text-gray-500">30-Day Forecast</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-600 font-medium">Starting Balance</div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(startingBalance)}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-600 font-medium">Total Inflows</div>
              <ArrowUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(totalInflows)}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-600 font-medium">Total Outflows</div>
              <ArrowDown className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700 mt-2">{formatCurrency(totalOutflows)}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-purple-600 font-medium">Projected Balance</div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${getBalanceColor(finalBalance)}`}>
              {formatCurrency(finalBalance)}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                name="Balance"
              />
              <Line 
                type="monotone" 
                dataKey="inflows" 
                stroke="#16a34a" 
                strokeWidth={2}
                dot={false}
                name="Inflows"
              />
              <Line 
                type="monotone" 
                dataKey="outflows" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={false}
                name="Outflows"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Payment</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Card Payment</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projections.map((day, index) => {
              const isExpanded = expandedRows.has(index);
              const hasDetails = day.inflows.length > 0 || day.outflows.length > 0;

              return (
                <React.Fragment key={index}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${day.balance < 50000 ? 'bg-red-50' : ''}`}
                    onClick={() => hasDetails && toggleRowExpansion(index)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {hasDetails && (
                          <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
                        )}
                        {format(new Date(day.date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {day.invoicePayment > 0 && formatCurrency(day.invoicePayment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                      {day.payroll > 0 && formatCurrency(day.payroll)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                      {day.creditCardPayment > 0 && formatCurrency(day.creditCardPayment)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getBalanceColor(day.balance)}`}>
                      {formatCurrency(day.balance)}
                    </td>
                  </tr>
                  {isExpanded && hasDetails && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-8 py-3">
                        <div className="text-sm space-y-1">
                          {day.inflows.map((inflow, i) => (
                            <div key={`inflow-${i}`} className="text-green-600">
                              + {inflow.network}: {formatCurrency(inflow.amount)}
                            </div>
                          ))}
                          {day.outflows.map((outflow, i) => (
                            <div key={`outflow-${i}`} className="text-red-600">
                              - {outflow.type}: {outflow.description} ({formatCurrency(outflow.amount)})
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImprovedCashFlow;