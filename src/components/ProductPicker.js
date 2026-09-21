import React, { useEffect, useRef, useState } from 'react';
import api from '../services/Api';
import { api_url } from '../utils/config';
import { Loader2, Search, X } from 'lucide-react';

// Picks the wine a row belongs to.
//
// Both the attribute and characteristic screens list rows from across the catalogue, which reads as
// though the rows float free of any product. They do not: an attribute and a tasting score are both
// facts *about a wine*, and the API requires product_id on create. Without this the Add button on
// either screen posts an incomplete body and is refused every time.
//
// It fetches on its own rather than through the products slice, which the Products page owns —
// searching here would otherwise replace the list that page is showing.
const ProductPicker = ({ value, onChange, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Clearing the value from outside (after a successful save) must clear the label too.
  useEffect(() => {
    if (!value) { setSelected(null); setQuery(''); }
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`${api_url}/v1/admin/products`, { params: { search: query, per_page: 10 } });
        setResults(res.data?.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    const away = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  if (selected) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 ${className}`}>
        <span className="truncate flex-1 text-gray-900">{selected.name}</span>
        <button type="button" onClick={() => { setSelected(null); onChange(''); setQuery(''); }}
          className="text-gray-400 hover:text-gray-700 flex-shrink-0" title="Change wine">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder="Search for a wine..."
        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">No wines match.</p>
          ) : (
            results.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { setSelected(p); onChange(p.id); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 transition-colors">
                <span className="block truncate text-gray-900">{p.name}</span>
                {p.sku && <span className="block text-xs text-gray-400">{p.sku}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPicker;
