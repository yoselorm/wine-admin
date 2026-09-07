import React from 'react';

const toneClasses = {
  green: 'bg-green-50 text-green-700 border-green-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
};

const Badge = ({ tone = 'neutral', size = 'sm', className = '', children }) => {
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wide rounded-full border ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
