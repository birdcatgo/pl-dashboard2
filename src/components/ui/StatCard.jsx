import React from 'react';
import { HelpCircle } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon, 
  tooltip,
  className = '',
  valueClassName = '',
  trendClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#6B7280]">{title}</h3>
            {tooltip && (
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                  {tooltip}
                  <div className="absolute bottom-0 right-2 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <div className={`mt-2 text-2xl font-bold text-[#111827] ${valueClassName}`}>
            {value}
          </div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-4 flex items-center gap-2 ${trendClassName}`}>
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard; 