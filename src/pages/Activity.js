import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, PlusCircle, Pencil, Trash2, RefreshCw, Loader2, History } from 'lucide-react';
import Badge from '../components/ui/Badge';
import toast from '../components/Toast';
import { fetchActivity, clearActivityError } from '../redux/ActivitySlice';

const ACTION_META = {
  created: { icon: PlusCircle, tone: 'green' },
  updated: { icon: Pencil, tone: 'sky' },
  deleted: { icon: Trash2, tone: 'red' },
  status: { icon: RefreshCw, tone: 'yellow' },
};

const AVATAR_COLORS = ['#8470FF', '#67BFFF', '#3EC972', '#F0BB33', '#FF5656', '#755FF8'];
const colorFor = (name = '?') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '?') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const Activity = () => {
  const dispatch = useDispatch();
  const { entries, loading, error } = useSelector((s) => s.activity);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const loadActivity = useCallback(() => {
    dispatch(fetchActivity({
      search: debouncedSearch || undefined,
      action: action || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }));
  }, [dispatch, debouncedSearch, action, dateFrom, dateTo]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearActivityError()); }
  }, [error, dispatch]);

  const actionOptions = useMemo(() => [...new Set(entries.map((e) => e.action).filter(Boolean))], [entries]);

  const grouped = entries.reduce((acc, entry) => {
    const label = formatDateLabel(entry.created_at || entry.date);
    (acc[label] = acc[label] || []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Activity</h1>
        <p className="text-sm text-gray-500 mt-1">Every admin mutation, newest first. Inventory adjustments also appear in the Inventory log.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-full sm:w-auto"
        >
          <option value="">All actions</option>
          {actionOptions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-full sm:w-auto"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-full sm:w-auto"
        />
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

      {loading && entries.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History size={22} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No activity matches your filters.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([label, group]) => (
          <div key={label} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">{label}</p>
            <div className="space-y-2">
              {group.map((e) => {
                const meta = ACTION_META[e.action?.toLowerCase()] || ACTION_META.updated;
                const adminName = e.admin_name || e.admin?.first_name ? `${e.admin?.first_name || ''} ${e.admin?.last_name || ''}`.trim() : (e.admin_name || 'System');
                return (
                  <div key={e.id} className="bg-white border border-gray-200 rounded-xl shadow-card px-5 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ backgroundColor: colorFor(adminName) }}>
                      {initials(adminName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{adminName}</span> · {e.description || e.text}
                      </p>
                      {(e.subject_type || e.detail) && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{e.detail || e.subject_type}</p>
                      )}
                    </div>
                    <Badge tone={meta.tone}>{e.action}</Badge>
                    <span className="text-xs text-gray-400 flex-shrink-0 w-12 text-right">{formatTime(e.created_at || e.date)}</span>
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
