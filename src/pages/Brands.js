import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrands, createBrand, updateBrand, deleteBrand, clearBrandStatus } from '../redux/BrandSlice';
import { Loader2, Plus, Upload } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import RichTextEditor from '../components/RichTextEditor';
import { paginateLocal } from '../utils/paginateLocal';

const emptyDetail = { name: '', slug: '', description: '', logo_url: '' };
const PER_PAGE = 10;

const Brands = () => {
  const dispatch = useDispatch();
  // GET /admin/brands is the flat paginator shape (data IS the array, no meta) — fetch
  // everything once and paginate client-side instead of relying on server page metadata.
  const { brands, loading, mutationLoading, error, message } = useSelector((state) => state.brands);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchBrands({ per_page: 500 }));
  }, [dispatch]);

  const { items: pagedBrands, meta: pagination } = paginateLocal(brands || [], currentPage, PER_PAGE);

  useEffect(() => {
    if (!selectedId && brands?.length) setSelectedId(brands[0].id);
  }, [brands, selectedId]);

  useEffect(() => {
    const brand = brands?.find((b) => b.id === selectedId);
    if (brand) {
      setDetail({ name: brand.name || '', slug: brand.slug || '', description: brand.description || '', logo_url: brand.logo_url || '' });
    }
  }, [selectedId, brands]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearBrandStatus()); }
    if (message) { toast.success(message); dispatch(clearBrandStatus()); }
  }, [error, message, dispatch]);

  const handleAddNew = () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    dispatch(createBrand({ name: newName, slug, description: '', logo_url: '' }));
    setNewName('');
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setDetail((prev) => ({ ...prev, name: val, slug: val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') }));
  };

  const handleSave = () => {
    if (selectedId) dispatch(updateBrand({ id: selectedId, brandData: detail }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteBrand(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const selected = brands?.find((b) => b.id === selectedId);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Brands</h1>
        <p className="text-sm text-gray-500 mt-1">Wine producers and estates. Brands in use by a product cannot be deleted.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">All Brands</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && brands.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : (
              pagedBrands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    selectedId === b.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedId === b.id ? 'text-violet-700' : 'text-gray-900'}`}>{b.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/{b.slug}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{b.products_count ?? 0} products</span>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(b); }} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Brand</p>
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Name, e.g. Meerlust"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <button onClick={handleAddNew} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Brand
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">Select a brand to view details.</div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Brand Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.name} onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.slug} onChange={(e) => setDetail((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  <p className="text-xs text-gray-400 mt-1">Must be unique · used in URLs</p>
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                  <RichTextEditor value={detail.description} onChange={(html) => setDetail((p) => ({ ...p, description: html }))}
                    placeholder="The estate's story, house style, signature wines..." />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Logo</label>
                  <div className="flex items-center gap-3">
                    <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-300 cursor-pointer hover:border-violet-300 flex-shrink-0">
                      <Plus size={18} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setDetail((p) => ({ ...p, logo_url: e.target.files[0] }))} />
                    </label>
                    <span className="text-sm text-violet-600 font-medium flex items-center gap-1"><Upload size={13} /> Upload logo · JPG, PNG, WebP</span>
                  </div>
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
        title="Delete Brand"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default Brands;
