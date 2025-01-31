import React from 'react';
import { DollarSign, CreditCard, AlertCircle, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const FinancialResources = ({ financialResources = [], cashFlowData = {} }) => {
  // Add default values and validation
  const resources = financialResources || [];
  const currentBalance = cashFlowData?.currentBalance || 0;
  const creditAvailable = cashFlowData?.creditAvailable || 0;

  // Filter out invalid resources
  const validResources = resources.filter(resource => 
    resource && typeof resource.amount === 'number' && resource.name
  );

  // Calculate totals
  const totalResources = validResources.reduce((sum, resource) => 
    sum + (resource.amount || 0), 0
  ) + currentBalance + creditAvailable;

  // Calculate totals
  const totalAvailable = resources.reduce((sum, resource) => sum + resource.available, 0);
  const totalOwing = resources.reduce((sum, resource) => sum + resource.owing, 0);
  const totalLimit = resources.reduce((sum, resource) => sum + resource.limit, 0);

  // Separate cash and credit accounts
  const cashAccounts = validResources.filter(resource => 
    !resource.limit && 
    resource.name.toLowerCase().includes('cash')
  );
  const creditAccounts = validResources.filter(resource => 
    resource.limit > 0 || 
    resource.name.toLowerCase().includes('credit')
  );

  
  const getUtilizationColor = (owing, limit) => {
    const utilization = (owing / limit) * 100;
    if (utilization < 30) return 'bg-green-100 text-green-800';
    if (utilization < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Financial Resources</h2>
      <div className="space-y-4">
        {/* Current Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Balance</span>
          <span className="font-medium">{formatCurrency(currentBalance)}</span>
        </div>

        {/* Credit Available */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Credit Available</span>
          <span className="font-medium">{formatCurrency(creditAvailable)}</span>
        </div>

        {/* Additional Resources */}
        {validResources.map((resource, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-600">{resource.name}</span>
            <span className="font-medium">{formatCurrency(resource.amount)}</span>
          </div>
        ))}

        {/* Total */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Resources</span>
            <span className="font-semibold">{formatCurrency(totalResources)}</span>
          </div>
        </div>
      </div>

      {/* Header Section with Summary Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Financial Resources</h3>
          <span className="text-sm text-gray-500">Account Overview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-600 font-medium">Total Available</div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(totalAvailable)}</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-600 font-medium">Total Owing</div>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700 mt-2">{formatCurrency(totalOwing)}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-600 font-medium">Total Credit Limit</div>
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(totalLimit)}</div>
          </div>
        </div>
      </div>

      {/* Cash Accounts Section */}
      {cashAccounts.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <Wallet className="h-5 w-5 text-gray-500 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Cash Accounts</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashAccounts.map((resource, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {resource.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(resource.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Accounts Section */}
      {creditAccounts.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Credit Accounts</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Owing</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditAccounts.map((resource, index) => {
                  const utilizationPercent = ((resource.owing / resource.limit) * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {resource.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {formatCurrency(resource.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {formatCurrency(resource.owing)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(resource.limit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUtilizationColor(resource.owing, resource.limit)}`}>
                          {utilizationPercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialResources;