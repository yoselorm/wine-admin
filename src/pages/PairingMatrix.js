import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { fetchPairingsMatrix } from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';

const TABS = [
  ['all', 'All'],
  ['local', 'Local'],
  ['intl', 'International'],
  ['thin', 'Needs attention'],
];

const PairingMatrix = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.pairingsMatrix);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => { dispatch(fetchPairingsMatrix()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const colours = data?.colours || [];
  const dishes = data?.dishes || [];
  const summary = data?.summary;

  const rows = useMemo(() => dishes
    .filter((d) => tab === 'all' ? true : tab === 'local' ? d.is_local : tab === 'intl' ? !d.is_local : d.is_thin)
    .filter((d) => !query || d.dish.toLowerCase().includes(query.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, tab, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pairing Matrix</h1>
        <p className="text-sm text-gray-500 mt-1">Every dish against every wine colour. Zero cells are the ones worth acting on.</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : !data ? null : (
        <>
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                ['Dishes', summary.dishes, 'in the vocabulary', 'text-gray-900'],
                ['No wine at all', summary.unpaired, 'pair to nothing', 'text-red-600'],
                ['Thinly covered', summary.thinly_covered, 'two wines or fewer', 'text-yellow-600'],
                ['Local pairings', summary.local_pairings, 'Ghanaian dishes', 'text-gray-900'],
                ['International', summary.international_pairings, 'everything else', 'text-gray-900'],
              ].map(([lbl, val, sub, colour]) => (
                <div key={lbl} className="bg-white border border-gray-200 rounded-xl shadow-card px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{lbl}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${colour}`}>{val}<span className="text-xs font-medium text-gray-400 ml-1.5">{sub}</span></p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map(([key, lbl]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`h-[30px] px-3.5 rounded-full text-xs font-semibold border transition-colors ${
                  tab === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {lbl}{key === 'thin' && summary ? ` ${summary.thinly_covered}` : key === 'all' ? ` ${summary?.dishes ?? ''}` : ''}
              </button>
            ))}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes…"
              className="flex-1 min-w-[180px] h-[38px] px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide bg-gray-50">
                    <th className="px-5 py-2.5 sticky left-0 bg-gray-50 z-20">Dish</th>
                    {colours.map((c) => <th key={c.slug} className="px-4 py-2.5 text-right whitespace-nowrap">{c.label}</th>)}
                    <th className="px-4 py-2.5 text-right">Total</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const tone = row.total === 0 ? 'red' : row.is_thin ? 'yellow' : 'green';
                    const status = row.total === 0 ? 'No wine' : row.is_thin ? 'Thin' : 'Covered';
                    return (
                      <tr key={row.dish_id}>
                        <td className={`px-5 py-2.5 font-medium whitespace-nowrap sticky left-0 bg-white ${row.total === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {row.dish}
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">{row.is_local ? 'Local' : 'Intl'}</span>
                        </td>
                        {colours.map((c) => {
                          const val = row.cells?.[c.slug] ?? 0;
                          return (
                            <td key={c.slug} className={`px-4 py-2.5 text-right font-medium ${val === 0 ? 'text-red-500 font-semibold bg-red-50/60' : 'text-gray-700'}`}>
                              {val}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">{row.total}</td>
                        <td className="px-5 py-2.5"><Badge tone={tone}>{status}</Badge></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={colours.length + 3} className="px-5 py-10 text-center text-sm text-gray-400">No dishes match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {rows.length} of {dishes.length} dishes · zero cells are kept deliberately — they are the rows worth acting on
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PairingMatrix;
