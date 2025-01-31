import React, { useState, useMemo } from 'react';
import { format, addDays, parseISO, startOfDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import _ from 'lodash';
import Link from 'next/link';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

const ProjectionRow = ({ day, isExpanded, onToggle }) => {
  const dayInflows = _.sumBy(day.inflows, 'amount') || 0;
  const dayOutflows = _.sumBy(day.outflows, 'amount') || 0;
  const net = dayInflows - dayOutflows;
  const hasDetails = day.inflows.length > 0 || day.outflows.length > 0;

  return (
    <>
      <tr className={day.balance < 0 ? 'bg-red-50' : ''}>
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="flex items-center">
            {hasDetails && (
              <button onClick={() => onToggle()} className="mr-2">
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                }
              </button>
            )}
            {format(day.date, 'MMM dd, yyyy')}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-right text-green-600">
          {dayInflows > 0 && formatCurrency(dayInflows)}
        </td>
        <td className="px-6 py-4 text-sm text-right text-red-600">
          {dayOutflows > 0 && formatCurrency(dayOutflows)}
        </td>
        <td className={`px-6 py-4 text-sm text-right ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(net)}
        </td>
        <td className={`px-6 py-4 text-sm font-medium text-right ${
          day.balance >= 0 ? 'text-gray-900' : 'text-red-600'
        }`}>
          {formatCurrency(day.balance)}
        </td>
      </tr>
      {isExpanded && hasDetails && (
        <tr className="bg-gray-50">
          <td colSpan="5" className="px-6 py-2">
            <div className="text-xs space-y-1">
              {day.inflows.map((inflow, idx) => (
                <div key={idx} className="text-green-600">
                  + {inflow.type}: {inflow.description} ({formatCurrency(inflow.amount)})
                </div>
              ))}
              {day.outflows.map((outflow, idx) => (
                <div key={idx} className="text-red-600">
                  - {outflow.type}: {outflow.description} ({formatCurrency(outflow.amount)})
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const CashFlowProjection = ({ projectionData }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const projections = useMemo(() => {
    if (!projectionData) return [];

    const today = startOfDay(new Date());
    const dailyProjections = [];
    let runningBalance = projectionData.currentBalance || 0;

    console.log('Starting balance:', runningBalance);
    console.log('Raw payroll data:', projectionData.payrollData);
    console.log('Raw invoice data:', projectionData.invoices);

    // Process payroll data
    const payrollOutflows = (projectionData.payrollData || [])
      .filter(entry => {
        console.log('Processing payroll entry:', entry);
        const isValid = 
          entry.Type === 'payroll' && 
          entry.Amount && 
          entry.DueDate;
        if (!isValid) {
          console.log('Skipping invalid payroll entry:', entry);
        }
        return isValid;
      })
      .map(entry => {
        const mappedEntry = {
          description: entry.Description || 'Payroll Payment',
          amount: parseAmount(entry.Amount),
          dueDate: new Date(entry.DueDate)
        };
        console.log('Mapped payroll entry:', mappedEntry);
        return mappedEntry;
      });

    // Process credit card payments
    const creditCardPayments = (projectionData.payrollData || [])
      .filter(entry => {
        console.log('Processing credit card entry:', entry);
        const isValid = 
          entry.Type === 'credit' && 
          entry.Amount && 
          entry.DueDate;
        if (!isValid) {
          console.log('Skipping invalid credit card entry:', entry);
        }
        return isValid;
      })
      .map(entry => {
        const mappedEntry = {
          description: entry.Description,
          amount: parseAmount(entry.Amount),
          dueDate: new Date(entry.DueDate)
        };
        console.log('Mapped credit card entry:', mappedEntry);
        return mappedEntry;
      });

    // Process invoices
    const incomingPayments = (projectionData.invoices || [])
      .filter(invoice => {
        console.log('Processing invoice:', invoice);
        const isValid = 
          invoice.Amount && 
          invoice.DueDate && 
          new Date(invoice.DueDate) >= today;
        if (!isValid) {
          console.log('Skipping invalid invoice:', invoice);
        }
        return isValid;
      })
      .map(invoice => {
        const mappedInvoice = {
          description: invoice.Network,
          amount: parseAmount(invoice.Amount),
          dueDate: new Date(invoice.DueDate),
          periodRange: `${invoice.PeriodStart} - ${invoice.PeriodEnd}`
        };
        console.log('Mapped invoice:', mappedInvoice);
        return mappedInvoice;
      });

    console.log('Final processed data:', {
      payrollOutflows,
      creditCardPayments,
      incomingPayments
    });

    // Calculate daily projections
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dailyProjection = {
        date,
        inflows: [],
        outflows: [],
        balance: 0
      };

      // Add incoming payments for this day
      incomingPayments
        .filter(payment => {
          const paymentDate = startOfDay(payment.dueDate);
          const projectionDate = startOfDay(date);
          console.log('Date comparison:', {
            payment: payment.description,
            paymentDate: paymentDate.toISOString(),
            projectionDate: projectionDate.toISOString(),
            matches: paymentDate.getTime() === projectionDate.getTime()
          });
          return paymentDate.getTime() === projectionDate.getTime();
        })
        .forEach(payment => {
          console.log('Adding payment to projection:', payment);
          dailyProjection.inflows.push({
            type: 'Network Payment',
            description: `${payment.description} (${payment.periodRange})`,
            amount: payment.amount
          });
        });

      // Add payroll expenses
      payrollOutflows
        .filter(expense => startOfDay(expense.dueDate).getTime() === date.getTime())
        .forEach(expense => {
          dailyProjection.outflows.push({
            type: 'Payroll',
            description: expense.description,
            amount: expense.amount
          });
        });

      // Add credit card payments
      creditCardPayments
        .filter(payment => startOfDay(payment.dueDate).getTime() === date.getTime())
        .forEach(payment => {
          dailyProjection.outflows.push({
            type: 'Credit Card',
            description: payment.description,
            amount: payment.amount
          });
        });

      // Calculate daily balance
      const dayInflows = _.sumBy(dailyProjection.inflows, 'amount') || 0;
      const dayOutflows = _.sumBy(dailyProjection.outflows, 'amount') || 0;
      runningBalance += dayInflows - dayOutflows;
      dailyProjection.balance = runningBalance;

      dailyProjections.push(dailyProjection);
    }

    return dailyProjections;
  }, [projectionData]);

  const totalInflows = _.sumBy(projections, day => 
    _.sumBy(day.inflows, 'amount')
  ) || 0;

  const totalOutflows = _.sumBy(projections, day => 
    _.sumBy(day.outflows, 'amount')
  ) || 0;

  const chartData = projections.map(day => ({
    name: format(day.date, 'MMM dd'),
    balance: day.balance
  }));

  // Calculate overdue invoices
  const overdueInvoices = useMemo(() => {
    const today = startOfDay(new Date());
    return (projectionData.invoices || [])
      .filter(invoice => 
        invoice.Amount && 
        invoice.DueDate && 
        new Date(invoice.DueDate) < today
      )
      .map(invoice => ({
        network: invoice.Network,
        amount: parseAmount(invoice.Amount),
        dueDate: new Date(invoice.DueDate),
        periodRange: `${invoice.PeriodStart} - ${invoice.PeriodEnd}`
      }));
  }, [projectionData.invoices]);

  const totalOverdue = _.sumBy(overdueInvoices, 'amount') || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Available Cash</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(projectionData?.currentBalance || 0)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Expected Inflows</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalInflows)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Expected Outflows</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOutflows)}</p>
        </div>
        {overdueInvoices.length > 0 && (
          <Link 
            href="?tab=invoices" 
            className="bg-red-50 rounded-lg p-4 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <p className="text-sm text-red-600 font-medium">Overdue Invoices</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(totalOverdue)}
            </p>
            <p className="text-sm text-red-600 mt-1">
              {overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''} overdue
            </p>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-Day Balance Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  width={100}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Projected Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inflows</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outflows</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projections.map((day, index) => (
                  <ProjectionRow
                    key={index}
                    day={day}
                    isExpanded={expandedRows.has(index)}
                    onToggle={() => toggleRow(index)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowProjection;