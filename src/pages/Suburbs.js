import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Plus, Search, AlertTriangle } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import { fetchSuburbs, createSuburb, updateSuburb, deleteSuburb, clearSuburbStatus } from '../redux/SuburbSlice';
import { fetchShippingZones } from '../redux/ShippingZoneSlice';

const emptyDetail = { name: '', latitude: '', longitude: '', shipping_zone_id: '' };
const PER_PAGE = 15;

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const Suburbs = () => {
  const dispatch = useDispatch();
  const { suburbs, pagination, loading, mutationLoading, error, successMessage } = useSelector((s) => s.suburbs);
  const { shippingZones: zones } = useSelector((s) => s.shippingZones);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const loadSuburbs = useCallback((page = 1) => {
    dispatch(fetchSuburbs({ search: debouncedSearch || undefined, page, per_page: PER_PAGE }));
  }, [dispatch, debouncedSearch]);

  useEffect(() => {
    loadSuburbs(1);
  }, [loadSuburbs]);

  useEffect(() => {
    dispatch(fetchShippingZones({ per_page: 200 }));
  }, [dispatch]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadSuburbs(page);
  };

  useEffect(() => {
    if (!selectedId && suburbs?.length) setSelectedId(suburbs[0].id);
  }, [suburbs, selectedId]);

  useEffect(() => {
    const suburb = suburbs?.find((s) => s.id === selectedId);
    if (suburb) {
      setDetail({
        name: suburb.name || '',
        latitude: suburb.latitude ?? '',
        longitude: suburb.longitude ?? '',
        shipping_zone_id: suburb.shipping_zone_id || suburb.shipping_zone?.id || '',
      });
    }
  }, [selectedId, suburbs]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearSuburbStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuburbStatus());
      loadSuburbs(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, successMessage, dispatch]);

  const handleAddNew = () => {
    if (!newName.trim()) return;
    dispatch(createSuburb({ name: newName, latitude: 0, longitude: 0, shipping_zone_id: null }));
    setNewName('');
  };

  const handleSave = () => {
    if (!selectedId) return;
    dispatch(updateSuburb({
      id: selectedId,
      data: {
        name: detail.name,
        latitude: detail.latitude === '' ? null : Number(detail.latitude),
        longitude: detail.longitude === '' ? null : Number(detail.longitude),
        shipping_zone_id: detail.shipping_zone_id || null,
      },
    }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteSuburb(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const zoneName = (suburb) => suburb.shipping_zone?.name || zones?.find((z) => z.id === suburb.shipping_zone_id)?.name;
  const selected = suburbs?.find((s) => s.id === selectedId);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Suburbs</h1>
        <p className="text-sm text-gray-500 mt-1">Deliverable suburbs and the shipping zone each belongs to. A suburb with no zone is recorded but not offered at checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 space-y-2">
            <h3 className="text-sm font-bold text-gray-900">All Suburbs</h3>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search suburbs..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && suburbs.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : suburbs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No suburbs match this search.</p>
            ) : (
              suburbs.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    selectedId === s.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedId === s.id ? 'text-violet-700' : 'text-gray-900'}`}>{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {zoneName(s) || <span className="text-yellow-600 inline-flex items-center gap-1"><AlertTriangle size={11} /> No zone — not deliverable</span>}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }} className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0">×</button>
                </div>
              ))
            )}
          </div>
          {pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <Pagination meta={pagination} onPageChange={handlePageChange} compact />
            </div>
          )}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Suburb</p>
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Name, e.g. Osu"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <button onClick={handleAddNew} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Suburb
            </button>
            <p className="text-xs text-gray-400">Set coordinates and a shipping zone after adding.</p>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">Select a suburb to view details.</div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Suburb Details</h3>
              {!detail.shipping_zone_id && (
                <div className="flex items-start gap-2 mb-5 p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>No shipping zone assigned — this suburb won't be offered at checkout until it belongs to a zone.</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.name} onChange={(e) => setDetail((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Latitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={detail.latitude} onChange={(e) => setDetail((p) => ({ ...p, latitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Longitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={detail.longitude} onChange={(e) => setDetail((p) => ({ ...p, longitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1.5">Shipping Zone</label>
                  <select value={detail.shipping_zone_id} onChange={(e) => setDetail((p) => ({ ...p, shipping_zone_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                    <option value="">None — not deliverable</option>
                    {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
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
        title="Delete Suburb"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default Suburbs;
