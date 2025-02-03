import React from 'react';
import _ from 'lodash';

const MonthlyPL = ({ monthlyData }) => {
  if (!monthlyData) return null;

  const formatCurrency = (amount) => {
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(/[$,]/g, '') || 0);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render Income Section
  const renderIncomeSection = () => {
    if (!monthlyData.incomeData?.length) return null;

    const totalIncome = monthlyData.incomeData.reduce((sum, item) => 
      sum + parseFloat(item.AMOUNT.replace(/[$,]/g, '') || 0), 0
    );

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Income</h2>
          <div className="text-xl font-bold text-green-600">
            Total: {formatCurrency(totalIncome)}
          </div>
        </div>
        <div className="space-y-2">
          {monthlyData.incomeData.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-1">
              <span>{item.DESCRIPTION}</span>
              <span className="text-green-600">{formatCurrency(item.AMOUNT)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Expense Category
  const renderExpenseCategory = (categoryName, items) => {
    const categoryTotal = items.reduce((sum, item) => 
      sum + parseFloat(item.AMOUNT.replace(/[$,]/g, '') || 0), 0
    );

    return (
      <div key={categoryName} className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{categoryName}</h3>
          <span className="font-semibold text-red-600">
            {formatCurrency(categoryTotal)}
          </span>
        </div>
        <div className="space-y-1 ml-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span>{item.DESCRIPTION}</span>
              <span className="text-red-600">{formatCurrency(item.AMOUNT)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Expenses Section
  const renderExpensesSection = () => {
    if (!monthlyData.categories) return null;

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Expenses</h2>
          <div className="text-xl font-bold text-red-600">
            Total: {formatCurrency(monthlyData.totalExpenses)}
          </div>
        </div>
        <div className="space-y-6">
          {Object.entries(monthlyData.categories).map(([category, items]) => 
            renderExpenseCategory(category, items)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderIncomeSection()}
      {renderExpensesSection()}
    </div>
  );
};

export default MonthlyPL;
