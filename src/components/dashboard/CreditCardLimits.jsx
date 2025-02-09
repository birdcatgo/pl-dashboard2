import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const tradeshiftMapping = {
  '1011': 'Convert 2 Freedom',
  '1003': 'Convert 2 Freedom',
  '1004': 'Rightway Marketing',
  '2007': 'Quit 9 to 5',
  '2009': 'Online Legacies',
  '2006': 'Torson Enterprises'
};

const CreditCardLimits = ({ financialResources }) => {
  // Filter only credit cards (rows 7-24)
  const creditCards = financialResources?.filter(resource => 
    resource.account && !['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'].includes(resource.account)
  ) || [];

  const totalLimit = creditCards.reduce((sum, card) => sum + (parseFloat(card.limit) || 0), 0);

  const getBusinessName = (cardName) => {
    // Extract the card number if it's an AMEX card
    const amexMatch = cardName.match(/AMEX\s+(\d{4})/i);
    if (amexMatch) {
      const cardNumber = amexMatch[1];
      return tradeshiftMapping[cardNumber];
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <CardTitle>Credit Card Limits</CardTitle>
            <p className="text-sm text-gray-500">Showing all credit cards and their Tradeshift business names</p>
          </div>
          <span className="text-2xl font-bold">{formatCurrency(totalLimit)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Card Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Business Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Credit Limit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditCards.map((card, index) => {
                const businessName = getBusinessName(card.account);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {card.account}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {businessName && (
                        <div className="flex items-center">
                          <Info className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-medium text-blue-600">
                            {businessName} Tradeshift
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(card.limit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardLimits; 