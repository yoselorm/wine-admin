import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOrders, 
  fetchOrderDetails, 
  updateOrderStatus, 
  clearOrderStatus,
  clearSelectedOrder
} from '../redux/OrderSlice';
import { 
  Search, Loader2, Eye, ShoppingBag, Calendar, 
  User, CreditCard, Truck, CheckCircle2, AlertCircle, X, ArrowUpRight 
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const Orders = () => {
  const dispatch = useDispatch();

  // Redux States
  const { orders, selectedOrder, pagination, loading, detailsLoading, mutationLoading, error, successMessage } = useSelector(s => s.orders);

  // Layout States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [limit, setLimit] = useState('15'); // Mapping limit from Screenshot 2026-06-26 at 10.26.01.png
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch Orders List
  const loadOrders = useCallback(() => {
    dispatch(fetchOrders({
      page: currentPage,
      limit: limit,
      status: statusFilter || undefined
    }));
  }, [currentPage, limit, statusFilter, dispatch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // 2. Intercept API Success/Error Feedback States
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOrderStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearOrderStatus());
    }
  }, [error, successMessage, dispatch]);

  // 3. Inspect Individual Order Pipeline Detail View
  const handleViewDetails = (orderId) => {
    dispatch(fetchOrderDetails(orderId));
    setIsDrawerOpen(true);
  };

  // 4. Fire Order State Transition Mutation Lifecycle
  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  const closeDetailsDrawer = () => {
    setIsDrawerOpen(false);
    dispatch(clearSelectedOrder());
  };

  // Helper badge color mapper based on order status string
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">System Orders</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Monitor transactional history, audit purchasing channels, trace line items, and coordinate fulfillment states.
        </p>
      </div>

      {/* PARAMETERS CONTROL DECK (Screenshot 2026-06-26 at 10.26.01.png Query Params) */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Query Filter: Status Selection */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700 min-w-[140px]"
          >
            <option value="">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Query Filter: Limit Constraint Matrix */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium whitespace-nowrap">Page Limit:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
            >
              <option value="15">15 records</option>
              <option value="30">30 records</option>
              <option value="50">50 records</option>
            </select>
          </div>
        </div>

        {loading && <Loader2 className="animate-spin text-zinc-400" size={16} />}
      </div>

      {/* CORE DATA INVENTORY TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Loading ledger transaction logs...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No matching system orders logged</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5">Order Reference Reference (ULID)</th>
                    <th className="py-3 px-5">Customer Account</th>
                    <th className="py-3 px-5">Purchase Date</th>
                    <th className="py-3 px-5">Financial Gross Total</th>
                    <th className="py-3 px-5">Fulfillment Pipeline State</th>
                    <th className="py-3 px-5 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-zinc-900 font-semibold">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div>
                          <div className="font-semibold text-zinc-800">{order.customer_name || 'Guest Checkout'}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{order.customer_email || '—'}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 font-normal">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-900 font-semibold font-mono">
                        {order.currency || '₵'}{Number(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors font-semibold"
                        >
                          <Eye size={12} /> Audit Node
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* INTEGRATED PERSISTENT PAGINATION BOX */}
            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={(page) => setCurrentPage(page)} />
            </div>
          </>
        )}
      </div>

      {/* DETAIL DEEP INSPECTION SIDE DRAWER DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={closeDetailsDrawer} />

          {/* Sliding panel context */}
          <div className="relative w-full max-w-lg bg-white border-l border-zinc-200 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200 text-xs text-zinc-700">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Transaction Profile</span>
                <h3 className="text-sm font-bold text-zinc-900 font-mono mt-0.5 flex items-center gap-1.5">
                  ID: {selectedOrder?.id || <Loader2 size={12} className="animate-spin text-zinc-400" />}
                </h3>
              </div>
              <button onClick={closeDetailsDrawer} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-white border border-zinc-200 rounded-lg shadow-xs">
                <X size={14} />
              </button>
            </div>

            {/* Drawer Main Body Scroll Block */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-zinc-400" size={20} />
                  <span className="text-[11px] text-zinc-400 font-medium">Assembling cart items metadata...</span>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Section 1: Dynamic Status Transition Selector (Screenshot 2026-06-26 at 10.26.01.png PUT block) */}
                  <div className="p-4 border border-zinc-200 bg-zinc-50/50 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                        <Truck size={14} className="text-zinc-400" /> Pipeline Status Controller
                      </span>
                      {mutationLoading && <Loader2 size={12} className="animate-spin text-zinc-400" />}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5">
                      {['pending', 'shipped', 'completed', 'cancelled'].map((stateKey) => (
                        <button
                          key={stateKey}
                          type="button"
                          disabled={mutationLoading}
                          onClick={() => handleStatusChange(selectedOrder.id, stateKey)}
                          className={`py-2 text-[10px] font-bold uppercase rounded-md border tracking-wider transition-all ${
                            selectedOrder.status === stateKey
                              ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                              : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-500'
                          }`}
                        >
                          {stateKey}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Account Parameters Metadata */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
                      <User size={13} className="text-zinc-400" /> Customer Account Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-zinc-50/30 p-3 border border-zinc-100 rounded-lg">
                      <div>
                        <span className="text-zinc-400 text-[10px]">Recipient Entity Name</span>
                        <p className="font-semibold text-zinc-800 mt-0.5">{selectedOrder.customer_name || 'Guest Profile'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Contact Route Email</span>
                        <p className="font-semibold text-zinc-800 mt-0.5 truncate">{selectedOrder.customer_email || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400 text-[10px]">Shipping Destination Matrix</span>
                        <p className="font-medium text-zinc-700 mt-0.5 leading-relaxed">
                          {selectedOrder.shipping_address || 'No destination block declared.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Purchased Line Items Ledger */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
                      <ShoppingBag size={13} className="text-zinc-400" /> Catalog Line Item Records
                    </h4>
                    <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <div key={item.id || idx} className="p-3 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                          <div className="space-y-0.5 max-w-[260px]">
                            <p className="font-bold text-zinc-900 truncate">{item.product_name || 'Generic SKU Item'}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              Qty {item.quantity || 1} × {selectedOrder.currency || '₵'}{Number(item.price || 0).toFixed(2)}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-zinc-800">
                            {selectedOrder.currency || '₵'}{Number((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Financial Accounting Breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-zinc-400" /> Financial Settlement Matrix
                    </h4>
                    <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-1.5 font-medium">
                      <div className="flex justify-between text-zinc-500">
                        <span>Items Subtotal</span>
                        <span className="font-mono">{selectedOrder.currency || '₵'}{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Logistics / Freight</span>
                        <span className="font-mono">{selectedOrder.currency || '₵'}{Number(selectedOrder.shipping_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Tax Valuation Vector</span>
                        <span className="font-mono">{selectedOrder.currency || '₵'}{Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-zinc-200 my-2" />
                      <div className="flex justify-between text-sm font-bold text-zinc-900">
                        <span>Gross Settled Total</span>
                        <span className="font-mono">{selectedOrder.currency || '₵'}{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-zinc-400">
                  <AlertCircle size={20} className="mx-auto mb-2 text-zinc-300" />
                  Failed to render details context.
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={closeDetailsDrawer}
                className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 shadow-xs transition-colors"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;