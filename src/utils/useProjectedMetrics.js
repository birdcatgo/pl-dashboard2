import { useMemo } from 'react';

const useProjectedMetrics = (cashFlowData, scenario) => {
  return useMemo(() => {
    if (!cashFlowData || !scenario) return {};

    const { financialResources } = cashFlowData;
    const { mediaBuyerSpend, paymentTerms, expenses } = scenario.adjustments;

    // Example calculations (customize as per your logic)
    const cashBalance =
      (financialResources?.totalCash || 0) -
      (mediaBuyerSpend * 3000); // Assume monthly spend multiplier
    const riskLevel = cashBalance < 0 ? 'High' : 'Low';
    const riskIndicator = cashBalance < 0 ? '🔴' : '✅';
    const runway = Math.floor(cashBalance / (mediaBuyerSpend * 100 || 1)); // Example logic
    const runwayComparison = `${runway} days`;

    return {
      cashBalance,
      riskLevel,
      riskIndicator,
      runway,
      runwayComparison,
    };
  }, [cashFlowData, scenario]);
};

export default useProjectedMetrics;
