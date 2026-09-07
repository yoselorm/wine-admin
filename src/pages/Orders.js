import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, clearOrderStatus } from '../redux/OrderSlice';
import { Search, Loader2, ShoppingBag } from 'lucide-react';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
];

const statusTone = { pending: 'yellow', completed: 'green', cancelled: 'neutral', refunded: 'red' };

const formatCedis = (n) => '₵' + Math.round(Number(n) || 0).toLocaleString('en-US').replace(/,/g, '.');

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error, successMessage } = useSelector(s => s.orders);

  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  useEffect(() => {
    dispatch(fetchOrders({ per_page: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearOrderStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearOrderStatus()); }
  }, [error, successMessage, dispatch]);

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key ? orders.filter((o) => o.status?.toLowerCase() === tab.key).length : orders.length;
    return acc;
  }, {});

  const filtered = orders.filter((o) => {
    if (activeStatus && o.status?.toLowerCase() !== activeStatus) return false;
    if (search && !`${o.id} ${o.customer_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          Orders <span className="text-2xl font-bold text-gray-300">{orders.length}</span>
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeStatus === tab.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} {counts[tab.key]}
          </button>
        ))}
      </div>

      <Card padded={false}>
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-gray-400" size={24} />
            <span className="text-sm text-gray-400">Loading orders...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No matching orders</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4 text-right">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} onClick={() => navigate(`/dashboard/orders/${order.id}`)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="py-3.5 px-6 font-mono font-bold text-violet-600">{order.id}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{order.customer_name || 'Guest'}</td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{order.zone || order.shipping_zone?.name || '—'}</td>
                    <td className="py-3.5 px-4 text-right text-gray-700">{order.items_count ?? order.items?.length ?? '—'}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">{formatCedis(order.total_amount)}</td>
                    <td className="py-3.5 px-4 text-gray-600">{order.payment_method || order.payment || '—'}</td>
                    <td className="py-3.5 px-6">
                      <Badge tone={statusTone[order.status?.toLowerCase()] || 'neutral'}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Orders;
