import React, { useState } from 'react';
import { TrendingUp, Download, AlertTriangle, ChartBar } from 'lucide-react';

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

const QuickActions = ({ insights, plData }) => {
  const [showExport, setShowExport] = useState(false);
  const [showHighExpenses, setShowHighExpenses] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  const handleExport = () => {
    setShowExport(true);
  };

  const handleHighExpenses = () => {
    setShowHighExpenses(true);
  };

  const handleTrends = () => {
    setShowTrends(true);
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-4">
        <QuickAction
          icon={<Download className="h-5 w-5" />}
          label="Export Data"
          onClick={handleExport}
        />
        <QuickAction
          icon={<AlertTriangle className="h-5 w-5" />}
          label="High Expenses"
          onClick={handleHighExpenses}
          variant="warning"
        />
        <QuickAction
          icon={<TrendingUp className="h-5 w-5" />}
          label="View Trends"
          onClick={handleTrends}
          variant="success"
        />
        <QuickAction
          icon={<ChartBar className="h-5 w-5" />}
          label="Insights"
          onClick={() => {}}
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
          onClose={() => setShowHighExpenses(false)}
          plData={plData}
        />
      )}

      {showTrends && (
        <TrendsModal
          onClose={() => setShowTrends(false)}
          insights={insights}
        />
      )}
    </div>
  );
};

export default QuickActions; 