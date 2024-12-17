import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

const formatCurrency = (num) => {
  const value = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.-]/g, '')) : num;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculatePercentage = (value, total) => {
  if (!total) return 0;
  return ((Math.abs(value) / Math.abs(total)) * 100).toFixed(1);
};

const CategoryDropdown = ({ category, items, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = items.reduce((sum, item) => sum + Math.abs(item.AMOUNT), 0);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors"
      >
        <span className="font-medium">{category}</span>
        <span className="text-right text-sm text-gray-500">{`${type} Total: ${formatCurrency(total)}`}</span>
      </button>
      {isExpanded && (
        <div className="mt-4 space-y-2 pl-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
              <span>{item.DESCRIPTION}</span>
              <span className="font-medium text-gray-700">{formatCurrency(item.AMOUNT)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MonthDetail = ({ data }) => {
  const monthData = Array.isArray(data) ? data : [];

  const groupByCategory = (data, type) => {
    return data
      .filter((item) => item['Income/Expense'] === type)
      .reduce((acc, item) => {
        const category = item.CATEGORY;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {});
  };

  const incomeGrouped = groupByCategory(monthData, 'Income');
  const expenseGrouped = groupByCategory(monthData, 'Expense');

  const totalIncome = Object.values(incomeGrouped).flat().reduce((sum, item) => sum + Math.abs(item.AMOUNT), 0);
  const totalExpenses = Object.values(expenseGrouped).flat().reduce((sum, item) => sum + Math.abs(item.AMOUNT), 0);

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(incomeGrouped).map(([category, items]) => (
            <CategoryDropdown key={category} category={category} items={items} type="Revenue" />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(expenseGrouped).map(([category, items]) => (
            <CategoryDropdown key={category} category={category} items={items} type="Expense" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthDetail;
