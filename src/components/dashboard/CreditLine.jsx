import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const CreditLine = ({ cashFlowData }) => {
  console.log('CreditLine received data:', cashFlowData); // Debug log

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Group resources by type
  const groupedResources = {
    'Cash Accounts': [],
    'AMEX Cards': [],
    'Chase Cards': [],
    'Capital One Cards': [],
    'Other Cards': []
  };

  // Sort resources into groups
  cashFlowData?.financialResources?.forEach(resource => {
    const account = resource.account.toLowerCase();
    if (account.includes('cash') || account.includes('savings') || account.includes('slash')) {
      groupedResources['Cash Accounts'].push(resource);
    } else if (account.includes('amex')) {
      groupedResources['AMEX Cards'].push(resource);
    } else if (account.includes('chase')) {
      groupedResources['Chase Cards'].push(resource);
    } else if (account.includes('capital one')) {
      groupedResources['Capital One Cards'].push(resource);
    } else {
      groupedResources['Other Cards'].push(resource);
    }
  });

  // Calculate totals
  const totals = {
    cashAvailable: (cashFlowData?.financialResources || [])
      .filter(resource => 
        resource.account === 'Cash in Bank' || 
        resource.account === 'Slash Account' || 
        resource.account === 'Business Savings (JP MORGAN)'
      )
      .reduce((sum, resource) => sum + (parseFloat(resource.available) || 0), 0),
    available: (cashFlowData?.financialResources || [])
      .reduce((sum, resource) => sum + (parseFloat(resource.available) || 0), 0),
    owing: (cashFlowData?.financialResources || [])
      .reduce((sum, resource) => sum + (parseFloat(resource.owing) || 0), 0),
    limit: (cashFlowData?.financialResources || [])
      .reduce((sum, resource) => sum + (parseFloat(resource.limit) || 0), 0)
  };

  // Get utilization percentage for a resource
  const getUtilization = (resource) => {
    if (!resource.limit) return 0;
    return (resource.owing / resource.limit) * 100;
  };

  // Get color based on utilization
  const getUtilizationColor = (utilization) => {
    if (utilization > 80) return 'text-red-600';
    if (utilization > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">Cash Available</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(totals.cashAvailable)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">Total Available</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(totals.available)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">Total Owing</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(totals.owing)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">Total Credit Limit</p>
              <p className="text-2xl font-bold text-purple-800">{formatCurrency(totals.limit)}</p>
            </div>
          </div>

          {/* Resources Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="text-left py-3 px-4 font-semibold">Account Name</th>
                  <th className="text-right py-3 px-4 font-semibold">Available Amount</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount Owing</th>
                  <th className="text-right py-3 px-4 font-semibold">Credit Limit</th>
                  <th className="text-right py-3 px-4 font-semibold">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(groupedResources).map(([groupName, resources]) => (
                  resources.length > 0 && (
                    <React.Fragment key={groupName}>
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="py-3 px-4 font-semibold text-gray-700">
                          {groupName}
                        </td>
                      </tr>
                      {resources.map((resource, index) => {
                        const utilization = getUtilization(resource);
                        const utilizationColor = getUtilizationColor(utilization);
                        const isCash = groupName === 'Cash Accounts';

                        return (
                          <tr 
                            key={`${groupName}-${index}`} 
                            className={`
                              hover:bg-gray-50
                              ${isCash ? 'bg-green-50' : ''}
                            `}
                          >
                            <td className="py-3 px-4">{resource.account}</td>
                            <td className="text-right py-3 px-4 font-medium text-green-600">
                              {formatCurrency(resource.available)}
                            </td>
                            <td className="text-right py-3 px-4 font-medium text-red-600">
                              {formatCurrency(resource.owing)}
                            </td>
                            <td className="text-right py-3 px-4 font-medium">
                              {formatCurrency(resource.limit)}
                            </td>
                            <td className={`text-right py-3 px-4 font-medium ${utilizationColor}`}>
                              {resource.limit ? `${utilization.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditLine; 