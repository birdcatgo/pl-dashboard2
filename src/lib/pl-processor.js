import { parse, isValid, startOfDay, endOfDay, format, subDays, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import _ from 'lodash';
// In your handler function

export async function processPLData(response) {
  try {
    const monthlyData = {};
    const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const summaryData = [];
    
    months.forEach(month => {
      const monthRange = `${month}!A:D`;
      const monthRows = response.valueRanges?.find(range => 
        range.range.startsWith(month))?.values || [];
        
      if (monthRows.length > 1) { // Skip header row
        monthlyData[month] = monthRows.slice(1).map(row => ({
          DESCRIPTION: row[0] || '',
          AMOUNT: parseFloat(row[1]?.replace(/[$,]/g, '') || 0),
          CATEGORY: row[2] || '',
          'Income/Expense': row[3] || ''
        }));

        // Calculate summary data
        const income = monthlyData[month]
          .filter(row => row['Income/Expense'] === 'Income')
          .reduce((sum, row) => sum + row.AMOUNT, 0);
          
        const expenses = monthlyData[month]
          .filter(row => row['Income/Expense'] === 'Expense')
          .reduce((sum, row) => sum + Math.abs(row.AMOUNT), 0);

        summaryData.push({
          Month: month,
          Income: income,
          Expenses: expenses,
          NetProfit: income - expenses
        });
      }
    });

    return { summary: summaryData, monthly: monthlyData };
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return { summary: [], monthly: {} };
  }
}