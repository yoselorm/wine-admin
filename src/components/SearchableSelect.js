import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * A select you can type into and scroll.
 *
 * A native <select> is fine for five options and unusable for fifty: there is nowhere to type, and
 * finding a name means scrolling a list the browser draws its own way. This keeps the same shape —
 * one value, chosen from a list — and adds the two things that were missing.
 *
 * The list is filtered here rather than on the server. The caller is expected to hold the whole set
 * already, which is the other half of the problem this was built for: the brand list was fetched
 * one page at a time, so four of nineteen brands could not be picked at all.
 */
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'Nothing matches.',
  required = false,
  name,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => options.find((o) => String(o.value) === String(value)), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(Math.max(0, filtered.findIndex((o) => String(o.value) === String(value))));
      // Focus the field, not the list: opening it is almost always a prelude to typing.
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const away = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  // Keeps the highlighted row in view when moving through a long list by keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, filtered.length]);

  const choose = (option) => {
    onChange(option ? option.value : '');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
  };

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      {/* Carries the value for native form validation, which the button cannot do itself. */}
      <input type="text" name={name} value={value || ''} required={required} readOnly tabIndex={-1}
        onChange={() => {}} aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />

      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left border rounded-md bg-white transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
          ${open ? 'border-violet-500' : 'border-gray-200'}`}>
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {selected && !required && (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); choose(null); }}
              onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), choose(null))}
              className="text-gray-300 hover:text-gray-600" title="Clear">
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input ref={searchRef} type="text" value={query} onKeyDown={onKeyDown}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                placeholder={searchPlaceholder}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          {/* Scrolls rather than growing without limit — the list is as long as the catalogue is. */}
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">{emptyText}</p>
            ) : (
              filtered.map((o, i) => {
                const isSelected = String(o.value) === String(value);
                return (
                  <button key={o.value} type="button" data-active={i === active}
                    onMouseEnter={() => setActive(i)} onClick={() => choose(o)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                      ${i === active ? 'bg-violet-50' : ''} ${isSelected ? 'font-semibold text-violet-700' : 'text-gray-700'}`}>
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check size={14} className="flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {options.length > 0 && (
            <p className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
              {filtered.length} of {options.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
