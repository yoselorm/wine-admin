import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { Loader2, X, Search, ChevronRight, Grid3x3, LayoutGrid } from 'lucide-react';
import {
  fetchCatalogueInsights,
  fetchFacet,
  fetchInsightWines,
  fetchPairingsMatrix,
  fetchWinePairings,
  fetchDishPairings,
  clearInsightWines,
} from '../redux/InsightsSlice';
import { fetchProducts } from '../redux/ProductSlice';
import { fetchFoodDishes } from '../redux/FoodDishSlice';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Pagination from '../components/Pagination';

const DIMENSION_LABEL = {
  colour: 'Colour', color: 'Colour', grape: 'Grape', country: 'Country', region: 'Region',
  brand: 'Brand', price_band: 'Price Band', axis: 'Tasting Axis', dish: 'Dish', pairing_type: 'Pairing Type',
};
const label = (dim) => DIMENSION_LABEL[dim] || dim.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Every count is drillable — this is what a facet value's count opens onto. It always sends the
// value's own `filter` object verbatim, never a hand-built query.
const WinesDrillModal = ({ isOpen, onClose, title, filter }) => {
  const dispatch = useDispatch();
  const { items, meta, loading } = useSelector((s) => s.insights.wines);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen && filter) {
      dispatch(fetchInsightWines({ ...filter, page }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter, page]);

  useEffect(() => {
    if (isOpen) setPage(1);
  }, [isOpen, filter]);

  const handleClose = () => {
    onClose();
    dispatch(clearInsightWines());
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-2xl w-full relative z-50 overflow-hidden animate-slide-in flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No wines match this filter.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-800 font-medium truncate pr-3">{w.name}</span>
                  <span className="text-gray-400 flex-shrink-0">₵{Number(w.price ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {meta && (
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <Pagination meta={meta} onPageChange={setPage} compact />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const FacetCard = ({ dimension, summary }) => {
  const dispatch = useDispatch();
  const { data: fullFacet, loading: facetLoading } = useSelector((s) => s.insights.facet);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [drill, setDrill] = useState(null);

  const values = summary?.values || [];
  const hasAvg = values.some((v) => v.avg !== undefined);
  const showingFull = expanded && fullFacet?.dimension === dimension;
  const listSource = showingFull ? fullFacet.values || [] : values;
  const filtered = search ? listSource.filter((v) => v.label.toLowerCase().includes(search.toLowerCase())) : listSource;

  const handleExpand = () => {
    setExpanded(true);
    if (fullFacet?.dimension !== dimension) dispatch(fetchFacet(dimension));
  };

  return (
    <Card
      title={label(dimension)}
      action={summary?.unclassified > 0 ? <Badge tone="yellow" size="sm">{summary.unclassified} unclassified</Badge> : null}
    >
      {expanded && values.length > 5 && (
        <div className="relative mb-3">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${label(dimension).toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
        </div>
      )}

      {showingFull && facetLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" size={16} /></div>
      ) : (
        <div className={`space-y-1.5 ${expanded ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
          {filtered.map((v) => (
            <button
              key={v.id || v.label}
              onClick={() => setDrill({ title: `${label(dimension)}: ${v.label}`, filter: v.filter })}
              disabled={!v.filter}
              className="w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 disabled:hover:bg-transparent disabled:cursor-default"
            >
              <span className="text-gray-700 truncate pr-2">{v.label}</span>
              <span className="flex items-center gap-2 flex-shrink-0 text-gray-500">
                {hasAvg && v.avg !== undefined && <span className="text-xs text-gray-400">avg {v.avg}</span>}
                <span className="font-semibold text-gray-900">{v.wines}</span>
                {v.filter && <ChevronRight size={12} className="text-gray-300" />}
              </span>
            </button>
          ))}
        </div>
      )}

      {!expanded && values.length >= 5 && (
        <button onClick={handleExpand} className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-700">
          View all →
        </button>
      )}

      <WinesDrillModal isOpen={!!drill} onClose={() => setDrill(null)} title={drill?.title} filter={drill?.filter} />
    </Card>
  );
};

const CountsTab = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.catalogue);

  useEffect(() => { dispatch(fetchCatalogueInsights()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  if (loading && !data) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;
  }
  if (!data) return null;

  const dimensions = Object.keys(data).filter((k) => data[k] && typeof data[k] === 'object' && Array.isArray(data[k].values));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {dimensions.map((dim) => (
        <FacetCard key={dim} dimension={dim} summary={data[dim]} />
      ))}
    </div>
  );
};

const WineToDishesView = () => {
  const dispatch = useDispatch();
  const { items: products } = useSelector((s) => s.products || { items: [] });
  const { data, loading } = useSelector((s) => s.insights.winePairings);
  const [productId, setProductId] = useState('');

  useEffect(() => { dispatch(fetchProducts({ per_page: 200 })); }, [dispatch]);
  useEffect(() => { if (productId) dispatch(fetchWinePairings(productId)); }, [dispatch, productId]);

  return (
    <Card title="A wine → the dishes it suits">
      <select value={productId} onChange={(e) => setProductId(e.target.value)}
        className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 mb-4">
        <option value="">Choose a wine...</option>
        {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={18} /></div>
      ) : !productId ? (
        <p className="text-sm text-gray-400">Pick a wine to see the dishes it's paired with.</p>
      ) : !data?.pairings?.length ? (
        <p className="text-sm text-gray-400">No dishes paired with this wine yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.pairings.map((p) => (
            <div key={p.dish_id || p.dish} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-800 font-medium">{p.dish_name || p.dish}</span>
              {p.other_wines_for_this_dish === 0 ? (
                <Badge tone="red" size="sm">Only wine for this dish</Badge>
              ) : (
                <span className="text-xs text-gray-400">{p.other_wines_for_this_dish} other wines also fit</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const DishToWinesView = () => {
  const dispatch = useDispatch();
  const { foodDishes: dishes } = useSelector((s) => s.foodDishes || { foodDishes: [] });
  const { data, loading } = useSelector((s) => s.insights.dishPairings);
  const [dishId, setDishId] = useState('');

  useEffect(() => { dispatch(fetchFoodDishes({ per_page: 200 })); }, [dispatch]);
  useEffect(() => { if (dishId) dispatch(fetchDishPairings(dishId)); }, [dispatch, dishId]);

  return (
    <Card title="A dish → the wines that suit it">
      <select value={dishId} onChange={(e) => setDishId(e.target.value)}
        className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 mb-4">
        <option value="">Choose a dish...</option>
        {dishes?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={18} /></div>
      ) : !dishId ? (
        <p className="text-sm text-gray-400">Pick a dish to see the wines that suit it.</p>
      ) : !data?.wines?.length ? (
        <p className="text-sm text-gray-400">No wines paired with this dish yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.wines.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-800 font-medium truncate pr-3">{w.name}</span>
              <span className="flex items-center gap-2 flex-shrink-0">
                {w.colour && <Badge tone="neutral" size="sm">{w.colour}</Badge>}
                <span className="text-gray-400">₵{Number(w.price ?? 0).toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const MatrixView = () => {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((s) => s.insights.pairingsMatrix);
  const [localFilter, setLocalFilter] = useState('');

  useEffect(() => { dispatch(fetchPairingsMatrix(localFilter)); }, [dispatch, localFilter]);

  const colours = data?.colours || [];

  return (
    <Card title="Every dish against every colour" padded={false}>
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex gap-1.5">
          {[['', 'All'], ['1', 'Local'], ['0', 'International']].map(([val, lbl]) => (
            <button key={val} onClick={() => setLocalFilter(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                localFilter === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>{lbl}</button>
          ))}
        </div>
        {data?.summary && (
          <div className="flex gap-4 text-xs text-gray-500">
            <span><span className="font-bold text-gray-900">{data.summary.unpaired}</span> unpaired</span>
            <span><span className="font-bold text-gray-900">{data.summary.thinly_covered}</span> thin</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
      ) : !data?.dishes?.length ? (
        <p className="text-sm text-gray-400 text-center py-10">No pairing data yet.</p>
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-2.5 sticky left-0 bg-white">Dish</th>
                {colours.map((c) => <th key={c.slug} className="px-3 py-2.5 text-center">{c.label}</th>)}
                <th className="px-3 py-2.5 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.dishes.map((row) => (
                <tr key={row.dish_id} className={row.total === 0 ? 'bg-red-50/40' : row.is_thin ? 'bg-yellow-50/40' : ''}>
                  <td className="px-4 py-2 sticky left-0 bg-inherit font-medium text-gray-800 whitespace-nowrap">
                    {row.dish}
                    {row.is_local && <span className="ml-1.5 text-[10px] text-green-600 font-bold">LOCAL</span>}
                  </td>
                  {colours.map((c) => {
                    const val = row.cells?.[c.slug] ?? 0;
                    const missing = row.missing_colours?.includes(c.slug);
                    return (
                      <td key={c.slug} className={`px-3 py-2 text-center ${val === 0 ? 'text-red-400 font-semibold' : 'text-gray-700'}`}>
                        {val}{missing && val === 0 && <span className="text-[10px] block text-red-300">missing</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-bold text-gray-900">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

const PairingsTab = () => {
  const [view, setView] = useState('matrix');
  return (
    <div className="space-y-5">
      <div className="flex gap-1.5">
        {[['matrix', 'Matrix', Grid3x3], ['wine', 'Wine → Dishes', ChevronRight], ['dish', 'Dish → Wines', LayoutGrid]].map(([key, lbl, Icon]) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-md border transition-colors ${
              view === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Icon size={14} /> {lbl}
          </button>
        ))}
      </div>
      {view === 'matrix' && <MatrixView />}
      {view === 'wine' && <WineToDishesView />}
      {view === 'dish' && <DishToWinesView />}
    </div>
  );
};

const CatalogueExplorer = () => {
  const [tab, setTab] = useState('counts');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catalogue Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">What do we have? Every count opens the wines behind it.</p>
      </div>

      <div className="flex gap-1.5 border-b border-gray-200">
        {[['counts', 'Counts'], ['pairings', 'Food Pairings']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>{lbl}</button>
        ))}
      </div>

      {tab === 'counts' ? <CountsTab /> : <PairingsTab />}
    </div>
  );
};

export default CatalogueExplorer;
