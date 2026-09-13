import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Loader2, Wallet, X, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  fetchCustomers,
  fetchCustomerDetails,
  fetchCustomerWalletTransactions,
  clearCustomerError,
  clearSelectedCustomer,
} from '../redux/CustomerSlice';
import toast from '../components/Toast';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const formatCedis = (n) => '₵' + Math.round(Number(n) || 0).toLocaleString('en-US').replace(/,/g, '.');

const initials = (name = '?') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const AVATAR_COLORS = ['#8470FF', '#67BFFF', '#3EC972', '#F0BB33', '#FF5656', '#755FF8'];
const colorFor = (name = '?') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Customers = () => {
  const dispatch = useDispatch();
  const { customers, kpis, loading, selectedCustomer, detailsLoading, walletTransactions, error } = useSelector((s) => s.customers);
  const [search, setSearch] = useState('');
  const [viewingId, setViewingId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const loadCustomers = useCallback(() => {
    dispatch(fetchCustomers({ search: debouncedSearch || undefined }));
  }, [dispatch, debouncedSearch]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearCustomerError()); }
  }, [error, dispatch]);

  const kpiMap = {};
  (kpis || []).forEach((k) => { kpiMap[k.key] = k.value; });

  const openDetails = (customer) => {
    setViewingId(customer.id);
    dispatch(fetchCustomerDetails(customer.id));
    dispatch(fetchCustomerWalletTransactions(customer.id));
  };

  const closeDetails = () => {
    setViewingId(null);
    dispatch(clearSelectedCustomer());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          Customers <span className="text-2xl font-bold text-gray-300">{customers.length}</span>
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {kpis?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(kpiMap.total_customers ?? 0).toLocaleString()}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet Balances Held</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCedis(kpiMap.wallet_balances_held)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Lifetime Spend</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCedis(kpiMap.avg_lifetime_spend)}</p>
          </Card>
        </div>
      )}

      <Card padded={false}>
        {loading && customers.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-right">Wallet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ backgroundColor: colorFor(c.name) }}>
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {c.joined_at || c.created_at ? new Date(c.joined_at || c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700">{c.orders_count ?? c.orders ?? 0}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-900">{formatCedis(c.total_spent ?? c.spent)}</td>
                    <td className="py-3.5 px-4 text-right text-gray-700">{formatCedis(c.wallet_balance ?? c.wallet)}</td>
                    <td className="py-3.5 px-4">
                      <Badge tone={(c.status || 'active') === 'active' ? 'green' : 'neutral'}>{c.status || 'active'}</Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button onClick={() => openDetails(c)} className="inline-flex p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CUSTOMER DETAIL DRAWER */}
      {viewingId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-gray-950/30 backdrop-blur-xs" onClick={closeDetails} />
          <div className="relative w-full max-w-md bg-white border-l border-gray-200 shadow-modal h-full flex flex-col z-10 animate-slide-in">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Customer Details</h3>
              <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 p-1.5 bg-white border border-gray-200 rounded-md">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailsLoading || !selectedCustomer ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
              ) : (
                <>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && <p className="text-sm text-gray-500 mt-0.5">{selectedCustomer.phone}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <p className="text-xs text-gray-400">Orders</p>
                      <p className="font-bold text-gray-900 mt-0.5">{selectedCustomer.orders_count ?? 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <p className="text-xs text-gray-400">Wallet</p>
                      <p className="font-bold text-gray-900 mt-0.5">{formatCedis(selectedCustomer.wallet_balance)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5"><Wallet size={13} className="text-gray-400" /> Wallet Transactions</h4>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
                      {walletTransactions.length === 0 ? (
                        <p className="text-sm text-gray-400 p-3">No wallet activity yet.</p>
                      ) : (
                        walletTransactions.map((t, idx) => (
                          <div key={t.id || idx} className="flex items-center justify-between px-3 py-2.5 text-sm">
                            <div>
                              <p className="text-gray-800">{t.description || t.type}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                              </p>
                            </div>
                            <span className={`font-mono font-semibold ${Number(t.amount) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {Number(t.amount) < 0 ? '' : '+'}{formatCedis(t.amount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
