import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchOrderDetails, updateOrderStatus, clearOrderStatus, clearSelectedOrder } from '../redux/OrderSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';

const statusTone = { pending: 'yellow', completed: 'green', cancelled: 'neutral', refunded: 'red' };

const formatCedis = (n) => '₵' + Math.round(Number(n) || 0).toLocaleString('en-US').replace(/,/g, '.');

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedOrder: order, detailsLoading, mutationLoading, error, successMessage } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
    return () => dispatch(clearSelectedOrder());
  }, [dispatch, id]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearOrderStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearOrderStatus()); }
  }, [error, successMessage, dispatch]);

  const handleStatusChange = (e) => {
    dispatch(updateOrderStatus({ orderId: id, status: e.target.value }));
  };

  if (detailsLoading || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-gray-400" size={24} />
        <span className="text-sm text-gray-400">Loading order...</span>
      </div>
    );
  }

  const subtotal = order.subtotal ?? (order.items || []).reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
  const shipping = order.shipping_cost ?? 0;
  const discount = order.discount_amount ?? order.discount ?? 0;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/dashboard/orders')} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700">
        <ArrowLeft size={14} /> Back to Orders
      </button>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-mono">{order.id}</h1>
          <Badge tone={statusTone[order.status?.toLowerCase()] || 'neutral'} size="lg">{order.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Update status</span>
          <select
            value={order.status}
            onChange={handleStatusChange}
            disabled={mutationLoading}
            className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          {mutationLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Items */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Items</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-5">Product</th>
                <th className="py-3 px-5 text-right">Price</th>
                <th className="py-3 px-5 text-right">Qty</th>
                <th className="py-3 px-5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.items || []).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3.5 px-5 font-medium text-gray-900">{item.product_name}</td>
                  <td className="py-3.5 px-5 text-right text-gray-600">{formatCedis(item.price)}</td>
                  <td className="py-3.5 px-5 text-right text-gray-600">{item.quantity || 1}</td>
                  <td className="py-3.5 px-5 text-right font-semibold text-gray-900">{formatCedis((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-5 space-y-2 text-sm border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCedis(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping{order.zone ? ` (${order.zone})` : ''}</span>
              <span>{formatCedis(shipping)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <span>{discount ? `-${formatCedis(discount)}` : '—'}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCedis(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Customer</h3>
            <p className="font-semibold text-gray-900">{order.customer_name || 'Guest'}</p>
            <p className="text-sm text-gray-500 mt-1">{order.customer_email || '—'}</p>
            <p className="text-sm text-gray-500 mt-1">{order.customer_phone || order.phone || '—'}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Delivery Address</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{order.shipping_address || 'No address on file.'}</p>
            {order.zone && (
              <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{order.zone}</span>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">{order.payment_method || order.payment || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-gray-900">{order.payment_reference || order.reference || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span className="text-gray-900">
                  {order.paid_at || order.created_at ? new Date(order.paid_at || order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
