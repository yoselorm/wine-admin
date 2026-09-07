import React from 'react';

const Pill = ({ active, onClick, children, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-white border-violet-500 text-violet-600'
        : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700'
    }`}
  >
    {children}
  </button>
);

export default Pill;
