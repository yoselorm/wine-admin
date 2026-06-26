import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchShippingRates, 
  createShippingRate, 
  updateShippingRate, 
  deleteShippingRate, 
  clearShippingRateStatus 
} from '../redux/ShippingRateSlice';
import {fetchShippingZones} from '../redux/ShippingZoneSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, Scale, 
  ArrowUpDown, AlertTriangle, X, DollarSign, Layers, Globe
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const ShippingRates = () => {
  const dispatch = useDispatch();
  const { shippingRates, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.shippingRates);
  const { shippingZones} = useSelector(s => s.shippingZones);

  // Layout Modal Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);

  // Query Parameter Filters (Maps explicitly to Screenshot 2026-06-26 at 10.50.58.png)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [zoneIdFilter, setZoneIdFilter] = useState(''); // Target query filtering by ULID
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  // Mock static zones array for assignment dropdown lists (Replace with api fetch if applicable)
  const availableZones = shippingZones || [];

  // Request Body Form Fields Matching API Layout Vector
  const [formData, setFormData] = useState({
    shipping_zone_id: '',
    min_weight: '',
    max_weight: '',
    price: ''
  });

  // 1. Fetch Request Lifecycle Dispatcher
  const loadRates = useCallback(() => {
    dispatch(fetchShippingRates({
      page: currentPage,
      per_page: perPage,
      shipping_zone_id: zoneIdFilter || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, zoneIdFilter, sortConfig, dispatch]);

  useEffect(() => {
    loadRates();
    dispatch(fetchShippingZones()); 
  }, [loadRates,dispatch]);

  // 2. State Mutation Feedback Channel Interceptor
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearShippingRateStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearShippingRateStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedRate(null);
      loadRates();
    }
  }, [error, successMessage, loadRates, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedRate(null);
    setFormData({
      shipping_zone_id: availableZones[0]?.id || '',
      min_weight: '0.0',
      max_weight: '5.0',
      price: '10.00'
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (rate) => {
    setSelectedRate(rate);
    setFormData({
      shipping_zone_id: rate.shipping_zone_id || '',
      min_weight: rate.min_weight?.toString() || '0',
      max_weight: rate.max_weight?.toString() || '0',
      price: rate.price?.toString() || '0'
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (rate) => {
    setSelectedRate(rate);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Explicit format conversions tracking to requested example types (float, float, float)
    const cleanPayload = {
      shipping_zone_id: formData.shipping_zone_id,
      min_weight: parseFloat(formData.min_weight),
      max_weight: parseFloat(formData.max_weight),
      price: parseFloat(formData.price)
    };

    if (selectedRate) {
      dispatch(updateShippingRate({ id: selectedRate.id, data: cleanPayload }));
    } else {
      dispatch(createShippingRate(cleanPayload));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedRate?.id) {
      dispatch(deleteShippingRate(selectedRate.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Shipping Cost Rates</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure step-tier weight structures, coordinate cost tables, and define global territorial parameters.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Add Rate
        </button>
      </div>

      {/* SEARCH AND CONTROL DECK FILTER BLOCK */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Query Filter Parameter: shipping_zone_id (ULID match context) */}
          <select
            value={zoneIdFilter}
            onChange={(e) => { setZoneIdFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700 min-w-[200px] font-medium"
          >
            <option value="">All Shipping Logistics Zones</option>
            {availableZones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Records Limit:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 records</option>
            <option value="30">30 records</option>
            <option value="50">50 records</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400" size={14} />}
        </div>
      </div>

      {/* LOGISTICS DATA TABLE LEDGER */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && shippingRates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Loading active weight class frameworks...</span>
          </div>
        ) : shippingRates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Scale size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No freight rules currently verified in database</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('shipping_zone_id')}>
                      <div className="flex items-center gap-1.5">Target Logistics Zone Identifier <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('min_weight')}>
                      <div className="flex items-center gap-1.5">Minimum Weight <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('max_weight')}>
                      <div className="flex items-center gap-1.5">Maximum Weight <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-1.5">Price<ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {shippingRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg flex items-center justify-center">
                            <Globe size={13} />
                          </div>
                          <div>
                            <div className="font-bold font-mono text-zinc-950 tracking-wide uppercase">
                              {rate.shipping_zone_id}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                              {availableZones.find(z => z.id === rate.shipping_zone_id)?.name || 'Unlinked Custom Region'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-900 text-sm">
                        {Number(rate.min_weight).toFixed(2)} <span className="text-[10px] text-zinc-400 font-sans font-normal">kg</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-900 text-sm">
                        {Number(rate.max_weight).toFixed(2)} <span className="text-[10px] text-zinc-400 font-sans font-normal">kg</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-950 text-sm">
                        ₵{Number(rate.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(rate)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(rate)}
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

      {/* DATA CONFIGURATION MUTATION MODAL DIALOG */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedRate ? 'Modify Freight Scale Metrics' : 'Incorporate Freight Weight Matrix Step'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Configure strict mass ranges mapping to structural costs.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              {/* Parameter: shipping_zone_id Form Assignment Block */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Territorial Region Allocation Zone *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.shipping_zone_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_zone_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-800 font-semibold font-mono"
                  >
                    {availableZones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.id} — ({zone.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parameters Grid Block: min_weight and max_weight bounds */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Floor Mass Target (min_weight) *</label>
                  <div className="relative flex items-center">
                    <input
                      type="number" step="0.001" min="0" required placeholder="0.00"
                      value={formData.min_weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_weight: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono font-medium"
                    />
                    <span className="absolute right-3 font-medium text-zinc-400">kg</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Ceiling Mass Target (max_weight) *</label>
                  <div className="relative flex items-center">
                    <input
                      type="number" step="0.001" min="0" required placeholder="10.00"
                      value={formData.max_weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_weight: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono font-medium"
                    />
                    <span className="absolute right-3 font-medium text-zinc-400">kg</span>
                  </div>
                </div>
              </div>

              {/* Parameter: price Numeric Val Vector */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Assigned Logistics Rate Price Matrix (₵) *</label>
                <div className="relative flex items-center">
                  <p className="absolute left-3 text-zinc-400" size={14} >₵</p>
                  <input
                    type="number" step="0.01" min="0" required placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono font-bold text-zinc-900"
                  />
                </div>
              </div>

              {/* Action Operations Tray */}
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
                  {selectedRate ? 'Save ' : 'Add Shipping Rate'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SYSTEM DELETION VALIDATION FRAME */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Purge Selected Freight Weight Class?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you certain you want to destroy the logistics threshold running from **{selectedRate?.min_weight}kg** to **{selectedRate?.max_weight}kg** under zone mapping **{selectedRate?.shipping_zone_id}**? Dynamic shopping cart rate requests matching this segment will default to general zone metrics instantly.
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
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShippingRates;