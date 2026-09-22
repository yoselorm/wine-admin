import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWineAttributes,
  fetchAttributeTypes,
  createWineAttribute,
  updateWineAttribute,
  deleteWineAttribute,
  clearWineAttributeStatus,
} from '../redux/WineAttributeSlice';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Trash2, Check, X, Tag } from 'lucide-react';
import api from '../services/Api';
import { api_url } from '../utils/config';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import TypeCombobox from '../components/TypeCombobox';
import ValueField from '../components/ValueField';

const humanizeType = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const emptyDraft = { attribute_type: '', value: '' };

/**
 * What each product says about itself.
 *
 * This was a flat list of every attribute row in the catalogue — 634 of them, 42 pages — with the
 * type and value on each. Since 155 wines carry the same allergen declaration and 142 the same
 * bottle size, it read as one fact printed over and over, and finding a particular wine's
 * attributes meant searching for it and reading rows that all looked alike.
 *
 * A product is the unit here: it is the thing an admin has in mind, the thing the rows belong to,
 * and the thing the page is named after. So the wine is chosen first and its attributes are shown
 * together, grouped by type. The repetition disappears because it was never repetition — it was one
 * fact per wine, listed without saying whose.
 *
 * The shared values themselves live on Attribute Types & Values, where renaming one moves every
 * product carrying it.
 */
const ProductAttributes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { attributes, types, mutationLoading, error, successMessage } = useSelector((s) => s.wineAttributes);

  const [wines, setWines] = useState([]);
  const [winePage, setWinePage] = useState(1);
  const [winePagination, setWinePagination] = useState(null);
  const [wineSearch, setWineSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingWines, setLoadingWines] = useState(false);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null); // { id, value }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const typeFor = (key) => (types || []).find((t) => t.key === key);

  const typeOptions = useMemo(
    () => (types || []).map((t) => ({ value: t.key, label: t.label || humanizeType(t.key), hint: t.hint })),
    [types],
  );

  useEffect(() => {
    dispatch(fetchAttributeTypes());
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(wineSearch); setWinePage(1); }, 300);
    return () => clearTimeout(t);
  }, [wineSearch]);

  // Fetched here rather than through the products slice, which the Products page owns — searching
  // on this screen would otherwise replace the list that one is showing.
  useEffect(() => {
    let cancelled = false;
    setLoadingWines(true);
    api.get(`${api_url}/v1/admin/products`, { params: { search: debouncedSearch || undefined, page: winePage, per_page: 15 } })
      .then((res) => {
        if (cancelled) return;
        setWines(res.data?.data || []);
        setWinePagination(res.data?.meta || null);
      })
      .catch(() => !cancelled && setWines([]))
      .finally(() => !cancelled && setLoadingWines(false));
    return () => { cancelled = true; };
  }, [debouncedSearch, winePage]);

  const loadAttributes = (productId) => dispatch(fetchWineAttributes({ product_id: productId, per_page: 100 }));

  useEffect(() => {
    if (selected) loadAttributes(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearWineAttributeStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineAttributeStatus());
      if (selected) loadAttributes(selected.id);
      dispatch(fetchAttributeTypes());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, successMessage]);

  // Grouped so a wine with a bottle size, an allergen note and two grape blends reads as three
  // kinds of fact rather than four loose rows.
  const grouped = useMemo(() => {
    const byType = new Map();
    for (const a of attributes || []) {
      if (!byType.has(a.attribute_type)) byType.set(a.attribute_type, []);
      byType.get(a.attribute_type).push(a);
    }
    return [...byType.entries()];
  }, [attributes]);

  const handleAdd = () => {
    if (!selected || !draft.attribute_type.trim() || !draft.value.trim()) return;
    dispatch(createWineAttribute({ product_id: selected.id, ...draft }));
    setDraft(emptyDraft);
  };

  const handleRename = () => {
    if (!editing?.value.trim()) return;
    dispatch(updateWineAttribute({ id: editing.id, data: { value: editing.value.trim() } }));
    setEditing(null);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteWineAttribute(deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Attributes</h1>
        <p className="text-sm text-gray-500 mt-1">
          What each product says — bottle size, allergens, cask type and more. Pick a wine to see and
          edit its attributes. To rename a shared value across every product at once, use{' '}
          <button type="button" onClick={() => navigate('/dashboard/attribute-types')} className="text-violet-600 hover:underline">
            Attribute Types &amp; Values
          </button>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* WINES */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={wineSearch} onChange={(e) => setWineSearch(e.target.value)}
                placeholder="Search wines..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingWines && wines.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
            ) : wines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No wines match.</p>
            ) : (
              wines.map((w) => (
                <button key={w.id} onClick={() => { setSelected(w); setEditing(null); setDraft(emptyDraft); }}
                  className={`w-full text-left px-5 py-3 transition-colors ${selected?.id === w.id ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                  <p className={`text-sm font-medium truncate ${selected?.id === w.id ? 'text-violet-700' : 'text-gray-900'}`}>{w.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {/* A wine with none is the one worth finding — it is invisible to anything that
                        reads attributes. */}
                    {w.attributes_count === 0
                      ? <span className="text-amber-600">No attributes yet</span>
                      : `${w.attributes_count} attribute${w.attributes_count === 1 ? '' : 's'}`}
                  </p>
                </button>
              ))
            )}
          </div>

          {winePagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <Pagination meta={winePagination} onPageChange={setWinePage} compact />
            </div>
          )}
        </div>

        {/* ATTRIBUTES FOR THE CHOSEN WINE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-sm text-gray-400 gap-2">
              <Tag size={22} className="text-gray-200" />
              Pick a wine to see its attributes.
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-6">
                {(attributes || []).length} attribute{(attributes || []).length === 1 ? '' : 's'}
              </p>

              {grouped.length === 0 ? (
                <p className="text-sm text-gray-400 italic mb-6">Nothing recorded for this wine yet.</p>
              ) : (
                <div className="space-y-5 mb-7">
                  {grouped.map(([type, rows]) => (
                    <div key={type}>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        {typeFor(type)?.label || humanizeType(type)}
                        {typeFor(type)?.is_enumerated && <span className="ml-1.5 font-normal normal-case tracking-normal text-gray-300">shared list</span>}
                      </p>
                      <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {rows.map((a) => (
                          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                            {editing?.id === a.id ? (
                              <>
                                <ValueField type={typeFor(a.attribute_type)} value={editing.value}
                                  onChange={(v) => setEditing((e) => ({ ...e, value: v }))} className="flex-1" />
                                <button onClick={handleRename} disabled={mutationLoading}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Save">
                                  {mutationLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                </button>
                                <button onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded transition-colors" title="Cancel">
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditing({ id: a.id, value: a.value })}
                                  className="flex-1 text-left text-sm text-gray-900 hover:text-violet-600 transition-colors truncate">
                                  {a.value}
                                </button>
                                {a.products_count > 1 && (
                                  <span className="text-xs text-gray-300 flex-shrink-0">{a.products_count} products</span>
                                )}
                                <button onClick={() => setDeleteTarget(a)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="Remove from this wine">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Add an attribute</p>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-start">
                  <TypeCombobox value={draft.attribute_type} options={typeOptions}
                    onChange={(v) => setDraft((d) => ({ ...d, attribute_type: v, value: '' }))} />
                  <ValueField type={typeFor(draft.attribute_type)} value={draft.value}
                    onChange={(v) => setDraft((d) => ({ ...d, value: v }))}
                    placeholder={typeFor(draft.attribute_type)?.hint || 'Value'} />
                  <button onClick={handleAdd} disabled={mutationLoading || !draft.attribute_type || !draft.value}
                    className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1.5 justify-center">
                    {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                  </button>
                </div>
                {typeFor(draft.attribute_type)?.hint && (
                  <p className="text-xs text-gray-400 mt-1.5">{typeFor(draft.attribute_type).hint}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Remove Attribute"
        message={`Remove "${deleteTarget?.value}" from ${selected?.name}? Other products keep it.`}
      />
    </div>
  );
};

export default ProductAttributes;
