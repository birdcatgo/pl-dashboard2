import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getCapStatusColor = (dailyCap, utilization) => {
  if (dailyCap === 'Uncapped') return 'bg-green-50 hover:bg-green-100';
  if (dailyCap === 'N/A' || dailyCap === 0) return 'bg-gray-50 hover:bg-gray-100';
  if (dailyCap === 'TBC') return 'bg-yellow-50 hover:bg-yellow-100';
  if (utilization > 90) return 'bg-red-50 hover:bg-red-100';
  if (utilization > 75) return 'bg-yellow-50 hover:bg-yellow-100';
  return 'hover:bg-gray-50';
};

const getCapStatusText = (dailyCap, utilization) => {
  if (dailyCap === 'Uncapped') return 'text-green-700';
  if (dailyCap === 'N/A' || dailyCap === 0) return 'text-gray-500';
  if (dailyCap === 'TBC') return 'text-yellow-700';
  if (utilization > 90) return 'text-red-700';
  if (utilization > 75) return 'text-yellow-700';
  return 'text-gray-900';
};

const NetworkCapsTab = ({ networkTerms }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Network Terms & Exposure</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Uncapped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Near Cap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>At Cap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Paused</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Last Day's Usage ({networkTerms?.[0]?.lastDate || ''})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {networkTerms?.map((network, index) => {
                const rowColorClass = getCapStatusColor(network.dailyCap, network.capUtilization);
                const textColorClass = getCapStatusText(network.dailyCap, network.capUtilization);
                
                return (
                  <tr key={index} className={`${rowColorClass} transition-colors`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColorClass}`}>
                      {network.network}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColorClass}`}>
                      {network.offer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.payPeriod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.netTerms}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodStart}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.periodEnd}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{network.invoiceDue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      {formatCurrency(network.runningTotal)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${textColorClass}`}>
                      {typeof network.dailyCap === 'number' ? formatCurrency(network.dailyCap) : network.dailyCap}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {typeof network.dailyCap === 'number' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className={`font-medium ${
                            !network.capUtilization ? 'text-gray-600' :
                            network.capUtilization > 90 ? 'text-red-600' : 
                            network.capUtilization > 75 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {typeof network.capUtilization === 'number' 
                              ? `${network.capUtilization.toFixed(1)}%` 
                              : '0%'
                            }
                          </span>
                          <span className="text-gray-500">
                            ({formatCurrency(network.lastDateSpend || 0)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
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

export default NetworkCapsTab;