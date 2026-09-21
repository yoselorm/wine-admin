import React from 'react';

// A real <select> of known/suggested types that still accepts a brand-new one: choosing
// "+ New type..." (or already holding a value with no matching option) reveals a text field for
// typing the slug, since `type`/`attribute_type` are now open-ended, not a fixed enum.
const TypeCombobox = ({ value, onChange, options, placeholder = 'e.g. bottle_size', className = '' }) => {
  // An empty value is 'nothing picked yet', not 'a custom one being typed'. Treating it as custom
  // opened the free-text box on first render, so the form asked for a new type before offering the
  // existing ones.
  const isKnown = !value || options.some((o) => o.value === value);

  return (
    <div className={className}>
      <select
        value={isKnown ? value : '__custom__'}
        onChange={(e) => onChange(e.target.value === '__custom__' ? '' : e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500"
      >
        <option value="" disabled>Select type...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        <option value="__custom__">+ New type...</option>
      </select>
      {!isKnown && (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            placeholder={placeholder}
            pattern="^[a-z][a-z0-9_]*$"
            className="w-full mt-1.5 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
          />
          {value && !/^[a-z][a-z0-9_]*$/.test(value) && (
            <p className="text-xs text-red-500 mt-1">Lowercase letters, numbers and underscores only, starting with a letter.</p>
          )}
        </>
      )}
    </div>
  );
};

export default TypeCombobox;
