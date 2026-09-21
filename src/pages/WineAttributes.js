import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWineAttributes,
  fetchAttributeTypes,
  createWineAttribute,
  updateWineAttribute,
  deleteWineAttribute,
  clearWineAttributeStatus,
} from '../redux/WineAttributeSlice';
import { Loader2, Plus, Search } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import TypeCombobox from '../components/TypeCombobox';
import { paginateLocal } from '../utils/paginateLocal';

const humanizeType = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const emptyDetail = { attribute_type: '', value: '' };
const PER_PAGE = 12;

// A catalog of (type, value) facts — closure, residual sugar, oak treatment, age statement, cask
// type... not tied to any one product. `attribute_type` is any lowercase identifier now, not a
// fixed enum, so the type field merges what's already in use with the starter suggestions and
// still accepts free text — a spirit needs `age_statement`, a wine needs `grape_blend`.
const WineAttributes = () => {
  const dispatch = useDispatch();
  const { attributes, inUseTypes, suggestedTypes, loading, mutationLoading, error, successMessage } = useSelector((s) => s.wineAttributes);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newAttr, setNewAttr] = useState(emptyDetail);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const typeOptions = [
    ...inUseTypes.map((t) => ({ value: t.attribute_type, label: humanizeType(t.attribute_type), hint: null, products_count: t.products_count })),
    ...(suggestedTypes.shared || []).filter((s) => !inUseTypes.some((t) => t.attribute_type === s.attribute_type))
      .map((s) => ({ value: s.attribute_type, label: humanizeType(s.attribute_type), hint: s.hint })),
  ];
  const hintFor = (value) => typeOptions.find((t) => t.value === value)?.hint;

  useEffect(() => {
    dispatch(fetchWineAttributes({ per_page: 500 }));
    dispatch(fetchAttributeTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearWineAttributeStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineAttributeStatus());
      // create/update don't merge into local state, so refetch to reflect changes
      dispatch(fetchWineAttributes({ per_page: 500 }));
    }
  }, [error, successMessage, dispatch]);

  const filtered = (attributes || []).filter((a) => {
    const q = search.toLowerCase();
    return !q || a.attribute_type.toLowerCase().includes(q) || String(a.value).toLowerCase().includes(q);
  });
  const { items: paged, meta: pagination } = paginateLocal(filtered, currentPage, PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search]);

  useEffect(() => {
    if (!selectedId && attributes?.length) setSelectedId(attributes[0].id);
  }, [attributes, selectedId]);

  useEffect(() => {
    const attr = attributes?.find((a) => a.id === selectedId);
    if (attr) setDetail({ attribute_type: attr.attribute_type || '', value: attr.value ?? '' });
  }, [selectedId, attributes]);

  const handleAddNew = () => {
    if (!newAttr.attribute_type.trim() || !newAttr.value.trim()) return;
    dispatch(createWineAttribute(newAttr));
    setNewAttr(emptyDetail);
  };

  const handleSave = () => {
    if (selectedId) dispatch(updateWineAttribute({ id: selectedId, data: detail }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteWineAttribute(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const selected = attributes?.find((a) => a.id === selectedId);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wine Attributes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Free-form catalogue facts — bottle size, allergens, cask type, age statement and more —
          for the tasting-score axes, see Wine Characteristics instead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 space-y-2.5">
            <h3 className="text-sm font-bold text-gray-900">All Attributes</h3>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type or value..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && attributes.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : paged.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No attributes match.</p>
            ) : (
              paged.map((attr) => (
                <div
                  key={attr.id}
                  onClick={() => setSelectedId(attr.id)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    selectedId === attr.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedId === attr.id ? 'text-violet-700' : 'text-gray-900'}`}>
                      {humanizeType(attr.attribute_type)}: <span className="font-normal text-gray-600">{attr.value}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{attr.products_count ?? 0} product{attr.products_count === 1 ? '' : 's'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(attr); }} className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0 pl-2">×</button>
                </div>
              ))
            )}
          </div>
          {pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <Pagination meta={pagination} onPageChange={setCurrentPage} compact />
            </div>
          )}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Attribute</p>
            <div className="flex gap-2 items-start">
              <TypeCombobox value={newAttr.attribute_type} onChange={(v) => setNewAttr((a) => ({ ...a, attribute_type: v }))}
                options={typeOptions} className="flex-1" />
              <input type="text" maxLength={500} value={newAttr.value} onChange={(e) => setNewAttr((a) => ({ ...a, value: e.target.value }))}
                placeholder={hintFor(newAttr.attribute_type) || 'Value'} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <button onClick={handleAddNew} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Attribute
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">Select an attribute to view details.</div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Attribute Details</h3>
              <p className="text-xs text-gray-400 mb-5">{selected.products_count ?? 0} product{selected.products_count === 1 ? '' : 's'} carry this attribute</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Attribute Type <span className="text-red-500">*</span></label>
                  <TypeCombobox value={detail.attribute_type} onChange={(v) => setDetail((p) => ({ ...p, attribute_type: v }))} options={typeOptions} />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Value <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={500} value={detail.value} onChange={(e) => setDetail((p) => ({ ...p, value: e.target.value }))}
                    placeholder={hintFor(detail.attribute_type) || undefined}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  {hintFor(detail.attribute_type) && (
                    <p className="text-xs text-gray-400 mt-1">{hintFor(detail.attribute_type)}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSave} disabled={mutationLoading}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                  {mutationLoading && <Loader2 size={14} className="animate-spin" />} Save Changes
                </button>
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
        message={`Remove "${deleteTarget?.attribute_type}: ${deleteTarget?.value}"? ${deleteTarget?.products_count ? `${deleteTarget.products_count} product(s) currently carry it.` : ''}`}
      />
    </div>
  );
};

export default WineAttributes;
