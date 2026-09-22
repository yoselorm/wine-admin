import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Calendar, Download, AlertTriangle, Truck, Wine } from 'lucide-react';
import { fetchReport } from '../redux/ReportsSlice';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import toast from '../components/Toast';

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const cedis = (n) => `₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 },
];

const Row = ({ label, value, muted, strong }) => (
  <div className="flex items-baseline justify-between py-2 border-b border-gray-50 last:border-0">
    <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    <span className={`text-sm tabular-nums ${strong ? 'font-bold text-gray-900' : muted ? 'text-gray-400' : 'font-semibold text-gray-800'}`}>{value}</span>
  </div>
);

const Empty = ({ children }) => <p className="text-sm text-gray-400 italic py-6 text-center">{children}</p>;

/**
 * What the orders actually say, over a period you choose.
 *
 * Distinct from Sales Reports, which is a table of figures an admin types in by hand — a record of
 * what was reported. This is computed from the orders themselves, and every figure on it is scoped
 * to the range at the top.
 */
const Reports = () => {
  const dispatch = useDispatch();
  const { revenue, topProducts, customers, coupons, locations, loading, error } = useSelector((s) => s.reports);

  const [range, setRange] = useState({ from: iso(Date.now() - 29 * DAY), to: iso(Date.now()) });

  useEffect(() => { dispatch(fetchReport(range)); }, [dispatch, range]);

  const summary = revenue?.summary || {};

  // goods + delivery reconcile to what was charged. Shown as a breakdown rather than one figure,
  // because a total on its own credits the shop with money the courier earned — and with every
  // wine priced at zero, that total is delivery income and nothing else.
  const goods = Number(summary.goods_revenue || 0);
  const delivery = Number(summary.total_shipping || 0);
  const charged = Number(summary.total_revenue || 0);

  const applyPreset = (days) => setRange({ from: iso(Date.now() - (days - 1) * DAY), to: iso(Date.now()) });

  const csv = useMemo(() => {
    const lines = [
      ['Report', `${range.from} to ${range.to}`],
      [],
      ['Orders', summary.total_orders ?? 0],
      ['Wine revenue', goods],
      ['Delivery revenue', delivery],
      ['Discounts given', summary.total_discounts ?? 0],
      ['Total charged', charged],
      ['Average order value', summary.avg_order_value ?? 0],
      [],
      ['Top products by revenue'],
      ['Product', 'Units', 'Revenue'],
      ...((topProducts?.by_revenue || []).map((p) => [p.name, p.units_sold, p.revenue])),
    ];
    return lines.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }, [range, summary, goods, delivery, charged, topProducts]);

  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `wine2u-report-${range.from}-to-${range.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not build the file.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            What the orders say over a period you choose. Distinct from Sales Reports, which records
            figures entered by hand.
          </p>
        </div>
        <button onClick={download} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 flex-shrink-0">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Range */}
      <Card className="mt-4 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p.days)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={range.from} max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={range.to} min={range.from} max={iso(Date.now())}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            {loading && <Loader2 size={15} className="animate-spin text-gray-300" />}
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2.5 p-3 mt-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Where the money came from */}
        <Card title="Where the money came from">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 p-3 rounded-lg bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-500 uppercase tracking-wider">
                <Wine size={12} /> Wine
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">{cedis(goods)}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-sky-50 border border-sky-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                <Truck size={12} /> Delivery
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">{cedis(delivery)}</p>
            </div>
          </div>

          {charged > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-gray-100">
              <div className="bg-violet-500" style={{ width: `${(goods / charged) * 100}%` }} />
              <div className="bg-sky-500" style={{ width: `${(delivery / charged) * 100}%` }} />
            </div>
          )}

          <Row label="Wine, before discounts" value={cedis(summary.total_goods)} muted />
          <Row label="Discounts given" value={`− ${cedis(summary.total_discounts)}`} muted />
          <Row label="Wine revenue" value={cedis(goods)} />
          <Row label="Delivery revenue" value={cedis(delivery)} />
          <Row label="Total charged" value={cedis(charged)} strong />

          {charged > 0 && goods === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mt-4">
              Every order in this period was delivery income only — no wine was paid for. Products
              priced at ₵0 are the usual cause.
            </p>
          )}
        </Card>

        {/* Orders */}
        <Card title="Orders">
          <Row label="Orders placed" value={summary.total_orders ?? 0} strong />
          <Row label="Average order value" value={cedis(summary.avg_order_value)} />
          <div className="mt-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">By status</p>
            {(revenue?.by_status || []).length === 0 ? (
              <Empty>No orders in this period.</Empty>
            ) : (
              revenue.by_status.map((s) => (
                <Row key={s.status} label={<span className="capitalize">{s.status}</span>} value={`${s.count} · ${cedis(s.value)}`} />
              ))
            )}
          </div>
        </Card>

        {/* Top products */}
        <Card title="Best sellers" padded={false}>
          {(topProducts?.by_revenue || []).length === 0 ? (
            <Empty>Nothing sold in this period.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr><th className="py-2.5 px-5">Product</th><th className="py-2.5 px-5">Units</th><th className="py-2.5 px-5">Revenue</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.by_revenue.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-5 text-gray-800 truncate max-w-[230px]">{p.name}</td>
                      <td className="py-2.5 px-5 tabular-nums text-gray-600">{p.units_sold}</td>
                      <td className="py-2.5 px-5 tabular-nums font-semibold text-gray-900">{cedis(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Delivery */}
        <Card title="Delivery">
          {(() => {
            const d = revenue?.delivery;
            if (!d || (d.orders_delivered === 0 && d.orders_collected === 0)) {
              return <Empty>No orders in this period.</Empty>;
            }
            return (
              <>
                <Row label="Delivered" value={d.orders_delivered} strong />
                <Row label="Collected in person" value={d.orders_collected} muted />
                <Row label="Charged for delivery" value={cedis(d.charged)} />
                <Row label="Average per delivery" value={cedis(d.avg_charged_per_delivery)} muted />

                {d.margin === null ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-3 py-2 mt-4">
                    What these deliveries cost is not recorded, so there is no margin to show. Set a
                    cost on each shipping rate and it will appear here for orders placed afterwards.
                  </p>
                ) : (
                  <>
                    <Row label="Cost to fulfil" value={`− ${cedis(d.cost)}`} muted />
                    <Row label="Delivery margin" value={`${cedis(d.margin)} · ${pct(d.margin_pct)}`} strong />
                    {d.cost_coverage_pct < 100 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mt-4">
                        Based on {d.orders_with_known_cost} of {d.orders_delivered} deliveries
                        ({pct(d.cost_coverage_pct)}) — the rest have no cost recorded, so the real
                        margin is lower than this.
                      </p>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </Card>

        {/* Customers */}
        <Card title="Customers">
          <Row label="Buyers" value={customers?.summary?.total_buyers ?? 0} strong />
          <Row label="New" value={customers?.summary?.new_buyers ?? 0} />
          <Row label="Returning" value={`${customers?.summary?.returning_buyers ?? 0} · ${pct(customers?.summary?.returning_rate_pct)}`} />
          <Row label="Guest orders" value={`${customers?.guest?.orders ?? 0} · ${cedis(customers?.guest?.revenue)}`} muted />
        </Card>

        {/* Coupons */}
        <Card title="Coupons">
          <Row label="Orders using a coupon" value={coupons?.summary?.orders_with_coupon ?? 0} strong />
          <Row label="Redemption rate" value={pct(coupons?.summary?.redemption_rate_pct)} />
          <Row label="Discount given" value={cedis(coupons?.summary?.total_discounts)} />
        </Card>

        {/* Where orders went */}
        <Card title="Where orders went">
          {(locations?.by_zone || locations?.zones || []).length === 0 ? (
            <Empty>No deliveries in this period.</Empty>
          ) : (
            (locations.by_zone || locations.zones).slice(0, 6).map((z) => (
              <Row
                key={z.zone || z.name}
                label={z.zone || z.name}
                // The delivery each zone paid for, not the whole order value —
                // that is what says whether a zone covers its own deliveries.
                value={`${z.orders ?? z.count ?? 0} · ${cedis(z.delivery_charged)} delivery`}
              />
            ))
          )}
        </Card>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Covering {range.from} to {range.to}.{' '}
        <Badge tone="sky" size="sm">wishlist and sommelier excluded</Badge>{' '}
        those tables do not record when a row was created, so they cannot be reported by period.
      </p>
    </div>
  );
};

export default Reports;
