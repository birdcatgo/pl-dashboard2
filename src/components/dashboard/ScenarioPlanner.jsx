import React from 'react';

const ScenarioPlanner = ({ data }) => {
  if (!data || !data.projections) {
    return <div>No data available for the Scenario Planner</div>;
  }

  const { projections } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Scenario Planner</h2>
      <ul>
        <li>Total Available Funds: ${projections.totalAvailableFunds.toLocaleString()}</li>
        <li>Total Daily Spend: ${projections.totalDailySpend.toLocaleString()}</li>
        <li>Days of Coverage: {projections.daysOfCoverage}</li>
      </ul>
    </div>
  );
};

export default ScenarioPlanner;
