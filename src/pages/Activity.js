import React, { useMemo, useState } from 'react';
import { Search, PlusCircle, Pencil, Trash2, RefreshCw } from 'lucide-react';
import ProposalNotice from '../components/ui/ProposalNotice';
import Badge from '../components/ui/Badge';

const ACTION_META = {
  Created: { icon: PlusCircle, tone: 'green' },
  Updated: { icon: Pencil, tone: 'sky' },
  Deleted: { icon: Trash2, tone: 'red' },
  Status: { icon: RefreshCw, tone: 'yellow' },
};

const AVATAR_COLORS = ['#8470FF', '#67BFFF', '#3EC972', '#F0BB33', '#FF5656', '#755FF8'];
const colorFor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const ENTRIES = [
  { dateLabel: 'Today', admin: 'Nana Serwaa', action: 'Status', text: 'Order ORD-3239 marked Completed', detail: 'pending → completed · Orders', time: '09:42' },
  { dateLabel: 'Today', admin: 'Kwabena Osei', action: 'Updated', text: 'Adjusted stock for Nederburg Baronne 2021', detail: '+24 units · New shipment from Cape Town · Inventory', time: '08:15' },
  { dateLabel: 'Yesterday', admin: 'Efya Owusu', action: 'Created', text: 'Coupon FESTIVE50', detail: '₵50 fixed · expires 2027-01-05 · Coupons', time: '16:30' },
  { dateLabel: 'Yesterday', admin: 'Akosua Frimpong', action: 'Updated', text: 'Blog post "Sparkling Wines for the Festive Season"', detail: 'excerpt, linked products (2) · Blogs', time: '14:05' },
  { dateLabel: 'Yesterday', admin: 'Nana Serwaa', action: 'Created', text: 'Admin invite sent to efya@wine2u.com', detail: 'role: marketing_manager · Admins', time: '11:20' },
  { dateLabel: 'Sep 3, 2026', admin: 'Kwabena Osei', action: 'Updated', text: 'Product Kanonkop Pinotage 2019', detail: 'price ₵400 → ₵420 · Products', time: '17:44' },
  { dateLabel: 'Sep 3, 2026', admin: 'Yaw Boakye', action: 'Status', text: 'Order ORD-3237 marked Completed', detail: 'pending → completed · Orders', time: '15:02' },
  { dateLabel: 'Sep 3, 2026', admin: 'Kwabena Osei', action: 'Created', text: 'Wine region Swartland', detail: 'type: region · parent: South Africa · Wine Regions', time: '10:31' },
  { dateLabel: 'Sep 2, 2026', admin: 'Nana Serwaa', action: 'Updated', text: 'Coupon JUNE24 deactivated', detail: 'is_active true → false · Coupons', time: '13:12' },
  { dateLabel: 'Sep 2, 2026', admin: 'Yaw Boakye', action: 'Status', text: 'Order ORD-3235 marked Cancelled', detail: 'pending → cancelled · Orders', time: '09:12' },
  { dateLabel: 'Sep 1, 2026', admin: 'Kwabena Osei', action: 'Deleted', text: 'Product variant SKU-TO22-6PK', detail: 'Two Oceans Cabernet Merlot 2022 · Products', time: '16:40' },
  { dateLabel: 'Sep 1, 2026', admin: 'Nana Serwaa', action: 'Updated', text: 'Shipping rate Tema 15–40 kg', detail: '₵100 → ₵110 · Shipping', time: '12:05' },
  { dateLabel: 'Sep 1, 2026', admin: 'Efya Owusu', action: 'Created', text: 'Coupon SOMM15', detail: '15% percent · limit 150 · Coupons', time: '10:22' },
];

const Activity = () => {
  const [search, setSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const admins = useMemo(() => [...new Set(ENTRIES.map((e) => e.admin))], []);

  const filtered = ENTRIES.filter((e) => {
    if (adminFilter && e.admin !== adminFilter) return false;
    if (actionFilter && e.action !== actionFilter) return false;
    if (search && !`${e.text} ${e.detail}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, entry) => {
    (acc[entry.dateLabel] = acc[entry.dateLabel] || []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Activity</h1>
        <p className="text-sm text-gray-500 mt-1">Every admin mutation, newest first. Inventory adjustments also appear in the Inventory log.</p>
      </div>

      <ProposalNotice>
        Requires the audit-log endpoints in the backend report.
      </ProposalNotice>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-full sm:w-auto"
        >
          <option value="">All admins</option>
          {admins.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-full sm:w-auto"
        >
          <option value="">All actions</option>
          {Object.keys(ACTION_META).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No activity matches your filters.</p>
      ) : (
        Object.entries(grouped).map(([label, entries]) => (
          <div key={label} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">{label}</p>
            <div className="space-y-2">
              {entries.map((e, idx) => {
                const meta = ACTION_META[e.action];
                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-card px-5 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ backgroundColor: colorFor(e.admin) }}>
                      {initials(e.admin)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{e.admin}</span> · {e.text}
                      </p>
                      <p className="text-xs text-gray-400 italic mt-0.5">{e.detail}</p>
                    </div>
                    <Badge tone={meta.tone}>{e.action}</Badge>
                    <span className="text-xs text-gray-400 flex-shrink-0 w-12 text-right">{e.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Activity;
