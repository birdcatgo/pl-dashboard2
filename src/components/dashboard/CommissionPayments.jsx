import React, { useState, useMemo } from 'react';

const CommissionPayments = ({ commissions, employeeData = [], performanceData = [] }) => {
  // Debug logging
  console.log('CommissionPayments received props:', {
    commissions: commissions?.length || 0,
    employeeData: employeeData?.length || 0,
    performanceData: performanceData?.length || 0,
    sampleCommission: commissions?.[0],
    sampleEmployee: employeeData?.[0]
  });

  // Debug: Show what columns are available in the first commission
  if (commissions?.[0]) {
    console.log('Available columns in first commission:', {
      allKeys: Object.keys(commissions[0]),
      monthKeys: Object.keys(commissions[0]).filter(key => key.match(/^[A-Za-z]+ \d{4}$/)),
      commissionKeys: Object.keys(commissions[0]).filter(key => key.includes('Commission'))
    });
  }

  // Test data fallback if no real data
  const testCommissions = [
    {
      mediaBuyer: 'John Smith',
      status: 'ACTIVE',
      commissionRate: 0.10,
      Confirmed: 'YES',
      'June 2025': '$5000',
      'June 2025 Commissions': '$500'
    },
    {
      mediaBuyer: 'Jane Doe',
      status: 'ACTIVE',
      commissionRate: 0.15,
      Confirmed: 'NO',
      'June 2025': '$3000',
      'June 2025 Commissions': '$450'
    }
  ];

  const testEmployeeData = [
    {
      name: 'John Smith',
      basePay: '$4000',
      frequency: 'Monthly'
    },
    {
      name: 'Jane Doe',
      basePay: '$3500',
      frequency: 'Monthly'
    }
  ];

  // Use test data if no real data
  const finalCommissions = commissions?.length ? commissions : testCommissions;
  const finalEmployeeData = employeeData?.length ? employeeData : testEmployeeData;

  // Dynamically detect available months from the data
  const availableMonths = useMemo(() => {
    if (!finalCommissions?.length) return ['June 2025'];
    
    const months = new Set();
    finalCommissions.forEach(commission => {
      Object.keys(commission).forEach(key => {
        // Look for month patterns (e.g., "June 2025", "July 2025", etc.)
        if (key.match(/^[A-Za-z]+ \d{4}$/)) {
          months.add(key);
        }
      });
    });
    
    // Sort months chronologically (newest first)
    return Array.from(months).sort((a, b) => {
      const monthA = new Date(a);
      const monthB = new Date(b);
      return monthB - monthA;
    });
  }, [finalCommissions]);

  // Set initial selected month to the most recent available month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return availableMonths[0] || 'June 2025';
  });
  const [showBaseSalaryAnalysis, setShowBaseSalaryAnalysis] = useState(false);

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value || value === '0' || value === 0) return '$0.00';
    
    // Handle string values with currency symbols and commas
    const cleanValue = typeof value === 'string' ? value.replace(/[$,]/g, '') : value;
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericValue);
  };

  // Helper function to format commission amounts without decimals
  const formatCommission = (value) => {
    if (!value || value === '0' || value === 0) return '$0';
    
    // Handle string values with currency symbols and commas
    const cleanValue = typeof value === 'string' ? value.replace(/[$,]/g, '') : value;
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericValue);
  };

  // Helper function to parse base pay amount
  const parseBasePay = (basePayString) => {
    if (!basePayString) return 0;
    const cleanValue = basePayString.toString().replace(/[$,]/g, '');
    return parseFloat(cleanValue) || 0;
  };

  // Helper function to get payment frequency multiplier
  const getFrequencyMultiplier = (frequency) => {
    if (!frequency) return 1;
    const freq = frequency.toLowerCase();
    if (freq.includes('twice') || freq.includes('bi-weekly') || freq.includes('semi-monthly')) return 2;
    if (freq.includes('once') || freq.includes('monthly')) return 1;
    if (freq.includes('weekly')) return 4;
    return 1; // Default to monthly
  };

  // Match media buyers with employee data
  const mediaBuyerAnalysis = useMemo(() => {
    if (!finalCommissions?.length || !finalEmployeeData?.length) return [];

    return finalCommissions.map(commission => {
      const buyerName = commission.mediaBuyer;
      
      // Skip if buyerName is missing
      if (!buyerName) {
        return {
          ...commission,
          hasBaseSalary: false,
          basePay: 0,
          frequency: '',
          monthlyBasePay: 0
        };
      }
      
      // Find matching employee by first name
      const employee = finalEmployeeData.find(emp => {
        if (!emp.name) return false;
        const empFirstName = emp.name.split(' ')[0]?.toLowerCase();
        const buyerFirstName = buyerName.split(' ')[0]?.toLowerCase();
        return empFirstName === buyerFirstName;
      });

      if (!employee) {
        return {
          ...commission,
          hasBaseSalary: false,
          basePay: 0,
          frequency: '',
          monthlyBasePay: 0
        };
      }

      const basePay = parseBasePay(employee.basePay);
      const frequency = employee.frequency || '';
      const frequencyMultiplier = getFrequencyMultiplier(frequency);
      const monthlyBasePay = basePay * frequencyMultiplier;

      return {
        ...commission,
        hasBaseSalary: true,
        basePay,
        frequency,
        monthlyBasePay,
        employeeData: employee
      };
    });
  }, [finalCommissions, finalEmployeeData]);

  // Calculate base salary justification
  const baseSalaryAnalysis = useMemo(() => {
    const analysis = [];

    mediaBuyerAnalysis.forEach(buyer => {
      // Only include active media buyers with base salaries
      if (!buyer.hasBaseSalary || (!buyer.status?.includes('ACTIVE') && !buyer.status?.includes('%'))) return;

      const monthlyBasePay = buyer.monthlyBasePay;
      
      // Calculate commission for the period based on profit
      // Assuming 10% commission rate (this should match your actual commission structure)
      const commissionRate = buyer.commissionRate || 0.10;
      
      // For now, we'll use a placeholder profit since performance data isn't available
      // You can adjust this based on your actual data structure
      const profit = 0; // Placeholder - adjust based on your data
      const commissionForPeriod = profit * commissionRate;
      
      // Total cost = base salary + commission
      const totalCost = monthlyBasePay + commissionForPeriod;
      const profitVsTotalCost = profit - totalCost;
      const isJustified = profit >= totalCost;

      analysis.push({
        name: buyer.mediaBuyer || 'Unknown',
        basePay: buyer.basePay,
        frequency: buyer.frequency,
        monthlyBasePay,
        commissionRate: commissionRate * 100,
        commissionForPeriod,
        totalCost,
        period: 'Current Period',
        profit,
        profitVsTotalCost,
        isJustified,
        status: isJustified ? 'Justified' : 'Not Justified'
      });
    });

    return analysis.sort((a, b) => b.profitVsTotalCost - a.profitVsTotalCost);
  }, [mediaBuyerAnalysis]);

  if (!finalCommissions?.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No commission data available
      </div>
    );
  }

  // Group commissions by status - handle both "15% ACTIVE" and "ACTIVE" formats
  const activeCommissions = mediaBuyerAnalysis.filter(c => 
    c.status?.includes('ACTIVE') || c.status === 'ACTIVE' || c.status?.includes('%')
  );
  const inactiveCommissions = mediaBuyerAnalysis.filter(c => 
    c.status?.includes('INACTIVE') || c.status === 'INACTIVE'
  );



  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          
          {/* Base Salary Analysis button temporarily hidden
          <button
            onClick={() => setShowBaseSalaryAnalysis(!showBaseSalaryAnalysis)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              showBaseSalaryAnalysis 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBaseSalaryAnalysis ? 'Hide' : 'Show'} Base Salary Analysis
          </button>
          */}
        </div>
      </div>

      {/* Base Salary Analysis - temporarily hidden
      {/* Base Salary Analysis */}
      {showBaseSalaryAnalysis && baseSalaryAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Base Salary Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Media Buyer
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Monthly Base Pay
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Commission Rate
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Profit
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Total Cost
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Company Profit
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {baseSalaryAnalysis.map((analysis, index) => (
                  <tr key={index} className={analysis.isJustified ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {analysis.name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatCurrency(analysis.monthlyBasePay)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                      {analysis.commissionRate.toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(analysis.profit)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(analysis.totalCost)}
                    </td>
                    <td className={`px-2 py-2 whitespace-nowrap text-sm text-right font-medium ${
                      analysis.profitVsTotalCost >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(analysis.profitVsTotalCost)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        analysis.isJustified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {analysis.isJustified ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Base Pay</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(baseSalaryAnalysis.reduce((sum, a) => sum + a.monthlyBasePay, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Profit Generated</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(baseSalaryAnalysis.reduce((sum, a) => sum + a.profit, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Company Profit</div>
                <div className={`text-lg font-semibold ${
                  baseSalaryAnalysis.reduce((sum, a) => sum + a.profitVsTotalCost, 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(baseSalaryAnalysis.reduce((sum, a) => sum + a.profitVsTotalCost, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Profitable Media Buyers</div>
                <div className="text-lg font-semibold text-gray-900">
                  {baseSalaryAnalysis.filter(a => a.isJustified).length} / {baseSalaryAnalysis.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Commission Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Commission Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmed
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                {/* Base Salary column temporarily hidden
                {showBaseSalaryAnalysis && (
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                )}
                */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Active Commissions */}
              {activeCommissions.map((commission, index) => {
                const amount = commission[selectedMonth];
                // Handle both "Commission" and "Commissions" formats
                const commissionAmount = commission[`${selectedMonth} Commissions`] || commission[`${selectedMonth} Commission`];

                const rowBackground = parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') > 0 ? 'bg-green-50' :
                                    parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') < 0 ? 'bg-red-50' : 'bg-white';

                
                return (
                  <tr key={`active-${index}`} className={rowBackground}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {commission.mediaBuyer}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      {commission.status}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {(commission.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      {commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {formatCommission(commissionAmount)}
                    </td>
                    {/* Base Salary column temporarily hidden
                    {showBaseSalaryAnalysis && (
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        {commission.hasBaseSalary ? (
                          <div className="text-xs">
                            <div className="font-medium">{formatCurrency(commission.basePay)}</div>
                            <div className="text-gray-500">{commission.frequency}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No base salary</span>
                        )}
                      </td>
                    )}
                    */}
                  </tr>
                );
              })}

              {/* Inactive Commissions */}
              {inactiveCommissions.map((commission, index) => {
                const amount = commission[selectedMonth];
                // Handle both "Commission" and "Commissions" formats
                const commissionAmount = commission[`${selectedMonth} Commissions`] || commission[`${selectedMonth} Commission`];

                const rowBackground = parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') > 0 ? 'bg-green-50' :
                                    parseFloat(commissionAmount?.replace(/[$,]/g, '') || '0') < 0 ? 'bg-red-50' : 'bg-white';

                
                return (
                  <tr key={`inactive-${index}`} className={`${rowBackground} opacity-75`}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {commission.mediaBuyer}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      {commission.status}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {(commission.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                      {commission.Confirmed === 'YES' && (
                        <span className="inline-flex items-center justify-center px-2 py-1 border-2 border-dashed border-gray-400 text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-right">
                      {formatCommission(commissionAmount)}
                    </td>
                    {/* Base Salary column temporarily hidden
                    {showBaseSalaryAnalysis && (
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                        {commission.hasBaseSalary ? (
                          <div className="text-xs">
                            <div className="font-medium">{formatCurrency(commission.basePay)}</div>
                            <div className="text-xs text-gray-500">{commission.frequency}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No base salary</span>
                        )}
                      </td>
                    )}
                    */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionPayments;