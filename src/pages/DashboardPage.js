import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ShoppingBag, MessageCircle, TrendingUp, TrendingDown,
  ArrowUpRight, AlertTriangle, Loader2, PackageX,
} from 'lucide-react';
import { fetchDashboard } from '../redux/DashboardSlice';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const LOW_STOCK_AT = 10;
const statusTone = { pending: 'yellow', processing: 'sky', shipped: 'sky', completed: 'green', delivered: 'green', cancelled: 'red', refunded: 'red' };

const cedis = (n) =>
  `₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The change against the previous period.
 *
 * Returns null when the previous period had nothing, rather than the infinity a percentage of zero
 * gives, or the "+0.0%" that reads as "flat" when it means "no basis for comparison". A tile with
 * no delta is honest; one showing a made-up delta is not.
 */
const change = (now, before) => {
  const a = Number(now || 0);
  const b = Number(before || 0);
  if (!b) return null;
  return ((a - b) / b) * 100;
};

const Delta = ({ pct, sub }) => {
  if (pct === null || pct === undefined) {
    return <span className="text-xs text-gray-400">{sub}</span>;
  }
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <>
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-700' : 'text-red-600'}`}>
        <Icon size={13} /> {up ? '+' : ''}{pct.toFixed(1)}%
      </span>
      <span className="text-xs text-gray-400">{sub}</span>
    </>
  );
};

const Empty = ({ children }) => (
  <p className="text-sm text-gray-400 italic py-6 text-center">{children}</p>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.auth);
  const { revenue, priorRevenue, wallet, priorWallet, sommelier, orders, lowStock, alerts, loading, error } =
    useSelector((state) => state.dashboard);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const summary = revenue?.summary || {};
  const priorSummary = priorRevenue?.summary || {};
  const topUps = wallet?.top_up_summary || {};
  const priorTopUps = priorWallet?.top_up_summary || {};

  const pending = (revenue?.by_status || []).find((s) => (s.status || '').toLowerCase() === 'pending')?.count || 0;

  const kpis = [
    {
      label: 'Revenue (30 days)', icon: Wallet,
      value: cedis(summary.total_revenue),
      pct: change(summary.total_revenue, priorSummary.total_revenue),
      sub: priorSummary.total_revenue ? 'vs. previous 30 days' : 'no revenue in the previous 30 days',
    },
    {
      label: 'Orders', icon: ShoppingBag,
      value: String(summary.total_orders ?? 0),
      pct: change(summary.total_orders, priorSummary.total_orders),
      sub: pending ? `${pending} pending fulfillment` : 'none pending',
    },
    {
      label: 'Wallet top-ups', icon: Wallet,
      value: cedis(topUps.total_credited),
      pct: change(topUps.total_credited, priorTopUps.total_credited),
      sub: priorTopUps.total_credited ? 'vs. previous 30 days' : 'no top-ups in the previous 30 days',
    },
    {
      label: 'Sommelier', icon: MessageCircle,
      value: String(sommelier?.summary?.total_recommendations ?? 0),
      // All time: the sommelier tables do not keep timestamps, so there is no
      // window to scope this to.
      pct: null,
      sub: 'recommendations made, all time',
    },
  ];

  // by_status drives the pipeline, so a status the shop has never used simply does not appear —
  // better than four bars hardcoded to the statuses someone expected.
  const pipeline = (revenue?.by_status || []).map((s) => ({
    label: (s.status || 'unknown').replace(/_/g, ' '),
    count: Number(s.count || 0),
    tone: statusTone[(s.status || '').toLowerCase()] || 'sky',
  }));
  const pipelineTotal = pipeline.reduce((sum, p) => sum + p.count, 0) || 1;

  const lowStockItems = (lowStock || []).filter((p) => Number(p.stock_quantity) <= LOW_STOCK_AT).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Good day, <span className="font-semibold text-gray-700">{admin?.first_name || 'Admin'}</span>. Here&apos;s what&apos;s happening across your store today.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/products')}>Add Product</Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                <div className="p-2 rounded-md bg-violet-50 text-violet-600"><Icon size={16} /></div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 min-h-[18px]">
                  {!loading && <Delta pct={kpi.pct} sub={kpi.sub} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2" padded={false} title="Recent Orders"
          action={
            <button onClick={() => navigate('/dashboard/orders')}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={14} />
            </button>
          }
        >
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
          ) : orders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-5">Order</th>
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-5">Total</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/dashboard/orders/${o.id}`)}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-gray-900">{o.order_number || o.id}</td>
                      <td className="py-3.5 px-5 font-medium text-gray-700">
                        {o.customer_name || [o.user?.first_name, o.user?.last_name].filter(Boolean).join(' ') || o.guest_name || o.email || '—'}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{cedis(o.total)}</td>
                      <td className="py-3.5 px-5">
                        <Badge tone={statusTone[(o.status || '').toLowerCase()] || 'sky'}>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Order Pipeline">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
          ) : pipeline.length === 0 ? (
            <Empty>Nothing in the pipeline.</Empty>
          ) : (
            <div className="space-y-4">
              {pipeline.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-600 capitalize">{p.label}</span>
                    <span className="font-bold text-gray-900">{p.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      p.tone === 'green' ? 'bg-green-500' : p.tone === 'red' ? 'bg-red-500' : p.tone === 'yellow' ? 'bg-yellow-500' : 'bg-sky-500'
                    }`} style={{ width: `${Math.round((p.count / pipelineTotal) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Low Stock"
          action={lowStockItems.length > 0 && <Badge tone="red" size="sm">{lowStockItems.length} alerts</Badge>}>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-6 text-gray-400">
              <PackageX size={20} className="text-gray-200" />
              <p className="text-sm italic">Nothing at or below {LOW_STOCK_AT} units.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} onClick={() => navigate(`/dashboard/products/${item.id}/edit`)}
                  className="flex items-center justify-between py-1 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku || '—'}</p>
                  </div>
                  <Badge tone={Number(item.stock_quantity) === 0 ? 'red' : 'yellow'} size="lg">
                    {item.stock_quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Intelligence Feed"
          action={
            <button onClick={() => navigate('/dashboard/intelligence')}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={14} />
            </button>
          }
        >
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={20} /></div>
          ) : alerts.length === 0 ? (
            <Empty>No alerts right now.</Empty>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => {
                const tone = { high: 'red', critical: 'red', medium: 'yellow', low: 'sky' }[(a.severity || '').toLowerCase()] || 'sky';
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                    <div className={`p-1.5 rounded-md ${tone === 'red' ? 'bg-red-50 text-red-600' : tone === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 'bg-sky-50 text-sky-600'}`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                        {a.severity && <Badge tone={tone} size="sm">{a.severity}</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.summary || a.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
