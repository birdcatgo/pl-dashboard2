import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Wallet, PiggyBank, CreditCard, Edit2 } from 'lucide-react';

const BankStructureOverview = ({ 
  bankStructure, 
  netProfit, 
  formatCurrency, 
  getAccountBalance,
  cashFlowData,
  creditLimits,
  otherCards,
  totalCreditLimit
}) => {
  // Load saved values from localStorage or use defaults
  const loadSavedValues = () => {
    const saved = localStorage.getItem('bankStructureValues');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      netProfit: typeof netProfit !== 'undefined' ? netProfit : 0,
      monthlyExpenses: 0,
      operatingGoal: 0,
      emergencyGoal: 0,
      taxReserveGoal: 0,
      growthFundGoal: 0,
      goals: {
        taxReservePercent: 25,
        growthFundPercent: 30
      }
    };
  };

  const [inputValues, setInputValues] = useState(loadSavedValues());
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const newValues = {
      ...inputValues,
      [field]: isNaN(numValue) ? 0 : numValue,
      goals: {
        ...inputValues.goals,
        [field]: isNaN(numValue) ? 0 : numValue
      }
    };
    setInputValues(newValues);
    localStorage.setItem('bankStructureValues', JSON.stringify(newValues));
  };

  const calculateAmount = (type) => {
    switch(type) {
      case 'Tax Reserve':
        return inputValues.netProfit * (inputValues.goals.taxReservePercent / 100);
      case 'Growth Fund':
        return inputValues.netProfit * (inputValues.goals.growthFundPercent / 100);
      default:
        return 0;
    }
  };

  // Update netProfit when it changes from props
  useEffect(() => {
    const currentNetProfit = netProfit || 0;
    if (currentNetProfit !== inputValues.netProfit) {
      handleInputChange('netProfit', currentNetProfit.toString());
    }
  }, [netProfit, inputValues.netProfit]);

  // Get current balances from props or state
  const currentBalances = {
    operating: getAccountBalance('Cash in Bank'),
    emergency: getAccountBalance('Business Savings (JP MORGAN)')
  };

  const getAvailableCredit = (cardType) => {
    return cashFlowData?.financialResources?.reduce((total, card) => {
      const name = card.account || '';
      const available = parseFloat(card.available.toString().replace(/[$,]/g, '') || '0') || 0;
      
      if (cardType === 'AMEX' && name.startsWith('AMEX ')) {
        return total + available;
      } else if (cardType === 'Chase' && name.startsWith('Chase C/C')) {
        return total + available;
      } else if (cardType === 'Capital One' && name.startsWith('Capital One')) {
        return total + available;
      } else if (cardType === 'Other' && 
        (name.includes('Amazon Prime') || 
         name.includes('Bank of America') || 
         name.includes('US Bank') || 
         name.includes('Alliant'))) {
        return total + available;
      }
      return total;
    }, 0);
  };

  const getTotalAvailableCredit = () => {
    return cashFlowData?.financialResources?.reduce((total, card) => {
      const available = parseFloat(card.available.toString().replace(/[$,]/g, '') || '0') || 0;
      return total + available;
    }, 0);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with Save Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Profit Distribution Calculator</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('bankStructureValues', JSON.stringify(inputValues));
                  setIsEditingGoals(false);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  isEditingGoals 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isEditingGoals}
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Edit2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Net Profit Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Net Profit</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  value={formatCurrency(inputValues.netProfit).replace('$', '')}
                  onChange={(e) => handleInputChange('netProfit', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Monthly Expenses Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Monthly Expenses</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  value={formatCurrency(inputValues.monthlyExpenses).replace('$', '')}
                  onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Account Goals Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Goals</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">Account</th>
                  <th className="text-right text-sm font-medium text-gray-500">Current Balance</th>
                  <th className="text-right text-sm font-medium text-gray-500">Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-900">Main Operating Account</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(currentBalances.operating)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={formatCurrency(inputValues.operatingGoal).replace('$', '')}
                        onChange={(e) => handleInputChange('operatingGoal', e.target.value)}
                        className="w-32 text-right border rounded px-2"
                      />
                    ) : formatCurrency(inputValues.operatingGoal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Emergency Fund Account</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(currentBalances.emergency)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={formatCurrency(inputValues.emergencyGoal).replace('$', '')}
                        onChange={(e) => handleInputChange('emergencyGoal', e.target.value)}
                        className="w-32 text-right border rounded px-2"
                      />
                    ) : formatCurrency(inputValues.emergencyGoal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Tax Reserve Account</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(0)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={formatCurrency(inputValues.taxReserveGoal || 0).replace('$', '')}
                        onChange={(e) => handleInputChange('taxReserveGoal', e.target.value)}
                        className="w-32 text-right border rounded px-2"
                      />
                    ) : formatCurrency(inputValues.taxReserveGoal || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Growth Fund</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(0)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={formatCurrency(inputValues.growthFundGoal || 0).replace('$', '')}
                        onChange={(e) => handleInputChange('growthFundGoal', e.target.value)}
                        className="w-32 text-right border rounded px-2"
                      />
                    ) : formatCurrency(inputValues.growthFundGoal || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Profit Distributions Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profit Distributions</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">Account</th>
                  <th className="text-right text-sm font-medium text-gray-500">Percentage</th>
                  <th className="text-right text-sm font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-900">Tax Reserve Account</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={inputValues.goals.taxReservePercent}
                        onChange={(e) => handleInputChange('taxReservePercent', e.target.value)}
                        className="w-20 text-right border rounded px-2"
                      />
                    ) : `${inputValues.goals.taxReservePercent}%`}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(calculateAmount('Tax Reserve'))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Growth Fund</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {isEditingGoals ? (
                      <input
                        type="text"
                        value={inputValues.goals.growthFundPercent}
                        onChange={(e) => handleInputChange('growthFundPercent', e.target.value)}
                        className="w-20 text-right border rounded px-2"
                      />
                    ) : `${inputValues.goals.growthFundPercent}%`}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(calculateAmount('Growth Fund'))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Credit Line Overview Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Credit Line Overview</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">Card Type</th>
                  <th className="text-right text-sm font-medium text-gray-500">Current Limit</th>
                  <th className="text-right text-sm font-medium text-gray-500">Available Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-900">AMEX Business</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(creditLimits.amex || 0)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(getAvailableCredit('AMEX'))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Chase Business</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(creditLimits.chase || 0)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(getAvailableCredit('Chase'))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Capital One</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(creditLimits.capitalOne || 0)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(getAvailableCredit('Capital One'))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-900">Other Cards</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(otherCards.total)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(getAvailableCredit('Other'))}
                  </td>
                </tr>
                <tr className="bg-gray-50 font-medium">
                  <td className="py-2 text-sm text-gray-900">Total Credit Lines</td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(totalCreditLimit)}
                  </td>
                  <td className="py-2 text-sm text-right text-gray-900">
                    {formatCurrency(getTotalAvailableCredit())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfitDistribution = ({ cashFlowData, bankStructure, netProfit }) => {
  console.log('SavingsGoals Props:', {
    cashFlowData,
    bankStructure,
    netProfit
  });

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

  const creditLimits = calculateCreditLimits();
  const totalCreditLimit = Object.values(creditLimits).reduce((sum, val) => sum + val, 0);

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
      <BankStructureOverview 
        bankStructure={bankStructure}
        netProfit={netProfit}
        formatCurrency={formatCurrency}
        getAccountBalance={getAccountBalance}
        cashFlowData={cashFlowData}
        creditLimits={creditLimits}
        otherCards={otherCards}
        totalCreditLimit={totalCreditLimit}
      />
    </div>
  );
};

export default ProfitDistribution; 