import React from 'react';

const PaymentTermsAdjuster = ({ value, onChange }) => {
  const options = ['current', 'accelerated', 'extended'];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Payment Terms</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg p-2 w-full"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PaymentTermsAdjuster;
