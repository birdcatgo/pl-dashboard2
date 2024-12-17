import React from 'react';

const CustomTooltip = ({ content, style }) => {
  return (
    <div
      className="bg-white text-sm text-gray-800 shadow-md border border-gray-300 rounded p-2"
      style={style}
    >
      {content.split('\n').map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
    </div>
  );
};

export default CustomTooltip;
