import React, { useState, useMemo } from 'react';

const CommissionPayments = ({ commissions, employeeData = [], performanceData = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState('June 2025');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
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

  // Calculate media buyer performance for different time periods
  const mediaBuyerPerformance = useMemo(() => {
    if (!performanceData?.length) return {};

    const today = new Date();
    const currentYear = today.getFullYear();
    const performance = {};

    performanceData.forEach(entry => {
      const buyer = entry['Media Buyer'];
      if (!buyer) return;

      const entryDate = new Date(entry.Date);
      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
      
      if (!performance[buyer]) {
        performance[buyer] = {
          name: buyer,
          periods: {
            '30days': { spend: 0, revenue: 0, profit: 0 },
            '60days': { spend: 0, revenue: 0, profit: 0 },
            '90days': { spend: 0, revenue: 0, profit: 0 },
            'mtd': { spend: 0, revenue: 0, profit: 0 },
            'ytd': { spend: 0, revenue: 0, profit: 0 },
            'all': { spend: 0, revenue: 0, profit: 0 }
          }
        };
      }

      const spend = parseFloat(entry['Ad Spend'] || 0);
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      const profit = revenue - spend;

      // Add to appropriate periods
      if (daysDiff <= 30) {
        performance[buyer].periods['30days'].spend += spend;
        performance[buyer].periods['30days'].revenue += revenue;
        performance[buyer].periods['30days'].profit += profit;
      }
      if (daysDiff <= 60) {
        performance[buyer].periods['60days'].spend += spend;
        performance[buyer].periods['60days'].revenue += revenue;
        performance[buyer].periods['60days'].profit += profit;
      }
      if (daysDiff <= 90) {
        performance[buyer].periods['90days'].spend += spend;
        performance[buyer].periods['90days'].revenue += revenue;
        performance[buyer].periods['90days'].profit += profit;
      }
      // MTD calculation (current month)
      const currentMonth = today.getMonth();
      if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
        performance[buyer].periods['mtd'].spend += spend;
        performance[buyer].periods['mtd'].revenue += revenue;
        performance[buyer].periods['mtd'].profit += profit;
      }
      // YTD calculation (current year)
      if (entryDate.getFullYear() === currentYear) {
        performance[buyer].periods['ytd'].spend += spend;
        performance[buyer].periods['ytd'].revenue += revenue;
        performance[buyer].periods['ytd'].profit += profit;
      }
      // All Time
      performance[buyer].periods['all'].spend += spend;
      performance[buyer].periods['all'].revenue += revenue;
      performance[buyer].periods['all'].profit += profit;
    });

    return performance;
  }, [performanceData]);

  // Match media buyers with employee data
  const mediaBuyerAnalysis = useMemo(() => {
    if (!commissions?.length || !employeeData?.length) return [];

    return commissions.map(commission => {
      const buyerName = commission.mediaBuyer;
      
      // Find matching employee by first name
      const employee = employeeData.find(emp => {
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
          monthlyBasePay: 0,
          performance: mediaBuyerPerformance[buyerName] || null
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
        employeeData: employee,
        performance: mediaBuyerPerformance[buyerName] || null
      };
    });
  }, [commissions, employeeData, mediaBuyerPerformance]);

  // Calculate base salary justification
  const baseSalaryAnalysis = useMemo(() => {
    const analysis = [];
    const periodLabels = {
      '30days': 'Last 30 Days',
      '60days': 'Last 60 Days', 
      '90days': 'Last 90 Days',
      'mtd': 'Month to Date',
      'ytd': 'Year to Date',
      'all': 'All Time'
    };

    mediaBuyerAnalysis.forEach(buyer => {
      // Only include active media buyers with base salaries
      if (!buyer.hasBaseSalary || !buyer.performance || buyer.status !== 'ACTIVE') return;

      const periodData = buyer.performance.periods[selectedPeriod];
      if (!periodData) return;

      const profit = periodData.profit;
      const monthlyBasePay = buyer.monthlyBasePay;
      
      // Calculate the number of months for the selected period based on when they started
      const getPeriodMonths = (period, buyerName) => {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Find the first date this buyer started running traffic
        const buyerEntries = performanceData.filter(entry => entry['Media Buyer'] === buyerName);
        if (!buyerEntries.length) return 0;
        
        const firstEntryDate = new Date(Math.min(...buyerEntries.map(entry => new Date(entry.Date))));
        
        // Base pay starts on the 15th of the first full month of traffic
        const firstBasePayDate = new Date(firstEntryDate.getFullYear(), firstEntryDate.getMonth(), 15);
        if (firstEntryDate.getDate() > 15) {
          // If they started after the 15th, base pay starts next month
          firstBasePayDate.setMonth(firstBasePayDate.getMonth() + 1);
        }
        
        let periodStart, periodEnd;
        
        switch (period) {
          case '30days':
            periodStart = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            periodEnd = today;
            break;
          case '60days':
            periodStart = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
            periodEnd = today;
            break;
          case '90days':
            periodStart = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
            periodEnd = today;
            break;
          case 'mtd':
            periodStart = new Date(currentYear, today.getMonth(), 1);
            periodEnd = today;
            break;
          case 'ytd':
            periodStart = new Date(currentYear, 0, 1); // January 1st
            periodEnd = today;
            break;
          case 'all':
            periodStart = firstBasePayDate;
            periodEnd = today;
            break;
          default:
            periodStart = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            periodEnd = today;
        }
        
        // Calculate months between period start and end, but only count months after they started getting base pay
        const effectiveStart = new Date(Math.max(periodStart.getTime(), firstBasePayDate.getTime()));
        
        if (effectiveStart > periodEnd) return 0;
        
        const monthsDiff = (periodEnd.getFullYear() - effectiveStart.getFullYear()) * 12 + 
                          (periodEnd.getMonth() - effectiveStart.getMonth());
        
        // Add 1 if the period includes at least 15 days of the end month
        const additionalMonth = periodEnd.getDate() >= 15 ? 1 : 0;
        
        return Math.max(0, monthsDiff + additionalMonth);
      };
      
      const periodMonths = getPeriodMonths(selectedPeriod, buyer.mediaBuyer);
      const basePayForPeriod = monthlyBasePay * periodMonths;
      
      // Calculate commission for the period based on profit
      // Assuming 10% commission rate (this should match your actual commission structure)
      const commissionRate = buyer.commissionRate || 0.10;
      // If profit is negative (loss), commission is $0, not negative
      const commissionForPeriod = profit > 0 ? profit * commissionRate : 0;
      
      // Total cost = base salary for period + commission
      const totalCost = basePayForPeriod + commissionForPeriod;
      const profitVsTotalCost = profit - totalCost;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      const isJustified = profit >= totalCost;

      analysis.push({
        name: buyer.mediaBuyer,
        basePay: buyer.basePay,
        frequency: buyer.frequency,
        monthlyBasePay,
        basePayForPeriod,
        commissionRate: commissionRate * 100,
        commissionForPeriod,
        totalCost,
        period: periodLabels[selectedPeriod],
        profit,
        profitVsTotalCost,
        roi,
        isJustified,
        status: isJustified ? 'Justified' : 'Not Justified'
      });
    });

    return analysis.sort((a, b) => b.profitVsTotalCost - a.profitVsTotalCost);
  }, [mediaBuyerAnalysis, selectedPeriod]);

  if (!commissions?.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No commission data available
      </div>
    );
  }

  // Group commissions by status
  const activeCommissions = mediaBuyerAnalysis.filter(c => c.status === 'ACTIVE');
  const inactiveCommissions = mediaBuyerAnalysis.filter(c => c.status === 'INACTIVE');

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
            <option value="June 2025">June 2025</option>
            <option value="May 2025">May 2025</option>
            <option value="April 2025">April 2025</option>
            <option value="March 2025">March 2025</option>
            <option value="February 2025">February 2025</option>
          </select>
          
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
        </div>

        {showBaseSalaryAnalysis && (
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="30days">Last 30 Days</option>
            <option value="60days">Last 60 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="mtd">Month to Date</option>
            <option value="ytd">Year to Date</option>
            <option value="all">All Time</option>
          </select>
        )}
      </div>

      {/* Base Salary Analysis */}
      {showBaseSalaryAnalysis && baseSalaryAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Base Salary Justification Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Analyzing whether media buyers with base salaries are justifying their pay based on profit performance
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Media Buyer
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Base Pay ({selectedPeriod === 'mtd' ? 'MTD' : selectedPeriod === 'ytd' ? 'YTD' : selectedPeriod === 'all' ? 'All Time' : selectedPeriod.replace('days', 'D')})
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Commission Rate
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    Monthly Base Pay
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-300">
                    {selectedPeriod === 'mtd' ? 'MTD Profit' : selectedPeriod === 'ytd' ? 'YTD Profit' : selectedPeriod === 'all' ? 'All Time Profit' : `${selectedPeriod.replace('days', 'D')} Profit`}
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
                      {formatCurrency(analysis.basePayForPeriod)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                      {analysis.commissionRate.toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatCurrency(analysis.monthlyBasePay)}
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
                <div className="text-sm text-gray-600">Total Base Pay ({selectedPeriod === 'mtd' ? 'MTD' : selectedPeriod === 'ytd' ? 'YTD' : selectedPeriod === 'all' ? 'All Time' : selectedPeriod.replace('days', 'D')})</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(baseSalaryAnalysis.reduce((sum, a) => sum + a.basePayForPeriod, 0))}
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
                {showBaseSalaryAnalysis && (
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                )}
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