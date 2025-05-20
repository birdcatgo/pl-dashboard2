import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import _ from 'lodash';
// In your handler function

export async function processPLData(batchResponse) {
  try {
    // Add debug logging for the raw response
    console.log('Processing PL data from batch response:', {
      hasData: !!batchResponse?.data?.valueRanges,
      rangeCount: batchResponse?.data?.valueRanges?.length
    });

    const monthlyData = {};
    const summaryData = [];

    batchResponse.data.valueRanges.forEach((range, index) => {
      // Enhanced logging for sheet detection
      console.log(`Processing sheet ${index}:`, {
        range: range.range,
        hasValues: !!range.values,
        valueCount: range.values?.length
      });

      // Get sheet name from range
      const sheetName = range.range.split('!')[0];
      console.log(`Processing sheet: ${sheetName}`);

      // Process if we have values
      if (range.values && range.values.length > 1) {
        const monthlyRows = range.values.slice(1).map(row => {
          if (!row || row.length < 4) {
            console.log('Skipping invalid row:', row);
            return null;
          }
          return {
            Description: row[0]?.trim() || '',
            Amount: parseFloat(row[1]?.replace(/[$,]/g, '') || '0'),
            Category: row[2]?.trim() || '',
            'Income/Expense': row[3]?.trim() || ''
          };
        }).filter(Boolean);

        // Calculate totals with debug logging
        const { incomeData, expenseData, totalIncome, totalExpenses } = monthlyRows.reduce((acc, row) => {
          console.log('Processing row:', {
            description: row.Description,
            amount: row.Amount,
            category: row.Category,
            type: row['Income/Expense']
          });

          if (row['Income/Expense']?.toLowerCase() === 'income') {
            acc.incomeData.push(row);
            acc.totalIncome += row.Amount;
          } else {
            acc.expenseData.push(row);
            acc.totalExpenses += row.Amount;
          }
          return acc;
        }, { incomeData: [], expenseData: [], totalIncome: 0, totalExpenses: 0 });

        // Group expenses by category with debug logging
        const categories = expenseData.reduce((acc, expense) => {
          const category = expense.Category || 'Uncategorized';
          console.log('Grouping expense by category:', {
            description: expense.Description,
            amount: expense.Amount,
            category
          });
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

        // Log the processed data for this month
        console.log(`Processed data for ${sheetName}:`, {
          incomeCount: incomeData.length,
          expenseCount: expenseData.length,
          totalIncome,
          totalExpenses,
          categoryCount: Object.keys(categories).length
        });

        const netProfit = totalIncome - totalExpenses;
        const netPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        summaryData.push({
          Month: sheetName,
          Income: totalIncome,
          Expenses: totalExpenses,
          NetProfit: netProfit,
          'Net%': netPercent
        });
      }
    });

    // Log the final processed data
    console.log('Final processed PL data:', {
      monthCount: Object.keys(monthlyData).length,
      summaryCount: summaryData.length,
      availableMonths: Object.keys(monthlyData)
    });

    return {
      monthly: monthlyData,
      summary: summaryData
    };
  } catch (error) {
    console.error('Error processing PL data:', error);
    throw error;
  }
}