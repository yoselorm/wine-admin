import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, Search, Wine, Utensils, ArrowUpRight, Tag, Wrench } from 'lucide-react';
import { fetchGaps } from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';
import InsightAlert from '../components/InsightAlert';
import { describeItem } from '../utils/describeItem';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const SEVERITY_TONE = { high: 'red', medium: 'yellow', low: 'sky' };
const SEVERITY_BAR = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-sky-400' };

const itemKind = (item) => {
  if (typeof item === 'string') return 'label';
  if (item && typeof item === 'object') {
    if (item.id && (item.sku !== undefined || item.price !== undefined || item.slug !== undefined)) return 'wine';
    if (item.id && item.is_local !== undefined) return 'dish';
    return 'object';
  }
  return 'label';
};

const itemLabel = (item) => describeItem(item);

const CheckItemRow = ({ item }) => {
  const navigate = useNavigate();
  const kind = itemKind(item);

  if (kind === 'wine') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/products/${item.id}/edit`); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all text-left group"
      >
        <span className="w-8 h-8 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
          <Wine size={14} />
        </span>
        <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">{itemLabel(item)}</span>
        {item.price !== undefined && <span className="text-xs font-medium text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-md">₵{Number(item.price).toFixed(0)}</span>}
        <ArrowUpRight size={14} className="text-gray-400 group-hover:text-violet-600 flex-shrink-0 ml-1 transition-colors" />
      </button>
    );
  }

  if (kind === 'dish') {
    return (
      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all text-left group">
        <span className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
          <Utensils size={14} />
        </span>
        <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">{itemLabel(item)}</span>
        <Badge tone={item.is_local ? 'green' : 'sky'} size="sm" className="flex-shrink-0">
          {item.is_local ? 'Local' : 'Intl'}
        </Badge>
        {item.pairings_count !== undefined && <span className="text-xs font-medium text-gray-400 flex-shrink-0 ml-1">{item.pairings_count} pairings</span>}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all text-left group">
      <span className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
        <Tag size={14} />
      </span>
      <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">{itemLabel(item)}</span>
    </div>
  );
};

const CheckItemsPanel = ({ check }) => {
  const [query, setQuery] = useState('');
  const items = check.items || [];
  const filtered = useMemo(
    () => (query ? items.filter((it) => itemLabel(it).toLowerCase().includes(query.toLowerCase())) : items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [check.items, query]
  );

  if (items.length === 0) return null;

  return (
    <div className="mt-2 bg-gray-50/50 border border-gray-100 rounded-xl overflow-hidden">
      {items.length > 8 && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder={`Filter ${items.length} items…`}
              onClick={(e) => e.stopPropagation()}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-all" 
            />
          </div>
        </div>
      )}
      <div className="max-h-[280px] overflow-y-auto p-2 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search size={20} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">No matches found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filter</p>
          </div>
        ) : (
          filtered.map((item, i) => <CheckItemRow key={item.id || item.label || i} item={item} />)
        )}
      </div>
      {check.count > items.length && (
        <div className="px-4 py-2.5 bg-gray-100/60 border-t border-gray-100 text-xs font-medium text-gray-500 flex justify-between items-center">
          <span>Showing {items.length} of {check.count} items</span>
          <span className="bg-gray-200 px-2 py-1 rounded text-gray-600">API limit: 50</span>
        </div>
      )}
    </div>
  );
};

const DataHealth = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.gaps);
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => { dispatch(fetchGaps()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const checks = [...(data?.checks || [])].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
  const unrecognized = data && checks.length === 0;

  useEffect(() => {
    if (unrecognized) {
      // eslint-disable-next-line no-console
      console.warn('[DataHealth] /insights/gaps responded but no field matched the expected shape:', data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Health</h1>
        <p className="text-sm text-gray-500 mt-1">Nine checks against the catalogue and the matching logic, worst first.</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : error ? (
        <InsightAlert title="Couldn't load data health checks">{error}</InsightAlert>
      ) : !data ? (
        <p className="text-sm text-gray-400 py-10 text-center">No data health checks returned yet.</p>
      ) : unrecognized ? (
        <InsightAlert tone="yellow" title="The endpoint responded, but nothing on this page recognised it">
          Expected a <code className="font-mono">checks[]</code> array. The raw response is logged to the console.
        </InsightAlert>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Open issues', data.summary?.issues ?? checks.length, 'text-gray-900'],
              ['High', data.summary?.high ?? 0, 'text-red-600'],
              ['Medium', data.summary?.medium ?? 0, 'text-yellow-600'],
              ['Low', data.summary?.low ?? 0, 'text-sky-600'],
            ].map(([lbl, val, colour]) => (
              <div key={lbl} className="bg-white border border-gray-200 rounded-xl shadow-card px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{lbl}</p>
                <p className={`text-2xl font-bold mt-0.5 ${colour}`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {checks.map((check) => {
              const expanded = expandedKey === check.key;
              return (
                <div key={check.key} className={`flex bg-white border rounded-xl shadow-card overflow-hidden transition-all duration-200 ${expanded ? 'border-gray-200' : 'border-gray-200'}`}>
                  <span className={`w-1 flex-shrink-0 ${SEVERITY_BAR[check.severity] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <button onClick={() => setExpandedKey(expanded ? null : check.key)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 focus:outline-none transition-colors">
                      <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180 text-violet-600' : ''}`} />
                      <div className="flex-1 min-w-0">
                        {/* Changed text-violet-900 to text-violet-700 which maps to a light purple in dark mode */}
                        <p className={`text-sm font-bold transition-colors ${expanded ? 'text-violet-700' : 'text-gray-900'}`}>{check.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{check.detail}</p>
                      </div>
                      <span className="text-xl font-bold text-gray-900 flex-shrink-0 tracking-tight">{check.count}</span>
                      <Badge tone={SEVERITY_TONE[check.severity] || 'neutral'} size="lg" className="flex-shrink-0">
                        {check.severity ? check.severity[0].toUpperCase() + check.severity.slice(1) : ''}
                      </Badge>
                    </button>
                    {expanded && (
                      <div className="px-5 pb-5 pt-1 animate-fade-in border-t border-gray-100">
                        <CheckItemsPanel check={check} />
                        
                        {check.fix && (
                          <div className="mt-4 flex gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl items-start">
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Wrench size={12} />
                            </span>
                            <div>
                              <span className="block text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">Recommended Action</span>
                              <span className="text-sm font-medium text-gray-700 leading-relaxed block">{check.fix}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DataHealth;