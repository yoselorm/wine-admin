import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  clearCouponStatus
} from '../redux/CouponSlice';
import { Loader2, Plus, Ticket } from 'lucide-react';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Switch from '../components/ui/Switch';

const emptyForm = { code: '', type: 'percent', value: '', expires_at: '', usage_limit: '', is_active: true, description: '' };

const statusFor = (coupon) => {
  const isExpired = coupon.expires_at && new Date(coupon.expires_at) <= new Date();
  const isExhausted = coupon.usage_limit && (coupon.used_count ?? coupon.times_used ?? 0) >= coupon.usage_limit;
  if (isExpired) return { label: 'Expired', tone: 'neutral' };
  if (isExhausted) return { label: 'Exhausted', tone: 'neutral' };
  return coupon.is_active ? { label: 'Active', tone: 'green' } : { label: 'Paused', tone: 'yellow' };
};

const Coupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, mutationLoading, error, successMessage } = useSelector(s => s.coupons);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchCoupons({ per_page: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearCouponStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearCouponStatus());
      // createCoupon/updateCoupon don't merge into local state, so refetch to reflect changes
      dispatch(fetchCoupons({ per_page: 200 }));
      setShowForm(false);
      setForm(emptyForm);
    }
  }, [error, successMessage, dispatch]);

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      code: form.code.toUpperCase().replace(/\s+/g, ''),
      value: Number(form.value),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at || null,
    };
    dispatch(createCoupon(payload));
  };

  const handleToggleActive = (coupon) => {
    dispatch(updateCoupon({ id: coupon.id, data: { is_active: !coupon.is_active } }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Coupons</h1>
        <Button icon={Plus} onClick={() => setShowForm((v) => !v)}>Create Coupon</Button>
      </div>

      {showForm && (
        <Card title="New Coupon">
          <form onSubmit={handleSave} className="space-y-5 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Code <span className="text-red-500">*</span></label>
                <input type="text" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 font-mono uppercase" />
                <p className="text-xs text-gray-400 mt-1">Must be unique · customers type this at checkout</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                  <option value="percent">percent</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Value <span className="text-red-500">*</span></label>
                <input type="number" required min="0" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">{form.type === 'percent' ? 'Percentage · 1–100' : 'Amount off in ₵'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Expires</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">YYYY-MM-DD · must be a future date · empty = never</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Usage Limit</label>
                <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <p className="text-xs text-gray-400 mt-1">Total redemptions allowed · empty = unlimited</p>
              </div>
              <div className="pt-7">
                <Switch checked={form.is_active} onChange={(val) => setForm((f) => ({ ...f, is_active: val }))} label="Active" italic />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows="2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Internal note — what this coupon is for"
                className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-violet-500" />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={mutationLoading}>
                {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />} Save Coupon
              </Button>
              <Button type="button" appearance="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false}>
        {loading && coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-gray-400" size={24} />
            <span className="text-sm text-gray-400">Loading coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <Ticket size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No coupons yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-center">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => {
                  const status = statusFor(coupon);
                  const used = coupon.used_count ?? coupon.times_used ?? 0;
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-violet-600">{coupon.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {coupon.type === 'percent' ? `${coupon.value}% off` : `₵${Number(coupon.value).toFixed(0)} off`}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">{coupon.description || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-600">{used} / {coupon.usage_limit ?? '∞'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{coupon.expires_at ? coupon.expires_at.slice(0, 10) : '—'}</td>
                      <td className="py-3.5 px-4"><Badge tone={status.tone}>{status.label}</Badge></td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex justify-center">
                          <Switch checked={coupon.is_active} onChange={() => handleToggleActive(coupon)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Coupons;
