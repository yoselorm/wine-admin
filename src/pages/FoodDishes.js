import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFoodDishes, 
  createFoodDish, 
  updateFoodDish, 
  deleteFoodDish, 
  clearFoodDishStatus 
} from '../redux/FoodDishSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, Utensils, 
  ArrowUpDown, AlertTriangle, X, Globe, Image, Upload, Link2
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const FoodDishes = () => {
  const dispatch = useDispatch();
  const { foodDishes, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.foodDishes);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  // Toggle state between 'url' selection or 'upload' asset choice
  const [imageSourceType, setImageSourceType] = useState('url'); 

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    origin: '',
    image_url: ''
  });

  const loadDishes = useCallback(() => {
    dispatch(fetchFoodDishes({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, sortConfig, dispatch]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearFoodDishStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearFoodDishStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedDish(null);
      loadDishes();
    }
  }, [error, successMessage, loadDishes, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedDish(null);
    setImageSourceType('url');
    setFormData({
      name: '',
      description: '',
      origin: '',
      image_url: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (dish) => {
    setSelectedDish(dish);
    // Default to url mode if string pattern matches http, otherwise default fallback
    setImageSourceType(dish.image_url?.startsWith('http') ? 'url' : 'upload');
    setFormData({
      name: dish.name || '',
      description: dish.description || '',
      origin: dish.origin || '',
      image_url: dish.image_url || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (dish) => {
    setSelectedDish(dish);
    setIsDeleteModalOpen(true);
  };

  // Process file upload stream locally
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size limit (e.g., 2MB maximum threshold)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be under 2MB.');
      return;
    }

    // Option A: Convert directly to base64 data stream for simple JSON transit
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);

    /* 
      Option B: If your project structure uses multipart form data uploads, 
      replace this block to dispatch directly to an assets media endpoint first.
    */
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedDish) {
      dispatch(updateFoodDish({ id: selectedDish.id, data: formData }));
    } else {
      dispatch(createFoodDish(formData));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedDish?.id) {
      dispatch(deleteFoodDish(selectedDish.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE TITLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Menu Food Dishes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your kitchen dishes catalog, update ingredient descriptions, and specify countries of origin.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Add New Dish
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search dish name..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Show:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 rows</option>
            <option value="30">30 rows</option>
            <option value="50">50 rows</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-1" size={14} />}
        </div>
      </div>

      {/* REPOSITORY TABLE CORE GRID */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && foodDishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Loading food dishes catalog data...</span>
          </div>
        ) : foodDishes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Utensils size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No dishes matching search parameters found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Dish Name <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-1.5">Description <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('origin')}>
                      <div className="flex items-center gap-1.5">Country of Origin <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {foodDishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 flex-shrink-0 flex items-center justify-center text-zinc-400">
                            {dish.image_url ? (
                              <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <Utensils size={14} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm tracking-tight">{dish.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono font-normal mt-0.5">{dish.id || 'system-uuid-node'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 max-w-xs text-zinc-500 font-normal leading-relaxed">
                        <p className="truncate">{dish.description || 'No description listed.'}</p>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-700">
                        <span className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] px-2 py-0.5 rounded-md font-medium">
                          <Globe size={11} className="text-zinc-400" /> {dish.origin || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(dish)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(dish)}
                          className="inline-flex p-1.5 text-zinc-400 hover:text-red-600 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-100 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={(page) => setCurrentPage(page)} />
            </div>
          </>
        )}
      </div>

      {/* ADD/EDIT DISH MODAL LAYER */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedDish ? 'Edit Food Dish' : 'Add New Food Dish'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Fill in the options below to configure this menu dish entry.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Dish Name *</label>
                <input
                  type="text" required placeholder="e.g., Spaghetti Carbonara"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Country of Origin *</label>
                <input
                  type="text" required placeholder="e.g., Italy"
                  value={formData.origin}
                  onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                />
              </div>

              {/* IMAGE TYPE SELECTION COMPONENT LAYER */}
              <div className="space-y-2">
                <label className="block font-semibold text-zinc-700">Dish Image *</label>
                
                {/* Mode Selectors */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-lg text-center font-medium">
                  <button
                    type="button"
                    onClick={() => { setImageSourceType('url'); setFormData(prev => ({ ...prev, image_url: '' })); }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${imageSourceType === 'url' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    <Link2 size={13} /> Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageSourceType('upload'); setFormData(prev => ({ ...prev, image_url: '' })); }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${imageSourceType === 'upload' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    <Upload size={13} /> Upload File
                  </button>
                </div>

                {/* Conditional Input Box Rendering */}
                {imageSourceType === 'url' ? (
                  <div className="relative flex items-center">
                    <Image className="absolute left-3 text-zinc-400" size={14} />
                    <input
                      type="url" 
                      required={imageSourceType === 'url'} 
                      placeholder="https://example.com/spaghetti.jpg"
                      value={formData.image_url?.startsWith('data:') ? '' : formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono text-zinc-600"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="flex flex-col items-center justify-center w-full px-4 py-3 border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100/50 rounded-lg cursor-pointer transition-colors text-center">
                      <div className="flex items-center gap-2 text-zinc-600 font-medium">
                        <Upload size={14} className="text-zinc-400" />
                        <span>{formData.image_url?.startsWith('data:') ? 'Image uploaded!' : 'Select an image file'}</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        className="hidden" 
                        required={imageSourceType === 'upload' && !formData.image_url} 
                      />
                    </label>

                    {formData.image_url?.startsWith('data:') && (
                      <div className="w-10 h-10 border border-zinc-200 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-50">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Description *</label>
                <textarea
                  rows="3" required placeholder="e.g., A classic Italian pasta dish made with eggs, hard cheese, cured pork, and black pepper."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none font-normal leading-relaxed text-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button" onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedDish ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DISH REMOVAL DIALOG */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Remove Food Dish?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you sure you want to remove **{selectedDish?.name}** from the catalog? This step cannot be undone and it removes the item immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                No, Keep It
              </button>
              <button
                type="button" disabled={mutationLoading} onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodDishes;