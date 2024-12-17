import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import _ from 'lodash';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ExpandableSection = ({ title, items, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalAmount = _.sumBy(items, type === 'credit' ? 'available' : 'owing');

  return (
    <div className="bg-white rounded-lg shadow">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <span className="text-lg font-semibold">
          {formatCurrency(totalAmount)}
        </span>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                {type === 'credit' && (
                  <>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Limit
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Owing
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  {type === 'credit' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(item.limit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(item.owing)}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(item.available)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const FinancialBreakdown = ({ financialResources }) => {
  const cashAccounts = financialResources.filter(resource => !resource.limit);
  const creditCards = financialResources.filter(resource => resource.limit);

  return (
    <div className="space-y-4">
      <ExpandableSection
        title="Cash Accounts"
        items={cashAccounts}
        type="cash"
      />
      <ExpandableSection
        title="Credit Cards"
        items={creditCards}
        type="credit"
      />
    </div>
  );
};

export default FinancialBreakdown;