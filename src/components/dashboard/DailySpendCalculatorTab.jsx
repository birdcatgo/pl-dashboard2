import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const DailySpendCalculatorTab = ({ cashManagementData }) => {
  const defaultBuyers = [
    { name: 'Zel', averageSpend: 2000 },
    { name: 'Daniel', averageSpend: 15000 },
    { name: 'Mike', averageSpend: 10000 },
    { name: 'Dave', averageSpend: 2000 },
    { name: 'Asheesh', averageSpend: 10000 }
  ];

  const [spendAmounts, setSpendAmounts] = useState(
    defaultBuyers.reduce((acc, buyer) => ({
      ...acc,
      [buyer.name]: buyer.averageSpend
    }), {})
  );

  const totalDailySpend = Object.values(spendAmounts).reduce((sum, spend) => sum + (parseFloat(spend) || 0), 0);
  const totalAvailable = (cashManagementData?.currentBalance || 0) + (cashManagementData?.creditAvailable || 0);
  const daysOfCoverage = Math.floor(totalAvailable / totalDailySpend) || 0;

  const handleSpendChange = (buyerName, value) => {
    setSpendAmounts(prev => ({
      ...prev,
      [buyerName]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Available Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalAvailable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalDailySpend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Days of Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {daysOfCoverage} days
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Buyer Daily Spend Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average Daily Spend</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Spend Scenario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {defaultBuyers.map((buyer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-900">{buyer.name}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(buyer.averageSpend)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className="relative w-32">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                        <input
                          type="text"
                          value={spendAmounts[buyer.name] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            handleSpendChange(buyer.name, value);
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            handleSpendChange(buyer.name, value.toFixed(2));
                          }}
                          className="form-input rounded-md border-gray-300 w-full text-right pl-8"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="font-medium">
                <td className="px-6 py-4 text-sm text-gray-900">Total Daily Spend</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(39000)}</td>
                <td className="px-6 py-4 text-sm text-center">{formatCurrency(totalDailySpend)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySpendCalculatorTab;