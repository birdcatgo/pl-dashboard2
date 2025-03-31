import React from 'react';

export const Sparkline = ({ data, width = 100, height = 30, color = '#22c55e' }) => {
  if (!data?.length) return null;

  // Filter out invalid values and ensure we have valid numbers
  const values = data
    .map(v => {
      const num = parseFloat(v);
      return isNaN(num) ? 0 : num;
    })
    .filter(v => v !== null && v !== undefined);

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}; 