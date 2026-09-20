import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { Loader2, X, Search } from 'lucide-react';
import {
  fetchCatalogueInsights,
  fetchFacet,
  fetchInsightWines,
  clearInsightWines,
} from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';
import Pagination from '../components/Pagination';

const DIMENSION_LABEL = {
  colour: 'Colour', color: 'Colour', grape: 'Grape Variety', country: 'Country', region: 'Wine Region',
  brand: 'Brand', price_band: 'Price Band', axis: 'Tasting Axis', dish: 'Dish', pairing_type: 'Pairing Type',
};
const label = (dim) => DIMENSION_LABEL[dim] || dim.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const humanizeStat = (key) => key.replace(/^total_/, '').replace(/_/g, ' ').toUpperCase();

const STATUS_TONE = { 'Too thin': 'red', Patchy: 'yellow', Good: 'green' };
const axisStatus = (pct) => (pct < 20 ? 'Too thin' : pct < 50 ? 'Patchy' : 'Good');

// Every count is drillable — this always sends the value's own `filter` object verbatim to
// /insights/wines, never a hand-built query. The filter is shown so that stays visible, not implied.
const WinesDrillModal = ({ isOpen, onClose, title, filter }) => {
  const dispatch = useDispatch();
  const { items, meta, loading } = useSelector((s) => s.insights.wines);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen && filter) dispatch(fetchInsightWines({ ...filter, page }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter, page]);

  useEffect(() => { if (isOpen) setPage(1); }, [isOpen, filter]);

  const handleClose = () => {
    onClose();
    dispatch(clearInsightWines());
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/45 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-xl w-full relative z-50 overflow-hidden animate-slide-in flex flex-col max-h-[80vh]">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {filter && <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{JSON.stringify(filter)}</p>}
          </div>
          <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-sm">
              <p className="text-gray-400">No wines match this filter.</p>
              <p className="font-bold text-red-600 mt-1">That is the finding.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-violet-300 flex-shrink-0" />
                  <span className="text-gray-800 flex-1 truncate">{w.name}</span>
                  <span className="text-gray-900 font-semibold flex-shrink-0">₵{Number(w.price ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
          <p className="text-xs text-gray-400">
            {meta ? `Showing ${items.length} of ${meta.total} wines` : items.length === 0 ? 'No wines match this filter' : ''}
            {' · /insights/wines with the filter above, verbatim'}
          </p>
          {meta && <Pagination meta={meta} onPageChange={setPage} compact />}
        </div>
      </div>
    </div>,
    document.body
  );
};

const FacetCard = ({ dimension, summary }) => {
  const dispatch = useDispatch();
  const { data: fullFacet, loading: facetLoading } = useSelector((s) => s.insights.facet);
  const [showFull, setShowFull] = useState(false);
  const [search, setSearch] = useState('');
  const [drill, setDrill] = useState(null);

  const values = summary?.values || [];
  const showingFull = showFull && fullFacet?.dimension === dimension;
  const listSource = showingFull ? fullFacet.values || [] : values;
  const filtered = search ? listSource.filter((v) => v.label.toLowerCase().includes(search.toLowerCase())) : listSource;
  const max = Math.max(...listSource.map((v) => v.wines), 1);
  const searchable = values.length > 6;

  const handleViewAll = () => {
    setShowFull(true);
    if (fullFacet?.dimension !== dimension) dispatch(fetchFacet(dimension));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">{label(dimension)}</h3>
      </div>

      {searchable && (
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${label(dimension).toLowerCase()}…`}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
          </div>
        </div>
      )}

      <div className={showingFull ? 'max-h-[220px] overflow-y-auto' : ''}>
        {filtered.map((v) => (
          <button
            key={v.id || v.label}
            onClick={() => setDrill({ title: `${label(dimension)} · ${v.label}`, filter: v.filter })}
            disabled={!v.filter}
            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 disabled:hover:bg-transparent disabled:cursor-default text-left"
          >
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">{v.label}</span>
            <span className="w-[90px] h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              <span className="block h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((v.wines / max) * 100)}%` }} />
            </span>
            <span className="text-sm font-semibold text-gray-900 w-8 text-right flex-shrink-0">{v.wines}</span>
          </button>
        ))}
        {showingFull && facetLoading && (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" size={16} /></div>
        )}
      </div>

      <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400 truncate">
          {summary?.unclassified ? `${summary.unclassified} wines carry no ${label(dimension).toLowerCase()}` : 'Every wine classified'}
        </span>
        {!showingFull && (
          <button onClick={handleViewAll} className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex-shrink-0">
            All {summary?.total ?? values.length} →
          </button>
        )}
      </div>

      <WinesDrillModal isOpen={!!drill} onClose={() => setDrill(null)} title={drill?.title} filter={drill?.filter} />
    </div>
  );
};

const InsightsCatalogue = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.catalogue);

  useEffect(() => { dispatch(fetchCatalogueInsights()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const dimensionKeys = data ? Object.keys(data).filter((k) => data[k] && typeof data[k] === 'object' && Array.isArray(data[k].values)) : [];
  const facetKeys = dimensionKeys.filter((k) => k !== 'axis');
  const axisSummary = data?.axis;
  const statEntries = data ? Object.entries(data).filter(([, v]) => typeof v === 'number') : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catalogue</h1>
        <p className="text-sm text-gray-500 mt-1">What the cellar holds, across every dimension. Every count opens the wines behind it.</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : !data ? null : (
        <>
          {statEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
              {statEntries.map(([key, value]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-xl shadow-card px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-400 tracking-wider">{humanizeStat(key)}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {facetKeys.map((dim) => <FacetCard key={dim} dimension={dim} summary={data[dim]} />)}
          </div>

          {axisSummary?.values?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Tasting Axes</h3>
              </div>
              <p className="px-5 py-3 text-xs text-gray-400 border-b border-gray-100">
                Coverage is how many wines carry a score on that axis. Average is the mean score among those scored.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide bg-gray-50">
                    <th className="px-5 py-2.5">Axis</th>
                    <th className="px-4 py-2.5 w-[200px]">Coverage</th>
                    <th className="px-4 py-2.5 text-right">Scored</th>
                    <th className="px-4 py-2.5 text-right">Avg</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {axisSummary.values.map((v) => {
                    const pct = Math.round((v.wines / (data.total_wines || v.wines || 1)) * 100);
                    const status = axisStatus(pct);
                    return (
                      <tr key={v.label} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => dispatch(fetchInsightWines(v.filter || {}))}>
                        <td className="px-5 py-2.5 font-semibold text-gray-900 capitalize">{v.label}</td>
                        <td className="px-4 py-2.5">
                          <span className="block w-[180px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <span className={`block h-full rounded-full ${status === 'Too thin' ? 'bg-red-400' : status === 'Patchy' ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{v.wines}{data.total_wines ? ` of ${data.total_wines}` : ''}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{v.avg != null ? Number(v.avg).toFixed(1) : '—'}</td>
                        <td className="px-5 py-2.5"><Badge tone={STATUS_TONE[status]}>{status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InsightsCatalogue;
