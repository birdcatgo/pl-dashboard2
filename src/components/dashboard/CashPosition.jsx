import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

const CashPosition = ({ cashFlowData, networkPaymentsData, invoicesData }) => {
  // Process invoices data with better error handling
  const processedInvoices = useMemo(() => {
    if (!Array.isArray(invoicesData)) {
      console.warn('invoicesData is not an array:', invoicesData);
      return [];
    }
    
    const today = new Date();
    return invoicesData.map(invoice => {
      try {
        return {
          network: invoice.Network || 'Unknown Network',
          amount: parseFloat(String(invoice.Amount || 0).replace(/[$,]/g, '')) || 0,
          dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
          periodStart: invoice.PeriodStart ? new Date(invoice.PeriodStart) : null,
          periodEnd: invoice.PeriodEnd ? new Date(invoice.PeriodEnd) : null,
          invoiceNumber: invoice.InvoiceNumber || 'N/A',
          isOverdue: invoice.DueDate ? new Date(invoice.DueDate) < today : false
        };
      } catch (error) {
        console.error('Error processing invoice:', invoice, error);
        return null;
      }
    }).filter(Boolean).sort((a, b) => (a.dueDate || new Date()) - (b.dueDate || new Date()));
  }, [invoicesData]);

  // Separate overdue and upcoming invoices with better validation
  const { overdueInvoices, upcomingInvoices } = useMemo(() => {
    const today = new Date();
    return processedInvoices.reduce((acc, invoice) => {
      if (!invoice.dueDate) {
        console.warn('Invoice missing due date:', invoice);
        return acc;
      }
      if (invoice.dueDate < today) {
        acc.overdueInvoices.push(invoice);
      } else {
        acc.upcomingInvoices.push(invoice);
      }
      return acc;
    }, { overdueInvoices: [], upcomingInvoices: [] });
  }, [processedInvoices]);

  // Calculate totals with null checks
  const totals = useMemo(() => ({
    overdueTotal: overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    upcomingTotal: upcomingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  }), [overdueInvoices, upcomingInvoices]);

  // Get cash in bank with improved account detection
  const cashInBank = useMemo(() => {
    if (!cashFlowData?.financialResources) {
      console.warn('No financial resources data available');
      return 0;
    }

    return cashFlowData.financialResources.reduce((total, resource) => {
      if (!resource.account || !resource.available) return total;
      
      const accountName = resource.account.toLowerCase();
      const isCash = accountName.includes('cash') || 
                    accountName.includes('savings') ||
                    accountName.includes('checking') ||
                    accountName.includes('bank');
      
      const balance = parseFloat(String(resource.available).replace(/[$,]/g, '')) || 0;
      return isCash ? total + balance : total;
    }, 0);
  }, [cashFlowData]);

  // Calculate total credit card debt with better validation
  const totalCreditCardDebt = useMemo(() => {
    if (!cashFlowData?.financialResources) return 0;

    return cashFlowData.financialResources.reduce((total, resource) => {
      if (!resource.account || !resource.limit || !resource.available) return total;
      
      const accountName = resource.account.toLowerCase();
      const isCreditCard = accountName.includes('credit') || 
                          accountName.includes('card') ||
                          accountName.includes('visa') ||
                          accountName.includes('mastercard');
      
      if (!isCreditCard) return total;

      const limit = parseFloat(String(resource.limit).replace(/[$,]/g, '')) || 0;
      const available = parseFloat(String(resource.available).replace(/[$,]/g, '')) || 0;
      return total + (limit - available);
    }, 0);
  }, [cashFlowData]);

  // Calculate average monthly expenses from actual data if available
  const averageMonthlyExpenses = useMemo(() => {
    if (!cashFlowData?.monthlyExpenses) {
      console.warn('No monthly expenses data available, using default');
      return 65000; // Default value if no data available
    }

    const expenses = Array.isArray(cashFlowData.monthlyExpenses) 
      ? cashFlowData.monthlyExpenses 
      : Object.values(cashFlowData.monthlyExpenses);

    if (expenses.length === 0) return 65000;

    const total = expenses.reduce((sum, expense) => {
      const amount = parseFloat(String(expense.amount || expense.AMOUNT || 0).replace(/[$,]/g, '')) || 0;
      return sum + amount;
    }, 0);

    return total / expenses.length;
  }, [cashFlowData]);

  // Calculate net position with null checks
  const totalCredits = cashInBank + (totals.overdueTotal || 0) + (totals.upcomingTotal || 0);
  const totalOwing = totalCreditCardDebt + averageMonthlyExpenses;
  const netPosition = totalCredits - totalOwing;

  // Add these calculations after the existing ones
  const today = new Date();

  // Add this function before the return statement
  const consolidateInvoices = (invoices) => {
    return Object.values(invoices.reduce((acc, invoice) => {
      const network = invoice.network;
      if (!acc[network]) {
        acc[network] = {
          Network: network,
          invoices: [],
          totalAmount: 0,
          earliestDueDate: new Date(invoice.dueDate),
          latestDueDate: new Date(invoice.dueDate)
        };
      }
      
      acc[network].invoices.push(invoice);
      acc[network].totalAmount += parseFloat(invoice.amount) || 0;
      
      const dueDate = new Date(invoice.dueDate);
      if (dueDate < acc[network].earliestDueDate) {
        acc[network].earliestDueDate = dueDate;
      }
      if (dueDate > acc[network].latestDueDate) {
        acc[network].latestDueDate = dueDate;
      }
      
      return acc;
    }, {}));
  };

  // Then update the Overdue and Upcoming sections to use the consolidated data
  const consolidatedOverdue = consolidateInvoices(overdueInvoices);
  const consolidatedUpcoming = consolidateInvoices(upcomingInvoices);

  // First, add these helper functions at the top with the other ones
  const groupCreditCards = (financialResources) => {
    return financialResources
      ?.filter(resource => !['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'].includes(resource.account))
      .map(card => ({
        name: card.account,
        limit: parseFloat(card.limit?.toString().replace(/[$,]/g, '') || '0'),
        available: parseFloat(card.available?.toString().replace(/[$,]/g, '') || '0'),
        owing: parseFloat(card.owing?.toString().replace(/[$,]/g, '') || '0'),
        utilization: card.limit ? ((card.limit - card.available) / card.limit * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.owing - a.owing) || [];
  };

  const monthlyExpenseCategories = [
    { name: 'Payroll', amount: 30000 },
    { name: 'Software & Tools', amount: 5000 },
    { name: 'Office & Utilities', amount: 3000 },
    { name: 'Marketing', amount: 15000 },
    { name: 'Professional Services', amount: 7000 },
    { name: 'Miscellaneous', amount: 5000 }
  ];

  return (
    <div className="space-y-6">
      {/* Net Position Card */}
      <Card className={`border-l-4 ${netPosition >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-xl">Net Position</span>
            </div>
            <span className={`text-2xl font-bold ml-4 ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  <span className="text-lg font-semibold text-green-600 ml-4">{formatCurrency(cashInBank)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue Invoices</span>
                  <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(totals.overdueTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Upcoming Invoices</span>
                  <span className="text-lg font-semibold text-green-600 ml-4">{formatCurrency(totals.upcomingTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-green-700 ml-4">{formatCurrency(totalCredits)}</span>
                </div>
              </div>
            </div>

            {/* Owing Breakdown */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 mb-2">Total Owing</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Card Debt</span>
                  <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(totalCreditCardDebt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Expenses</span>
                  <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(averageMonthlyExpenses)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-200">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-red-700 ml-4">{formatCurrency(totalOwing)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credits Section */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-lg font-semibold">Credits</span>
              </div>
              <span className="text-lg font-bold text-green-600 ml-4">
                {formatCurrency(totalCredits)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cash Summary */}
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-gray-500" />
                <span>Total Cash</span>
              </div>
              <span className="text-lg font-semibold text-green-600 ml-4">{formatCurrency(cashInBank)}</span>
            </div>

            {/* Invoice Summaries - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Overdue Summary */}
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <span>Overdue ({overdueInvoices.length})</span>
                </div>
                <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(totals.overdueTotal)}</span>
              </div>

              {/* Upcoming Summary */}
              <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Upcoming ({upcomingInvoices.length})</span>
                </div>
                <span className="text-lg font-semibold text-green-600 ml-4">{formatCurrency(totals.upcomingTotal)}</span>
              </div>
            </div>

            {/* Invoice Details - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Overdue Invoices Section */}
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium text-red-900">Overdue</h3>
                    </div>
                    <span className="font-medium text-red-600 ml-4">
                      {formatCurrency(totals.overdueTotal)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-red-100 max-h-[400px] overflow-y-auto">
                  {consolidatedOverdue.map((networkGroup, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-red-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {networkGroup.Network}
                            <span className="ml-2 text-sm text-red-600">
                              ({networkGroup.invoices.length} invoices)
                            </span>
                          </div>
                          <div className="text-sm text-red-600">
                            Due: {networkGroup.earliestDueDate.toLocaleDateString()}
                            {networkGroup.invoices.length > 1 && 
                              ` - ${networkGroup.latestDueDate.toLocaleDateString()}`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {networkGroup.invoices.map((inv, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span>#{inv.invoiceNumber}: {inv.periodStart?.toLocaleDateString()} - {inv.periodEnd?.toLocaleDateString()}</span>
                                <span className="ml-4">{formatCurrency(inv.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600 ml-4">
                            {formatCurrency(networkGroup.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total for {networkGroup.Network}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Invoices Section */}
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium text-green-900">Upcoming</h3>
                    </div>
                    <span className="font-medium text-green-600 ml-4">
                      {formatCurrency(totals.upcomingTotal)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-green-100 max-h-[400px] overflow-y-auto">
                  {consolidatedUpcoming.map((networkGroup, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-green-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {networkGroup.Network}
                            <span className="ml-2 text-sm text-green-600">
                              ({networkGroup.invoices.length} invoices)
                            </span>
                          </div>
                          <div className="text-sm text-green-600">
                            Due: {networkGroup.earliestDueDate?.toLocaleDateString()}
                            {networkGroup.invoices.length > 1 && 
                              ` - ${networkGroup.latestDueDate?.toLocaleDateString()}`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {networkGroup.invoices.map((inv, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span>#{inv.invoiceNumber}: {inv.periodStart?.toLocaleDateString()} - {inv.periodEnd?.toLocaleDateString()}</span>
                                <span className="ml-4">{formatCurrency(inv.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 ml-4">
                            {formatCurrency(networkGroup.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total for {networkGroup.Network}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owing Section */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span className="text-lg font-semibold">Owing</span>
              </div>
              <span className="text-lg font-bold text-red-600 ml-4">
                {formatCurrency(totalOwing)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Credit Card Summary */}
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-red-500" />
                  <span>Credit Cards</span>
                </div>
                <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(totalCreditCardDebt)}</span>
              </div>

              {/* Monthly Expenses Summary */}
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <span>Monthly Expenses</span>
                </div>
                <span className="text-lg font-semibold text-red-600 ml-4">{formatCurrency(averageMonthlyExpenses)}</span>
              </div>
            </div>

            {/* Detailed Sections - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Credit Card Details */}
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium text-red-900">Credit Cards</h3>
                    </div>
                    <span className="font-medium text-red-600 ml-4">
                      {formatCurrency(totalCreditCardDebt)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-red-100 max-h-[400px] overflow-y-auto">
                  {groupCreditCards(cashFlowData?.financialResources).map((card, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-red-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{card.name}</div>
                          <div className="text-xs text-gray-500">
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className="text-green-600 ml-4">{formatCurrency(card.available)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Limit:</span>
                              <span className="ml-4">{formatCurrency(card.limit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Utilization:</span>
                              <span className={`${card.utilization > 80 ? 'text-red-600' : 'text-gray-600'} ml-4`}>
                                {card.utilization}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600 ml-4">
                            {formatCurrency(card.owing)}
                          </div>
                          <div className="text-xs text-gray-500">Balance</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Expenses Details */}
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium text-red-900">Monthly Expenses</h3>
                    </div>
                    <span className="font-medium text-red-600 ml-4">
                      {formatCurrency(averageMonthlyExpenses)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-red-100 max-h-[400px] overflow-y-auto">
                  {monthlyExpenseCategories.map((category, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-red-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">
                            {((category.amount / averageMonthlyExpenses) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600 ml-4">
                            {formatCurrency(category.amount)}
                          </div>
                          <div className="text-xs text-gray-500">Monthly Average</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Section */}
      {overdueInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Overdue Invoices</h3>
              <div className="text-red-600 font-semibold">
                {formatCurrency(totals.overdueTotal)}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueInvoices.map((invoice, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.network}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(invoice.dueDate, 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Invoices Section */}
      {upcomingInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Invoices</h3>
              <div className="text-green-600 font-semibold">
                {formatCurrency(totals.upcomingTotal)}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingInvoices.map((invoice, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.network}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(invoice.dueDate, 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashPosition; 