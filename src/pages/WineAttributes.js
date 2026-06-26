import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchWineAttributes, 
  createWineAttribute, 
  updateWineAttribute, 
  deleteWineAttribute, 
  clearWineAttributeStatus 
} from '../redux/WineAttributeSlice';
import { fetchProducts } from '../redux/ProductSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, SlidersHorizontal, 
  Wine, ArrowUpDown, AlertTriangle, X 
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

// Simple utility to prevent instant server search spam on keystrokes
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const WineAttributes = () => {
  const dispatch = useDispatch();

  // Redux State Layers
  const { attributes, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.wineAttributes);
  const { items: products } = useSelector(s => s.products);

  // Core Layout Visibility Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null); // Active item context for edit/delete operations
  
  // Filtering & Query Search Parameters States (Screenshot 2026-06-26 at 09.46.05.png)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });
  const [perPage, setPerPage] = useState('15');

  const debouncedSearch = useDebounce(searchInput, 400);

  // Payload Schema Form State (product_id, attribute_type, value)
  const [formData, setFormData] = useState({
    product_id: '',
    attribute_type: 'sweetness', // Default preset variant
    value: ''
  });

  // 1. Fetch Request Dispatchers
  const loadAttributes = useCallback(() => {
    dispatch(fetchWineAttributes({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, sortConfig, dispatch]);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  useEffect(() => {
    // Populate simple lookup reference dropdown arrays
    dispatch(fetchProducts({ page: 1, limit: 100 }));
  }, [dispatch]);

  // 2. Action Callback Toast Status Monitors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWineAttributeStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineAttributeStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedAttribute(null);
      loadAttributes();
    }
  }, [error, successMessage, loadAttributes, dispatch]);

  // 3. Filter Actions Handlers
  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Submission Operations Lifecycle Execution
  const openCreateModal = () => {
    setSelectedAttribute(null);
    setFormData({ product_id: '', attribute_type: 'sweetness', value: '' });
    setIsFormModalOpen(true);
  };

  const openEditModal = (attr) => {
    setSelectedAttribute(attr);
    setFormData({
      product_id: attr.product_id || '',
      attribute_type: attr.attribute_type || 'sweetness',
      value: attr.value || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteConfirmation = (attr) => {
    setSelectedAttribute(attr);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedAttribute) {
      dispatch(updateWineAttribute({ id: selectedAttribute.id, data: formData }));
    } else {
      dispatch(createWineAttribute(formData));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedAttribute?.id) {
      dispatch(deleteWineAttribute(selectedAttribute.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION VIEW HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Wine Characteristics & Attributes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure dynamic technical flavor parameters (sweetness levels, acidity profiles, body density descriptors) mapping to inventory profiles.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Add Characteristic Record
        </button>
      </div>

      {/* SEARCH AND SERVER-SIDE FILTERING BAR */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-3 text-xs">
        {/* Realtime Debounced Input Block */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search attributes contextually via server engine..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        {/* Entries Sizing Control Wrapper */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Page Matrix Size:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 rows</option>
            <option value="30">30 rows</option>
            <option value="50">50 rows</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-2" size={14} />}
        </div>
      </div>

      {/* AUDIT ATTRIBUTES LIST DATAGRID */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && attributes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Loading characteristics array data matrices...</span>
          </div>
        ) : attributes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Wine size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No profile traits or sensory metadata parameters found</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('product_id')}>
                      <div className="flex items-center gap-1.5">Target Product Mapping <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('attribute_type')}>
                      <div className="flex items-center gap-1.5">Attribute Type <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('value')}>
                      <div className="flex items-center gap-1.5">Assigned Value <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {attributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">{attr.product?.name || 'Unknown Product reference'}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">UUID: {attr.product_id}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-zinc-100 border border-zinc-200/60 rounded text-zinc-700 uppercase tracking-wider">
                          {attr.attribute_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-800 font-mono font-semibold">
                        {attr.value}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(attr)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(attr)}
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

            {/* INTEGRATED PERSISTENT PAGINATION FRAME */}
            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      {/* SYSTEM OPERATIONS MODAL SLIDER (CREATE & EDIT MIXED ENTRY SYSTEM) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedAttribute ? 'Refine Characteristic Parameters' : 'Register New Flavor Characteristic'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Assure precision alignment with backend sensory profiles.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              {/* Target Product Relationship Option Mapping */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Associated Item Asset *</label>
                <select
                  required
                  disabled={!!selectedAttribute} // Keep reference clean on updating configurations
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white disabled:bg-zinc-50 rounded-lg focus:outline-none focus:border-zinc-950"
                >
                  <option value="">Choose item entry mapping selection...</option>
                  {products?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                  ))}
                </select>
              </div>

              {/* Attribute Type Parameter Vector Specification Selection */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Attribute Type *</label>
                <select
                  value={formData.attribute_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribute_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950"
                >
                  <option value="sweetness">Sweetness</option>
                  <option value="body">Body</option>
                  <option value="tannins">Tannins</option>
                  <option value="acidity">Acidity</option>
                  <option value="alcohol_content">Alcohol Content (%)</option>
                </select>
              </div>

              {/* Target Value Input Segment */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Assigned value *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 7.5, Medium-Dry, 13.5%, Full Bodied"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Interaction Action Group Buttons Layout */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedAttribute ? 'Commit Properties' : 'Save Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORE CRITICAL ACTION DELETION SAFETY CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Purge Characteristic Profile Parameter?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you entirely certain you want to scrap this variant evaluation configuration? This drops sensory description indices instantly from customer storefront display parameters. This operation cannot be rolled back.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button"
                disabled={mutationLoading}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={mutationLoading}
                onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WineAttributes;