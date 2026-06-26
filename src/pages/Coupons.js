import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  clearCouponStatus 
} from '../redux/CouponSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, Ticket, 
  ArrowUpDown, AlertTriangle, X, Percent, DollarSign, Calendar, SlidersHorizontal
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

// Debounce hook for smooth search input handling
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Coupons = () => {
  const dispatch = useDispatch();
  const { coupons, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.coupons);

  // Modal State Management
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // GET Query Filters (Maps to Screenshot 2026-06-26 at 10.32.51.png query parameters)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // fixed or percent
  const [activeFilter, setActiveFilter] = useState(''); // true or false
  const [sortConfig, setSortConfig] = useState({ sort_by: 'created_at', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Form State Layout mirroring requested body schema
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    expires_at: '',
    usage_limit: '',
    is_active: true,
    description: ''
  });

  // 1. Fetching Coupons Dispatch Layer
  const loadCoupons = useCallback(() => {
    dispatch(fetchCoupons({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch,
      type: typeFilter || undefined,
      is_active: activeFilter === '' ? undefined : activeFilter === 'true',
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, typeFilter, activeFilter, sortConfig, dispatch]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // 2. Feedback Channel Toast Notification Interceptor
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCouponStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearCouponStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedCoupon(null);
      loadCoupons();
    }
  }, [error, successMessage, loadCoupons, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedCoupon(null);
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      expires_at: '',
      usage_limit: '',
      is_active: true,
      description: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    // Formatting timestamp safely to value match HTML DateTime-Local inputs (YYYY-MM-DDTHH:MM)
    const formattedDate = coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '';
    
    setFormData({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value || '',
      expires_at: formattedDate,
      usage_limit: coupon.usage_limit || '',
      is_active: coupon.is_active !== undefined ? coupon.is_active : true,
      description: coupon.description || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanPayload = {
      ...formData,
      value: Number(formData.value),
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
    };

    if (selectedCoupon) {
      dispatch(updateCoupon({ id: selectedCoupon.id, data: cleanPayload }));
    } else {
      dispatch(createCoupon(cleanPayload));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedCoupon?.id) {
      dispatch(deleteCoupon(selectedCoupon.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Campaign Coupon Rules</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Establish code instances, configure percent or fixed deductions, limit usages, and track validation thresholds.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Design New Coupon
        </button>
      </div>

      {/* FILTER CONTROL DECK (Screenshot 2026-06-26 at 10.32.51.png GET Parameters) */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search matching codes..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="">All Rule Deductions</option>
            <option value="percent">Percentage Only</option>
            <option value="fixed">Fixed Flat Pricing</option>
          </select>
        </div>

        <div>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="">All Activation States</option>
            <option value="true">Active Assets Only</option>
            <option value="false">Deactivated Rules</option>
          </select>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Per Page Limit:</span>
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

      {/* COMPACT REPOSITORY GRID DATA-MATRIX */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Querying running promotional records...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Ticket size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No active codes matching validation boundaries</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('code')}>
                      <div className="flex items-center gap-1.5">Coupon Code / Detail <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1.5">Deduction Type<ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('value')}>
                      <div className="flex items-center gap-1.5">Value<ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('expires_at')}>
                      <div className="flex items-center gap-1.5">Expiration Time <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5">Usage Cap Limit</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                            coupon.is_active ? 'bg-zinc-950 border-zinc-950 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                          }`}>
                            <Ticket size={13} />
                          </div>
                          <div>
                            <div className="font-bold font-mono text-zinc-950 tracking-wide uppercase flex items-center gap-1.5">
                              {coupon.code}
                              {!coupon.is_active && <span className="text-[9px] font-normal font-sans px-1 bg-zinc-100 border border-zinc-200 text-zinc-500 rounded">Disabled</span>}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-normal mt-0.5 max-w-[180px] truncate">{coupon.description || 'No summary text stated.'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                          coupon.type === 'percent' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {coupon.type === 'percent' ? <Percent size={10} /> : <DollarSign size={10} />}
                          {coupon.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-900">
                        {coupon.type === 'percent' ? `${coupon.value}%` : `₵${Number(coupon.value).toFixed(2)}`}
                      </td>
                      <td className="py-3.5 px-5 font-normal text-zinc-500">
                        {coupon.expires_at ? (
                          <span className={`inline-flex items-center gap-1 ${new Date(coupon.expires_at) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar size={11} /> {new Date(coupon.expires_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </span>
                        ) : <span className="text-zinc-300 font-mono">— Unlimited</span>}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-600">
                        {coupon.usage_limit ? `${coupon.usage_limit} allocations` : <span className="text-zinc-300">— No Limit</span>}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(coupon)}
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

      {/* CRUD MANAGEMENT CONFIGURATION MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedCoupon ? 'Modify Promotion Parameters' : 'Register New Campaign Coupon Token'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Define core redemption weights, constraints, and runtime limits.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              {/* Token Code Input Block */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Coupon Code *</label>
                <input
                  type="text" required placeholder="e.g., SUMMER25"
                  value={formData.code} 
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono font-bold uppercase tracking-wider"
                />
              </div>

              {/* Deduction Type & Numeric Valuation Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Deduction Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 font-medium"
                  >
                    <option value="percent">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Currency Amnt (₵)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Value *</label>
                  <input
                    type="number" min="1" step="0.01" required placeholder={formData.type === 'percent' ? '25' : '15.00'}
                    value={formData.value} onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono"
                  />
                </div>
              </div>

              {/* Allocation Caps & Expiration Boundaries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Total Usage Cap Limit</label>
                  <input
                    type="number" min="1" placeholder="e.g., 100 (Blank for inf)"
                    value={formData.usage_limit} onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Expiration Time</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at} onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-mono"
                  />
                </div>
              </div>

              {/* Context Summary Narrative */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Description</label>
                <textarea
                  rows="2" placeholder="Describe the activation parameters contextually for audit checks..."
                  value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none font-medium"
                />
              </div>

              {/* Immediate Validation Activation Control */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200/60 rounded-lg">
                <input
                  type="checkbox" id="is_active"
                  checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950"
                />
                <label htmlFor="is_active" className="select-none font-semibold text-zinc-800">
                  Activate this coupon rule immediately for checkouts
                </label>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button" onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedCoupon ? 'Save Parameters' : 'Add Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINATION CONFIRMATION DIALOG */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Purge Selected Coupon Token?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you sure you want to terminate token rules for **{selectedCoupon?.code}**? This removes the entry from the index immediately. Active checkouts utilizing this parameter key will fail.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Dismiss
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

export default Coupons;