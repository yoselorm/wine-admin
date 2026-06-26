import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryLogs, adjustInventory, clearInventoryStatus } from '../redux/InventorySlice';
import { fetchProducts } from '../redux/ProductSlice'; 
import { ClipboardList, Plus, Search, Loader2, SlidersHorizontal, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Inventory = () => {
  const dispatch = useDispatch();

  // Redux State Layers
  const { logs, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.inventory);
  const { items: products } = useSelector(s => s.products);

  // Core UI Control States
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtering states matching parameters from Screenshot 2026-06-26 at 09.32.25.png
  const [filters, setFilters] = useState({
    product_id: '',
    limit: '15'
  });

  // Manual Adjustment Form Payload State
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_change: 0,
    change_type: 'addition', 
    reason: 'Restock'
  });

  // 1. Initial Data Synchronizations
  useEffect(() => {
    dispatch(fetchInventoryLogs({ page: currentPage, ...filters }));
  }, [currentPage, filters, dispatch]);

  useEffect(() => {
    // Load products list on open to facilitate clear dropdown maps 
    dispatch(fetchProducts({ page: 1, limit: 100 }));
  }, [dispatch]);

  // 2. Status Notifications Handling
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearInventoryStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearInventoryStatus());
      setIsAdjustmentModalOpen(false);
      // Reset form variables and refresh logs table view
      setFormData({ product_id: '', quantity_change: 1, change_type: 'addition', reason: 'Restock' });
      dispatch(fetchInventoryLogs({ page: 1, ...filters }));
    }
  }, [error, successMessage, filters, dispatch]);

  // 3. User Interface Filter Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Form Action Execution
  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error('Please pick a target stock product.');
      return;
    }
    
    // Cast adjustment payload numbers properly before execution dispatch
    dispatch(adjustInventory({
      ...formData,
      quantity_change: Number(formData.quantity_change)
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Inventory Logs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit trailing balance operations, execute historical variations correction, and patch batch quantities.
          </p>
        </div>
        <button
          onClick={() => setIsAdjustmentModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Adjust Stock Levels
        </button>
      </div>

      {/* FILTER CONTROL DOCK */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Filter by Catalog Product</label>
          <select
            name="product_id"
            value={filters.product_id}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="">Show All Products</option>
            {products?.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.name} ({prod.sku || 'No SKU'})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Logs Size Allocation Limit</label>
          <select
            name="limit"
            value={filters.limit}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 Entries per View</option>
            <option value="30">30 Entries per View</option>
            <option value="50">50 Entries per View</option>
          </select>
        </div>

        <div className="flex items-center justify-end h-full">
          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 font-medium">
              <Loader2 className="animate-spin" size={14} />
              <span>Querying audit logs...</span>
            </div>
          )}
        </div>
      </div>

      {/* DATA LOGS DISPLAY TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
            <span className="text-xs text-zinc-400">Fetching audit trailing data arrays...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <ClipboardList size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No matching audit trail variations recorded</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5">Timestamp / Trace ID</th>
                    <th className="py-3 px-5">Target Item SKU Mapping</th>
                    <th className="py-3 px-5">Action Modifier</th>
                    <th className="py-3 px-5">Context / Reasoning Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{log.id}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-800">{log.product?.name || 'Unknown Product'}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">ID: {log.product_id}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          log.change_type === 'addition'
                            ? 'bg-green-50 border-green-100 text-green-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {log.change_type === 'addition' ? '+' : '-'}{log.quantity_change} Units
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 max-w-xs truncate">
                        {log.reason || 'Manual ledger balancing control sequence adjustment override'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* INTEGRATED FIX PAGINATION COMPONENT */}
            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      {/* OVERLAY SYSTEM MANUAL ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsAdjustmentModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-sm font-bold text-zinc-900">Manual Stock Adjustment Overrides</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Directly impact physical ledger metrics on active SKUs.</p>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              {/* Product Target Select */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Select Target Product *</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950"
                >
                  <option value="">Select an Item...</option>
                  {products?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                  ))}
                </select>
              </div>

              {/* Modifier Type and Units Count Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Modification Vector *</label>
                  <select
                    value={formData.change_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, change_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none"
                  >
                    <option value="addition">Addition (+)</option>
                    <option value="subtraction">Subtraction (-)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Quantity Change *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity_change}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_change: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Justification Reasoning String Input */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Restock, Damaged Goods, Audit Reconciliation"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Alert Sign */}
              <div className="flex gap-2.5 bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-lg text-[11px] font-medium leading-relaxed">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Caution: Adjustments process instantly. This alters active physical customer stock visibility figures in the storefront database interface immediately.</span>
              </div>

              {/* Action Buttons Panel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  Post Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;