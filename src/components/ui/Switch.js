import React from 'react';

const Switch = ({ checked, onChange, label, italic = false }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    {label && <span className={`text-sm font-medium text-gray-700 ${italic ? 'italic' : ''}`}>{label}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-violet-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </label>
);

export default Switch;
