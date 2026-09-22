import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWineCharacteristics,
  fetchTastingAxes,
  createWineCharacteristic,
  updateWineCharacteristic,
  deleteWineCharacteristic,
  clearWineCharacteristicStatus,
} from '../redux/WineCharacteristicSlice';
import { Loader2, Plus, Search } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ProductPicker from '../components/ProductPicker';
import Pagination from '../components/Pagination';
import { TASTING_AXES } from '../utils/tastingAxes';
import { paginateLocal } from '../utils/paginateLocal';

// product_id is required: a tasting score is a score *of a wine*.
const emptyDetail = { product_id: '', axis: '', score: '' };
const PER_PAGE = 12;

const builtInDescription = (axis) => TASTING_AXES.find((a) => a.key === axis.toLowerCase())?.description;

// The eight tasting axes (bold/dry/acidity/tannic/soft/light/fizzy/sweet) are a closed set, unlike
// attribute types — the server owns the list and refuses anything else by name. This screen is
// every score in the catalogue rather than one wine at a time, which is the only way a number like
// "sweet is scored on seven wines out of a hundred and sixty" is visible at all.
const WineCharacteristics = () => {
  const dispatch = useDispatch();
  const { characteristics, axes, loading, mutationLoading, error, successMessage } = useSelector((s) => s.wineCharacteristics);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newAxis, setNewAxis] = useState(emptyDetail);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchWineCharacteristics({ per_page: 500 }));
    dispatch(fetchTastingAxes());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearWineCharacteristicStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineCharacteristicStatus());
      // create/update don't merge into local state, so refetch to reflect changes
      dispatch(fetchWineCharacteristics({ per_page: 500 }));
    }
  }, [error, successMessage, dispatch]);

  const filtered = (characteristics || []).filter((c) => !search || c.axis.toLowerCase().includes(search.toLowerCase()));
  const { items: paged, meta: pagination } = paginateLocal(filtered, currentPage, PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search]);

  useEffect(() => {
    if (!selectedId && characteristics?.length) setSelectedId(characteristics[0].id);
  }, [characteristics, selectedId]);

  useEffect(() => {
    const c = characteristics?.find((x) => x.id === selectedId);
    if (c) setDetail({ axis: c.axis || '', score: c.score ?? '' });
  }, [selectedId, characteristics]);

  // The server owns this list — the axes are a closed set of eight, and typing anything else is a
  // 422. TASTING_AXES stays only as the source of the written descriptions.
  const knownAxes = (axes || []).map((a) => a.axis);

  const handleAddNew = () => {
    if (!newAxis.product_id || !newAxis.axis.trim() || newAxis.score === '') return;
    dispatch(createWineCharacteristic({
      product_id: newAxis.product_id,
      axis: newAxis.axis.trim().toLowerCase(),
      score: Number(newAxis.score),
    }));
    setNewAxis(emptyDetail);
  };

  const handleSave = () => {
    if (selectedId) dispatch(updateWineCharacteristic({ id: selectedId, data: { axis: detail.axis, score: Number(detail.score) } }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteWineCharacteristic(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const selected = characteristics?.find((c) => c.id === selectedId);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wine Characteristics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every tasting score in the catalogue, scored 0–10. The eight axes are a fixed set — seeing
          the scores together is how you spot one that covers only a handful of wines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 space-y-2.5">
            <h3 className="text-sm font-bold text-gray-900">All Characteristics</h3>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wine or axis..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && characteristics.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : paged.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No characteristics match.</p>
            ) : (
              paged.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    selectedId === c.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate capitalize ${selectedId === c.id ? 'text-violet-700' : 'text-gray-900'}`}>
                      {c.axis} <span className="font-normal text-gray-500">· {c.score}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.product?.name || 'Unknown wine'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }} className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0 pl-2">×</button>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Characteristic</p>
            <ProductPicker value={newAxis.product_id} onChange={(id) => setNewAxis((a) => ({ ...a, product_id: id }))} />
            <div className="flex gap-2">
              <select value={newAxis.axis}
                onChange={(e) => setNewAxis((a) => ({ ...a, axis: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                <option value="" disabled>Axis...</option>
                {knownAxes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input type="number" min="0" max="10" step="0.1" value={newAxis.score}
                onChange={(e) => setNewAxis((a) => ({ ...a, score: e.target.value }))}
                placeholder="0–10" className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <button onClick={handleAddNew} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Characteristic
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">Select a characteristic to view details.</div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Characteristic Details</h3>
              <p className="text-xs text-gray-400 mb-5">{selected.product?.name || 'Unknown wine'}</p>
              {builtInDescription(detail.axis) && (
                <p className="text-xs text-violet-600 bg-violet-50 border border-violet-100 rounded-md px-3 py-2 mb-5">{builtInDescription(detail.axis)}</p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Axis <span className="text-red-500">*</span></label>
                  <select value={detail.axis}
                    onChange={(e) => setDetail((p) => ({ ...p, axis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                    {knownAxes.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Score <span className="text-red-500">*</span></label>
                  <input type="number" min="0" max="10" value={detail.score}
                    onChange={(e) => setDetail((p) => ({ ...p, score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
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
        title="Remove Characteristic"
        message={`Remove "${deleteTarget?.axis}: ${deleteTarget?.score}"? ${deleteTarget?.products_count ? `${deleteTarget.products_count} product(s) currently carry it.` : ''}`}
      />
    </div>
  );
};

export default WineCharacteristics;
