import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import _ from 'lodash';
// In your handler function

export async function processPLData(response) {
  try {
    const monthlyData = {};
    const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January'];
    const summaryData = [];
    
    months.forEach(month => {
      const monthRange = `${month}!A:D`;
      const monthRows = response.valueRanges?.find(range => 
        range.range.startsWith(month))?.values || [];
        
      if (monthRows.length > 1) { // Skip header row
        // Process monthly data with proper grouping
        const processedRows = monthRows.slice(1).map(row => ({
          DESCRIPTION: row[0]?.trim() || '',
          AMOUNT: row[1]?.replace(/[$,]/g, '') || '0',
          CATEGORY: row[2]?.trim() || '',
          'Income/Expense': row[3]?.trim() || ''
        }));

        // Group data by Income/Expense type
        const incomeData = processedRows.filter(row => 
          row['Income/Expense'] === 'Income'
        ).sort((a, b) => parseFloat(a.AMOUNT) - parseFloat(b.AMOUNT));

        const expenseData = processedRows.filter(row => 
          row['Income/Expense'] === 'Expense'
        );

        // Group expenses by category
        const categories = expenseData.reduce((acc, row) => {
          const category = row.CATEGORY || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(row);
          return acc;
        }, {});

        // Calculate totals
        const totalIncome = incomeData.reduce((sum, row) => 
          sum + parseFloat(row.AMOUNT), 0
        );

        const totalExpenses = expenseData.reduce((sum, row) => 
          sum + parseFloat(row.AMOUNT), 0
        );

        monthlyData[month] = {
          monthDataArray: processedRows,
          incomeData,
          expenseData,
          categories,
          totalIncome,
          totalExpenses
        };

        // Add to summary data
        summaryData.push({
          Month: month,
          Income: totalIncome,
          Expenses: totalExpenses,
          NetProfit: totalIncome - totalExpenses
        });
      }
    });

    return { summary: summaryData, monthly: monthlyData };
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return { summary: [], monthly: {} };
  }
}