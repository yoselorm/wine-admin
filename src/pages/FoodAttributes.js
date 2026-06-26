import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFoodAttributes, 
  createFoodAttribute, 
  updateFoodAttribute, 
  deleteFoodAttribute, 
  clearFoodAttributeStatus 
} from '../redux/FoodAttributeSlice';
import { fetchFoodDishes } from '../redux/FoodDishSlice'; // Importing dish action to populate dropdowns
import { 
  Plus, Search, Loader2, Trash2, Edit3, Sliders, 
  ArrowUpDown, AlertTriangle, X, Utensils, Tag
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

const FoodAttributes = () => {
  const dispatch = useDispatch();
  
  // Connect both slices to properly pair dish data with attribute configurations
  const { foodAttributes, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.foodAttributes);
  const { foodDishes } = useSelector(s => s.foodDishes);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  // GET Parameters matching filters from Screenshot 2026-06-26 at 11.35.25.png
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Form structure binding matching the payload keys: dish_id, attribute_type, value
  const [formData, setFormData] = useState({
    dish_id: '',
    attribute_type: '',
    value: ''
  });

  // 1. Data Fetch Lifecycle Layer
  const loadAttributesData = useCallback(() => {
    dispatch(fetchFoodAttributes({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, sortConfig, dispatch]);

  useEffect(() => {
    loadAttributesData();
    // Pre-emptively load food dishes list in background if not filled to back reference dropdown options
    if (!foodDishes || foodDishes.length === 0) {
      dispatch(fetchFoodDishes({ per_page: 200 }));
    }
  }, [loadAttributesData, foodDishes, dispatch]);

  // 2. State Sync Validation Alerts
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearFoodAttributeStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearFoodAttributeStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedAttribute(null);
      loadAttributesData();
    }
  }, [error, successMessage, loadAttributesData, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedAttribute(null);
    setFormData({
      dish_id: foodDishes?.[0]?.id || '', // Prefill fallback with first dynamic option if available
      attribute_type: '',
      value: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (attr) => {
    setSelectedAttribute(attr);
    setFormData({
      dish_id: attr.dish_id || '',
      attribute_type: attr.attribute_type || '',
      value: attr.value || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (attr) => {
    setSelectedAttribute(attr);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedAttribute) {
      dispatch(updateFoodAttribute({ id: selectedAttribute.id, data: formData }));
    } else {
      dispatch(createFoodAttribute(formData));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedAttribute?.id) {
      dispatch(deleteFoodAttribute(selectedAttribute.id));
    }
  };

  // Helper mapping helper logic to locate dish name strings dynamically from state indices using the ID reference link
  const getDishNameById = (id) => {
    const target = foodDishes.find(d => d.id === id);
    return target ? target.name : `Dish ID: ${id}`;
  };

  return (
    <div className="space-y-6">
      
      {/* COMPACT HEAD LAYOUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Food Dish Attributes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure custom parameter values and metric details like spiciness metrics directly linked to dishes.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Assign Attribute
        </button>
      </div>

      {/* SEARCH AND CAP VALUES FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search attribute classifications..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Show Limit:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 options</option>
            <option value="30">30 options</option>
            <option value="50">50 options</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-1" size={14} />}
        </div>
      </div>

      {/* CORE DATA-LEDGER CONTAINER GRID */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && foodAttributes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Querying attribute schema layouts...</span>
          </div>
        ) : foodAttributes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Sliders size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No active item attributes established</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('dish_id')}>
                      <div className="flex items-center gap-1.5">Linked Food Dish <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('attribute_type')}>
                      <div className="flex items-center gap-1.5">Attribute Label <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('value')}>
                      <div className="flex items-center gap-1.5">Assigned Metric Value <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {foodAttributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center text-zinc-500">
                            <Utensils size={12} />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-950 block">{getDishNameById(attr.dish_id)}</span>
                            <span className="text-[10px] font-mono font-normal text-zinc-400">{attr.dish_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold px-2 py-0.5 rounded-md">
                          <Tag size={11} className="text-zinc-400" /> {attr.attribute_type}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-zinc-900 font-mono font-semibold">
                        {attr.value}
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(attr)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(attr)}
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

      {/* ATTRIBUTE INPUT FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedAttribute ? 'Edit Attribute Setting' : 'Assign Food Attribute Metric'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Bind dynamic parameters explicitly to catalog food options.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              {/* Target Fetch Dropdown: dish_id */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Select Target Food Dish *</label>
                <select
                  required
                  value={formData.dish_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, dish_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                >
                  <option value="" disabled>-- Select dynamic item dish matching ID --</option>
                  {foodDishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} ({dish.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payload Field: attribute_type */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Attribute Type Option *</label>
                <input
                  type="text" required placeholder="e.g., spiciness, sweetness, portion_size"
                  value={formData.attribute_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribute_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                />
              </div>

              {/* Payload Field: value */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Attribute Value Metric *</label>
                <input
                  type="text" required placeholder="e.g., 4.5, High, Mild, 500g"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                />
              </div>

              {/* Modal Controls Actions Bar */}
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
                  {selectedAttribute ? 'Update Configuration' : 'Save Attribute'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DISMISS RECOGNITION POPUP LAYER */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Omit Selected Attribute?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you completely certain you want to tear down the metric setting **{selectedAttribute?.attribute_type}** assigned to **{getDishNameById(selectedAttribute?.dish_id)}**? This metadata drops out of user filter options instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                No, Keep
              </button>
              <button
                type="button" disabled={mutationLoading} onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Purge Config
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodAttributes;