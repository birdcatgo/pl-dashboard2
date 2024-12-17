import React from 'react';
import _ from 'lodash';

const MonthlyPL = ({ monthlyData }) => {
  console.log('Monthly data received:', monthlyData);
  console.log('Raw Monthly Data:', JSON.stringify(monthlyData, null, 2));

  if (!monthlyData) return null;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Flatten all monthly data into a single array for grouping
  const allData = _(Object.values(monthlyData))
    .flatten()
    .value();

  // Separate data into Revenue (Income) and Expenses (Expense)
  const groupedData = _.groupBy(allData, 'Income/Expense');
  const revenueData = groupedData['Income'] || [];
  const expenseData = groupedData['Expense'] || [];

  // Group Revenue and Expense by Description
  const revenueByDescription = _.groupBy(revenueData, 'DESCRIPTION');
  const expenseByDescription = _.groupBy(expenseData, 'DESCRIPTION');

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Revenue Section */}
      <div>
        <h2 className="text-xl font-bold">Revenue</h2>
        {Object.entries(revenueByDescription).map(([description, items]) => (
          <details key={description} className="mb-4">
            <summary>
              <span className="font-bold">{description}</span>: {formatCurrency(_.sumBy(items, 'AMOUNT'))}
            </summary>
            <div className="mt-2 space-y-2">
              {items.map((item, index) => (
                <div key={index} className="p-2 border rounded bg-gray-50">
                  <div><strong>Description:</strong> {item.DESCRIPTION}</div>
                  <div><strong>Amount:</strong> {formatCurrency(item.AMOUNT)}</div>
                  <div><strong>Category:</strong> {item.CATEGORY}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Expense Section */}
      <div>
        <h2 className="text-xl font-bold">Expenses</h2>
        {Object.entries(expenseByDescription).map(([description, items]) => (
          <details key={description} className="mb-4">
            <summary>
              <span className="font-bold">{description}</span>: {formatCurrency(_.sumBy(items, 'AMOUNT'))}
            </summary>
            <div className="mt-2 space-y-2">
              {items.map((item, index) => (
                <div key={index} className="p-2 border rounded bg-gray-50">
                  <div><strong>Description:</strong> {item.DESCRIPTION}</div>
                  <div><strong>Amount:</strong> {formatCurrency(item.AMOUNT)}</div>
                  <div><strong>Category:</strong> {item.CATEGORY}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
return (
  <div>
    {Object.entries(monthlyData).map(([month, data]) => (
      <div key={month}>
        <h2>{month}</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Income/Expense</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{row.DESCRIPTION}</td>
                <td>{formatCurrency(row.AMOUNT)}</td>
                <td>{row.CATEGORY}</td>
                <td>{row['Income/Expense']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
);
export default MonthlyPL;
