import React from 'react';
import { RefreshCw } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

const FinancialOverviewBox = ({ 
  cashInBank = 0,
  creditCardDebt = 0,
  outstandingInvoices = 0,
  networkExposure = 0,
  onRefresh
}) => {
  // Debug logging
  console.log('FinancialOverviewBox received props:', {
    cashInBank,
    creditCardDebt,
    outstandingInvoices,
    networkExposure
  });

  // Calculate potential bottom line, treating undefined/null as 0
  const safeValue = (val) => (val === null || val === undefined || isNaN(val)) ? 0 : Number(val);
  const potentialBottomLine = safeValue(cashInBank) + safeValue(outstandingInvoices) - safeValue(creditCardDebt);

  console.log('FinancialOverviewBox calculated values:', {
    potentialBottomLine,
    safeCashInBank: safeValue(cashInBank),
    safeOutstandingInvoices: safeValue(outstandingInvoices),
    safeCreditCardDebt: safeValue(creditCardDebt)
  });

  const currentDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
            <p className="text-sm text-gray-600">Current Financial Position</p>
            <p className="text-xs text-gray-500">Real-time snapshot of your financial status</p>
          </div>
          <button 
            onClick={onRefresh}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Live Data</span>
            <span className="text-gray-400">{currentDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Cash In Bank</div>
            <div className="text-xl font-bold text-green-700 mt-1">{formatCurrency(cashInBank)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-800">Credit Card Debt</div>
            <div className="text-xl font-bold text-red-700 mt-1">{formatCurrency(creditCardDebt)}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Outstanding Invoices</div>
            <div className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(outstandingInvoices)}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-800">Network Exposure</div>
            <div className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(networkExposure)}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900">Potential Bottom Line</div>
            <div className="text-sm text-gray-600">If all outstanding invoices were collected and credit cards cleared</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-6">{formatCurrency(potentialBottomLine)}</div>
          
          <div className="text-sm space-y-3">
            <div className="text-gray-700 font-medium">Based on:</div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-gray-600">+ Current Cash:</span>
              <span className="font-medium text-green-600">{formatCurrency(cashInBank)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-gray-600">+ Outstanding Invoices:</span>
              <span className="font-medium text-blue-600">{formatCurrency(outstandingInvoices)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-gray-600">- Credit Card Debt:</span>
              <span className="font-medium text-red-600">{formatCurrency(creditCardDebt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverviewBox; 