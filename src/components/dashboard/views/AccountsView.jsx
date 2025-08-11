import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import InvoicesTable from '../InvoicesTable';
import UpcomingExpensesTable from '../UpcomingExpensesTable';
import ExpenseOverview from '../ExpenseOverview';
import ExpenseReview from '../ExpenseReview';
import TradeshiftReview from '../TradeshiftReview';
import CommissionPayments from '../CommissionPayments';

const AccountsView = ({ 
  accountsSubview, 
  setAccountsSubview,
  invoiceData,
  expenseData,
  plData,
  cashFlowData,
  networkTermsData,
  tradeshiftData,
  performanceData,
  employeeData
}) => {
  // Debug logging
  console.log('AccountsView props:', {
    accountsSubview,
    invoiceDataLength: invoiceData?.length || 0,
    expenseDataLength: expenseData?.length || 0,
    plDataKeys: plData ? Object.keys(plData) : [],
    cashFlowDataKeys: cashFlowData ? Object.keys(cashFlowData) : [],
    networkTermsDataLength: networkTermsData?.length || 0,
    tradeshiftDataLength: tradeshiftData?.length || 0,
    performanceDataKeys: performanceData ? Object.keys(performanceData) : [],
    employeeDataLength: employeeData?.length || 0
  });
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Accounts Receivable & Payable" 
        subtitle="Track and manage invoices, expenses, and financial obligations"
        icon={FileText}
      />
      
      {/* Accounts Subviews Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex space-x-4">
          <Button
            variant={accountsSubview === 'invoices' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('invoices')}
          >
            Invoices
          </Button>
          <Button
            variant={accountsSubview === 'expenses' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('expenses')}
          >
            Upcoming Expenses
          </Button>
          <Button
            variant={accountsSubview === 'expense-overview' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('expense-overview')}
          >
            Expense Overview
          </Button>
          <Button
            variant={accountsSubview === 'expense-review' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('expense-review')}
          >
            Expense Review
          </Button>
          <Button
            variant={accountsSubview === 'tradeshift-review' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('tradeshift-review')}
          >
            Tradeshift Review
          </Button>
          <Button
            variant={accountsSubview === 'commissions' ? 'default' : 'outline'}
            onClick={() => setAccountsSubview('commissions')}
          >
            Commissions
          </Button>
        </div>
      </div>

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {accountsSubview === 'invoices' && (
          <InvoicesTable data={invoiceData || []} />
        )}
        {accountsSubview === 'expenses' && (
          <UpcomingExpensesTable data={expenseData || []} />
        )}
        {accountsSubview === 'expense-overview' && (
          <ExpenseOverview 
            plData={plData}
            cashFlowData={cashFlowData}
            invoicesData={invoiceData}
            networkTerms={networkTermsData || []}
          />
        )}
        {accountsSubview === 'expense-review' && (
          <ExpenseReview plData={plData} />
        )}
        {accountsSubview === 'tradeshift-review' && (
          <TradeshiftReview tradeshiftData={tradeshiftData || []} />
        )}
        {accountsSubview === 'commissions' && (
          <CommissionPayments 
            commissions={performanceData?.commissions || []} 
            employeeData={employeeData || []}
            performanceData={performanceData?.data || []}
          />
        )}
      </div>
    </div>
  );
};

export default AccountsView; 