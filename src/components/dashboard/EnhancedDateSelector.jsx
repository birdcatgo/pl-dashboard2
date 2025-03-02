import React from 'react';
import { Card } from '../ui/card';
import { CalendarDays } from 'lucide-react';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

const EnhancedDateSelector = ({ 
  onDateChange, 
  selectedPeriod = 'last7',
  latestDate
}) => {
  const getDateRange = (period) => {
    const now = latestDate || new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      }
      case 'last7':
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        break;
      case 'last30':
        startDate = startOfDay(subDays(now, 29));
        endDate = endOfDay(now);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth': {
        const lastMonth = subDays(startOfMonth(now), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      }
      case 'last60':
        startDate = startOfDay(subDays(now, 59));
        endDate = endOfDay(now);
        break;
      case 'last90':
        startDate = startOfDay(subDays(now, 89));
        endDate = endOfDay(now);
        break;
      case 'ytd':
        startDate = startOfYear(now);
        endDate = endOfDay(now);
        break;
      default:
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
    }

    // Debug log
    console.log('Date range calculated:', {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      now: now.toISOString(),
      latestDate: latestDate.toISOString()
    });

    return {
      startDate,
      endDate,
      period
    };
  };

  const handlePeriodSelect = (period) => {
    const newRange = getDateRange(period);
    console.log('Selected period:', period, newRange);
    onDateChange(newRange);
  };

  const periods = [
    {
      label: 'Quick Select',
      options: [
        { id: 'yesterday', label: 'Yesterday', icon: '⏪' },
        { id: 'last7', label: 'Last 7 Days', icon: '📊' },
        { id: 'last30', label: 'Last 30 Days', icon: '📈' }
      ]
    },
    {
      label: 'Monthly',
      options: [
        { id: 'thisMonth', label: 'This Month', icon: '📅' },
        { id: 'lastMonth', label: 'Last Month', icon: '⌛' }
      ]
    },
    {
      label: 'Extended',
      options: [
        { id: 'last60', label: 'Last 60 Days', icon: '📊' },
        { id: 'last90', label: 'Last 90 Days', icon: '📈' },
        { id: 'ytd', label: 'Year to Date', icon: '📅' }
      ]
    }
  ];

  return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 border-b pb-3">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Time Period</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {periods.map((section) => (
            <div key={section.label} className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                {section.label}
              </h4>
              <div className="flex flex-col gap-2">
                {section.options.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => handlePeriodSelect(period.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                      transition-all duration-200 ease-in-out
                      ${selectedPeriod === period.id
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }
                      ${selectedPeriod === period.id ? 'scale-102' : 'scale-100'}
                    `}
                  >
                    <span className="text-base">{period.icon}</span>
                    <span>{period.label}</span>
                    {selectedPeriod === period.id && (
                      <span className="ml-auto text-blue-600">•</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default EnhancedDateSelector;