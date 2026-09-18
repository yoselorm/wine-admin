import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWineRegions,
  createWineRegion,
  updateWineRegion,
  deleteWineRegion,
  clearWineRegionStatus
} from '../redux/WineRegionSlice';
import { Loader2, Plus, Upload } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Switch from '../components/ui/Switch';
import Pagination from '../components/Pagination';
import RichTextEditor from '../components/RichTextEditor';
import { paginateLocal } from '../utils/paginateLocal';

const emptyDetail = {
  name: '', slug: '', description: '', type: 'region', parent_id: '',
  iso_code: '', flag_url: '', image_url: '', is_published: true, position: 1,
};
const PER_PAGE = 10;

const WineRegions = () => {
  const dispatch = useDispatch();
  // GET /admin/wine-regions is the flat paginator shape (data IS the array, no meta) — fetch
  // everything once. That conveniently also means the Parent Region picker always has every
  // region available, not just whichever page is on screen.
  const { regions, loading, mutationLoading, error, successMessage } = useSelector((s) => s.wineRegions);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { items: pagedRegions, meta: pagination } = paginateLocal(regions || [], currentPage, PER_PAGE);

  useEffect(() => {
    dispatch(fetchWineRegions({ per_page: 500 }));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId && regions?.length) setSelectedId(regions[0].id);
  }, [regions, selectedId]);

  useEffect(() => {
    const region = regions?.find((r) => r.id === selectedId);
    if (region) {
      setDetail({
        name: region.name || '', slug: region.slug || '', description: region.description || '',
        type: region.type || 'region', parent_id: region.parent_id || '', iso_code: region.iso_code || '',
        flag_url: region.flag_url || '', image_url: region.image_url || '',
        is_published: region.is_published !== undefined ? region.is_published : true,
        position: region.position || 1,
      });
    }
  }, [selectedId, regions]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearWineRegionStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineRegionStatus());
      // createWineRegion/updateWineRegion don't merge into local state, so refetch to reflect changes
      dispatch(fetchWineRegions({ per_page: 500 }));
    }
  }, [error, successMessage, dispatch]);

  const handleAddNew = () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    dispatch(createWineRegion({ name: newName, slug, description: '', type: 'region', parent_id: null, iso_code: '', flag_url: '', image_url: '', is_published: true, position: (regions?.length || 0) + 1 }));
    setNewName('');
  };

  const handleSave = () => {
    if (selectedId) dispatch(updateWineRegion({ id: selectedId, data: { ...detail, position: Number(detail.position), parent_id: detail.parent_id || null } }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteWineRegion(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const selected = regions?.find((r) => r.id === selectedId);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wine Regions</h1>
        <p className="text-sm text-gray-500 mt-1">Continent, country, region and appellation form a hierarchy — set the type and an optional parent. Regions in use cannot be deleted.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">All Regions</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && regions.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : (
              pagedRegions.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    selectedId === r.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedId === r.id ? 'text-violet-700' : 'text-gray-900'}`}>{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.type}{r.parent_id ? ` · ${regions.find((p) => p.id === r.parent_id)?.name || ''}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                    {r.product_count > 0 && <span className="text-xs text-gray-400 whitespace-nowrap">{r.product_count} products</span>}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                  </div>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Region</p>
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Name, e.g. Douro Valley"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <button onClick={handleAddNew} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Region
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">Select a region to view details.</div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Region Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.name} onChange={(e) => setDetail((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.slug} onChange={(e) => setDetail((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  <p className="text-xs text-gray-400 mt-1">Must be unique · used in URLs</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Type <span className="text-red-500">*</span></label>
                  <select value={detail.type} onChange={(e) => setDetail((p) => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                    <option value="continent">continent</option>
                    <option value="country">country</option>
                    <option value="region">region</option>
                    <option value="appellation">appellation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Parent Region</label>
                  <select value={detail.parent_id} onChange={(e) => setDetail((p) => ({ ...p, parent_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                    <option value="">None</option>
                    {regions.filter((r) => r.id !== selectedId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">e.g. Stellenbosch sits under South Africa</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">ISO Code</label>
                  <input type="text" value={detail.iso_code} onChange={(e) => setDetail((p) => ({ ...p, iso_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  <p className="text-xs text-gray-400 mt-1">Countries only, e.g. ZA</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Position</label>
                  <input type="number" value={detail.position} onChange={(e) => setDetail((p) => ({ ...p, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  <p className="text-xs text-gray-400 mt-1">Sort order on the storefront</p>
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                  <RichTextEditor value={detail.description} onChange={(html) => setDetail((p) => ({ ...p, description: html }))}
                    placeholder="Climate, typical styles, what makes it distinctive..." />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Flag</label>
                  <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-300 cursor-pointer hover:border-violet-300 mb-1">
                    <Plus size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setDetail((p) => ({ ...p, flag_url: e.target.files[0] }))} />
                  </label>
                  <span className="text-xs text-violet-600 font-medium flex items-center gap-1"><Upload size={12} /> Upload flag</span>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Image</label>
                  <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-300 cursor-pointer hover:border-violet-300 mb-1">
                    <Plus size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setDetail((p) => ({ ...p, image_url: e.target.files[0] }))} />
                  </label>
                  <span className="text-xs text-violet-600 font-medium flex items-center gap-1"><Upload size={12} /> Upload image</span>
                </div>
              </div>
              <div className="mt-5">
                <Switch checked={detail.is_published} onChange={(val) => setDetail((p) => ({ ...p, is_published: val }))} label="Published" italic />
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
        title="Delete Wine Region"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default WineRegions;
