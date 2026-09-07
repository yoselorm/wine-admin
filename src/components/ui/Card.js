import React from 'react';

const Card = ({ title, action, padded = true, className = '', children }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>}
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
};

export default Card;
