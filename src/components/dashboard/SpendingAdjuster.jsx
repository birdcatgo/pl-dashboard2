import React from 'react';

const SpendingAdjuster = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Media Buyer Spend</label>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-sm">Multiplier: {value}x</p>
    </div>
  );
};

export default SpendingAdjuster;
