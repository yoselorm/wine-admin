import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { fetchBrands, createBrand, updateBrand, deleteBrand, clearBrandStatus } from '../redux/BrandSlice';
import { Shield, Plus, Search, Edit2, Trash2, X, Loader2, Link, Upload, Eye } from 'lucide-react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Brands = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { brands, loading, mutationLoading, error, message } = useSelector((state) => state.brands);

  const [searchInputValue, setSearchInputValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [logoSource, setLogoSource] = useState('url');
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', logo_url: '' });

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearBrandStatus()); }
    if (message) { toast.success(message); dispatch(clearBrandStatus()); closeDrawer(); }
  }, [error, message, dispatch]);

  const debouncedFetch = useCallback(
    debounce((str) => dispatch(fetchBrands({ search: str })), 400),
    [dispatch]
  );

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, logo_url: files[0] }));
    }
  };

  const openCreateDrawer = () => {
    setEditingBrand(null);
    setLogoSource('url');
    setFormData({ name: '', slug: '', description: '', logo_url: '' });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (e, brand) => {
    e.stopPropagation(); // Avoid triggering full-row card view navigations
    setEditingBrand(brand);
    setLogoSource(typeof brand.logo_url === 'string' && brand.logo_url ? 'url' : 'upload');
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      logo_url: brand.logo_url || '',
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { setIsDrawerOpen(false); setEditingBrand(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBrand) {
      dispatch(updateBrand({ id: editingBrand.id, brandData: formData }));
    } else {
      dispatch(createBrand(formData));
    }
  };

  const handleDeleteTrigger = (e, brand) => {
    e.stopPropagation();
    setItemToDelete(brand);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteBrand(itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Brands</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Configure root vineyard brands, brand logos, and descriptive meta portfolios.</p>
        </div>
        <button onClick={openCreateDrawer} className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm">
          <Plus size={14} /> Add Brand
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-3">
        <Search size={16} className="text-zinc-400" />
        <input type="text" placeholder="Search brands..." value={searchInputValue} onChange={handleSearchChange} className="w-full text-xs bg-transparent border-none text-zinc-800 focus:outline-none" />
        {loading && <Loader2 className="animate-spin text-zinc-400" size={14} />}
      </div>

      {/* CARDS LIST PLATFORM */}
      {loading && brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[#c4945c]" size={24} />
          <span className="text-xs text-zinc-400 font-medium">Syncing wine brand ledgers...</span>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3"><Shield size={20} /></div>
          <h3 className="text-xs font-bold text-zinc-700">No brands indexed</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div 
              key={brand.id}
              onClick={() => navigate(`/dashboard/brands/${brand.id}`)}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                    {brand.logo_url && typeof brand.logo_url === 'string' ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-zinc-400">{brand.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditDrawer(e, brand)} className="p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 shadow-xs"><Edit2 size={12} /></button>
                    <button onClick={(e) => handleDeleteTrigger(e, brand)} className="p-1.5 rounded-md border border-red-100 bg-white text-red-600 hover:bg-red-50 shadow-xs"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-zinc-900 text-sm group-hover:text-[#c4945c] transition-colors">{brand.name}</h3>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{brand.slug}</p>
                  <p className="text-xs font-light text-zinc-500 mt-2 line-clamp-2">{brand.description || 'No descriptive overview defined.'}</p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[10px] text-zinc-400 font-semibold gap-1 pt-4 mt-4 border-t border-zinc-50">
                <span>View Brand</span> <Eye size={10} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRAWER PORTAL */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-md h-screen bg-white shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-serif font-bold text-zinc-900 text-sm">{editingBrand ? 'Modify Brand ' : 'Register Brand'}</h3>
              </div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs pb-24 custom-scrollbar">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Brand Name *</label>
                <input type="text" required value={formData.name} onChange={handleNameChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Brand URL Route Slug</label>
                <input type="text" readOnly value={formData.slug} className="w-full px-3 py-2 border border-zinc-100 bg-zinc-50 font-mono text-[11px] text-zinc-500 rounded-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-700">Brand Logo Asset</label>
                  <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                    <button type="button" onClick={() => setLogoSource('url')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${logoSource === 'url' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Link size={10}/>URL</button>
                    <button type="button" onClick={() => setLogoSource('upload')} className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${logoSource === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}><Upload size={10}/>Upload</button>
                  </div>
                </div>
                {logoSource === 'url' ? (
                  <input type="url" name="logo_url" value={typeof formData.logo_url === 'string' ? formData.logo_url : ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-[11px]" placeholder="https://example.com/logo.png" />
                ) : (
                  <input type="file" name="logo_url" accept="image/*" onChange={handleFileChange} className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg file:mr-3 file:py-1 file:px-2 file:text-[10px] file:font-bold file:bg-zinc-100 file:text-zinc-700" />
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none" placeholder="Vineyard history, regional parameters, characteristics..." />
              </div>
            </form>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
              <button type="button" onClick={closeDrawer} className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg font-semibold">Cancel</button>
              <button type="submit" disabled={mutationLoading} onClick={handleSubmit} className="flex items-center justify-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg font-semibold disabled:opacity-50">
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                {editingBrand ? 'Update Brand' : 'Submit Brand'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDeleteModal isOpen={deleteModalOpen} isDeleting={mutationLoading} onClose={() => setDeleteModalOpen(false)} onConfirm={executeDelete} title="Delete Brand" message={`Are you entirely sure you want to delete "${itemToDelete?.name}"? Deleting a root brand identity node will completely un-link nested storefront metrics.`} />
    </div>
  );
};

export default Brands;