import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const Overview = ({ data }) => {
  useEffect(() => {
    console.log('Overview Component Mounted');
    console.log('Full Data Structure:', {
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
      networkTerms: data?.networkTerms,
      networkTermsLength: data?.networkTerms?.length
    });
  }, [data]);

  // Network Terms section
  const renderNetworkTerms = () => {
    console.log('Rendering Network Terms Section', {
      hasData: !!data,
      hasNetworkTerms: !!data?.networkTerms,
      networkTermsLength: data?.networkTerms?.length
    });
    
    if (!data?.networkTerms?.length) {
      console.log('No network terms data available');
      return (
        <Card className="col-span-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Network Terms & Exposure</h2>
            <div className="text-gray-500">No network terms data available</div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="col-span-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Network Terms & Exposure</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Terms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period Start</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Due</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Running Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.networkTerms
                  .sort((a, b) => b.runningTotal - a.runningTotal)
                  .map((network, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.network}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.offer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.payPeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.netTerms}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodStart}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodEnd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.invoiceDue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(network.runningTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {typeof network.dailyCap === 'number' ? formatCurrency(network.dailyCap) : network.dailyCap}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  };

  // Debug render
  console.log('Overview Render', {
    hasData: !!data,
    dataKeys: Object.keys(data || {}),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Show other sections */}
      <Card className="col-span-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
          <pre className="text-sm">
            {JSON.stringify({
              hasData: !!data,
              dataKeys: Object.keys(data || {}),
              networkTermsLength: data?.networkTerms?.length
            }, null, 2)}
          </pre>
        </div>
      </Card>
      
      {renderNetworkTerms()}
    </div>
  );
};

export default Overview; 