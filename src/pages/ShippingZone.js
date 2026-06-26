import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchShippingZones, 
  createShippingZone, 
  updateShippingZone, 
  deleteShippingZone, 
  clearShippingZoneStatus 
} from '../redux/ShippingZoneSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, MapPin, 
  ArrowUpDown, AlertTriangle, X, Layers, Compass
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

// Debounce hook for optimization of search criteria queries
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ShippingZones = () => {
  const dispatch = useDispatch();
  const { shippingZones, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.shippingZones);

  // Modal Structural Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // GET Filter Options (Maps to query specs in Screenshot 2026-06-26 at 11.00.12.png)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Request Form Local Parameters matching example schema explicitly
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // 1. Data Fetch Lifecycle Dispatch Layer
  const loadZones = useCallback(() => {
    dispatch(fetchShippingZones({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, sortConfig, dispatch]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // 2. State Sync Validation Notification Interceptor
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearShippingZoneStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearShippingZoneStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedZone(null);
      loadZones();
    }
  }, [error, successMessage, loadZones, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedZone(null);
    setFormData({
      name: '',
      description: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name || '',
      description: zone.description || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (zone) => {
    setSelectedZone(zone);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedZone) {
      dispatch(updateShippingZone({ id: selectedZone.id, data: formData }));
    } else {
      dispatch(createShippingZone(formData));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedZone?.id) {
      dispatch(deleteShippingZone(selectedZone.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* COMPACT DASHBOARD TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Fulfillment Shipping Zones</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organize fulfillment groups, establish territorial coverage nodes, and map structural description boundaries.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Initialize Region Zone
        </button>
      </div>

      {/* PARAMETERS CONTROL PANEL BAR */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search matching zone titles..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Per Page Limit:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700 font-medium"
          >
            <option value="15">15 zones</option>
            <option value="30">30 zones</option>
            <option value="50">50 zones</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-1" size={14} />}
        </div>
      </div>

      {/* CORE SHIPPING ZONE DATA-LEDGER GRID */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && shippingZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Querying live structural zone tables...</span>
          </div>
        ) : shippingZones.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Compass size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No geographic shipping zones defined yet</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 w-1/3 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Shipping Zone Regional Name <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 w-1/2 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-1.5">Scope Description Narrative <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {shippingZones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-zinc-950 text-white rounded-lg flex items-center justify-center shadow-xs">
                            <MapPin size={13} />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950 tracking-tight">{zone.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono font-normal mt-0.5">{zone.id || 'system-uuid-node'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 max-w-sm">
                        <p className="text-zinc-500 font-normal leading-relaxed truncate">
                          {zone.description || <span className="text-zinc-300 italic">No summary description provided.</span>}
                        </p>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(zone)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(zone)}
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

      {/* REGIONAL MUTATION FORM CONFIGURATION MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedZone ? 'Modify Regional Zone Parameters' : 'Register New Shipping Territory'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Map title namespaces to specific logical operational centers.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              {/* Body Schema: name */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Zone Label Identifier Name *</label>
                <input
                  type="text" required placeholder="e.g., North America"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                />
              </div>

              {/* Body Schema: description */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Scope Context Narrative Description *</label>
                <textarea
                  rows="4" required placeholder="e.g., Shipping zone for North American countries"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none font-normal leading-relaxed text-zinc-600"
                />
              </div>

              {/* Operational Action Row Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button" onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
                >
                  Dismiss
                </button>
                <button
                  type="submit" disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedZone ? 'Commit Updates' : 'Publish Zone'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETION CONFIRM DIALOG */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Deconstruct Shipping Zone?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you entirely certain you want to purge **{selectedZone?.name}**? This breaks the link context for all underlying weight matrices. Dynamic shipping rate operations inside this location structure will default out.
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
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShippingZones;