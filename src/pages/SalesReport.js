import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSalesReports, 
  createSalesReport, 
  updateSalesReport, 
  deleteSalesReport, 
  clearSalesReportStatus 
} from '../redux/SalesReportSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, BarChart3, 
  ArrowUpDown, AlertTriangle, X, Calendar, ShoppingBag, Users
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const SalesReports = () => {
  const dispatch = useDispatch();
  
  const { reports, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.salesReports);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // GET Request Parameters matching parameters in Screenshot 2026-06-26 at 11.57.46.png
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [reportDateFilter, setReportDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'report_date', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Form payload configuration matching structural keys explicitly:
  // report_date, total_orders, total_customers, total_sales, average_order_value, total_revenue, total_discounts
  const [formData, setFormData] = useState({
    report_date: '',
    total_orders: '',
    total_customers: '',
    total_sales: '',
    average_order_value: '',
    total_revenue: '',
    total_discounts: ''
  });

  // 1. Fetch Request Handler
  const loadReportsData = useCallback(() => {
    dispatch(fetchSalesReports({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      report_date: reportDateFilter || undefined,
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, reportDateFilter, sortConfig, dispatch]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // 2. Notification & State Sync Lifecycle Listener
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearSalesReportStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSalesReportStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedReport(null);
      loadReportsData();
    }
  }, [error, successMessage, loadReportsData, dispatch]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Safe helper to strip any ISO strings down into standard HTML date input format (YYYY-MM-DD)
  const formatInputDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  // Human Readable Date Helper (e.g., July 28, 2000)
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; 
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Keep it absolute based on incoming ledger criteria
    });
  };

  // Localized Currency Format helper handling Ghanaian Cedis (GH₵)
  const formatCedis = (val) => {
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      currencyDisplay: 'symbol' 
    }).format(val || 0);
  };

  const openCreateModal = () => {
    setSelectedReport(null);
    setFormData({
      report_date: new Date().toISOString().split('T')[0],
      total_orders: '',
      total_customers: '',
      total_sales: '',
      average_order_value: '',
      total_revenue: '',
      total_discounts: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setFormData({
      report_date: formatInputDate(report.report_date),
      total_orders: report.total_orders ?? '',
      total_customers: report.total_customers ?? '',
      total_sales: report.total_sales ?? '',
      average_order_value: report.average_order_value ?? '',
      total_revenue: report.total_revenue ?? '',
      total_discounts: report.total_discounts ?? ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (report) => {
    setSelectedReport(report);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Cast numeric entry targets appropriately before sending payload
    const numericalPayload = {
      ...formData,
      total_orders: parseInt(formData.total_orders, 10),
      total_customers: parseInt(formData.total_customers, 10),
      total_sales: parseFloat(formData.total_sales),
      average_order_value: parseFloat(formData.average_order_value),
      total_revenue: parseFloat(formData.total_revenue),
      total_discounts: parseFloat(formData.total_discounts)
    };

    if (selectedReport) {
      dispatch(updateSalesReport({ id: selectedReport.id, data: numericalPayload }));
    } else {
      dispatch(createSalesReport(numericalPayload));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedReport?.id) {
      dispatch(deleteSalesReport(selectedReport.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Sales Logs & Reports</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Maintain financial logs, order indexes, and performance metrics formatted in Ghanaian Cedis.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Record Daily Report
        </button>
      </div>

      {/* ADVANCED PARAMETERS CONTROL BLOCK */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search reports ledger..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
            />
          </div>

          <div className="relative w-full sm:w-48 flex items-center">
            <Calendar className="absolute left-3 text-zinc-400 pointer-events-none" size={14} />
            <input
              type="date"
              value={reportDateFilter}
              onChange={(e) => { setReportDateFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
            />
            {reportDateFilter && (
              <button 
                onClick={() => { setReportDateFilter(''); setCurrentPage(1); }}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Rows:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 records</option>
            <option value="30">30 records</option>
            <option value="50">50 records</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-1" size={14} />}
        </div>
      </div>

      {/* CORE DATA LEDGER TABLE */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Compiling financial indexes...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No matching sales reports logged</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600 table-fixed min-w-[950px]">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-4 w-44 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('report_date')}>
                      <div className="flex items-center gap-1.5">Reporting Date <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('total_orders')}>
                      <div className="flex items-center justify-end gap-1.5">Orders <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('total_customers')}>
                      <div className="flex items-center justify-end gap-1.5">Customers <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('total_sales')}>
                      <div className="flex items-center justify-end gap-1.5">Gross Sales <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('average_order_value')}>
                      <div className="flex items-center justify-end gap-1.5">Avg Value <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('total_revenue')}>
                      <div className="flex items-center justify-end gap-1.5">Net Revenue <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('total_discounts')}>
                      <div className="flex items-center justify-end gap-1.5">Discounts <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {reports.map((report) => (
                    <tr key={report.id || report.report_date} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-950">
                        {formatReadableDate(report.report_date)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                        {report.total_orders?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                        {report.total_customers?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-900 font-semibold">
                        {formatCedis(report.total_sales)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-500">
                        {formatCedis(report.average_order_value)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-bold">
                        {formatCedis(report.total_revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-red-600">
                        -{formatCedis(report.total_discounts)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(report)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(report)}
                          className="inline-flex p-1.5 text-zinc-400 hover:text-red-600 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-100 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={(page) => setCurrentPage(page)} />
            </div>
          </>
        )}
      </div>

      {/* FORM INPUT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedReport ? 'Adjust Financial Report Metrics' : 'Log New Daily Sales Metrics'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Input system numerical criteria values (expressed globally in GH₵ balances).</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field: report_date */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Report Reference Date *</label>
                  <input
                    type="date" required name="report_date"
                    disabled={!!selectedReport}
                    value={formData.report_date} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>

                {/* Field: total_orders */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Total Completed Orders *</label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-2.5 text-zinc-400" size={13} />
                    <input
                      type="number" required min="0" step="1" name="total_orders" placeholder="e.g., 855"
                      value={formData.total_orders} onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>

                {/* Field: total_customers */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Total Customers *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 text-zinc-400" size={13} />
                    <input
                      type="number" required min="0" step="1" name="total_customers" placeholder="e.g., 373"
                      value={formData.total_customers} onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>

                {/* Field: total_sales */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Gross Sales Value (GH₵) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-semibold font-mono text-[10px]">GH₵</span>
                    <input
                      type="number" required min="0" step="0.01" name="total_sales" placeholder="e.g., 53552.58"
                      value={formData.total_sales} onChange={handleInputChange}
                      className="w-full pl-12 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>

                {/* Field: average_order_value */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Average Order Value (GH₵) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-semibold font-mono text-[10px]">GH₵</span>
                    <input
                      type="number" required min="0" step="0.01" name="average_order_value" placeholder="e.g., 291.14"
                      value={formData.average_order_value} onChange={handleInputChange}
                      className="w-full pl-12 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>

                {/* Field: total_revenue */}
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Total Revenue (GH₵) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-semibold font-mono text-[10px]">GH₵</span>
                    <input
                      type="number" required min="0" step="0.01" name="total_revenue" placeholder="e.g., 20553.02"
                      value={formData.total_revenue} onChange={handleInputChange}
                      className="w-full pl-12 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>

                {/* Field: total_discounts */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-semibold text-zinc-700">Total Deducted Discounts (GH₵) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-semibold font-mono text-[10px]">GH₵</span>
                    <input
                      type="number" required min="0" step="0.01" name="total_discounts" placeholder="e.g., 4522.25"
                      value={formData.total_discounts} onChange={handleInputChange}
                      className="w-full pl-12 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 font-medium text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Form Actions Control Tray */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button" onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedReport ? 'Commit Adjustment' : 'Save Report Log'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DISMISS CONFIRMATION DELETION SHEET */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Purge Selected Financial Entry?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you entirely certain you want to drop the historical metrics for **{formatReadableDate(selectedReport?.report_date)}**? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                No, Retain
              </button>
              <button
                type="button" disabled={mutationLoading} onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesReports;