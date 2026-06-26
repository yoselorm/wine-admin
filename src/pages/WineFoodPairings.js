import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchWineFoodPairings, 
  createWineFoodPairing, 
  updateWineFoodPairing, 
  deleteWineFoodPairing, 
  clearPairingStatus 
} from '../redux/WineFoodPairingSlice';
import { fetchFoodDishes } from '../redux/FoodDishSlice';
// Assuming your architecture handles product items out of a ProductSlice
import { fetchProducts } from '../redux/ProductSlice'; 
import { 
  Plus, Search, Loader2, Trash2, Edit3, Link, 
  ArrowUpDown, AlertTriangle, X, Utensils, Wine, ShieldAlert
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

const WineFoodPairings = () => {
  const dispatch = useDispatch();
  
  // 1. Redux Selectors pulling authentication and structural records state 
  const { admin:user } = useSelector(s => s.auth); // Grabbing logged-in context for admin_id binding
  const { pairings, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.wineFoodPairings);
  const { foodDishes } = useSelector(s => s.foodDishes);
  const { items: products } = useSelector(s => s.products || { products: [] });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState(null);

  // URL Query Parameters matching layout in Screenshot 2026-06-26 at 11.40.17.png
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Form State tracking state keys matching Schema model requirements
  const [formData, setFormData] = useState({
    product_id: '',
    dish_id: '',
    reason: '',
    admin_id: ''
  });

  // 2. Fetch Handler Layer 
  const loadPairingsData = useCallback(() => {
    dispatch(fetchWineFoodPairings({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, sortConfig, dispatch]);

  useEffect(() => {
    loadPairingsData();
    
    // Background load linked assets if records indices appear unpopulated
    if (!foodDishes || foodDishes.length === 0) {
      dispatch(fetchFoodDishes({ per_page: 150 }));
    }
    if (!products || products.length === 0) {
      dispatch(fetchProducts({ per_page: 150 }));
    }
  }, [loadPairingsData, foodDishes, products, dispatch]);

  // 3. Operation Status Listener Action Trigger Interceptors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPairingStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearPairingStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedPairing(null);
      loadPairingsData();
    }
  }, [error, successMessage, loadPairingsData, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedPairing(null);
    setFormData({
      product_id: products?.[0]?.id || '',
      dish_id: foodDishes?.[0]?.id || '',
      reason: '',
      admin_id: user?.id || user?.uuid || 'system_admin' // Fallback fallback safety if session empty
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (pairing) => {
    setSelectedPairing(pairing);
    setFormData({
      product_id: pairing.product_id || '',
      dish_id: pairing.dish_id || '',
      reason: pairing.reason || '',
      admin_id: pairing.admin_id || user?.id || 'system_admin'
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (pairing) => {
    setSelectedPairing(pairing);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedPairing) {
      dispatch(updateWineFoodPairing({ id: selectedPairing.id, data: formData }));
    } else {
      dispatch(createWineFoodPairing(formData));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedPairing?.id) {
      dispatch(deleteWineFoodPairing(selectedPairing.id));
    }
  };

  // State Lookup Helpers to parse label string names from entity collections 
  const getWineName = (id) => products?.find(p => p.id === id)?.name || `Wine ID: ${id}`;
  const getDishName = (id) => foodDishes?.find(d => d.id === id)?.name || `Dish ID: ${id}`;

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER TRACE SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Wine & Food Pairings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cross-reference catalog wine products with curated kitchen dishes, logging administrative reasoning.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Create New Pairing
        </button>
      </div>

      {/* PARAMETERS SORTING ROW CONTROL BOX */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search matching pairing criteria..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Show rows:</span>
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

      {/* GRID LOG INTERFACE MATRIX */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && pairings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Loading relation maps...</span>
          </div>
        ) : pairings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Link size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No active wine-food pairing rows active</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('product_id')}>
                      <div className="flex items-center gap-1.5"><Wine size={11} /> Wine Item <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('dish_id')}>
                      <div className="flex items-center gap-1.5"><Utensils size={11} /> Matched Food Dish <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('reason')}>
                      <div className="flex items-center gap-1.5">Pairing Reason<ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {pairings?.map((pair) => (
                    <tr key={pair.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-bold text-zinc-950 block">{getWineName(pair.product_id)}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{pair.product_id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-zinc-950 block">{getDishName(pair.dish_id)}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{pair.dish_id}</span>
                      </td>
                      <td className="py-4 px-5 max-w-xs text-zinc-500 font-normal leading-relaxed">
                        <p className="italic">"{pair.reason || 'No description criteria provided.'}"</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                          <ShieldAlert size={9} /> Author ID: {pair.admin_id}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(pair)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(pair)}
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

      {/* RELATION CREATION INPUT FORM MODAL LAYER */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedPairing ? 'Edit Pairing Config' : 'Link Wine & Food Pairing'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Map dynamic IDs together to instruct retail frontend suggestion panels.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              {/* Product List Select: product_id */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Select Product *</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                >
                  <option value="" disabled>Choose Product</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              {/* Dishes List Select: dish_id */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Select Target Food Dish *</label>
                <select
                  required
                  value={formData.dish_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, dish_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                >
                  <option value="" disabled>-- Choose kitchen Dish index --</option>
                  {foodDishes?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                  ))}
                </select>
              </div>

              {/* Simple Wording Field: reason */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Pairing Reason *</label>
                <textarea
                  rows="3" required placeholder="e.g., Acidity cuts cleanly through the rich fats of the cheese pasta sauce."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none font-normal text-zinc-600 leading-relaxed"
                />
              </div>

             

              {/* Bottom Actions Tray */}
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
                  {selectedPairing ? 'Save Changes' : 'Link Pairing'}
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
                <h4 className="text-sm font-bold text-zinc-900">Break Selected Pairing?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you completely sure you want to decouple **{getWineName(selectedPairing?.product_id)}** and **{getDishName(selectedPairing?.dish_id)}**? This suggestion pairing record drops instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button" disabled={mutationLoading} onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WineFoodPairings;