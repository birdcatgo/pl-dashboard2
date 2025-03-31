import React from 'react';
import { HelpCircle } from 'lucide-react';

const TrendGraph = ({ 
  data, 
  width = 100, 
  height = 40, 
  positiveColor = '#2ECC71', 
  negativeColor = '#E74C3C',
  tooltip
}) => {
  const maxValue = Math.max(...data.map(Math.abs));
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative group">
      <div className="bg-[#F7F8FA] rounded-md p-2 border border-gray-100">
        <svg width={width} height={height} className="mx-auto">
          <polyline
            points={points}
            fill="none"
            stroke={data[data.length - 1] >= 0 ? positiveColor : negativeColor}
            strokeWidth="2"
            className="transition-all duration-200"
          />
        </svg>
      </div>
      {tooltip && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
              {tooltip}
              <div className="absolute bottom-0 right-2 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendGraph; 