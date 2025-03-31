import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon,
  className = '',
  subtitleClassName = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-50">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
          {subtitle && (
            <p className={`mt-1 text-sm text-[#6B7280] ${subtitleClassName}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader; 