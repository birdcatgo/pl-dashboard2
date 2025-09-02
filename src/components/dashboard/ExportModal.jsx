import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ExportModal = ({ onClose, monthlyData, plData }) => {
  const exportToCSV = () => {
    // Get available months dynamically
    const getAvailableMonths = () => {
      if (!monthlyData) return [];
      
      const parseMonthYear = (monthStr) => {
        const monthNames = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4,
          'May': 5, 'June': 6, 'July': 7, 'August': 8,
          'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        
        const parts = monthStr.split(' ');
        if (parts.length !== 2) return 0;
        
        const month = monthNames[parts[0]];
        const year = parseInt(parts[1]);
        
        if (!month || !year) return 0;
        
        return year * 12 + month;
      };
      
      return Object.keys(monthlyData)
        .sort((a, b) => parseMonthYear(a) - parseMonthYear(b))
        .slice(-3); // Get last 3 months
    };
    
    const availableMonths = getAvailableMonths();
    
    // Prepare the data
    const headers = ['Category', 'Description', ...availableMonths];
    const rows = [];

    // Helper function to get month's amount
    const getMonthAmount = (expense, monthName) => {
      return expense.amounts[monthName] || 0;
    };

    // Add data for each category
    ['Payroll', 'Advertising', 'Subscriptions', 'Miscellaneous'].forEach(category => {
      // Add category data here
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financial_report.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Export Data</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <button
            onClick={exportToCSV}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 