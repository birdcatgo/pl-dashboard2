import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, Briefcase } from 'lucide-react';

const CashPosition = ({ cashFlowData, networkPaymentsData, invoicesData = [] }) => {
  // Add debug logging
  console.log('CashPosition received:', {
    cashFlowData,
    networkPaymentsData,
    invoicesData: invoicesData || []
  });

  console.log('Invoice Data:', networkPaymentsData?.map(invoice => ({
    network: invoice.Network,
    amount: invoice.Amount,
    status: invoice.Status,
    periodStart: invoice.PeriodStart,
    periodEnd: invoice.PeriodEnd
  })));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get cash in bank from financial resources
  const cashInBank = cashFlowData?.financialResources?.reduce((total, resource) => {
    const balance = parseFloat(resource.available?.toString().replace(/[$,]/g, '') || '0');
    const isCash = resource.account?.toLowerCase().includes('cash') || 
                  resource.account?.toLowerCase().includes('savings');
    return isCash ? total + balance : total;
  }, 0) || 0;

  // Calculate total credit card debt
  const totalCreditCardDebt = cashFlowData?.financialResources?.reduce((total, resource) => {
    if (!resource.limit || !resource.available) return total;
    const limit = parseFloat(resource.limit.toString().replace(/[$,]/g, ''));
    const available = parseFloat(resource.available.toString().replace(/[$,]/g, ''));
    return resource.limit > 0 ? total + (limit - available) : total;
  }, 0) || 0;

  // Ensure invoicesData is an array
  const validInvoices = Array.isArray(invoicesData) ? invoicesData : [];

  // Calculate total unpaid invoices
  const totalUnpaidInvoices = validInvoices.reduce((total, invoice) => {
    if (invoice?.Status === 'Unpaid') {
      return total + (parseFloat(invoice.Amount) || 0);
    }
    return total;
  }, 0);

  // Fixed monthly expenses
  const averageMonthlyExpenses = 65000;

  // Calculate net position
  const totalCredits = cashInBank + totalUnpaidInvoices;
  const totalOwing = totalCreditCardDebt + averageMonthlyExpenses;
  const netPosition = totalCredits - totalOwing;

  // Add these calculations after the existing ones
  const today = new Date();

  // Split invoices into overdue and upcoming
  const { overdueInvoices, upcomingInvoices, totalOverdue, totalUpcoming } = validInvoices
    .filter(invoice => invoice?.Status === 'Unpaid')
    .reduce((acc, invoice) => {
      const dueDate = new Date(invoice.DueDate);
      const amount = parseFloat(invoice.Amount) || 0;
      
      if (dueDate < today) {
        acc.overdueInvoices.push(invoice);
        acc.totalOverdue += amount;
      } else {
        acc.upcomingInvoices.push(invoice);
        acc.totalUpcoming += amount;
      }
      
      return acc;
    }, { 
      overdueInvoices: [], 
      upcomingInvoices: [], 
      totalOverdue: 0, 
      totalUpcoming: 0 
    });

  return (
    <div className="space-y-6">
      {/* Net Position Card */}
      <Card className={`border-l-4 ${netPosition >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6" />
              <span>Net Position</span>
            </div>
            <span className={`text-3xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netPosition)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Credits Breakdown */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 mb-2">Total Credits</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash in Bank</span>
                  <span>{formatCurrency(cashInBank)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue Invoices</span>
                  <span>{formatCurrency(totalOverdue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Upcoming Invoices</span>
                  <span>{formatCurrency(totalUpcoming)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-green-700">{formatCurrency(totalCredits)}</span>
                </div>
              </div>
            </div>

            {/* Owing Breakdown */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 mb-2">Total Owing</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Card Debt</span>
                  <span>{formatCurrency(totalCreditCardDebt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Expenses</span>
                  <span>{formatCurrency(averageMonthlyExpenses)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-200">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-red-700">{formatCurrency(totalOwing)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credits Section */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Credits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cash and Invoices Summary */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <span>Total Cash</span>
                </div>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(cashInBank)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <span>Overdue Invoices</span>
                </div>
                <span className="text-lg font-semibold text-red-600">{formatCurrency(totalOverdue)}</span>
              </div>

              <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Upcoming Invoices</span>
                </div>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(totalUpcoming)}</span>
              </div>
            </div>

            {/* Unpaid Invoices Details */}
            <div>
              {overdueInvoices.length > 0 && (
                <>
                  <div className="flex items-center space-x-2 mb-3 text-lg font-medium">
                    <Calendar className="h-5 w-5 text-red-500" />
                    <span>Overdue Invoices</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {overdueInvoices.map((invoice, index) => (
                      <div key={index} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.Network}</span>
                          <span className="text-sm text-red-600">Due: {invoice.DueDate}</span>
                        </div>
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(parseFloat(invoice.Amount) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {upcomingInvoices.length > 0 && (
                <>
                  <div className="flex items-center space-x-2 mb-3 text-lg font-medium">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>Upcoming Invoices</span>
                  </div>
                  <div className="space-y-2">
                    {upcomingInvoices.map((invoice, index) => (
                      <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.Network}</span>
                          <span className="text-sm text-gray-500">Due: {invoice.DueDate}</span>
                        </div>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(parseFloat(invoice.Amount) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Owing Section */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span>Owing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credit Card Debt */}
            <div>
              <div className="flex items-center space-x-2 mb-3 text-lg font-medium">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <span>Credit Card Debt</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <span>Total Credit Card Debt</span>
                <span className="text-lg font-semibold text-red-600">{formatCurrency(totalCreditCardDebt)}</span>
              </div>
            </div>

            {/* Monthly Expenses */}
            <div>
              <div className="flex items-center space-x-2 mb-3 text-lg font-medium">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span>Monthly Expenses</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <span>Average Monthly</span>
                <span className="text-lg font-semibold text-red-600">{formatCurrency(averageMonthlyExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashPosition; 