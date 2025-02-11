import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const BreakEvenAnalysis = ({ monthlyData }) => {
  // Calculate averages across the months
  const averages = monthlyData.reduce((acc, month) => {
    acc.totalRevenue = (acc.totalRevenue || 0) + month.revenue;
    acc.totalExpenses = (acc.totalExpenses || 0) + month.total;
    acc.totalPayroll = (acc.totalPayroll || 0) + month.payroll;
    acc.totalSubscriptions = (acc.totalSubscriptions || 0) + month.subscriptions;
    return acc;
  }, {});

  // Calculate monthly averages
  const monthlyAverage = {
    revenue: averages.totalRevenue / monthlyData.length,
    expenses: averages.totalExpenses / monthlyData.length,
    payroll: averages.totalPayroll / monthlyData.length,
    subscriptions: averages.totalSubscriptions / monthlyData.length,
    net: (averages.totalRevenue - averages.totalExpenses) / monthlyData.length
  };

  // Calculate revenue targets
  const revenueTargets = {
    breakEven: monthlyAverage.expenses, // Just cover expenses
    comfort: monthlyAverage.expenses * 1.2, // 20% above expenses
    growth: monthlyAverage.expenses * 1.5, // 50% above expenses
    scaling: monthlyAverage.expenses * 2, // 100% above expenses
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Break-Even Analysis</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Averages</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Revenue</span>
              <span className="font-medium">{formatCurrency(monthlyAverage.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Expenses</span>
              <span className="font-medium">{formatCurrency(monthlyAverage.expenses)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net</span>
              <span className={`font-medium ${monthlyAverage.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyAverage.net)}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Revenue Targets</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Break Even</span>
              <span className="font-medium">{formatCurrency(revenueTargets.breakEven)}</span>
            </div>
            <div className="flex justify-between">
              <span>Comfort Zone</span>
              <span className="font-medium">{formatCurrency(revenueTargets.comfort)}</span>
            </div>
            <div className="flex justify-between">
              <span>Growth Target</span>
              <span className="font-medium">{formatCurrency(revenueTargets.growth)}</span>
            </div>
            <div className="flex justify-between">
              <span>Scaling Target</span>
              <span className="font-medium">{formatCurrency(revenueTargets.scaling)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakEvenAnalysis; 