import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import _ from 'lodash';
// In your handler function

export async function processPLData(batchResponse) {
  try {
    console.log('Starting P&L data processing with batchResponse:', {
      hasData: !!batchResponse?.data,
      valueRangesCount: batchResponse?.data?.valueRanges?.length,
      allRanges: batchResponse?.data?.valueRanges?.map(r => r.range),
      sampleData: batchResponse?.data?.valueRanges?.[0]?.values?.[0]
    });

    const monthlyData = {};
    const summaryData = [];

    // Process all value ranges
    batchResponse.data.valueRanges.forEach((range, index) => {
      // Enhanced logging for sheet detection
      const sheetName = range.range.split('!')[0].replace(/'/g, '');
      console.log(`Processing sheet ${index}:`, {
        sheetName,
        range: range.range,
        hasValues: !!range.values,
        rowCount: range.values?.length,
        sampleRow: range.values?.[0]
      });

      // Process if we have values
      if (range.values && range.values.length > 1) {
        const monthlyRows = range.values.slice(1).map(row => {
          if (!row || row.length < 4) {
            console.log('Skipping invalid row:', row);
            return null;
          }
          return {
            DESCRIPTION: row[0]?.trim() || '',
            AMOUNT: parseFloat(row[1]?.replace(/[$,]/g, '') || '0'),
            CATEGORY: row[2]?.trim() || '',
            'Income/Expense': row[3]?.trim() || ''
          };
        }).filter(Boolean);

        // Calculate totals
        const { incomeData, expenseData, totalIncome, totalExpenses } = monthlyRows.reduce((acc, row) => {
          if (row['Income/Expense']?.toLowerCase() === 'income') {
            acc.incomeData.push(row);
            acc.totalIncome += row.AMOUNT;
          } else {
            acc.expenseData.push(row);
            acc.totalExpenses += row.AMOUNT;
          }
          return acc;
        }, { incomeData: [], expenseData: [], totalIncome: 0, totalExpenses: 0 });

        // Group expenses by category
        const categories = expenseData.reduce((acc, expense) => {
          const category = expense.CATEGORY || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(expense);
          return acc;
        }, {});

        monthlyData[sheetName] = {
          monthDataArray: monthlyRows,
          incomeData,
          expenseData,
          categories,
          totalIncome,
          totalExpenses
        };

        const netProfit = totalIncome - totalExpenses;
        const netPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        summaryData.push({
          Month: sheetName,
          Income: totalIncome,
          Expenses: totalExpenses,
          NetProfit: netProfit,
          'Net%': netPercent
        });

        console.log(`Processed ${sheetName} data:`, {
          totalIncome,
          totalExpenses,
          netProfit,
          netPercent,
          rowCount: monthlyRows.length,
          hasIncomeData: incomeData.length > 0,
          hasExpenseData: expenseData.length > 0
        });
      }
    });

    const result = { summary: summaryData, monthly: monthlyData };

    // Enhanced final logging
    console.log('Final processed P&L data:', {
      summaryCount: summaryData.length,
      monthlyCount: Object.keys(monthlyData).length,
      availableMonths: Object.keys(monthlyData),
      hasMarchData: !!monthlyData['March'],
      marchData: monthlyData['March'],
      sampleMonthData: monthlyData[Object.keys(monthlyData)[0]]
    });

    return result;

  } catch (error) {
    console.error('Error in processPLData:', error);
    throw new Error('Failed to process P&L data: ' + error.message);
  }
}