import React from 'react';

// The value half of an attribute. Which control this is depends entirely on the type.
//
// A type with a shared vocabulary — bottle_size, allergens — keeps its values in one place and every
// product points at the same row, so this is a <select> of those values. Typing a new one is still
// allowed: it is added to the list rather than refused, the same way "+ New type..." works above it.
//
// A type without one — colour_note, grape_blend — holds prose about a single product. There is
// nothing to pick from, so it stays a plain text field.
//
// Near-duplicates are settled by the server: "75 CL" typed against an existing "75CL" resolves to
// the row that is already there rather than sitting beside it. So a free-typed value here is safe,
// and does not need the frontend to guess at matching.
const ValueField = ({ type, value, onChange, placeholder, maxLength = 500, className = '' }) => {
  const options = type?.is_enumerated ? type.values || [] : null;

  if (!options) {
    return (
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Value'}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 ${className}`}
      />
    );
  }

  const isKnown = options.some((o) => o.value === value);

  return (
    <div className={className}>
      <select
        value={isKnown ? value : '__custom__'}
        onChange={(e) => onChange(e.target.value === '__custom__' ? '' : e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500"
      >
        <option value="" disabled>Select value...</option>
        {options.map((o) => (
          <option key={o.id} value={o.value}>{o.value}</option>
        ))}
        <option value="__custom__">+ New value...</option>
      </select>
      {!isKnown && (
        <input
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'New value'}
          className="w-full mt-1.5 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
        />
      )}
    </div>
  );
};

export default ValueField;
