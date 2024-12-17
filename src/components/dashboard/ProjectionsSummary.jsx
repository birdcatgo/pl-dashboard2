import React from 'react';
import CashProjectionTable from './CashProjectionTable';

const MetricCard = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="text-sm font-medium text-gray-500">{title}</div>
    <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

const formatCurrency = (amount) => {
  let parsedAmount = typeof amount === 'string'
    ? parseFloat(amount.replace(/[\$,]/g, '') || 0)
    : amount || 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsedAmount);
};

const ProjectionsSummary = ({ cashFlowData, startingBalance }) => {
  const { inflows = [], outflows = {} } = cashFlowData;
  
  const totalInflows = _.sumBy(inflows, 'amount');
  const totalOutflows =
    _.sumBy(outflows.creditCardPayments, 'amount') +
    _.sumBy(outflows.payroll, 'amount');
  
  const netChange = totalInflows - totalOutflows;
  const projectedBalance = startingBalance + netChange;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Expected Inflows" value={formatCurrency(totalInflows)} />
        <MetricCard title="Expected Outflows" value={formatCurrency(totalOutflows)} />
        <MetricCard title="Net Change" value={formatCurrency(netChange)} />
        <MetricCard title="Projected Balance" value={formatCurrency(projectedBalance)} />
      </div>
  
      {/* CashProjectionTable */}
      <CashProjectionTable
        startingBalance={startingBalance}
        inflows={inflows}
        outflows={outflows}
      />
    </div>
  );
};

export default ProjectionsSummary;