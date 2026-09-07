import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// NOTE: Dashboard aggregate/analytics endpoints are not yet available from the API.
// This screen is built with placeholder data and can be wired to real endpoints later.
const kpis = [
  { label: 'Revenue (30 days)', value: '₵24,580.00', delta: '+12.5%', tone: 'up', sub: 'vs. previous 30 days', icon: Wallet },
  { label: 'Orders', value: '312', delta: '+8.2%', tone: 'up', sub: '42 pending fulfillment', icon: ShoppingBag },
  { label: 'Wallet top-ups', value: '₵6,120.00', delta: '-3.1%', tone: 'down', sub: 'vs. previous 30 days', icon: Wallet },
  { label: 'Sommelier chats', value: '186', delta: '+21.4%', tone: 'up', sub: 'new conversations', icon: MessageCircle },
];

const pipeline = [
  { label: 'Pending', count: 18, tone: 'yellow' },
  { label: 'Shipped', count: 24, tone: 'sky' },
  { label: 'Completed', count: 246, tone: 'green' },
  { label: 'Cancelled', count: 9, tone: 'red' },
];
const pipelineTotal = pipeline.reduce((sum, p) => sum + p.count, 0);

const lowStock = [
  { name: 'Château Margaux 2015', sku: 'CM-2015-750', stock: 3 },
  { name: 'Dom Pérignon Vintage', sku: 'DP-VIN-750', stock: 5 },
  { name: 'Barolo Riserva 2016', sku: 'BR-2016-750', stock: 7 },
];

const alerts = [
  { severity: 'High', tone: 'red', title: 'GHS/USD volatility spike', summary: 'Currency swing may affect import cost margins this week.' },
  { severity: 'Medium', tone: 'yellow', title: 'Bulk wine index rising', summary: 'Sourcing costs trending up across red varietals.' },
  { severity: 'Low', tone: 'sky', title: 'Sparkling demand trend', summary: 'Seasonal uptick expected in sparkling wine orders.' },
];

const recentOrders = [
  { id: 'ORD-9482', customer: 'Amara Mensah', total: '₵650.00', status: 'pending' },
  { id: 'ORD-9481', customer: 'Kwame Asante', total: '₵320.00', status: 'shipped' },
  { id: 'ORD-9480', customer: 'Elena Rostova', total: '₵890.00', status: 'completed' },
  { id: 'ORD-9479', customer: 'John Doe', total: '₵1,200.00', status: 'completed' },
  { id: 'ORD-9478', customer: 'Nana Yaw', total: '₵210.00', status: 'cancelled' },
];

const statusTone = { pending: 'yellow', shipped: 'sky', completed: 'green', cancelled: 'red' };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Good day, <span className="font-semibold text-gray-700">{admin?.first_name || 'Admin'}</span>. Here&apos;s what&apos;s happening across your store today.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/products')}>Add Product</Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.tone === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                <div className="p-2 rounded-md bg-violet-50 text-violet-600">
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${kpi.tone === 'up' ? 'text-green-700' : 'text-red-600'}`}>
                    <TrendIcon size={13} /> {kpi.delta}
                  </span>
                  <span className="text-xs text-gray-400">{kpi.sub}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <Card
          className="lg:col-span-2"
          padded={false}
          title="Recent Orders"
          action={
            <button
              onClick={() => navigate('/dashboard/orders')}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight size={14} />
            </button>
          }
        >
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-gray-900">{order.id}</td>
                    <td className="py-3.5 px-5 font-medium text-gray-700">{order.customer}</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{order.total}</td>
                    <td className="py-3.5 px-5">
                      <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Order pipeline */}
        <Card title="Order Pipeline">
          <div className="space-y-4">
            {pipeline.map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-600">{p.label}</span>
                  <span className="font-bold text-gray-900">{p.count}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.tone === 'green' ? 'bg-green-500' : p.tone === 'red' ? 'bg-red-500' : p.tone === 'yellow' ? 'bg-yellow-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.round((p.count / pipelineTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <Card title="Low Stock" action={<Badge tone="red" size="sm">{lowStock.length} alerts</Badge>}>
          <div className="space-y-3">
            {lowStock.map((item) => (
              <div key={item.sku} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                </div>
                <Badge tone="yellow" size="lg">{item.stock} left</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Intelligence feed */}
        <Card
          title="Intelligence Feed"
          action={
            <button
              onClick={() => navigate('/dashboard/intelligence')}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight size={14} />
            </button>
          }
        >
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.title} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className={`p-1.5 rounded-md ${alert.tone === 'red' ? 'bg-red-50 text-red-600' : alert.tone === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 'bg-sky-50 text-sky-600'}`}>
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{alert.title}</p>
                    <Badge tone={alert.tone} size="sm">{alert.severity}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
