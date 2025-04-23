import React from 'react';

export function DatePicker({ selected, onSelect, className }) {
  return (
    <input
      type="date"
      className={`rounded-md border p-2 ${className || ''}`}
      value={selected ? new Date(selected).toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onSelect(date);
      }}
    />
  );
} 