import React from 'react';
import FinancialResources from './FinancialResources';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CashCreditBalancesTab = ({ financialResources }) => {
  const totalCash = financialResources
    ?.filter(resource => !resource.limit)
    .reduce((sum, resource) => sum + (resource.available || 0), 0) || 0;

  const totalCredit = financialResources
    ?.filter(resource => resource.limit)
    .reduce((sum, resource) => sum + (resource.available || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalCash)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Credit Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalCredit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <FinancialResources financialResources={financialResources} />
    </div>
  );
};

export default CashCreditBalancesTab;