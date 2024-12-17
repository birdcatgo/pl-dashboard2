import React, { useState, useEffect } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CashSituation = ({ cashManagementData }) => {
  const { financialResources } = cashManagementData;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Cash Available</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(financialResources.totalCash)}</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total Credit Available</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(financialResources.totalCreditAvailable)}</p>
        </div>
      </div>
    </div>
  );
};

export const MediaBuyerSpend = ({ onSpendChange, totalAvailableFunds }) => {
  const [spendAmounts, setSpendAmounts] = useState(() => ({
    'Zel': 2000,
    'Daniel': 15000,
    'Mike': 10000,
    'Dave': 2000,
    'Asheesh': 10000
  }));

  const buyers = [
    { name: 'Zel', averageSpend: 2000 },
    { name: 'Daniel', averageSpend: 15000 },
    { name: 'Mike', averageSpend: 10000 },
    { name: 'Dave', averageSpend: 2000 },
    { name: 'Asheesh', averageSpend: 10000 }
  ];

  const handleSpendChange = (buyerName, rawValue) => {
    const value = rawValue.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(value) || 0;
    const newSpends = { ...spendAmounts, [buyerName]: numericValue };
    setSpendAmounts(newSpends);
    onSpendChange(newSpends);
  };

  const formatInputValue = value => {
    if (!value) return '';
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US');
  };

  const totalAverageSpend = buyers.reduce((sum, buyer) => sum + buyer.averageSpend, 0);
  const totalNewSpend = Object.values(spendAmounts).reduce((sum, spend) => sum + (spend || 0), 0);
  const averageDaysOfCoverage = Math.floor(totalAvailableFunds / totalAverageSpend);
  const newDaysOfCoverage = Math.floor(totalAvailableFunds / totalNewSpend);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Media Buyer Daily Spend</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average Daily Spend</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Spend Scenario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {buyers.map((buyer) => (
              <tr key={buyer.name}>
                <td className="px-6 py-4 text-sm text-gray-900">{buyer.name}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(buyer.averageSpend)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <div className="relative w-32">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                      <input
                        type="text"
                        value={formatInputValue(spendAmounts[buyer.name])}
                        onChange={(e) => handleSpendChange(buyer.name, e.target.value)}
                        className="form-input rounded-md border-gray-300 w-full text-right pl-8"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr className="text-lg font-bold">
              <td className="px-6 py-4 text-gray-900">Total Daily Spend</td>
              <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(totalAverageSpend)}</td>
              <td className="px-6 py-4 text-center text-gray-900">{formatCurrency(totalNewSpend)}</td>
            </tr>
            <tr className="text-lg font-bold text-blue-600">
              <td className="px-6 py-4">Days of Coverage</td>
              <td className="px-6 py-4 text-right">{averageDaysOfCoverage} days</td>
              <td className="px-6 py-4 text-center">{newDaysOfCoverage} days</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export const NetworkPaymentSchedule = ({ networkData }) => {
  const defaultData = [
    { network: 'Suited', terms: 'Net 5 weekly', cap: 100000, exposure: 19475 },
    { network: 'TLG', terms: 'Net 10 weekly', cap: 101500, exposure: 55428 },
    { network: 'Pure Ads', terms: 'Net 15 bi monthly', cap: 7600, exposure: 49362 },
    { network: 'Transparent', terms: 'Net 15 bi monthly', cap: 8160, exposure: 37083 },
    { network: 'Leadnomic', terms: 'Net 5 weekly', cap: 300000, exposure: 4213 },
    { network: 'Wisdom', terms: 'Net 30', cap: 1200, exposure: 1137 },
    { network: 'Lead Econ', terms: 'Net 8 weekly', cap: 1000, exposure: 5723 },
    { network: 'ACA', terms: 'Net 5 weekly', cap: 100000, exposure: 837 }
  ];

  const data = networkData?.length > 0 ? networkData : defaultData;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Network Payment Schedule</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Exposure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((network, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{network.network}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.cap)}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.exposure)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{network.terms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const OutstandingInvoices = ({ invoices }) => {
  const today = startOfDay(new Date());
  const invoiceEntries = Object.entries(invoices || {})
    .filter(([key, value]) => key !== 'Total Outstanding' && value['Amount Due'] && value['Date Due']);

  if (!invoiceEntries.length) return null;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Outstanding Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoiceEntries.map(([network, details], index) => {
              const dueDate = new Date(details['Date Due']);
              const isOverdue = isBefore(dueDate, today);
              const amount = parseFloat(details['Amount Due']?.replace(/[\$,]/g, '') || 0);

              return (
                <tr key={index} className={isOverdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm text-gray-900">{network}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(amount)}</td>
                  <td className="px-6 py-4 text-sm">{format(dueDate, 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const UpcomingExpenses = ({ expenses }) => {
  if (!expenses?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Expenses</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.type}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(expense.amount)}</td>
                <td className="px-6 py-4 text-sm">{format(new Date(expense.dueDate), 'MMM d, yyyy')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{expense.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};