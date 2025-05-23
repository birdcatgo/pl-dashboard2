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
  // Validate and filter data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-[#F7F8FA] rounded-md p-2 border border-gray-100 w-[100px] h-[40px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">—</span>
      </div>
    );
  }

  // Filter out invalid values and ensure we have valid numbers
  const validData = data
    .map(v => {
      const num = parseFloat(v);
      return isNaN(num) ? 0 : num;
    })
    .filter(v => v !== null && v !== undefined);

  if (validData.length < 2) {
    return (
      <div className="bg-[#F7F8FA] rounded-md p-2 border border-gray-100 w-[100px] h-[40px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">—</span>
      </div>
    );
  }

  // Calculate min and max for scaling
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1; // Prevent division by zero

  // Generate points with padding
  const padding = 4;
  const points = validData.map((value, index) => {
    const x = padding + (index / (validData.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Determine line color based on trend
  const lastValue = validData[validData.length - 1];
  const lineColor = lastValue >= 0 ? positiveColor : negativeColor;

  return (
    <div className="relative group">
      <div className="bg-[#F7F8FA] rounded-md p-2 border border-gray-100">
        <svg width={width} height={height} className="mx-auto">
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            className="transition-all duration-200"
            strokeLinecap="round"
            strokeLinejoin="round"
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