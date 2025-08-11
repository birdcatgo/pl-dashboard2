import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, subMonths, format as formatDate } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Area, ReferenceLine } from 'recharts';
import { ChevronRight } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate trend
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get trend explanation
  const getTrendExplanation = (currentAmount, previousAmount, monthDisplay) => {
    if (!previousAmount || previousAmount === 0) return null;
    const trend = calculateTrend(currentAmount, previousAmount);
    const difference = Math.abs(currentAmount - previousAmount);
    return `${title} ${trend > 0 ? 'increased' : 'decreased'} by ${formatCurrency(difference)} (${Math.abs(trend).toFixed(1)}%) compared to ${monthDisplay}`;
  };

  // Calculate current month amount
  const currentAmount = monthlyData[0]?.amount || 0;
  
  // Calculate previous month amount for trend
  const previousAmount = monthlyData[1]?.amount || 0;
  
  // Calculate trend
  const trend = calculateTrend(currentAmount, previousAmount);
  
  // Get trend explanation
  const trendExplanation = getTrendExplanation(currentAmount, previousAmount, monthlyData[0]?.month);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={handleClick}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentAmount)}
                </span>
                {trend !== 0 && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    trend > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
                  </span>
                )}
              </div>
              {trendExplanation && (
                <span className="text-sm text-gray-600">{trendExplanation}</span>
              )}
            </div>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'transform rotate-90' : ''
            }`}
          />
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="space-y-3">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <span className="text-sm text-gray-900">{formatCurrency(month.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ExportModal = ({ onClose, monthlyData, plData }) => {
  const exportToCSV = () => {
    // Prepare the data
    const headers = ['Category', 'Description', 'November 2024', 'December 2024', 'January 2025', 'February 2025', 'March 2025'];
    const rows = [];

    // Helper function to get month's amount
    const getMonthAmount = (expense, monthName) => {
      return expense.amounts[monthName] || 0;
    };

    // Add data for each category
    ['Payroll', 'Advertising', 'Subscriptions', 'Miscellaneous'].forEach(category => {
      rows.push([category, '', '', '', '']); // Category header

      // Get expenses for this category
      const monthExpenses = plData['March 2025']?.expenses.filter(e => {
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
                <th>December 2024</th>
                <th>January 2025</th>
                <th>February 2025</th>
                <th>March 2025</th> 
              </tr>
            </thead>
            <tbody>
              ${['Payroll', 'Advertising', 'Subscriptions', 'Miscellaneous']
                .map(category => {
                const expenses = plData['March 2025']?.expenses
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
      if (!monthlyData || !monthlyData[month]?.expenses) return [];
  
  const categories = monthlyData[month].expenses.reduce((acc, expense) => {
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
                      monthlyData={plData}
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
  
  // Process expenses by category
  const categories = useMemo(() => {
    console.log('ExpenseComparisonTable: Processing expense data:', {
      hasPlData: !!plData,
      plDataKeys: plData ? Object.keys(plData) : [],
      julyData: plData?.['July 2025'],
      juneData: plData?.['June 2025'],
      mayData: plData?.['May 2025']
    });

    if (!plData) {
      console.log('ExpenseComparisonTable: No plData available');
      return {};
    }

    console.log('ExpenseComparisonTable: Processing plData:', Object.keys(plData));

    const categoryMap = {
      payroll: [],
      advertising: [],
      subscriptions: [],
      other: []
    };

          // Process each month's data
      Object.entries(plData).forEach(([month, data]) => {
        if (!data?.expenses) return;
  
  console.log(`ExpenseComparisonTable: Processing ${month} with ${data.expenses.length} expenses`);
  
  data.expenses.forEach(expense => {
        const category = expense.Category?.toLowerCase() || '';
        const description = expense.Description?.toLowerCase() || '';
        const amount = parseAmount(expense.Amount);
        let targetCategory;

        // Categorize the expense
        if (category.includes('payroll') || 
            category.includes('salary') || 
            category.includes('commission') || 
            category.includes('bonus')) {
          targetCategory = 'payroll';
        } else if (category.includes('facebook') ||
                  category.includes('ad spend') ||
                  category.includes('advertising') ||
                  category.includes('media buy') ||
                  category.includes('google') ||
                  category.includes('tiktok') ||
                  category.includes('youtube') ||
                  category.includes('ads') ||
                  category.includes('marketing') ||
                  category.includes('promotion')) {
          targetCategory = 'advertising';
        } else if (category.includes('subscription') ||
                  category.includes('software') ||
                  category.includes('saas') ||
                  category.includes('service') ||
                  description.includes('subscription') ||
                  description.includes('software') ||
                  description.includes('license')) {
          targetCategory = 'subscriptions';
        } else {
          targetCategory = 'other';
        }

        // Find existing expense or create new one
        const existingExpense = categoryMap[targetCategory].find(e => 
          e.name.toLowerCase() === expense.Description?.toLowerCase()
        );

        if (existingExpense) {
          existingExpense.amounts[month] = (existingExpense.amounts[month] || 0) + amount;
        } else {
          categoryMap[targetCategory].push({
            name: expense.Description || 'Unnamed Expense',
            amounts: { [month]: amount }
          });
        }
      });
    });

    console.log('ExpenseComparisonTable: Before filtering:', {
      payroll: categoryMap.payroll.length,
      advertising: categoryMap.advertising.length,
      subscriptions: categoryMap.subscriptions.length,
      other: categoryMap.other.length
    });

    // Filter out expenses that have $0 across all months
    Object.keys(categoryMap).forEach(categoryKey => {
      const originalLength = categoryMap[categoryKey].length;
      categoryMap[categoryKey] = categoryMap[categoryKey].filter(expense => {
        // Check if the expense has any amount in the last 3 months (most recent to oldest)
        const targetMonths = ['July 2025', 'June 2025', 'May 2025'];
        const recentAmount = targetMonths.reduce((sum, month) => sum + (expense.amounts[month] || 0), 0);
        return recentAmount > 0; // Only keep expenses with actual amounts in the last 3 months
      });
      const filteredLength = categoryMap[categoryKey].length;
      console.log(`ExpenseComparisonTable: ${categoryKey} filtered from ${originalLength} to ${filteredLength} items`);
    });

    console.log('ExpenseComparisonTable: After filtering:', {
      payroll: categoryMap.payroll.length,
      advertising: categoryMap.advertising.length,
      subscriptions: categoryMap.subscriptions.length,
      other: categoryMap.other.length
    });

    console.log('ExpenseComparisonTable: Final category data:', {
      payroll: categoryMap.payroll.slice(0, 3).map(e => ({ name: e.name, amounts: e.amounts })),
      advertising: categoryMap.advertising.slice(0, 3).map(e => ({ name: e.name, amounts: e.amounts })),
      subscriptions: categoryMap.subscriptions.slice(0, 3).map(e => ({ name: e.name, amounts: e.amounts })),
      other: categoryMap.other.slice(0, 3).map(e => ({ name: e.name, amounts: e.amounts }))
    });

    return categoryMap;
  }, [plData]);

  // Get the last 3 months in chronological order (most recent to oldest)
  const lastThreeMonths = useMemo(() => {
    if (!plData) return [];
    
    const months = Object.keys(plData)
      .filter(month => ['July 2025', 'June 2025', 'May 2025'].includes(month))
      .sort((a, b) => {
        const monthOrder = { 'July 2025': 7, 'June 2025': 6, 'May 2025': 5 };
        return monthOrder[b] - monthOrder[a]; // Most recent first (July 2025, June 2025, May 2025)
      });

    console.log('ExpenseComparisonTable: Last three months:', months);
    return months;
  }, [plData]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals = {};
    Object.entries(categories).forEach(([category, expenses]) => {
      totals[category] = expenses.reduce((sum, expense) => {
        return sum + Object.values(expense.amounts).reduce((monthSum, amount) => monthSum + amount, 0);
      }, 0) / lastThreeMonths.length; // Average monthly total
    });
    return totals;
  }, [categories, lastThreeMonths]);

  // Only show the section if there are actual expenses to display
  const hasExpenses = Object.values(categories).some(expenses => expenses.length > 0);
  if (!hasExpenses) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Analysis by Category</h3>
      <div className="space-y-4">
        {(() => {
          const filteredCategories = Object.entries(categories)
            .filter(([category, expenses]) => expenses.length > 0);
          
          console.log('ExpenseComparisonTable: Categories to display:', filteredCategories.map(([cat, exp]) => `${cat}: ${exp.length} items`));
          
          return filteredCategories.map(([category, expenses]) => (
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
                <span className="font-medium">{formatCurrency(categoryTotals[category] || 0)}/mo avg</span>
                <span className="text-gray-500">
                  {expandedCategory === category ? '▼' : '▶'}
                </span>
              </div>
            </button>

            {expandedCategory === category && (
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                  <div>Description</div>
                  {lastThreeMonths.map(month => (
                    <div key={month} className="text-right">{month}</div>
                  ))}
                </div>
                {expenses
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((expense, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 px-4 py-2 text-sm hover:bg-gray-50">
                      <div className="font-medium">{expense.name}</div>
                      {lastThreeMonths.map(month => {
                        const amount = expense.amounts[month] || 0;
                        const prevMonth = lastThreeMonths[lastThreeMonths.indexOf(month) + 1];
                        const prevAmount = prevMonth ? expense.amounts[prevMonth] || 0 : 0;
                        const growth = prevAmount ? 
                          (((amount - prevAmount) / prevAmount) * 100).toFixed(1) : 
                          '0';
                        
                        return (
                          <div key={month} className="text-right">
                            <div>{amount > 0 ? formatCurrency(amount) : '—'}</div>
                            {amount > 0 && growth !== '0' && Math.abs(parseFloat(growth)) > 5 && (
                              <div className={`text-xs ${growth.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
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
        ));
        })()}
      </div>
    </div>
  );
};

const IncomeComparisonTable = ({ monthlyData, plData }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Process revenue data
  const revenueData = useMemo(() => {
    console.log('IncomeComparisonTable: Processing revenue data:', {
      hasPlData: !!plData,
      plDataKeys: plData ? Object.keys(plData) : [],
      julyData: plData?.['July 2025'],
      juneData: plData?.['June 2025'],
      mayData: plData?.['May 2025']
    });

    if (!plData) return { sources: [], total: 0, totalSources: 0 };

    const sources = new Map();
    let total = 0;
    let totalSources = 0;

    // Process each month's income data
    Object.entries(plData).forEach(([month, data]) => {
      if (!data?.incomeData) return;

      data.incomeData.forEach(income => {
        const name = income.Description || 'Unnamed Income';
        const amount = parseAmount(income.Amount);
        
        if (!sources.has(name)) {
          sources.set(name, {
            name,
            amounts: {},
            totalRevenue: 0
          });
          totalSources++;
        }
        
        const source = sources.get(name);
        source.amounts[month] = (source.amounts[month] || 0) + amount;
        source.totalRevenue += amount;
        total += amount;
      });
    });

    // Filter sources: only show those with revenue in the last 3 months (most recent to oldest)
    const lastThreeMonths = ['July 2025', 'June 2025', 'May 2025'];
    const filteredSources = Array.from(sources.values()).filter(source => {
      const recentRevenue = lastThreeMonths.reduce((sum, month) => sum + (source.amounts[month] || 0), 0);
      // Only show sources that have actual revenue in the last 3 months (no zero amounts)
      return recentRevenue > 0;
    });

    // Sort by most recent month's revenue (July 2025), then by total revenue
    filteredSources.sort((a, b) => {
      const aRecent = a.amounts['July 2025'] || 0;
      const bRecent = b.amounts['July 2025'] || 0;
      if (aRecent !== bRecent) return bRecent - aRecent;
      return b.totalRevenue - a.totalRevenue;
    });

    console.log('IncomeComparisonTable: Final revenue data:', {
      sourcesCount: filteredSources.length,
      total: total / Object.keys(plData).length,
      totalSources,
      sampleSources: filteredSources.slice(0, 3).map(s => ({
        name: s.name,
        amounts: s.amounts,
        totalRevenue: s.totalRevenue
      }))
    });

    return {
      sources: filteredSources,
      total: total / Object.keys(plData).length, // Average monthly total
      totalSources
    };
  }, [plData]);

  // Only show the section if there's actual revenue data
  if (revenueData.sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analysis</h3>
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setExpandedCategory(expandedCategory ? null : 'revenue')}
          className="w-full px-6 py-4 bg-green-50 hover:bg-green-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-green-800">Network Revenue</span>
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {revenueData.sources.length} active of {revenueData.totalSources} total
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-green-800">{formatCurrency(revenueData.total)}/mo avg</span>
            <span className="text-green-600">
              {expandedCategory ? '▼' : '▶'}
            </span>
          </div>
        </button>
        
        {expandedCategory && (
          <div className="border-t border-green-100">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                <div>Network Source</div>
                <div className="text-right">July 2025</div>
                <div className="text-right">June 2025</div>
                <div className="text-right">May 2025</div>
              </div>
            </div>
            
            {/* Data Rows */}
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {revenueData.sources.map((source, index) => {
                const julyAmount = source.amounts['July 2025'] || 0;
                const juneAmount = source.amounts['June 2025'] || 0;
                const mayAmount = source.amounts['May 2025'] || 0;
                
                // Calculate trend between July and June
                const trend = juneAmount ? ((julyAmount - juneAmount) / juneAmount * 100) : 0;
                const isGrowing = trend > 5;
                const isDeclining = trend < -5;
                
                return (
                  <div key={index} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      {/* Source Name */}
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">{source.name}</span>
                        {isGrowing && <span className="text-green-600 text-xs">🚀</span>}
                        {isDeclining && <span className="text-red-600 text-xs">📉</span>}
                      </div>
                      
                      {/* July Amount */}
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(julyAmount)}</div>
                        {trend !== 0 && Math.abs(trend) > 5 && (
                          <div className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      
                      {/* June Amount */}
                      <div className="text-right">
                        <span className="text-gray-700">
                          {juneAmount > 0 ? formatCurrency(juneAmount) : '—'}
                        </span>
                      </div>
                      
                      {/* May Amount */}
                      <div className="text-right">
                        <span className="text-gray-700">
                          {mayAmount > 0 ? formatCurrency(mayAmount) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Footer */}
            <div className="bg-green-50 px-6 py-4 border-t">
              <div className="grid grid-cols-4 gap-4 items-center font-semibold text-green-800">
                <div>Total Active Revenue</div>
                <div className="text-right">
                  {(() => {
                    const total = revenueData.sources.reduce((sum, s) => sum + (s.amounts['July 2025'] || 0), 0);
                    return total > 0 ? formatCurrency(total) : '—';
                  })()}
                </div>
                <div className="text-right">
                  {(() => {
                    const total = revenueData.sources.reduce((sum, s) => sum + (s.amounts['June 2025'] || 0), 0);
                    return total > 0 ? formatCurrency(total) : '—';
                  })()}
                </div>
                <div className="text-right">
                  {(() => {
                    const total = revenueData.sources.reduce((sum, s) => sum + (s.amounts['May 2025'] || 0), 0);
                    return total > 0 ? formatCurrency(total) : '—';
                  })()}
                </div>
              </div>
            </div>
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
    const monthName = format(monthDate, 'MMMM yyyy');
    return plData[monthName]?.income || [];
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
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Monthly Performance</h3>
        <div className="text-center py-8 text-gray-500">
          No data available for monthly performance analysis.
        </div>
      </div>
    );
  }

  // Take only the first 3 months to ensure consistent display
  const displayData = monthlyData.slice(0, 3);

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Monthly Performance</h3>
      <div className="grid grid-cols-3 gap-4">
        {displayData.map((data, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-3">{format(data.month, 'MMMM yyyy')}</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Revenue</span>
                <span className="text-base font-semibold">{formatCurrency(data.revenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expenses</span>
                <span className="text-base font-semibold text-red-600">{formatCurrency(data.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Net Profit</span>
                <div className="text-right">
                  <span className={`text-base font-semibold ${
                    (data.revenue || 0) - (data.total || 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency((data.revenue || 0) - (data.total || 0))}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Margin: {data.revenue ? (((data.revenue - (data.total || 0)) / data.revenue) * 100).toFixed(1) : '0.0'}%
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
  if (!monthlyData || monthlyData.length < 2) {
    return (
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Key Metrics</h3>
        <div className="text-center py-8 text-gray-500">
          Insufficient data for trend analysis. Need at least 2 months of data.
        </div>
      </div>
    );
  }

  const calculateGrowth = (current, previous) => {
    return previous ? ((current - previous) / previous * 100).toFixed(1) : 0;
  };

  // Use the most recent month (index 0) vs previous month (index 1) for MoM calculations
  const currentMonth = monthlyData[0] || {};
  const previousMonth = monthlyData[1] || {};

  const metrics = [
    {
      title: "Revenue Growth",
      value: `${calculateGrowth(currentMonth.revenue || 0, previousMonth.revenue || 0)}%`,
      suffix: "MoM",
      explanation: "Month-over-month revenue growth, before expenses. Shows top-line growth.",
      goodRange: "Positive values indicate revenue growth, but check profit growth for full picture."
    },
    {
      title: "Profit Growth",
      value: `${calculateGrowth(
        (currentMonth.revenue || 0) - (currentMonth.total || 0),
        (previousMonth.revenue || 0) - (previousMonth.total || 0)
      )}%`,
      suffix: "MoM",
      explanation: "Month-over-month growth in net profit (revenue minus expenses). Shows actual business growth.",
      goodRange: "Positive values indicate increasing profitability. This is more important than revenue growth."
    },
    {
      title: "Current Margin",
      value: currentMonth.revenue ? (((currentMonth.revenue - (currentMonth.total || 0)) / currentMonth.revenue) * 100).toFixed(1) + '%' : '0.0%',
      explanation: "The percentage of revenue that becomes profit after all expenses. Higher margins indicate better profitability.",
      goodRange: "Healthy margins typically range from 20-30%. Above 30% is excellent."
    },
    {
      title: "Cash Efficiency",
      value: (currentMonth.total && currentMonth.total > 0) ? 
        ((currentMonth.revenue || 0) / currentMonth.total).toFixed(2) : '0.00',
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
    if (!plData) return [];

    // Define the correct month order with years
    const monthOrder = [
      'July 2024', 'August 2024', 'September 2024', 'October 2024', 
      'November 2024', 'December 2024', 'January 2025', 'February 2025', 
      'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025'
    ];
    
    return monthOrder.map(monthYear => {
      const data = plData[monthYear];
      if (!data) return null;

      // Calculate revenue (excluding cash injections)
      const revenue = data.income?.reduce((sum, income) => {
        const category = (income.Category || '').toLowerCase();
        const description = (income.Description || '').toLowerCase();
        
        // Skip cash injections
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          return sum;
        }
        return sum + parseAmount(income.Amount);
      }, 0) || 0;
      
      // Calculate cash injections
      const cashInjections = data.income?.reduce((sum, income) => {
        const category = (income.Category || '').toLowerCase();
        const description = (income.Description || '').toLowerCase();
        
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          return sum + parseAmount(income.Amount);
        }
        return sum;
      }, 0) || 0;

      // Calculate expenses by category
      const expenses = data.expenses?.reduce((acc, expense) => {
        const category = (expense.Category || '').toLowerCase();
        const description = (expense.Description || '').toLowerCase();
        const amount = parseAmount(expense.Amount);

        if (category.includes('payroll') || 
            category.includes('salary') || 
            category.includes('commission') || 
            category.includes('bonus')) {
          acc.payroll += amount;
        } else if (category.includes('facebook') ||
                  category.includes('ad spend') ||
                  category.includes('advertising') ||
                  category.includes('media buy') ||
                  category.includes('google') ||
                  category.includes('tiktok') ||
                  category.includes('youtube') ||
                  category.includes('ads') ||
                  category.includes('marketing') ||
                  category.includes('promotion')) {
          acc.adSpend += amount;
        } else if (category.includes('subscription') ||
                  category.includes('software') ||
                  category.includes('saas') ||
                  category.includes('service') ||
                  description.includes('subscription') ||
                  description.includes('software') ||
                  description.includes('license')) {
          acc.subscriptions += amount;
        } else {
          acc.otherExpenses += amount;
        }
        return acc;
      }, { payroll: 0, adSpend: 0, subscriptions: 0, otherExpenses: 0 }) || { 
        payroll: 0, adSpend: 0, subscriptions: 0, otherExpenses: 0 
      };

      const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      const profit = revenue - totalExpenses;
      const profitMargin = revenue ? ((profit / revenue) * 100).toFixed(1) : '0.0';

      return {
        month: monthYear,
        revenue,
        cashInjections,
        ...expenses,
        totalExpenses,
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

      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Month</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Revenue</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                <div className="flex items-center justify-end">
                  <span className="text-gray-500">Cash Inj.*</span>
                </div>
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 border-l bg-gray-100 w-36">Total Expenses</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                <span className="text-gray-500">Ad Spend</span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                <span className="text-gray-500">Payroll</span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                <span className="text-gray-500">Subs</span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">
                <span className="text-gray-500">Misc</span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 border-l bg-gray-50 w-28">Profit</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 bg-gray-50 w-20">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {profitTrendData.map((data, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{data.month}</td>
                <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(data.revenue)}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatCurrency(data.cashInjections)}</td>
                <td className="px-3 py-2 text-right text-red-600 font-medium border-l bg-gray-100">{formatCurrency(data.totalExpenses)}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatCurrency(data.adSpend)}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatCurrency(data.payroll)}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatCurrency(data.subscriptions)}</td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatCurrency(data.otherExpenses)}</td>
                <td className="px-3 py-2 text-right font-bold border-l bg-gray-50">{formatCurrency(data.profit)}</td>
                <td className="px-3 py-2 text-right bg-gray-50 font-bold">{data.profitMargin}%</td>
              </tr>
            ))}
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

  // Define the months we want to show in correct order (July, June, May)
  const targetMonths = ['July 2025', 'June 2025', 'May 2025'];

  console.log('processMonthlyData debug:', {
    inputMonthlyData: monthlyData,
    availableKeys: monthlyData ? Object.keys(monthlyData) : [],
    targetMonths,
    julyExists: !!monthlyData?.['July 2025'],
    juneExists: !!monthlyData?.['June 2025'],
    mayExists: !!monthlyData?.['May 2025'],
    julyData: monthlyData?.['July 2025'],
    juneData: monthlyData?.['June 2025'],
    mayData: monthlyData?.['May 2025']
  });

  return targetMonths.map(monthStr => {
    const data = monthlyData[monthStr];
    
    console.log(`Processing month ${monthStr}:`, {
      hasData: !!data,
      data: data,
      totalIncome: data?.totalIncome,
      expenseDataLength: data?.expenses?.length
    });
    
    if (!data) {
      console.log(`No data found for ${monthStr}, returning zero values`);
      const [month, year] = monthStr.split(' ');
      return {
        month: new Date(`${month} 1, ${year}`),
        revenue: 0,
        payroll: 0,
        adSpend: 0,
        subscriptions: 0,
        miscellaneous: 0,
        total: 0,
        profit: 0,
        profitMargin: '0.0'
      };
    }

    // Calculate revenue from incomeData (excluding cash injections)
    console.log(`processMonthlyData - Processing income for ${monthStr}:`, {
      hasIncomeData: !!data.income,
      incomeDataLength: data.income?.length,
      sampleIncomeItems: data.income?.slice(0, 3),
      dataKeys: data ? Object.keys(data) : [],
      fullData: data
    });

    const revenue = data.income?.reduce((sum, income) => {
      const category = (income.Category || '').toLowerCase();
      const description = (income.Description || '').toLowerCase();
      const amount = parseAmount(income.Amount);
      
      // Skip cash injections
      if (category.includes('cash injection') || 
          description.includes('cash injection')) {
        console.log(`processMonthlyData - Cash injection found: ${description} = ${amount}`);
        return sum;
      }
      console.log(`processMonthlyData - Revenue found: ${description} = ${amount}`);
      return sum + amount;
    }, 0) || 0;
    
    console.log(`processMonthlyData - Total revenue for ${monthStr}: ${revenue}`);

    // Calculate cash injections from incomeData
    const cashInjections = data.income?.reduce((sum, income) => {
      const category = (income.Category || '').toLowerCase();
      const description = (income.Description || '').toLowerCase();
      
      if (category.includes('cash injection') || 
          description.includes('cash injection')) {
        return sum + parseAmount(income.Amount);
      }
      return sum;
    }, 0) || 0;

    // Calculate payroll from expense data
    const payroll = data.expenses?.reduce((sum, expense) => {
      if (!expense || !expense.Category) return sum;
      const category = expense.Category.toLowerCase();
      if (category.includes('payroll') ||
          category.includes('salary') ||
          category.includes('commission') ||
          category.includes('bonus')) {
        return sum + parseAmount(expense.Amount);
      }
      return sum;
    }, 0) || 0;

    // Calculate ad spend from expense data
    const adSpend = data.expenses?.reduce((sum, expense) => {
      if (!expense || !expense.Category) return sum;
      const category = expense.Category.toLowerCase();
      if (category.includes('advertising') ||
          category.includes('ad spend') ||
          category.includes('facebook') ||
          category.includes('google') ||
          category.includes('tiktok') ||
          category.includes('native')) {
        return sum + parseAmount(expense.Amount);
      }
      return sum;
    }, 0) || 0;

    // Calculate subscriptions from expense data
    const subscriptions = data.expenses?.reduce((sum, expense) => {
      if (!expense || !expense.Category) return sum;
      const category = expense.Category.toLowerCase();
      if (category.includes('subscription') ||
          category.includes('software') ||
          category.includes('tool') ||
          category.includes('saas') ||
          category.includes('platform')) {
        return sum + parseAmount(expense.Amount);
      }
      return sum;
    }, 0) || 0;

    // Calculate miscellaneous (everything else)
    const miscellaneous = data.expenses?.reduce((sum, expense) => {
      if (!expense || !expense.Category) return sum;
      const category = expense.Category.toLowerCase();
      if (!category.includes('payroll') &&
          !category.includes('salary') &&
          !category.includes('commission') &&
          !category.includes('bonus') &&
          !category.includes('advertising') &&
          !category.includes('ad spend') &&
          !category.includes('facebook') &&
          !category.includes('google') &&
          !category.includes('tiktok') &&
          !category.includes('native') &&
          !category.includes('subscription') &&
          !category.includes('software') &&
          !category.includes('tool') &&
          !category.includes('saas') &&
          !category.includes('platform')) {
        return sum + parseAmount(expense.Amount);
      }
      return sum;
    }, 0) || 0;

    const total = payroll + adSpend + subscriptions + miscellaneous;
    const profit = revenue - total;
    const profitMargin = revenue ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    // Extract month and year from monthStr for date creation
    const [month, year] = monthStr.split(' ');

    return {
      month: new Date(`${month} 1, ${year}`),
      revenue,
      cashInjections,
      payroll,
      adSpend,
      subscriptions,
      miscellaneous,
      total,
      profit,
      profitMargin
    };
  });
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

const ExpenseOverview = ({ plData, cashFlowData, invoicesData, networkTerms }) => {
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

  console.log('P&L Data received:', {
    hasPlData: !!plData,
    plDataKeys: plData ? Object.keys(plData) : [],
    hasMonthly: !!plData?.monthly,
          monthlyKeys: plData ? Object.keys(plData) : [],
    hasSummary: !!plData?.summary,
    summaryLength: plData?.summary?.length || 0,
    fullPlData: plData
  });

  const lastThreeMonths = useMemo(() => {
    if (!plData || Object.keys(plData).length === 0) return [];
    
    // Create a mapping of months to their numerical order
    const monthOrder = {
      'July 2025': 2025 * 12 + 7,
      'June 2025': 2025 * 12 + 6,
      'May 2025': 2025 * 12 + 5,
      'April 2025': 2025 * 12 + 4,
      'March 2025': 2025 * 12 + 3,
      'February 2025': 2025 * 12 + 2,
      'January 2025': 2025 * 12 + 1,
      'December 2024': 2024 * 12 + 12,
      'November 2024': 2024 * 12 + 11,
      'October 2024': 2024 * 12 + 10,
      'September 2024': 2024 * 12 + 9,
      'August 2024': 2024 * 12 + 8
    };
    
    // Get all available months from the plData (plData contains monthly data directly)
    const availableMonths = Object.keys(plData).filter(month => 
      month && month !== 'undefined' && month !== 'null' && month !== '' && plData[month]
    ).map(monthName => ({
      name: monthName,
      date: new Date(monthName.split(' ')[0] + ' 1, ' + monthName.split(' ')[1]),
      order: monthOrder[monthName] || 0
    }));

    // Sort by date (newest first)
    availableMonths.sort((a, b) => b.order - a.order);

    // Return the three most recent months
    return availableMonths.slice(0, 3);
  }, [plData]);

  const processedData = useMemo(() => {
    // Check if we have the new data structure (months as direct keys) or the old structure (monthly property)
    const monthlyData = plData?.monthly || plData;
    
    if (!monthlyData) {
      console.log('No monthly data available');
      return null;
    }

    // Define the months we want to show in order - ONLY 3 months
    const targetMonths = ['July 2025', 'June 2025', 'May 2025'];

    // Add debug logging
    console.log('Processing monthly data:', {
      availableMonths: Object.keys(monthlyData),
      hasJulyData: !!monthlyData['July 2025'],
      hasJuneData: !!monthlyData['June 2025'],
      hasMayData: !!monthlyData['May 2025'],
      julyData: monthlyData['July 2025'],
      juneData: monthlyData['June 2025'],
      mayData: monthlyData['May 2025']
    });

    return targetMonths.map(monthStr => {
      const monthData = monthlyData[monthStr];
      
      if (!monthData) {
        console.log(`No data available for ${monthStr}`);
        const [month, year] = monthStr.split(' ');
        return {
          month: new Date(`${month} 1, ${year}`),
          revenue: 0,
          payroll: 0,
          adSpend: 0,
          subscriptions: 0,
          miscellaneous: 0,
          total: 0
        };
      }

      // Enhanced debug logging for each month
      console.log(`Processing ${monthStr}:`, {
        hasData: !!monthData,
        totalIncome: monthData?.totalIncome,
        totalExpenses: monthData?.totalExpenses,
        expenseData: monthData?.expenses,
        rawData: monthData
      });

            // Calculate revenue first (excluding cash injections)
      console.log(`Processing income for ${monthStr}:`, {
        hasIncomeData: !!monthData?.income,
        incomeDataLength: monthData?.income?.length,
        sampleIncomeItems: monthData?.income?.slice(0, 3),
        monthDataKeys: monthData ? Object.keys(monthData) : [],
        fullMonthData: monthData
      });

      const monthlyRevenue = monthData?.income?.reduce((sum, income) => {
        const category = (income.Category || '').toLowerCase();
        const description = (income.Description || '').toLowerCase();
        const amount = parseAmount(income.Amount);
        
        // Skip cash injections
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          console.log(`Cash injection found: ${description} = ${amount}`);
          return sum;
        }
        console.log(`Revenue found: ${description} = ${amount}`);
        return sum + amount;
      }, 0) || 0;
      
      console.log(`Total revenue for ${monthStr}: ${monthlyRevenue}`);

      // Calculate cash injections
      const cashInjections = monthData?.income?.reduce((sum, income) => {
        const category = (income.Category || '').toLowerCase();
        const description = (income.Description || '').toLowerCase();
        
        if (category.includes('cash injection') || 
            description.includes('cash injection')) {
          return sum + parseAmount(income.Amount);
        }
        return sum;
      }, 0) || 0;

      // Calculate payroll with debug logging
      const payroll = monthData?.expenses?.reduce((sum, expense) => {
        if (!expense || !expense.Category) return sum;
        const category = expense.Category.toLowerCase();
        if (category.includes('payroll') ||
            category.includes('salary') ||
            category.includes('commission') ||
            category.includes('bonus')) {
          const amount = parseAmount(expense.Amount);
          console.log(`Payroll expense found: ${expense.Category} = ${amount}`);
          return sum + amount;
        }
        return sum;
      }, 0) || 0;

      // Calculate ad spend with debug logging
      const adSpend = monthData?.expenses?.reduce((sum, expense) => {
        if (!expense || !expense.Category) return sum;
        const category = expense.Category.toLowerCase();
        if (category.includes('advertising') ||
            category.includes('ad spend') ||
            category.includes('facebook') ||
            category.includes('google') ||
            category.includes('tiktok') ||
            category.includes('native')) {
          const amount = parseAmount(expense.Amount);
          console.log(`Ad spend expense found: ${expense.Category} = ${amount}`);
          return sum + amount;
        }
        return sum;
      }, 0) || 0;

      // Calculate subscriptions with debug logging
      const subscriptions = monthData?.expenses?.reduce((sum, expense) => {
        if (!expense || !expense.Category) return sum;
        const category = expense.Category.toLowerCase();
        if (category.includes('subscription') ||
            category.includes('software') ||
            category.includes('tool') ||
            category.includes('saas') ||
            category.includes('platform')) {
          const amount = parseAmount(expense.Amount);
          console.log(`Subscription expense found: ${expense.Category} = ${amount}`);
          return sum + amount;
        }
        return sum;
      }, 0) || 0;

      // Calculate miscellaneous (everything else)
      const miscellaneous = monthData?.expenses?.reduce((sum, expense) => {
        if (!expense || !expense.Category) return sum;
        const category = expense.Category.toLowerCase();
        if (!category.includes('payroll') &&
            !category.includes('salary') &&
            !category.includes('commission') &&
            !category.includes('bonus') &&
            !category.includes('advertising') &&
            !category.includes('ad spend') &&
            !category.includes('facebook') &&
            !category.includes('google') &&
            !category.includes('tiktok') &&
            !category.includes('native') &&
            !category.includes('subscription') &&
            !category.includes('software') &&
            !category.includes('tool') &&
            !category.includes('saas') &&
            !category.includes('platform')) {
          const amount = parseAmount(expense.Amount);
          console.log(`Miscellaneous expense found: ${expense.Category} = ${amount}`);
          return sum + amount;
        }
        return sum;
      }, 0) || 0;

      const totalExpenses = payroll + adSpend + subscriptions + miscellaneous;
      const profit = monthlyRevenue - totalExpenses;
      const profitMargin = monthlyRevenue ? ((profit / monthlyRevenue) * 100).toFixed(1) : '0.0';

      // Extract month and year from monthStr for date creation
      const [month, year] = monthStr.split(' ');

      return {
        month: new Date(`${month} 1, ${year}`),
        revenue: monthlyRevenue,
        cashInjections,
        payroll,
        adSpend,
        subscriptions,
        miscellaneous,
        total: totalExpenses, // Use 'total' instead of 'totalExpenses' for component compatibility
        profit,
        profitMargin
      };
    });
  }, [plData]);

  const monthlyData = processMonthlyData(plData);

  if (!processedData) {
    console.log('No processed data available, showing loading state');
    return <div>Loading expense overview...</div>;
  }

  console.log('Rendering ExpenseOverview with data:', {
    processedDataLength: processedData?.length,
    processedData: processedData,
    monthlyDataLength: monthlyData?.length,
    monthlyData: monthlyData
  });

  // Debug logging
  console.log('ExpenseOverview data debug:', {
    hasPlData: !!plData,
    plDataKeys: plData ? Object.keys(plData) : [],
    processedMonthlyData: monthlyData,
    processedDataLength: processedData?.length,
    processedData: processedData,
    monthlyDataLength: monthlyData?.length
  });

  return (
    <div className="p-2">
      {/* Add refresh button at the top */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Expense Overview</h1>
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
        <CardContent>
          <div className="space-y-6">
            {/* Historical Analysis Section */}
            <div className="pt-4">
              <div className="mb-4">
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
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Revenue</h3>
                <div className="grid grid-cols-3 gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-lg font-semibold">{formatCurrency(data.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payroll */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Payroll (Salaries, Bonuses, Commissions)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="bg-red-50 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-lg font-semibold">{formatCurrency(data.payroll)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Spend */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Advertising Spend</h3>
                <div className="grid grid-cols-3 gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="bg-orange-50 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-lg font-semibold">{formatCurrency(data.adSpend)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Subscriptions (Tools & Software)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-lg font-semibold">{formatCurrency(data.subscriptions)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Miscellaneous */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Miscellaneous Expenses</h3>
                <div className="grid grid-cols-3 gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-600">{format(data.month, 'MMMM yyyy')}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-lg font-semibold">{formatCurrency(data.miscellaneous)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

export default ExpenseOverview; 