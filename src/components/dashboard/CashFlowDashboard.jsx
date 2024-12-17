import React from 'react';
import FinancialBreakdown from './FinancialBreakdown.jsx';
import ProjectionsSummary from './ProjectionsSummary.jsx';

const CashFlowDashboard = ({ cashFlowData }) => {
  if (!cashFlowData) {
    return <div>No cash flow data available</div>;
  }

  const { financialResources, projections } = cashFlowData;

  return (
    <div className="space-y-8">
      {/* Financial Breakdown */}
      <FinancialBreakdown financialResources={financialResources} />

      {/* Projections Summary */}
      <ProjectionsSummary
        cashFlowData={cashFlowData}
        startingBalance={financialResources.totalCash}
      />
    </div>
  );
};

export default CashFlowDashboard;
