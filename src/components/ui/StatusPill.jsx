import React from 'react';

const statusStyles = {
  volatile: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: '⚠️'
  },
  improving: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: '✅'
  },
  new: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '🆕'
  }
};

const StatusPill = ({ 
  status, 
  label, 
  className = '',
  showIcon = true
}) => {
  const style = statusStyles[status] || statusStyles.new;
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${style.bg} ${style.text} ${style.border} border
      ${className}
    `}>
      {showIcon && <span>{style.icon}</span>}
      {label || status}
    </span>
  );
};

export default StatusPill; 