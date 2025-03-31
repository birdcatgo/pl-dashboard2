import React from 'react';
import { HelpCircle } from 'lucide-react';

const ChartContainer = ({
  title,
  children,
  tooltip,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
      <div className={`bg-[#F7F8FA] rounded-md p-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer; 