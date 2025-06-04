import React from 'react';
import { Brain } from 'lucide-react';
import PageHeader from '../../ui/PageHeader';

const DashboardIndexView = ({ setActiveTab, setAccountingSubview, setAccountsSubview, setReportingSubview, setContractorSubview, setToolsSubview }) => {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard Index" 
        subtitle="Quick access to all dashboard views and features"
        icon={Brain}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profit Metrics Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Profit Metrics</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('accounting');
                setAccountingSubview('net-profit');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🔮</span>
                <div>
                  <h3 className="font-medium">Net Profit</h3>
                  <p className="text-sm text-gray-600">Predicts future performance based on trends and targets</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounting');
                setAccountingSubview('pl');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💵</span>
                <div>
                  <h3 className="font-medium">Cash View (Money In/Out)</h3>
                  <p className="text-sm text-gray-600">Track actual money received and paid</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounting');
                setAccountingSubview('media-buyer-pl');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-medium">Performance View</h3>
                  <p className="text-sm text-gray-600">Revenue earned based on delivered leads</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounting');
                setAccountingSubview('credit-line');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="font-medium">Credit Line & Budget Manager</h3>
                  <p className="text-sm text-gray-600">Monitor credit limits and spending thresholds</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('invoices');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="font-medium">Invoices (Receivable)</h3>
                  <p className="text-sm text-gray-600">Track and manage incoming payments</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('expenses');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="font-medium">Upcoming Expenses (Payable)</h3>
                  <p className="text-sm text-gray-600">Manage and track outgoing payments</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('expense-overview');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-medium">Expense Overview</h3>
                  <p className="text-sm text-gray-600">Analyze expense patterns and categories</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('expense-review');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-medium">Expense Review</h3>
                  <p className="text-sm text-gray-600">Review and analyze expenses</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('tradeshift-review');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-medium">Tradeshift Review</h3>
                  <p className="text-sm text-gray-600">Review and analyze tradeshift data</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('commissions');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💸</span>
                <div>
                  <h3 className="font-medium">Commission Payments</h3>
                  <p className="text-sm text-gray-600">Track and manage commission payouts</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('cash-flow-planner');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-medium">Cash Flow Planner</h3>
                  <p className="text-sm text-gray-600">Plan and manage cash flow</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                setAccountsSubview('network-pay-terms');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🌐</span>
                <div>
                  <h3 className="font-medium">Network Pay Terms</h3>
                  <p className="text-sm text-gray-600">Manage network payment terms and exposure</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Reporting Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Reporting</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('reporting');
                setReportingSubview('eod-report');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-medium">EOD Report</h3>
                  <p className="text-sm text-gray-600">Daily performance summary and analysis</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('reporting');
                setReportingSubview('offer-performance');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📈</span>
                <div>
                  <h3 className="font-medium">Offer Performance</h3>
                  <p className="text-sm text-gray-600">Track offer metrics and network caps</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('reporting');
                setReportingSubview('media-buyers');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">👥</span>
                <div>
                  <h3 className="font-medium">Media Buyers</h3>
                  <p className="text-sm text-gray-600">Media buyer performance and challenges</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('reporting');
                setReportingSubview('highlights');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-medium">Highlights</h3>
                  <p className="text-sm text-gray-600">Key performance highlights and insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Contractor Information Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Contractor Information</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('contractor-info');
                setContractorSubview('contracts');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📝</span>
                <div>
                  <h3 className="font-medium">Contractor Contracts</h3>
                  <p className="text-sm text-gray-600">Manage and download contracts for contractors</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('contractor-info');
                setContractorSubview('nda');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🔒</span>
                <div>
                  <h3 className="font-medium">NDA Template</h3>
                  <p className="text-sm text-gray-600">Non-Disclosure Agreement for contractors</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('contractor-info');
                setContractorSubview('media-buyer');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-medium">Media Buyer Agreement</h3>
                  <p className="text-sm text-gray-600">Contract template for media buyers</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('contractor-info');
                setContractorSubview('30-day');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-medium">30 Day Contract</h3>
                  <p className="text-sm text-gray-600">First 30 days agreement template</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('contractor-info');
                setContractorSubview('post-30-day');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📆</span>
                <div>
                  <h3 className="font-medium">Post 30 Day Contract</h3>
                  <p className="text-sm text-gray-600">Contract template after initial 30 days</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Tools</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('daily-update');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📝</span>
                <div>
                  <h3 className="font-medium">Daily Updates</h3>
                  <p className="text-sm text-gray-600">Create and send slack updates</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('daily-pl-update');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-medium">Daily P&L Update</h3>
                  <p className="text-sm text-gray-600">Track and report daily P&L</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('ad-accounts');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🎯</span>
                <div>
                  <h3 className="font-medium">Ad Accounts</h3>
                  <p className="text-sm text-gray-600">Manage and monitor ad accounts</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('timezone');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">⏰</span>
                <div>
                  <h3 className="font-medium">Timezone Converter</h3>
                  <p className="text-sm text-gray-600">Convert between NZT and PST</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('cash-flow-planner');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="font-medium">Cash Flow Planner</h3>
                  <p className="text-sm text-gray-600">Plan and manage cash flow</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubview('network-pay-terms');
              }}
              className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🌐</span>
                <div>
                  <h3 className="font-medium">Network Pay Terms</h3>
                  <p className="text-sm text-gray-600">Manage network payment terms and exposure</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIndexView; 