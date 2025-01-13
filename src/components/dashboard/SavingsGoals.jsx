import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Wallet, PiggyBank, CreditCard, Edit2 } from 'lucide-react';

const CircularProgress = ({ value, color, size = 120 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          className="text-gray-100"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size/2}
          cy={size/2}
        />
        {/* Progress circle */}
        <circle
          className={`${color}`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size/2}
          cy={size/2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

const HorizontalStackedBars = ({ creditLimits, otherCards, totalCreditLimit, formatCurrency }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-gray-500">Stacked Bar View</h3>
    {[
      { name: 'AMEX', value: creditLimits.amex, color: 'bg-purple-500' },
      { name: 'Chase', value: creditLimits.chase, color: 'bg-indigo-500' },
      { name: 'Capital One', value: creditLimits.capitalOne, color: 'bg-pink-500' },
      { name: 'Other Cards', value: otherCards.total, color: 'bg-slate-400' }
    ].map(card => (
      <div key={card.name} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{card.name}</span>
          <span className="font-medium">{formatCurrency(card.value)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div 
            className={`h-full rounded-full ${card.color}`}
            style={{ width: `${(card.value / totalCreditLimit) * 100}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

const SavingsBreakdown = ({ currentSavings, goalAmount, formatCurrency }) => {
  const remaining = goalAmount - currentSavings;
  const monthlyTarget = remaining / 12;
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-3">12-Month Savings Plan</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Monthly savings needed:</span>
          <span className="text-sm font-medium">{formatCurrency(monthlyTarget)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total remaining:</span>
          <span className="text-sm font-medium">{formatCurrency(remaining)}</span>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 italic">
        {remaining > 0 
          ? `Save ${formatCurrency(monthlyTarget)} each month to reach your goal by ${new Date(Date.now() + 31536000000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : 'Goal reached! 🎉'}
      </div>
    </div>
  );
};

// New component for the edit modal
const GoalEditModal = ({ isOpen, onClose, goals, onSave }) => {
  const [editedGoals, setEditedGoals] = useState(goals);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedGoals);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Financial Goals</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Operating Cash Goal
            </label>
            <input
              type="number"
              value={editedGoals.operatingCash}
              onChange={(e) => setEditedGoals({
                ...editedGoals,
                operatingCash: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Savings Goal
            </label>
            <input
              type="number"
              value={editedGoals.savings}
              onChange={(e) => setEditedGoals({
                ...editedGoals,
                savings: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Credit Line Goal
            </label>
            <input
              type="number"
              value={editedGoals.creditLine}
              onChange={(e) => setEditedGoals({
                ...editedGoals,
                creditLine: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SavingsGoals = ({ cashFlowData }) => {
  // Move GOALS to state
  const [goals, setGoals] = useState({
    operatingCash: 500000,
    savings: 500000,
    creditLine: 3000000
  });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Add edit button to each card header
  const EditButton = () => (
    <button
      onClick={() => setIsEditModalOpen(true)}
      className="p-1 hover:bg-gray-100 rounded-full"
      title="Edit Goals"
    >
      <Edit2 className="h-4 w-4 text-gray-400" />
    </button>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get specific account balances
  const getAccountBalance = (accountName) => {
    const account = cashFlowData?.financialResources?.find(
      resource => resource?.account === accountName
    );
    return account ? parseFloat(account.available.toString().replace(/[$,]/g, '')) : 0;
  };

  // Calculate credit limits by card type
  const calculateCreditLimits = () => {
    if (!cashFlowData?.financialResources) return {};
    
    return cashFlowData.financialResources.reduce((acc, card) => {
      const name = card.account || '';
      const limit = parseFloat(card.limit.toString().replace(/[$,]/g, '') || '0') || 0;

      if (name.startsWith('AMEX ')) {
        acc.amex = (acc.amex || 0) + limit;
      } else if (name.startsWith('Chase C/C')) {
        acc.chase = (acc.chase || 0) + limit;
      } else if (name.startsWith('Capital One')) {
        acc.capitalOne = (acc.capitalOne || 0) + limit;
      } else if (name.trim() === 'Chase Amazon Prime') {
        acc.amazonPrime = limit;
      } else if (name === 'Bank of America') {
        acc.bankOfAmerica = limit;
      } else if (name === 'US Bank - Triple Cash') {
        acc.usBank = limit;
      } else if (name === 'Alliant Visa Signature') {
        acc.alliant = limit;
      }

      return acc;
    }, {});
  };

  // Add debug logging
  console.log('Financial Resources:', cashFlowData?.financialResources?.map(r => ({
    name: r.account,
    available: r.available,
    limit: r.limit
  })));

  const operatingCash = getAccountBalance('Cash in Bank');
  const savingsBalance = getAccountBalance('Business Savings (JP MORGAN)');
  const creditLimits = calculateCreditLimits();
  const totalCreditLimit = Object.values(creditLimits).reduce((sum, val) => sum + val, 0);

  // Prepare data for pie chart
  const otherCards = {
    total: (creditLimits.amazonPrime || 0) + 
           (creditLimits.bankOfAmerica || 0) + 
           (creditLimits.usBank || 0) + 
           (creditLimits.alliant || 0),
    breakdown: [
      { name: 'Chase Amazon Prime', value: creditLimits.amazonPrime || 0 },
      { name: 'Bank of America', value: creditLimits.bankOfAmerica || 0 },
      { name: 'US Bank', value: creditLimits.usBank || 0 },
      { name: 'Alliant', value: creditLimits.alliant || 0 }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operating Cash */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Operating Cash</h2>
                  <EditButton />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(operatingCash)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Goal: {formatCurrency(goals.operatingCash)}
                  </div>
                </div>
              </div>
              <CircularProgress 
                value={(operatingCash / goals.operatingCash) * 100}
                color="text-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Savings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Business Savings</h2>
                  <EditButton />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(savingsBalance)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Goal: {formatCurrency(goals.savings)}
                  </div>
                </div>
              </div>
              <CircularProgress 
                value={(savingsBalance / goals.savings) * 100}
                color="text-green-500"
              />
            </div>
            <SavingsBreakdown 
              currentSavings={savingsBalance}
              goalAmount={goals.savings}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>
      </div>

      {/* Credit Lines */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold">Credit Line Progress</h2>
                  <EditButton />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalCreditLimit)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Goal: {formatCurrency(goals.creditLine)}
                  </div>
                </div>
              </div>
              <CircularProgress 
                value={(totalCreditLimit / goals.creditLine) * 100}
                color="text-purple-500"
              />
            </div>

            <div className="mt-8">
              <HorizontalStackedBars 
                creditLimits={creditLimits}
                otherCards={otherCards}
                totalCreditLimit={totalCreditLimit}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <GoalEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        goals={goals}
        onSave={setGoals}
      />
    </div>
  );
};

export default SavingsGoals; 