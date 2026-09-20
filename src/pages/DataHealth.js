import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { fetchGaps } from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';
import InsightAlert from '../components/InsightAlert';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const SEVERITY_TONE = { high: 'red', medium: 'yellow', low: 'sky' };
const SEVERITY_BAR = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-sky-400' };

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
                <div key={check.key} className="flex bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
                  <span className={`w-1 flex-shrink-0 ${SEVERITY_BAR[check.severity] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <button onClick={() => setExpandedKey(expanded ? null : check.key)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{check.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>
                      </div>
                      <span className="text-xl font-bold text-gray-900 flex-shrink-0">{check.count}</span>
                      <Badge tone={SEVERITY_TONE[check.severity] || 'neutral'} size="lg" className="flex-shrink-0">
                        {check.severity ? check.severity[0].toUpperCase() + check.severity.slice(1) : ''}
                      </Badge>
                    </button>
                    {expanded && (
                      <div className="px-5 pb-4">
                        {check.items?.length > 0 && (
                          <>
                            <div className="flex flex-wrap gap-1.5">
                              {check.items.map((item, i) => (
                                <span key={i} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">
                                  {typeof item === 'string' ? item : item.name || item.label || JSON.stringify(item)}
                                </span>
                              ))}
                            </div>
                            {check.count > check.items.length && (
                              <p className="text-xs text-gray-400 mt-2.5">Showing {check.items.length} of {check.count} · the API caps items at 50</p>
                            )}
                          </>
                        )}
                        {check.fix && (
                          <div className="flex gap-3 items-baseline mt-3.5 pt-3.5 border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Fix</span>
                            <span className="text-sm text-gray-700">{check.fix}</span>
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
