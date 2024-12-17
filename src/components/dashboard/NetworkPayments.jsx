import React from 'react';

const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const NetworkPayments = ({ networkData }) => {
  if (!networkData?.length) {
    return <div className="text-gray-500">No network payment data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Network Payment Schedule</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Network
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Offer
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Daily Cap
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Exposure
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Terms
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {networkData.map((network, index) => (
              <tr key={index}
                className={network.riskLevel?.includes('🔴') ? 'bg-red-50' :
                  network.riskLevel?.includes('⚠️') ? 'bg-yellow-50' :
                    'bg-white'}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {network.network}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {network.offer}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {formatCurrency(network.cap)}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {formatCurrency(network.exposure)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {network.terms}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${network.riskLevel?.includes('✅') ? 'bg-green-100 text-green-800' :
                      network.riskLevel?.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                    {network.riskLevel?.replace('✅ ', '').replace('⚠️ ', '').replace('🔴 ', '')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworkPayments;