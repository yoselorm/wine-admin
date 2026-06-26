import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  clearCategoryStatus 
} from '../redux/CategorySlice';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  Link, 
  Upload, 
  Eye,
  CornerDownRight
} from 'lucide-react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';

// Debounce helper utility for server-side queries
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Categories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, loading, mutationLoading, error, message } = useSelector((state) => state.categories);


  // Layout layout tracking states
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Image upload source selection state toggle ('url' vs 'upload')
  const [imageSource, setImageSource] = useState('url');

  // Unified reactive state mapping database models
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: ''
  });

  // Pull baseline index records on initial mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sync event triggers and toast logs
  useEffect(() => {
    if (error) { 
      toast.error(error); 
      dispatch(clearCategoryStatus()); 
    }
    if (message) { 
      toast.success(message); 
      dispatch(clearCategoryStatus()); 
      closeDrawer(); 
    }
  }, [error, message, dispatch]);

  // Debounced search engine mechanism
  const debouncedFetch = useCallback(
    debounce((str) => dispatch(fetchCategories({ search: str })), 400),
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
      setFormData((prev) => ({ ...prev, image_url: files[0] }));
    }
  };

  const openCreateDrawer = () => {
    setEditingCategory(null);
    setImageSource('url');
    setFormData({ name: '', slug: '', description: '', image_url: '', parent_id: '' });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (e, category) => {
    e.stopPropagation(); // Block layout navigation when edit bounds are targeted
    setEditingCategory(category);
    setImageSource(typeof category.image_url === 'string' && category.image_url ? 'url' : 'upload');
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || '',
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      dispatch(updateCategory({ id: editingCategory.id, categoryData: formData }));
    } else {
      dispatch(createCategory(formData));
    }
  };

  const handleDeleteTrigger = (e, category) => {
    e.stopPropagation();
    setItemToDelete(category);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteCategory(itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE ACTIONS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Product Categories</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Configure store department trees, upload graphics, and link child taxonomies.</p>
        </div>
        <button 
          onClick={openCreateDrawer} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* FILTER SEARCH PANEL BAR */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-3">
        <Search size={16} className="text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search categories via server query parameters..." 
          value={searchInputValue} 
          onChange={handleSearchChange} 
          className="w-full text-xs bg-transparent border-none text-zinc-800 focus:outline-none" 
        />
        {loading && <Loader2 className="animate-spin text-zinc-400" size={14} />}
      </div>

      {/* CATEGORIES RECORD DISPLAY TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && categories?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#c4945c]" size={24} />
            <span className="text-xs text-zinc-400 font-medium">Indexing active category trees...</span>
          </div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Layers size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No categories indexed</h3>
            <p className="text-xs text-zinc-400 mt-1">Refine your active search filter or append a new inventory department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="py-3 px-5">Category Name / Path Slug</th>
                  <th className="py-3 px-5">Structural Level</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {categories?.map((cat) => {
                  // Resolve visual parent indicator strings dynamically if provided inside the payload structure
                  const hasParent = cat.parent_id || cat.parent;

                  return (
                    <tr 
                      key={cat.id} 
                      onClick={() => navigate(`/dashboard/categories/${cat.id}`)}
                      className="hover:bg-zinc-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {hasParent && <CornerDownRight size={13} className="text-zinc-400 flex-shrink-0" />}
                          <div>
                            <div className="font-semibold text-zinc-900 group-hover:text-[#c4945c] transition-colors">{cat.name}</div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{cat.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide border uppercase ${
                          hasParent 
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-500' 
                            : 'bg-amber-50 border-amber-100 text-amber-800'
                        }`}>
                          {hasParent ? 'Subcategory' : 'Root Node'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-zinc-500 max-w-xs truncate font-light">
                        {cat.description || '—'}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => openEditDrawer(e, cat)} 
                          className="inline-flex p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 shadow-xs"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteTrigger(e, cat)} 
                          className="inline-flex p-1.5 rounded-md border border-red-100 bg-white text-red-600 hover:bg-red-50 shadow-xs"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PORTAL DRAWER FORM PANEL LAYOUT */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-md h-screen bg-white shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 flex-shrink-0">
              <div>
                <h3 className="font-serif font-bold text-zinc-900 text-sm">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Configure hierarchy fields, paths, and image schemas.</p>
              </div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs pb-24 custom-scrollbar">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={handleNameChange} 
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900" 
                />
              </div>
              
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">URL Route Slug (Auto-generated)</label>
                <input 
                  type="text" 
                  readOnly 
                  value={formData.slug} 
                  className="w-full px-3 py-2 border border-zinc-100 bg-zinc-50 font-mono text-[11px] text-zinc-500 rounded-lg" 
                />
              </div>

              {/* DYNAMIC HIERARCHICAL TREE SELECTOR */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Parent Placement Node Hierarchy</label>
                <select
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900 text-zinc-800"
                >
                  <option value="">None (Establish as Top-Level Root)</option>
                  {/* Filter out current category node configuration map loop to block circular dependencies crashes */}
                  {categories
                    .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* IMAGE ASSET CONTROLS SWITCH */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-700">Display Cover Graphics</label>
                  <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                    <button 
                      type="button" 
                      onClick={() => setImageSource('url')} 
                      className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${imageSource === 'url' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                    >
                      <Link size={10}/>URL
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setImageSource('upload')} 
                      className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${imageSource === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                    >
                      <Upload size={10}/>Upload
                    </button>
                  </div>
                </div>
                {imageSource === 'url' ? (
                  <input 
                    type="url" 
                    name="image_url" 
                    value={typeof formData.image_url === 'string' ? formData.image_url : ''} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-[11px]" 
                    placeholder="https://example.com/category-cover.png" 
                  />
                ) : (
                  <input 
                    type="file" 
                    name="image_url" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg file:mr-3 file:py-1 file:px-2 file:text-[10px] file:font-bold file:bg-zinc-100 file:text-zinc-700" 
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="4" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none" 
                  placeholder="Summarize structural scope or inventory characteristics mapping this department segment..." 
                />
              </div>
            </form>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
              <button 
                type="button" 
                onClick={closeDrawer} 
                className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={mutationLoading} 
                onClick={handleSubmit} 
                className="flex items-center justify-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                {editingCategory ? 'Update Records' : 'Commit Registration'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* LOCAL DELETE WARNING MODAL COUPLING */}
      <ConfirmDeleteModal 
        isOpen={deleteModalOpen} 
        isDeleting={mutationLoading} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={executeDelete} 
        title="Delete Store Category" 
        message={`Are you absolutely sure you want to drop "${itemToDelete?.name}"? Deleting a structural node breaks navigation cascades on any children endpoints connected underneath this segment context.`} 
      />
    </div>
  );
};

export default Categories;