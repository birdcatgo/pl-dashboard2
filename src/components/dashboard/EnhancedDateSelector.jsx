import React from 'react';
import { Card } from '../ui/card';
import { CalendarDays } from 'lucide-react';

const EnhancedDateSelector = ({ onDateChange, activePeriod }) => {
  const periods = [
    {
      label: 'Quick Select',
      options: [
        { id: 'allDates', label: 'All Dates' },
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'last7', label: 'Last 7 Days' }
      ]
    },
    {
      label: 'Monthly',
      options: [
        { id: 'last30', label: 'Last 30 Days' },
        { id: 'thisMonth', label: 'This Month' },
        { id: 'lastMonth', label: 'Last Month' }
      ]
    },
    {
      label: 'Extended',
      options: [
        { id: 'last60', label: 'Last 60 Days' },
        { id: 'last90', label: 'Last 90 Days' },
        { id: 'ytd', label: 'Year to Date' }
      ]
    }
  ];

  const handlePeriodSelect = (period) => {
    const today = new Date();
    const endDate = new Date(today);
    let startDate = new Date(today);

    switch (period) {
      case 'allDates':
        startDate = new Date(2020, 0, 1);
        break;
      case 'today':
        startDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'last7':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last60':
        startDate.setDate(today.getDate() - 60);
        break;
      case 'last90':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        break;
    }

    onDateChange({ startDate, endDate, period });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <CalendarDays className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-medium">Time Period</h3>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {periods.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="text-sm font-medium text-gray-500">{group.label}</div>
            <div className="space-y-1">
              {group.options.map((period) => (
                <button
                  key={period.id}
                  onClick={() => handlePeriodSelect(period.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activePeriod === period.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EnhancedDateSelector;