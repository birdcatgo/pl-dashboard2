import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const NetworkCapsTab = ({ networkPaymentsData }) => {
  console.log('NetworkCapsTab received data:', networkPaymentsData);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Caps & Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Exposure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {networkPaymentsData?.map((network, index) => (
                <tr key={index} className={network.riskLevel.includes('🔴') ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm">{network.network}</td>
                  <td className="px-6 py-4 text-sm">{network.offer}</td>
                  <td className="px-6 py-4 text-sm">{network.paymentTerms}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.dailyCap)}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.currentExposure)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${network.riskLevel.includes('✅') ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {network.riskLevel.replace('✅ ', '').replace('🔴 ', '')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkCapsTab;