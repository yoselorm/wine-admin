import React from 'react';

const appearanceClasses = {
  primary: 'bg-gray-900 text-white border border-gray-900 hover:bg-gray-800',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  'danger-outline': 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  violet: 'bg-violet-500 text-white border border-violet-500 hover:bg-violet-600',
};

const sizeClasses = {
  sm: 'h-[30px] px-3 text-xs gap-1.5',
  md: 'h-[38px] px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-sm gap-2',
};

const Button = ({
  appearance = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-md shadow-hairline transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${appearanceClasses[appearance]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};

export default Button;
