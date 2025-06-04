import React from 'react';
import { Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import NetProfit from '../NetProfit';
import ImprovedPLDashboard from '../ImprovedPLDashboard';
import MediaBuyerPL from '../MediaBuyerPL';
import CreditLine from '../CreditLine';

const ProfitMetricsView = ({ 
  accountingSubview, 
  setAccountingSubview, 
  performanceData, 
  dateRange, 
  cashFlowData, 
  networkTermsData,
  plData,
  invoiceData,
  expenseData,
  isRefreshing,
  error
}) => {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Profit Metrics" 
        subtitle="Financial performance analysis across different views"
        icon={Calculator}
      />
      
      {/* Profit Metrics Subviews Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="space-y-6">
          <div className="flex space-x-4">
            <Button
              variant={accountingSubview === 'net-profit' ? 'default' : 'outline'}
              onClick={() => setAccountingSubview('net-profit')}
              className={`flex items-center ${
                accountingSubview === 'net-profit' 
                  ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' 
                  : 'hover:bg-purple-50'
              }`}
            >
              🔮 Forecasting View
            </Button>
            <Button
              variant={accountingSubview === 'pl' ? 'default' : 'outline'}
              onClick={() => setAccountingSubview('pl')}
              className={`flex items-center ${
                accountingSubview === 'pl' 
                  ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
                  : 'hover:bg-blue-50'
              }`}
            >
              💵 Cash View (Money In/Out)
            </Button>
            <Button
              variant={accountingSubview === 'media-buyer-pl' ? 'default' : 'outline'}
              onClick={() => setAccountingSubview('media-buyer-pl')}
              className={`flex items-center ${
                accountingSubview === 'media-buyer-pl' 
                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                  : 'hover:bg-green-50'
              }`}
            >
              📊 Performance View
            </Button>
            <Button
              variant={accountingSubview === 'credit-line' ? 'default' : 'outline'}
              onClick={() => setAccountingSubview('credit-line')}
              className={`flex items-center ${
                accountingSubview === 'credit-line' 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' 
                  : 'hover:bg-yellow-50'
              }`}
            >
              💳 Credit Line & Budget Manager
            </Button>
          </div>

          {/* View Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            {accountingSubview === 'net-profit' && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Predicts future performance based on trends, targets, and expected spend.
                  Use this to plan ahead — it estimates future profit based on current ROI, average daily revenue, and projected ad spend. Great for tracking whether we're on pace to hit monthly goals.
                </p>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Includes:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Revenue projections (daily, weekly, EOM)</li>
                    <li>Spend forecasts</li>
                    <li>Estimated commissions and payouts</li>
                    <li>Expected profit margin</li>
                  </ul>
                </div>
              </div>
            )}
            {accountingSubview === 'pl' && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Tracks actual money that has come in and gone out.
                  This is our true Profit & Loss — what we've actually received from networks and what we've actually paid (ad spend, commissions, SaaS tools, etc). It reflects bank balance reality, not just earned figures.
                </p>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Includes:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Revenue received this month</li>
                    <li>All business expenses paid</li>
                    <li>Net profit (cash-based)</li>
                    <li>Breakeven tracking</li>
                  </ul>
                </div>
              </div>
            )}
            {accountingSubview === 'media-buyer-pl' && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Shows how much revenue we've earned based on delivered leads — regardless of payment timing.
                  This reflects how our campaigns are performing, not whether we've been paid yet. It's useful for ROI decisions, buyer tracking, and scaling.
                </p>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Includes:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Earned revenue (accrual-based)</li>
                    <li>Spend to generate it</li>
                    <li>Commission-adjusted profit</li>
                    <li>ROI and profit per campaign/media buyer</li>
                  </ul>
                </div>
              </div>
            )}
            {accountingSubview === 'credit-line' && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Real-time view of available cash, credit limits, daily spend, and safe spending thresholds. Helps protect your ad accounts while maximizing growth.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {accountingSubview === 'net-profit' && (
          <NetProfit
            performanceData={performanceData?.data || []}
            dateRange={dateRange}
            cashFlowData={{
              ...cashFlowData,
              networkTerms: networkTermsData
            }}
          />
        )}
        {accountingSubview === 'pl' && (
          <ImprovedPLDashboard 
            plData={plData}
            summaryData={plData?.summary || []}
          />
        )}
        {accountingSubview === 'media-buyer-pl' && (
          <MediaBuyerPL performanceData={performanceData?.data || []} />
        )}
        {accountingSubview === 'credit-line' && (
          <CreditLine 
            data={{
              performanceData: performanceData?.data || [],
              invoicesData: invoiceData,
              cashFlowData,
              payrollData: expenseData
            }}
            loading={isRefreshing}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default ProfitMetricsView; 