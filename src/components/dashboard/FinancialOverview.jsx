import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, subMonths, format as formatDate } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Area, ReferenceLine } from 'recharts';
import FinancialSnapshot from './FinancialSnapshot';

const SLACK_WEBHOOK_URL = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;

// Move parseAmount to the top of the file, after formatCurrency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Single parseAmount implementation to be used throughout the component
const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[$,]/g, '') || '0');
  }
  return 0;
};

const ExpenseDetails = ({ expenses, onClose, isAdvertising = false }) => {
  const [selectedForCancellation, setSelectedForCancellation] = useState([]);
  const [selectedForReview, setSelectedForReview] = useState([]);
  const [nonC2FItems, setNonC2FItems] = useState([]);
  const [notes, setNotes] = useState({});
  const [isSending, setIsSending] = useState(false);

  // Create unique identifiers for expenses
  const getExpenseKey = (expense) => {
    return `${expense.DESCRIPTION}_${expense.AMOUNT}`;
  };

  const isExpenseSelected = (expense, savedKeys) => {
    return savedKeys.includes(getExpenseKey(expense));
  };

  // Load saved states from localStorage
  useEffect(() => {
    const savedNonC2F = localStorage.getItem('nonC2FExpenses');
    const savedForReview = localStorage.getItem('expensesForReview');
    const savedForCancellation = localStorage.getItem('expensesForCancellation');
    const savedNotes = localStorage.getItem('expenseNotes');

    if (savedNonC2F) {
      const savedKeys = JSON.parse(savedNonC2F);
      setNonC2FItems(expenses.filter(expense => isExpenseSelected(expense, savedKeys)));
    }

    if (savedForReview) {
      const savedKeys = JSON.parse(savedForReview);
      setSelectedForReview(expenses.filter(expense => isExpenseSelected(expense, savedKeys)));
    }

    if (savedForCancellation) {
      const savedKeys = JSON.parse(savedForCancellation);
      setSelectedForCancellation(expenses.filter(expense => isExpenseSelected(expense, savedKeys)));
    }

    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, [expenses]);

  const saveChanges = () => {
    localStorage.setItem('nonC2FExpenses', JSON.stringify(nonC2FItems.map(getExpenseKey)));
    localStorage.setItem('expensesForReview', JSON.stringify(selectedForReview.map(getExpenseKey)));
    localStorage.setItem('expensesForCancellation', JSON.stringify(selectedForCancellation.map(getExpenseKey)));
    localStorage.setItem('expenseNotes', JSON.stringify(notes));
  };

  const handleToggleNonC2F = (expense) => {
    const newNonC2F = nonC2FItems.includes(expense)
      ? nonC2FItems.filter(e => e !== expense)
      : [...nonC2FItems, expense];
    setNonC2FItems(newNonC2F);
  };

  const handleToggleSelection = (expense) => {
    if (selectedForCancellation.includes(expense)) {
      setSelectedForCancellation(selectedForCancellation.filter(e => e !== expense));
    } else {
      setSelectedForCancellation([...selectedForCancellation, expense]);
    }
  };

  const handleToggleReview = (expense) => {
    if (selectedForReview.includes(expense)) {
      setSelectedForReview(selectedForReview.filter(e => e !== expense));
    } else {
      setSelectedForReview([...selectedForReview, expense]);
    }
  };

  const handleNoteChange = (expense, note) => {
    const newNotes = { ...notes, [expense.DESCRIPTION]: note };
    setNotes(newNotes);
    localStorage.setItem('expenseNotes', JSON.stringify(newNotes));
  };

  const sendToSlack = async () => {
    if (selectedForCancellation.length === 0 && selectedForReview.length === 0) return;

    setIsSending(true);
    const cancellationTotal = selectedForCancellation.reduce((sum, expense) => 
      sum + parseAmount(expense.AMOUNT), 0
    );
    const reviewTotal = selectedForReview.reduce((sum, expense) => 
      sum + parseAmount(expense.AMOUNT), 0
    );

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📋 Expense Review & Cancellation Report",
            emoji: true
          }
        }
      ]
    };

    // Add Review Section if there are items to review
    if (selectedForReview.length > 0) {
      message.blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*🔍 Items To Be Reviewed*"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: selectedForReview.map(expense => 
              `• *${expense.DESCRIPTION}* - ${formatCurrency(parseAmount(expense.AMOUNT))}/month`
            ).join('\n')
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Total Under Review:* ${formatCurrency(reviewTotal)}`
          }
        }
      );
    }

    // Add Cancellation Section if there are items to cancel
    if (selectedForCancellation.length > 0) {
      message.blocks.push(
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*🚫 Items To Be Cancelled*"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: selectedForCancellation.map(expense => 
              `• *${expense.DESCRIPTION}* - ${formatCurrency(parseAmount(expense.AMOUNT))}/month`
            ).join('\n')
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Total Monthly Savings:* ${formatCurrency(cancellationTotal)}`
          }
        }
      );
    }

    // Add footer
    message.blocks.push(
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🕒 Generated on ${new Date().toLocaleDateString()}`
          }
        ]
      }
    );

    try {
      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        alert('Successfully sent to Slack!');
        setSelectedForCancellation([]);
        setSelectedForReview([]);
      } else {
        throw new Error('Failed to send to Slack');
      }
    } catch (error) {
      console.error('Error sending to Slack:', error);
      alert('Failed to send to Slack. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Expense Details</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={saveChanges}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={sendToSlack}
              disabled={isSending || (selectedForCancellation.length === 0 && selectedForReview.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send to Slack'}
            </button>
            <button
              onClick={() => {
                saveChanges();
                onClose();
              }}
              className="p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Non C2F
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                To Be Reviewed
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                To Be Cancelled
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {expense.DESCRIPTION}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatCurrency(parseAmount(expense.AMOUNT))}
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={nonC2FItems.includes(expense)}
                    onChange={() => handleToggleNonC2F(expense)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedForReview.includes(expense)}
                    onChange={() => handleToggleReview(expense)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedForCancellation.includes(expense)}
                    onChange={() => handleToggleSelection(expense)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick, variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    warning: 'bg-red-50 hover:bg-red-100 text-red-700',
    success: 'bg-green-50 hover:bg-green-100 text-green-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} p-3 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
};

const ExpenseCategory = ({ title, monthlyData, plData }) => {
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  const handleClick = () => {
    if (title.toLowerCase().includes('subscription')) {
      // Get the most recent month's data
      const mostRecentMonth = Object.entries(plData.monthly)
        .filter(([month]) => ['February', 'January', 'December'].includes(month))
        .sort(([monthA], [monthB]) => {
          const monthOrder = { 'February': 3, 'January': 2, 'December': 1 };
          return monthOrder[monthB] - monthOrder[monthA];
        })[0];

      if (mostRecentMonth) {
        setShowExpenseDetails(true);
      }
    }
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getTrendExplanation = (currentAmount, previousAmount, monthDisplay) => {
    const trend = calculateTrend(currentAmount, previousAmount);
    const difference = Math.abs(currentAmount - previousAmount);
    return `${title} ${trend > 0 ? 'increased' : 'decreased'} by ${formatCurrency(difference)} (${Math.abs(trend)}%) compared to ${monthDisplay}`;
  };

  // Ensure data is in chronological order (Feb, Jan, Dec)
  const orderedData = [
    monthlyData.find(d => d.month === 'February 2025'),
    monthlyData.find(d => d.month === 'January 2025'),
    monthlyData.find(d => d.month === 'December 2024')
  ].filter(Boolean);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">
        {title}
      </h3>
      <div 
        className={`bg-white rounded-lg shadow ${
          title.toLowerCase().includes('subscription') ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={handleClick}
      >
        <div className="grid grid-cols-3 gap-4">
          {orderedData.map((data, index) => {
            const nextMonth = orderedData[index + 1];
            const trend = nextMonth ? calculateTrend(data.amount, nextMonth.amount) : 0;

            return (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">{data.month}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-lg font-semibold">{formatCurrency(data.amount)}</div>
                  {index === 0 && nextMonth && (
                    <div className="relative group">
                      <div className={`text-sm ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
                      </div>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                        {getTrendExplanation(data.amount, nextMonth.amount, nextMonth.month)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showExpenseDetails && (
        <ExpenseDetails
          expenses={Object.entries(plData.monthly)
            .filter(([month]) => ['February', 'January', 'December'].includes(month))
            .sort(([monthA], [monthB]) => {
              const monthOrder = { 'February': 3, 'January': 2, 'December': 1 };
              return monthOrder[monthB] - monthOrder[monthA];
            })[0]?.[1]?.expenseData?.filter(expense => {
              const category = expense.CATEGORY?.toLowerCase() || '';
              const description = expense.DESCRIPTION?.toLowerCase() || '';
              return category.includes('subscription') || 
                     category.includes('software') || 
                     category.includes('saas') || 
                     category.includes('service') ||
                     description.includes('subscription') ||
                     description.includes('software') ||
                     description.includes('license');
            }) || []}
          onClose={() => setShowExpenseDetails(false)}
          isAdvertising={false}
        />
      )}
    </div>
  );
};

const ExportModal = ({ onClose, monthlyData, plData }) => {
  const exportToCSV = () => {
    // Prepare the data
    const headers = ['Category', 'Description', 'November 2024', 'December 2024', 'January 2025'];
    const rows = [];

    // Helper function to get month's amount
    const getMonthAmount = (expense, monthName) => {
      return expense.amounts[monthName] || 0;
    };

    // Add data for each category
    ['Payroll', 'Advertising', 'Subscriptions', 'Miscellaneous'].forEach(category => {
      rows.push([category, '', '', '', '']); // Category header

      // Get expenses for this category
      const monthExpenses = plData.monthly['January']?.expenseData.filter(e => {
        const expenseCategory = e.CATEGORY?.toLowerCase() || '';
        if (category === 'Payroll') {
          return expenseCategory.includes('payroll') || expenseCategory.includes('salary');
        } else if (category === 'Advertising') {
          return expenseCategory.includes('ad') || expenseCategory.includes('marketing');
        } else if (category === 'Subscriptions') {
          return expenseCategory.includes('subscription') || expenseCategory.includes('software');
        } else {
          return !expenseCategory.includes('payroll') &&
                 !expenseCategory.includes('salary') &&
                 !expenseCategory.includes('ad') &&
                 !expenseCategory.includes('marketing') &&
                 !expenseCategory.includes('subscription') &&
                 !expenseCategory.includes('software');
        }
      }) || [];

      // Add each expense row
      monthExpenses.forEach(expense => {
        rows.push([
          '',
          expense.DESCRIPTION,
          expense.AMOUNT || '0',
          expense.AMOUNT || '0',
          expense.AMOUNT || '0'
        ]);
      });

      // Add category total
      const total = monthExpenses.reduce((sum, expense) => 
        sum + (parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) || 0), 0
      );
      rows.push(['', `${category} Total`, total, total, total]);
      rows.push([]); // Empty row for spacing
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Create a printable version of the data
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; }
            .category { font-weight: bold; background-color: #f1f1f1; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <h2>Last 3 Months Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>November 2024</th>
                <th>December 2024</th>
                <th>January 2025</th>
              </tr>
            </thead>
            <tbody>
              ${['Payroll', 'Advertising', 'Subscriptions', 'Miscellaneous']
                .map(category => {
                  const expenses = plData.monthly['January']?.expenseData
                    .filter(e => e.CATEGORY?.toLowerCase().includes(category.toLowerCase())) || [];
                  
                  return `
                    <tr class="category">
                      <td colspan="5">${category}</td>
                    </tr>
                    ${expenses.map(expense => `
                      <tr>
                        <td></td>
                        <td>${expense.DESCRIPTION}</td>
                        <td>${formatCurrency(expense.AMOUNT)}</td>
                        <td>${formatCurrency(expense.AMOUNT)}</td>
                        <td>${formatCurrency(expense.AMOUNT)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total">
                      <td></td>
                      <td>Total</td>
                      <td colspan="3">${formatCurrency(
                        expenses.reduce((sum, expense) => 
                          sum + (parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) || 0), 0
                        )
                      )}</td>
                    </tr>
                    <tr><td colspan="5">&nbsp;</td></tr>
                  `;
                }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Export Report</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <button 
            onClick={() => {
              exportToCSV();
              onClose();
            }}
            className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
          >
            Export as CSV
          </button>
          <button 
            onClick={() => {
              exportToPDF();
              onClose();
            }}
            className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
          >
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseActions = ({ expense, onAction }) => {
  const [status, setStatus] = useState({
    flagged: false,
    hasNotes: false,
    reviewed: false
  });

  const handleAction = (action) => {
    switch (action) {
      case 'flag':
        setStatus(prev => ({ ...prev, flagged: !prev.flagged }));
        onAction({ type: 'flag', expense });
        break;
      case 'note':
        // Show note modal
        onAction({ type: 'note', expense });
        setStatus(prev => ({ ...prev, hasNotes: true }));
        break;
      case 'review':
        setStatus(prev => ({ ...prev, reviewed: !prev.reviewed }));
        onAction({ type: 'review', expense });
        break;
    }
  };

  return (
    <div className="flex justify-center space-x-2">
      <button 
        className={`${status.flagged ? 'text-red-600' : 'text-yellow-600 hover:text-yellow-800'} mx-2`}
        onClick={() => handleAction('flag')}
        title={status.flagged ? 'Remove Flag' : 'Flag for Review'}
      >
        {status.flagged ? '🚩' : '⚐'}
      </button>
      <button 
        className={`${status.hasNotes ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'} mx-2`}
        onClick={() => handleAction('note')}
        title="Add Note"
      >
        {status.hasNotes ? '📝✓' : '📝'}
      </button>
      <button 
        className={`${status.reviewed ? 'text-green-600' : 'text-gray-600 hover:text-gray-800'} mx-2`}
        onClick={() => handleAction('review')}
        title={status.reviewed ? 'Mark as Unreviewed' : 'Mark as Reviewed'}
      >
        {status.reviewed ? '✅' : '☐'}
      </button>
    </div>
  );
};

const NoteModal = ({ expense, onClose, onSave }) => {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add Note</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Expense: {expense.DESCRIPTION}</p>
            <p className="text-sm text-gray-600 mb-4">Amount: {formatCurrency(expense.AMOUNT)}</p>
          </div>
          <textarea
            className="w-full h-32 p-2 border rounded-lg"
            placeholder="Enter your note here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {
              onSave(note);
              onClose();
            }}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

const HighExpensesModal = ({ expenses, monthlyData, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const handleExpenseAction = (action) => {
    switch (action.type) {
      case 'flag':
        console.log('Flagged expense:', action.expense);
        break;
      case 'note':
        setSelectedExpense(action.expense);
        setShowNoteModal(true);
        break;
      case 'review':
        console.log('Reviewed expense:', action.expense);
        break;
    }
  };

  const handleNoteSave = (note) => {
    console.log('Saved note for expense:', selectedExpense, note);
    // Add your note saving logic here
  };

  // Get expenses grouped by category for a month
  const getCategoryBreakdown = (month) => {
    if (!monthlyData || !monthlyData[month]?.expenseData) return [];

    const categories = monthlyData[month].expenseData.reduce((acc, expense) => {
      const category = expense.CATEGORY || 'Uncategorized';
      // Ensure we're handling the amount correctly
      const amount = typeof expense.AMOUNT === 'string' ? 
        parseFloat(expense.AMOUNT.replace(/[$,]/g, '')) : 
        parseFloat(expense.AMOUNT) || 0;

      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, expenses: [] };
      }
      
      // Store the full expense object with parsed amount
      acc[category].expenses.push({
        ...expense,
        AMOUNT: amount // Store the parsed amount
      });
      acc[category].total += amount;
      acc[category].count += 1;
      
      return acc;
    }, {});

    return Object.entries(categories)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        expenses: data.expenses.sort((a, b) => b.AMOUNT - a.AMOUNT) // Sort by amount descending
      }))
      .sort((a, b) => b.total - a.total);
  };

  // Show category details for selected month
  if (selectedMonth && selectedCategory) {
    const categoryData = getCategoryBreakdown(selectedMonth)
      .find(cat => cat.category === selectedCategory);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Categories
              </button>
              <h3 className="text-lg font-medium">
                {selectedCategory} Expenses for {selectedMonth}
              </h3>
              <p className="text-sm text-gray-600">
                Total: {formatCurrency(categoryData.total)} ({categoryData.count} transactions)
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="bg-white rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.expenses.map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.DESCRIPTION}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(expense.AMOUNT)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Show categories for selected month
  if (selectedMonth) {
    const categoryBreakdown = getCategoryBreakdown(selectedMonth);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <button 
                onClick={() => setSelectedMonth(null)}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Months
              </button>
              <h3 className="text-lg font-medium">Expense Categories for {selectedMonth}</h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div 
                key={index}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setSelectedCategory(category.category)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-lg">{category.category}</h4>
                    <p className="text-sm text-gray-600">
                      {category.count} {category.count === 1 ? 'expense' : 'expenses'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {formatCurrency(category.total)}
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no month selected, show month overview
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">High Expense Review</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          {Object.entries(expenses).map(([month, amount]) => (
            <div 
              key={month} 
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => setSelectedMonth(month)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-lg">{month}</h4>
                  <p className="text-sm text-gray-600">Click to view detailed breakdown</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-medium ${
                    amount > 100000 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {amount > 100000 ? '⚠️ High Spend Month' : 'Normal Range'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuickActions = ({ insights, plData }) => {
  const [showExport, setShowExport] = useState(false);
  const [showHighExpenses, setShowHighExpenses] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickAction
          icon="📊"
          label="Export Report"
          onClick={() => setShowExport(true)}
        />
        <QuickAction
          icon="⚠️"
          label="Review High Expenses"
          onClick={() => setShowHighExpenses(true)}
          variant="warning"
        />
      </div>

      {showExport && (
        <ExportModal 
          onClose={() => setShowExport(false)} 
          monthlyData={insights}
          plData={plData}
        />
      )}
      {showHighExpenses && (
        <HighExpensesModal 
          expenses={insights.reduce((acc, month) => ({
            ...acc,
            [format(month.month, 'MMMM')]: month.total
          }), {})}
          monthlyData={plData.monthly}
          onClose={() => setShowHighExpenses(false)} 
        />
      )}
    </>
  );
};

const BreakEvenAnalysis = ({ monthlyData }) => {
  // Calculate averages across the months
  const averages = monthlyData.reduce((acc, month) => {
    acc.totalRevenue = (acc.totalRevenue || 0) + month.revenue;
    acc.totalExpenses = (acc.totalExpenses || 0) + month.total;
    acc.totalPayroll = (acc.totalPayroll || 0) + month.payroll;
    acc.totalSubscriptions = (acc.totalSubscriptions || 0) + month.subscriptions;
    return acc;
  }, {});

  // Calculate monthly averages
  const monthlyAverage = {
    revenue: averages.totalRevenue / monthlyData.length,
    expenses: averages.totalExpenses / monthlyData.length,
    payroll: averages.totalPayroll / monthlyData.length,
    subscriptions: averages.totalSubscriptions / monthlyData.length,
    net: (averages.totalRevenue - averages.totalExpenses) / monthlyData.length
  };

  // Calculate revenue targets
  const revenueTargets = {
    breakEven: monthlyAverage.expenses, // Just cover expenses
    comfort: monthlyAverage.expenses * 1.2, // 20% above expenses
    growth: monthlyAverage.expenses * 1.5, // 50% above expenses
    scaling: monthlyAverage.expenses * 2, // 100% above expenses
  };

  // Generate insights based on the data
  const generateInsights = () => {
    const insights = [];
    
    // Revenue vs Target insights
    if (monthlyAverage.revenue < revenueTargets.breakEven) {
      insights.push({
        type: 'warning',
        message: 'Currently operating below break-even point. Immediate action needed.'
      });
    }

    // Expense pattern insights
    const highestExpenseCategory = monthlyData.reduce((acc, month) => {
      const categories = {
        'Payroll': month.payroll,
        'Ad Spend': month.adSpend,
        'Subscriptions': month.subscriptions,
        'Miscellaneous': month.miscellaneous
      };
      const highest = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      return { category: highest[0], amount: highest[1] };
    }, {});

    insights.push({
      type: 'info',
      message: `Largest expense category is ${highestExpenseCategory.category} at ${formatCurrency(highestExpenseCategory.amount)}/month`
    });

    // Growth insights
    const monthOverMonthGrowth = ((monthlyData[2]?.revenue - monthlyData[0]?.revenue) / monthlyData[0]?.revenue * 100).toFixed(1);
    insights.push({
      type: 'info',
      message: `Revenue ${monthOverMonthGrowth > 0 ? 'grew' : 'declined'} by ${Math.abs(monthOverMonthGrowth)}% over 3 months`
    });

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Analysis</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">Monthly Fixed Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Payroll</dt>
                <dd className="text-sm font-medium">{formatCurrency(monthlyAverage.payroll)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Subscriptions</dt>
                <dd className="text-sm font-medium">{formatCurrency(monthlyAverage.subscriptions)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-sm font-medium">Total Fixed Costs</dt>
                <dd className="text-sm font-medium">
                  {formatCurrency(monthlyAverage.payroll + monthlyAverage.subscriptions)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">Break-Even Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Average Monthly Revenue</dt>
                <dd className="text-sm font-medium">{formatCurrency(averages.totalRevenue / monthlyData.length)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Profit Margin</dt>
                <dd className="text-sm font-medium">
                  {(((averages.totalRevenue - averages.totalExpenses) / averages.totalRevenue) * 100).toFixed(1)}%
                </dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-sm font-medium">Break-Even Revenue Needed</dt>
                <dd className="text-sm font-medium text-blue-700">{formatCurrency(averages.totalExpenses / monthlyData.length)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Revenue Targets Card */}
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="text-base">Revenue Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Break-even Target</dt>
                <dd className="text-sm font-medium">{formatCurrency(revenueTargets.breakEven)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Comfort Target (20% margin)</dt>
                <dd className="text-sm font-medium">{formatCurrency(revenueTargets.comfort)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Growth Target (50% margin)</dt>
                <dd className="text-sm font-medium">{formatCurrency(revenueTargets.growth)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-sm font-medium">Scaling Target (100% margin)</dt>
                <dd className="text-sm font-medium text-green-700">{formatCurrency(revenueTargets.scaling)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Insights Card */}
        <Card className="bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li 
                  key={index}
                  className={`text-sm ${
                    insight.type === 'warning' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  • {insight.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ExpenseComparisonTable = ({ monthlyData, plData }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Add helper function for name normalization
  const normalizeExpenseName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[.,\-_&\/\\|]+/g, ' ')
      .replace(/\.(com|io|ai|net|org)$/g, '')
      .replace(/\b(inc|llc|ltd|subscription|license|platform)\b/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  };

  // Add helper function for finding similar names
  const findSimilarExpense = (expenses = [], name) => {
    if (!expenses || !name) return null;
    const normalizedName = normalizeExpenseName(name);
    return expenses.find(e => normalizeExpenseName(e.name) === normalizedName);
  };

  // Initialize categories with empty arrays
  const initialCategories = {
    payroll: [],
    advertising: [],
    subscriptions: [],
    other: []
  };

  // Process expenses by category
  const categories = monthlyData.reduce((acc, { month }) => {
    const monthName = format(month, 'MMMM');
    const monthExpenses = plData.monthly[monthName]?.expenseData || [];

    monthExpenses.forEach(expense => {
      const category = expense.CATEGORY?.toLowerCase() || '';
      const name = expense.DESCRIPTION || '';
      let targetCategory;

      if (category.includes('payroll') || category.includes('salary')) {
        targetCategory = 'payroll';
      } else if (category.includes('advertising') || category.includes('ad spend')) {
        targetCategory = 'advertising';
      } else if (category.includes('subscription') || category.includes('software')) {
        targetCategory = 'subscriptions';
      } else {
        targetCategory = 'other';
      }

      // Use parseAmount helper instead of direct parsing
      const amount = parseAmount(expense.AMOUNT);
      const existingExpense = findSimilarExpense(acc[targetCategory], name);

      if (existingExpense) {
        existingExpense.amounts[monthName] = (existingExpense.amounts[monthName] || 0) + amount;
      } else {
        acc[targetCategory].push({
          name,
          normalizedName: normalizeExpenseName(name),
          amounts: { [monthName]: amount }
        });
      }
    });

    return acc;
  }, initialCategories);

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Analysis by Category</h3>
      <div className="space-y-4">
        {Object.entries(categories).map(([category, expenses]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <span className="font-medium capitalize">{category}</span>
                <span className="text-sm text-gray-500">
                  {expenses.length} items
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">
                  {expandedCategory === category ? '▼' : '▶'}
                </span>
              </div>
            </button>

            {expandedCategory === category && (
              <div className="divide-y divide-gray-200">
                {expenses.map((expense, index) => (
                  <div key={index} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span>{expense.name}</span>
                      <div className="space-x-4">
                        {Object.entries(expense.amounts).map(([month, amount]) => (
                          <span key={month} className="text-gray-600">
                            {formatCurrency(amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const IncomeComparisonTable = ({ monthlyData, plData }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Single category for network revenue
  const networkRevenue = {
    name: 'Network Revenue',
    sources: []
  };
  
  // Collect all revenue
  monthlyData.forEach(({ month }) => {
    const monthName = format(month, 'MMMM');
    const monthIncome = plData.monthly[monthName]?.incomeData || [];
    
    monthIncome.forEach(income => {
      const name = income.DESCRIPTION;
      const amount = parseAmount(income.AMOUNT);
      const existingSource = networkRevenue.sources.find(s => s.name === name);

      if (existingSource) {
        existingSource.amounts[monthName] = (existingSource.amounts[monthName] || 0) + amount;
      } else {
        networkRevenue.sources.push({
          name,
          amounts: { [monthName]: amount }
        });
      }
    });
  });

  // Calculate total monthly revenue
  const categoryTotal = monthlyData.reduce((total, { month }) => {
    const monthName = format(month, 'MMMM');
    return total + networkRevenue.sources.reduce((sum, source) => 
      sum + (source.amounts[monthName] || 0), 0
    );
  }, 0) / monthlyData.length;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analysis</h3>
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedCategory(expandedCategory ? null : 'revenue')}
          className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <span className="font-medium">Network Revenue</span>
            <span className="text-sm text-gray-500">
              {networkRevenue.sources.length} sources
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-medium">{formatCurrency(categoryTotal)}/mo avg</span>
            <span className="text-gray-500">
              {expandedCategory ? '▼' : '▶'}
            </span>
          </div>
        </button>
        
        {expandedCategory && (
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              <div>Source</div>
              {monthlyData.map(({ month }) => (
                <div key={month} className="text-right">{format(month, 'MMM yyyy')}</div>
              ))}
            </div>
            {networkRevenue.sources
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((source, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 px-4 py-2 text-sm hover:bg-gray-50">
                  <div className="font-medium">{source.name}</div>
                  {monthlyData.map(({ month }) => {
                    const monthName = format(month, 'MMMM');
                    const amount = source.amounts[monthName] || 0;
                    const prevMonth = monthlyData[monthlyData.indexOf({ month }) - 1];
                    const prevAmount = prevMonth ? source.amounts[format(prevMonth.month, 'MMMM')] || 0 : 0;
                    const growth = prevAmount ? 
                      (((amount - prevAmount) / prevAmount) * 100).toFixed(1) : 
                      '0';
                    
                    return (
                      <div key={month} className="text-right">
                        <div>{formatCurrency(amount)}</div>
                        {growth !== '0' && (
                          <div className={`text-xs ${growth.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                            {growth.includes('-') ? '↓' : '↑'} {Math.abs(parseFloat(growth))}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RevenueDetails = ({ revenues, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Revenue Breakdown</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">Source</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {revenues?.sort((a, b) => a.DESCRIPTION.localeCompare(b.DESCRIPTION)).map((revenue, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2">{revenue.DESCRIPTION || 'N/A'}</td>
                <td className="py-2 text-right">{formatCurrency(parseFloat(revenue.AMOUNT.replace(/[$,]/g, '')) || 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="py-2 font-medium">Total Revenue</td>
              <td className="py-2 text-right font-medium">
                {formatCurrency(
                  revenues?.reduce((sum, revenue) => 
                    sum + (parseFloat(revenue.AMOUNT.replace(/[$,]/g, '')) || 0), 0
                  ) || 0
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const RevenueCategory = ({ monthlyData, plData }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  const calculateTrend = () => {
    if (monthlyData.length < 2) return 0;
    const oldestAmount = monthlyData[0].amount;
    const newestAmount = monthlyData[monthlyData.length - 1].amount;
    return oldestAmount ? ((newestAmount - oldestAmount) / oldestAmount) * 100 : 0;
  };

  const trend = calculateTrend();

  const getRevenuesForMonth = (monthDate) => {
    const monthName = format(monthDate, 'MMMM');
    return plData.monthly[monthName]?.incomeData || [];
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Revenue</h3>
      <div className="grid grid-cols-3 gap-4">
        {monthlyData.map((data, index) => (
          <div 
            key={index} 
            className="bg-green-50 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-green-100"
            onClick={() => {
              setSelectedMonth(data.month);
              setShowDetails(true);
            }}
          >
            <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-lg font-semibold">{formatCurrency(data.amount)}</div>
              {index === monthlyData.length - 1 && trend !== 0 && (
                <div className={`text-sm ${
                  trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend > 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showDetails && selectedMonth && (
        <RevenueDetails 
          revenues={getRevenuesForMonth(selectedMonth)}
          onClose={() => {
            setShowDetails(false);
            setSelectedMonth(null);
          }}
        />
      )}
    </div>
  );
};

const ProfitabilitySnapshot = ({ monthlyData }) => {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Monthly Performance</h3>
      <div className="grid grid-cols-3 gap-4">
        {monthlyData.map((data, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-3">{format(data.month, 'MMMM yyyy')}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Revenue</span>
                <span className="text-base font-semibold">{formatCurrency(data.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expenses</span>
                <span className="text-base font-semibold text-red-600">{formatCurrency(data.total)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Net Profit</span>
                <div className="text-right">
                  <span className={`text-base font-semibold ${
                    data.revenue - data.total > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.revenue - data.total)}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Margin: {((data.revenue - data.total) / data.revenue * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KPITrends = ({ monthlyData }) => {
  const calculateGrowth = (current, previous) => {
    return previous ? ((current - previous) / previous * 100).toFixed(1) : 0;
  };

  const metrics = [
    {
      title: "Revenue Growth",
      value: `${calculateGrowth(monthlyData[2].revenue, monthlyData[1].revenue)}%`,
      suffix: "MoM",
      explanation: "Month-over-month revenue growth, before expenses. Shows top-line growth.",
      goodRange: "Positive values indicate revenue growth, but check profit growth for full picture."
    },
    {
      title: "Profit Growth",
      value: `${calculateGrowth(
        monthlyData[2].revenue - monthlyData[2].total,
        monthlyData[1].revenue - monthlyData[1].total
      )}%`,
      suffix: "MoM",
      explanation: "Month-over-month growth in net profit (revenue minus expenses). Shows actual business growth.",
      goodRange: "Positive values indicate increasing profitability. This is more important than revenue growth."
    },
    {
      title: "Current Margin",
      value: ((monthlyData[2].revenue - monthlyData[2].total) / monthlyData[2].revenue * 100).toFixed(1) + '%',
      explanation: "The percentage of revenue that becomes profit after all expenses. Higher margins indicate better profitability.",
      goodRange: "Healthy margins typically range from 20-30%. Above 30% is excellent."
    },
    {
      title: "Cash Efficiency",
      value: (monthlyData[2].revenue / monthlyData[2].total).toFixed(2),
      suffix: ":1",
      explanation: "Revenue generated per dollar spent. Higher ratios indicate better operational efficiency.",
      goodRange: "Above 1.25:1 is good. Above 1.5:1 is excellent."
    }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Key Metrics</h3>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="group relative bg-white rounded-lg p-4 shadow-sm">
            <div className="absolute invisible group-hover:visible w-72 bg-gray-900 text-white text-sm rounded-lg p-3 -mt-2 left-full ml-2 z-10">
              <p className="font-medium mb-1">{metric.title}</p>
              <p className="mb-2">{metric.explanation}</p>
              <p className="text-gray-300 text-xs">{metric.goodRange}</p>
            </div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              {metric.title}
              <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
            </h4>
            <div className="mt-1 flex items-baseline">
              <span className={`text-2xl font-semibold ${
                metric.title.includes('Growth') && parseFloat(metric.value) < 0 ? 'text-red-600' : ''
              }`}>
                {metric.value}
              </span>
              {metric.suffix && (
                <span className="ml-1 text-sm text-gray-500">{metric.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfitTrendChart = ({ plData }) => {
  const profitTrendData = useMemo(() => {
    if (!plData?.monthly) return [];

    const monthOrder = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January'];
    
    return monthOrder.map(month => {
      const data = plData.monthly[month];
      if (!data) return null;

      const parseAmount = (amount) => {
        if (!amount) return 0;
        if (typeof amount === 'number') return amount;
        return parseFloat(amount.replace(/[$,]/g, '')) || 0;
      };

      // Calculate total revenue excluding cash injections
      const revenue = data.incomeData?.reduce((sum, income) => {
        const category = (income.CATEGORY || '').toLowerCase();
        const description = (income.DESCRIPTION || '').toLowerCase();
        
        // Skip cash injections when calculating revenue
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          return sum;
        }
        return sum + parseAmount(income.AMOUNT);
      }, 0) || 0;
      
      // Calculate cash injections (only from income now)
      const cashInjections = data.incomeData?.reduce((sum, income) => {
        const category = (income.CATEGORY || '').toLowerCase();
        const description = (income.DESCRIPTION || '').toLowerCase();
        
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          return sum + parseAmount(income.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate payroll expenses
      const payroll = data.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('payroll') ||
            category.includes('salary') ||
            category.includes('commission') ||
            category.includes('bonus')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate ad spend
      const adSpend = data.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('facebook') ||
            category.includes('ad spend') ||
            category.includes('advertising') ||
            category.includes('media buy') ||
            category.includes('google') ||
            category.includes('tiktok') ||
            category.includes('youtube') ||
            category.includes('ads') ||
            category.includes('marketing') ||
            category.includes('promotion')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate subscriptions
      const subscriptions = data.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('subscription') ||
            category.includes('software') ||
            category.includes('saas') ||
            category.includes('service')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate other expenses (including SBA loans now)
      const otherExpenses = data.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        const description = (expense.DESCRIPTION || '').toLowerCase();
        
        if (!category.includes('payroll') &&
            !category.includes('salary') &&
            !category.includes('commission') &&
            !category.includes('bonus') &&
            !category.includes('facebook') &&
            !category.includes('ad spend') &&
            !category.includes('advertising') &&
            !category.includes('media buy') &&
            !category.includes('subscription') &&
            !category.includes('software') &&
            !category.includes('saas') &&
            !category.includes('service') ||
            description.includes('sba loan')) {  // Include SBA loans in misc expenses
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      const totalExpenses = payroll + adSpend + subscriptions + otherExpenses;
      const profit = revenue - totalExpenses;
      const profitMargin = ((profit / revenue) * 100).toFixed(1);
      const year = month === 'January' ? '2025' : '2024';

      return {
        month: `${month} ${year}`,
        revenue,
        cashInjections,
        adSpend,
        payroll,
        subscriptions,
        otherExpenses,
        profit,
        profitMargin
      };
    }).filter(Boolean);
  }, [plData]);

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Trends</h3>
      <div className="h-96 w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={profitTrendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <defs>
              <linearGradient id="negativeProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(255, 0, 0)" stopOpacity={0.1}/>
                <stop offset="100%" stopColor="rgb(255, 0, 0)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={75}
              interval={0}
              tick={{ dy: 10 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              width={80}
            />
            <Tooltip 
              formatter={(value, name) => [
                formatCurrency(value),
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              wrapperStyle={{ zIndex: 100 }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
            />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="profit"
              fill="url(#negativeProfit)"
              stroke="none"
              baseValue={0}
              fillOpacity={1}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#82ca9d"
              name="Revenue"
              dot={true}
            />
            <Line 
              type="monotone" 
              dataKey="adSpend" 
              stroke="#ff7f7f"
              name="Ad Spend"
              dot={true}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#8884d8"
              name="Profit"
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Updated Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">Month</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-36">Revenue</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">
                <div className="flex items-center justify-end">
                  <span className="text-gray-500">Cash Inj.*</span>
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 border-l bg-gray-100 w-40">Total Expenses</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">
                <span className="text-gray-500">Ad Spend</span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">
                <span className="text-gray-500">Payroll</span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">
                <span className="text-gray-500">Subs</span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">
                <span className="text-gray-500">Misc</span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 border-l bg-gray-50 w-32">Profit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 bg-gray-50 w-24">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {profitTrendData.map((data, index) => {
              const totalExpenses = data.adSpend + data.payroll + data.subscriptions + data.otherExpenses;

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{data.month}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(data.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.cashInjections)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium border-l bg-gray-100">{formatCurrency(totalExpenses)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.adSpend)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.payroll)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.subscriptions)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCurrency(data.otherExpenses)}</td>
                  <td className="px-4 py-3 text-right font-bold border-l bg-gray-50">{formatCurrency(data.profit)}</td>
                  <td className="px-4 py-3 text-right bg-gray-50 font-bold">{data.profitMargin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2 text-xs text-gray-500">
          * Cash injections are shown for reference only
        </div>
      </div>
    </div>
  );
};

const processMonthlyData = (monthlyData) => {
  if (!monthlyData) return [];

  return Object.entries(monthlyData).map(([month, data]) => {
    const revenue = data.totalIncome || 0;
    const expenses = data.totalExpenses || 0;
    const profit = revenue - expenses;
    const profitMargin = revenue ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    // Get expense categories with expanded category matching
    const expensesByCategory = data.expenseData?.reduce((acc, expense) => {
      const category = expense.CATEGORY?.toLowerCase() || '';
      const description = expense.DESCRIPTION?.toLowerCase() || '';
      const amount = parseAmount(expense.AMOUNT);

      if (category.includes('advertising') || category.includes('ad spend')) {
        acc.adSpend += amount;
      } else if (category.includes('payroll') || category.includes('salary')) {
        acc.payroll += amount;
      } else if (
        category.includes('subscription') || 
        category.includes('software') || 
        category.includes('saas') || 
        category.includes('service') ||
        description.includes('subscription') ||
        description.includes('software') ||
        description.includes('license')
      ) {
        acc.subscriptions += amount;
      } else {
        acc.otherExpenses += amount;
      }
      return acc;
    }, { adSpend: 0, payroll: 0, subscriptions: 0, otherExpenses: 0 });

    // Calculate cash injections using parseAmount
    const cashInjections = data.incomeData?.reduce((sum, income) => {
      const description = income.DESCRIPTION?.toLowerCase() || '';
      const amount = parseAmount(income.AMOUNT);
      return description.includes('investment') || description.includes('injection') ? sum + amount : sum;
    }, 0);

    // Update year assignment
    const year = month === 'January' || month === 'February' ? '2025' : '2024';
    
    return {
      month: `${month} ${year}`,
      revenue,
      cashInjections,
      ...expensesByCategory,
      profit,
      profitMargin
    };
  }).filter(Boolean);
};

// Update the network revenue processing
const processNetworkRevenue = (monthIncome) => {
  const networkRevenue = {
    sources: [],
    total: 0
  };

  monthIncome.forEach(income => {
    const name = income.DESCRIPTION;
    const amount = parseAmount(income.AMOUNT);
    const existingSource = networkRevenue.sources.find(s => s.name === name);

    if (existingSource) {
      existingSource.amount += amount;
    } else {
      networkRevenue.sources.push({ name, amount });
    }
    networkRevenue.total += amount;
  });

  return networkRevenue;
};

const FinancialOverview = ({ plData, cashFlowData, invoicesData, networkTerms }) => {
  // Add loading state
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Make a GET request to your API endpoint
      const response = await fetch('/api/sheets', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      // Reload the page to reflect new data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
      // You might want to show an error toast here
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log('Financial Overview received networkTerms:', {
    hasTerms: !!networkTerms,
    termsCount: networkTerms?.length,
    sampleTerm: networkTerms?.[0],
    fullNetworkTerms: networkTerms
  });

  // Process invoices data
  const processedInvoices = useMemo(() => {
    if (!Array.isArray(invoicesData)) return [];
    
    return invoicesData.map(invoice => ({
      network: invoice.Network || 'Unknown',
      amount: parseAmount(invoice.Amount), // Use parseAmount helper
      dueDate: new Date(invoice.DueDate),
      status: invoice.Status || 'Pending',
      invoiceNumber: invoice.InvoiceNumber || '-'
    })).filter(invoice => invoice.amount > 0);
  }, [invoicesData]);

  const invoiceTotals = useMemo(() => {
    return processedInvoices.reduce((acc, invoice) => {
      acc.total += invoice.amount;
      if (invoice.dueDate < new Date()) {
        acc.overdue += invoice.amount;
      }
      return acc;
    }, { total: 0, overdue: 0 });
  }, [processedInvoices]);

  console.log('P&L Data received:', plData);

  const lastThreeMonths = useMemo(() => {
    if (!plData?.summary) return [];
    
    // Create a mapping of months to their numerical order
    const monthOrder = {
      'January': 1,
      'February': 2,
      'March': 3,
      'April': 4,
      'May': 5,
      'June': 6,
      'July': 7,
      'August': 8,
      'September': 9,
      'October': 10,
      'November': 11,
      'December': 12
    };

    // Sort months by year (2025 before 2024) and then by month order
    const sortedMonths = plData.summary
      .map(item => ({
        name: item.Month,
        date: new Date(`${item.Month} 1, ${
          ['January', 'February'].includes(item.Month) ? '2025' : '2024'
        }`),
        order: monthOrder[item.Month]
      }))
      .sort((a, b) => {
        // First compare years
        const yearA = a.date.getFullYear();
        const yearB = b.date.getFullYear();
        if (yearA !== yearB) return yearB - yearA;
        
        // If same year, compare months
        return b.order - a.order;
      })
      .slice(0, 3); // Get only the most recent 3 months

    console.log('Last three months:', sortedMonths);
    return sortedMonths;
  }, [plData]);

  const processedData = useMemo(() => {
    if (!plData?.monthly) {
      console.log('No monthly P&L data available');
      return null;
    }

    return lastThreeMonths.map(({ name, date }) => {
      const monthData = plData.monthly[name];
      console.log(`Processing month ${name}:`, monthData);

      // Calculate revenue first
      const monthlyRevenue = parseAmount(monthData?.totalIncome) || 0;

      // Calculate payroll
      const payroll = monthData?.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('payroll') ||
            category.includes('salary') ||
            category.includes('commission') ||
            category.includes('bonus')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate ad spend
      const adSpend = monthData?.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('facebook') ||
            category.includes('ad spend') ||
            category.includes('advertising') ||
            category.includes('media buy') ||
            category.includes('google') ||
            category.includes('tiktok') ||
            category.includes('youtube') ||
            category.includes('ads') ||
            category.includes('marketing') ||
            category.includes('promotion')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      // Calculate subscriptions
      const subscriptions = monthData?.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (category.includes('subscription') ||
            category.includes('software') ||
            category.includes('saas') ||
            category.includes('service')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      const miscellaneous = monthData?.expenseData?.reduce((sum, expense) => {
        const category = expense.CATEGORY?.toLowerCase() || '';
        if (!category.includes('payroll') &&
            !category.includes('salary') &&
            !category.includes('commission') &&
            !category.includes('bonus') &&
            !category.includes('facebook') &&
            !category.includes('ad spend') &&
            !category.includes('advertising') &&
            !category.includes('media buy') &&
            !category.includes('subscription') &&
            !category.includes('software') &&
            !category.includes('saas') &&
            !category.includes('service')) {
          return sum + parseAmount(expense.AMOUNT);
        }
        return sum;
      }, 0) || 0;

      const monthSummary = {
        month: date,
        revenue: monthlyRevenue,
        payroll,
        adSpend,
        subscriptions,
        miscellaneous,
        total: payroll + adSpend + subscriptions + miscellaneous
      };

      console.log(`Month ${name} summary:`, monthSummary);
      return monthSummary;
    });
  }, [plData, lastThreeMonths]);

  if (!processedData) {
    return <div>Loading financial overview...</div>;
  }

  const monthlyData = processMonthlyData(plData.monthly);

  return (
    <div className="p-6">
      {/* Add refresh button at the top */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isRefreshing 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Current Financial Position */}
            <FinancialSnapshot 
              cashFlowData={cashFlowData}
              invoicesData={invoicesData}
              networkTerms={networkTerms}
            />

            {/* Historical Analysis Section */}
            <div className="border-t pt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Historical Performance Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Detailed breakdown of revenue, expenses, and profitability trends over the last 3 months
                </p>
              </div>

              <ProfitabilitySnapshot monthlyData={processedData} />
              <KPITrends monthlyData={processedData} />
              
              <QuickActions 
                insights={processedData} 
                plData={plData}
              />

              {/* Monthly Revenue */}
              <ExpenseCategory 
                title="Monthly Revenue"
                monthlyData={monthlyData.map(d => ({
                  month: d.month,
                  amount: d.revenue
                }))}
              />

              {/* Payroll */}
              <ExpenseCategory 
                title="Payroll (Salaries, Bonuses, Commissions)"
                monthlyData={monthlyData.map(d => ({
                  month: d.month,
                  amount: d.payroll
                }))}
              />

              {/* Ad Spend */}
              <ExpenseCategory 
                title="Advertising Spend"
                monthlyData={monthlyData.map(d => ({
                  month: d.month,
                  amount: d.adSpend
                }))}
              />

              {/* Subscriptions */}
              <ExpenseCategory 
                title="Subscriptions (Tools & Software)"
                monthlyData={monthlyData.map(d => ({
                  month: d.month,
                  amount: d.subscriptions
                }))}
                plData={plData}  // Pass plData here
              />

              {/* Miscellaneous */}
              <ExpenseCategory 
                title="Miscellaneous Expenses"
                monthlyData={monthlyData.map(d => ({
                  month: d.month,
                  amount: d.otherExpenses
                }))}
              />

              <BreakEvenAnalysis monthlyData={processedData} />
              
              <IncomeComparisonTable 
                monthlyData={processedData}
                plData={plData}
              />
              
              <ExpenseComparisonTable 
                monthlyData={processedData}
                plData={plData}
              />

              <ProfitTrendChart plData={plData} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialOverview; 