import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, CreditCard, Building2, Receipt, Wallet } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function FinancialSnapshot({ cashFlowData, invoicesData, networkTerms }) {
  // Calculate total cash in bank
  const cashInBank = cashFlowData?.availableCash || 0;
  
  // Calculate total owed on credit cards
  const creditCardDebt = cashFlowData?.financialResources
    ?.filter(resource => !['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'].includes(resource.account))
    ?.reduce((total, card) => total + (card.owing || 0), 0) || 0;
  
  // Calculate total outstanding invoices
  const outstandingInvoices = invoicesData?.reduce((total, invoice) => total + (invoice.AmountDue || 0), 0) || 0;
  
  // Calculate total network exposure
  const networkExposure = networkTerms?.reduce((total, term) => total + (term.runningTotal || 0), 0) || 0;
  
  // Calculate potential bottom line
  const potentialBottomLine = cashInBank + outstandingInvoices - creditCardDebt;

  const metrics = [
    {
      title: "Cash In Bank",
      value: formatCurrency(cashInBank),
      icon: Building2,
      trend: "neutral",
      color: "text-blue-600"
    },
    {
      title: "Credit Card Debt",
      value: formatCurrency(creditCardDebt),
      icon: CreditCard,
      trend: "negative",
      color: "text-red-600"
    },
    {
      title: "Outstanding Invoices",
      value: formatCurrency(outstandingInvoices),
      icon: Receipt,
      trend: "positive",
      color: "text-green-600"
    },
    {
      title: "Network Exposure",
      value: formatCurrency(networkExposure),
      icon: Wallet,
      trend: "neutral",
      color: "text-orange-600"
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Current Financial Position</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Real-time snapshot of your financial status</p>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <span className="flex items-center">
              <span className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Live Data
            </span>
            <span className="ml-2 text-xs">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.title} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${metric.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    {metric.trend === "positive" && (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    )}
                    {metric.trend === "negative" && (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                    <h3 className={`text-2xl font-bold ${metric.color}`}>
                      {metric.value}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Potential Bottom Line</h3>
                <p className="text-sm text-gray-500 mt-1">
                  If all outstanding invoices were collected and credit cards cleared
                </p>
                <h4 className={`text-3xl font-bold mt-3 ${potentialBottomLine >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(potentialBottomLine)}
                </h4>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Based on:</p>
                <ul className="mt-1">
                  <li>+ Current Cash: {formatCurrency(cashInBank)}</li>
                  <li>+ Outstanding Invoices: {formatCurrency(outstandingInvoices)}</li>
                  <li>- Credit Card Debt: {formatCurrency(creditCardDebt)}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 