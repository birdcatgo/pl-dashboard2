import React from 'react';
import { format, addDays } from 'date-fns';
import _ from 'lodash';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ProjectionsHeader = ({ title, amount, type }) => (
  <div className={`p-4 rounded-lg ${
    type === 'inflow' ? 'bg-green-50' : 
    type === 'outflow' ? 'bg-red-50' : 'bg-blue-50'
  }`}>
    <div className={`text-sm font-medium ${
      type === 'inflow' ? 'text-green-600' : 
      type === 'outflow' ? 'text-red-600' : 'text-blue-600'
    }`}>
      {title}
    </div>
    <div className={`text-2xl font-bold ${
      type === 'inflow' ? 'text-green-700' : 
      type === 'outflow' ? 'text-red-700' : 'text-blue-700'
    }`}>
      {formatCurrency(amount)}
    </div>
  </div>
);

const SimpleProjections = ({ cashFlowData }) => {
  // Calculate total expected inflows
  const totalInflows = _.sumBy(cashFlowData.invoices, inv => 
    parseFloat(inv.amount?.toString().replace(/[\$,]/g, '') || '0')
  );

  // Calculate total expected outflows
  const dailyMediaSpend = cashFlowData.mediaBuyerSpend?.buyers?.reduce((total, buyer) => 
    total + parseFloat(buyer.calculatedSpend?.toString().replace(/[\$,]/g, '') || '0'), 0) || 0;
  
  const totalPayroll = cashFlowData.expenses?.reduce((total, expense) => 
    total + 
    parseFloat(expense.biWeekly?.toString().replace(/[\$,]/g, '') || '0') +
    parseFloat(expense.fifteenth?.toString().replace(/[\$,]/g, '') || '0') +
    parseFloat(expense.thirtieth?.toString().replace(/[\$,]/g, '') || '0'), 0) || 0;

  const totalCCMinPayments = cashFlowData.financialResources?.creditCards?.reduce((total, card) => {
    const owing = parseFloat(card.owing?.toString().replace(/[\$,]/g, '') || '0');
    return total + Math.max(owing * 0.03, 25); // Minimum $25 or 3% of balance
  }, 0) || 0;

  const totalOutflows = (dailyMediaSpend * 30) + totalPayroll + totalCCMinPayments;
  const netProjection = totalInflows - totalOutflows;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Cash Flow Projection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectionsHeader 
          title="Expected Inflows" 
          amount={totalInflows}
          type="inflow"
        />
        <ProjectionsHeader 
          title="Expected Outflows" 
          amount={totalOutflows}
          type="outflow"
        />
        <ProjectionsHeader 
          title="Net Projection" 
          amount={netProjection}
          type="net"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">Expected Inflows</h4>
          </div>
          <div className="p-4 space-y-2">
            {cashFlowData.invoices?.map((invoice, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{invoice.network}</span>
                <span className="text-green-600">{formatCurrency(invoice.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">Expected Outflows</h4>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Daily Media Spend</div>
              <div className="space-y-1">
                {cashFlowData.mediaBuyerSpend?.buyers?.map((buyer, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{buyer.name}</span>
                    <span className="text-red-600">{formatCurrency(buyer.calculatedSpend)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Payroll</div>
              <div className="space-y-1">
                {cashFlowData.expenses?.map((expense, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{expense.name}</span>
                    <span className="text-red-600">
                      {formatCurrency(
                        (expense.biWeekly || 0) + 
                        (expense.fifteenth || 0) + 
                        (expense.thirtieth || 0)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Credit Card Minimum Payments</div>
              <div className="space-y-1">
                {cashFlowData.financialResources?.creditCards?.map((card, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{card.name}</span>
                    <span className="text-red-600">
                      {formatCurrency(Math.max(card.owing * 0.03, 25))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleProjections;