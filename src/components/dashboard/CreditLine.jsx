import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

const CreditLine = ({ financialResources }) => {
  console.log('CreditLine received financialResources:', financialResources);

  // Filter for credit cards (exclude cash accounts and savings)
  const creditCards = financialResources?.filter(resource => 
    resource['Credit Limit'] > 0 && 
    !resource['Account Name'].toLowerCase().includes('cash') &&
    !resource['Account Name'].toLowerCase().includes('savings')
  ) || [];

  console.log('Filtered credit cards:', creditCards);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalLimit = creditCards.reduce((sum, card) => sum + parseFloat(card['Credit Limit'].replace(/[$,]/g, '')), 0);
  const totalAvailable = creditCards.reduce((sum, card) => sum + parseFloat(card['Available Amount'].replace(/[$,]/g, '')), 0);
  const overallUtilization = ((totalLimit - totalAvailable) / totalLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Line Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Credit Limit</p>
                <p className="text-lg font-semibold">{formatCurrency(totalLimit)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Credit</p>
                <p className="text-lg font-semibold">{formatCurrency(totalAvailable)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Overall Utilization</p>
                <p className="text-lg font-semibold">{overallUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Individual Cards */}
          <div className="space-y-4">
            {creditCards.map((card, index) => {
              const limit = parseFloat(card['Credit Limit'].replace(/[$,]/g, ''));
              const available = parseFloat(card['Available Amount'].replace(/[$,]/g, ''));
              const utilization = ((limit - available) / limit) * 100;
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{card['Account Name']}</h3>
                    <span className="text-sm text-gray-500">
                      {utilization.toFixed(1)}% Used
                    </span>
                  </div>
                  <Progress 
                    value={utilization}
                    className="mb-3"
                    indicatorClassName={utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Credit Limit</p>
                      <p className="font-medium">{card['Credit Limit']}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Available</p>
                      <p className="font-medium">{card['Available Amount']}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditLine; 