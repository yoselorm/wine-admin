import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryLogs, adjustInventory, clearInventoryStatus } from '../redux/InventorySlice';
import { fetchProducts } from '../redux/ProductSlice';
import { ClipboardList, Loader2 } from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';

const Inventory = () => {
  const dispatch = useDispatch();

  const { logs, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.inventory);
  const { items: products } = useSelector(s => s.products);

  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_change: '',
    change_type: 'addition',
    reason: '',
  });

  useEffect(() => {
    dispatch(fetchInventoryLogs({ page: currentPage }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearInventoryStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearInventoryStatus());
      setFormData({ product_id: '', quantity_change: '', change_type: 'addition', reason: '' });
      dispatch(fetchInventoryLogs({ page: 1 }));
    }
  }, [error, successMessage, dispatch]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error('Please select a product.');
      return;
    }
    dispatch(adjustInventory({
      ...formData,
      quantity_change: Number(formData.quantity_change),
    }));
  };

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* ADJUST STOCK PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Adjust Stock</h3>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Product</label>
              <select
                required
                value={formData.product_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a product...</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="change_type" checked={formData.change_type === 'addition'}
                  onChange={() => setFormData((p) => ({ ...p, change_type: 'addition' }))}
                  className="text-violet-600 focus:ring-violet-500" />
                <span className="font-medium text-gray-700">Addition</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="change_type" checked={formData.change_type === 'subtraction'}
                  onChange={() => setFormData((p) => ({ ...p, change_type: 'subtraction' }))}
                  className="text-violet-600 focus:ring-violet-500" />
                <span className="font-medium text-gray-700">Deduction</span>
              </label>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Quantity</label>
              <input
                type="number" min="1" required
                value={formData.quantity_change}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity_change: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
              <input
                type="text" required
                placeholder="e.g. New shipment from Cape Town"
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
              />
            </div>

            <Button type="submit" disabled={mutationLoading} className="w-full justify-center">
              {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Log Adjustment
            </Button>
          </form>
        </div>

        {/* LOG PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900">Inventory Log</h3>
          </div>
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-gray-400" size={24} />
              <span className="text-sm text-gray-400">Loading log...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-700">No inventory activity recorded</h3>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 sticky top-0 bg-white">
                    <tr>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Product</th>
                      <th className="py-3 px-5 text-right">Change</th>
                      <th className="py-3 px-5">Reason</th>
                      <th className="py-3 px-5">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-5 text-gray-500 whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-gray-900">{log.product?.name || 'Unknown product'}</td>
                        <td className={`py-3.5 px-5 text-right font-mono font-bold ${log.change_type === 'addition' ? 'text-green-600' : 'text-red-500'}`}>
                          {log.change_type === 'addition' ? '+' : '-'}{log.quantity_change}
                        </td>
                        <td className="py-3.5 px-5 text-gray-500 max-w-xs truncate">{log.reason || '—'}</td>
                        <td className="py-3.5 px-5 text-gray-500">{log.admin?.name || log.admin_name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                <Pagination meta={pagination} onPageChange={handlePageChange} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
