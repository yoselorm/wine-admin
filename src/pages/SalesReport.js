import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchSalesReports,
  deleteSalesReport,
  clearSalesReportStatus
} from '../redux/SalesReportSlice';
import {
  Plus, Search, Loader2, Trash2, Edit3, BarChart3, ArrowUpDown, Calendar, X
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

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
  const navigate = useNavigate();

  const { reports, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.salesReports);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('15');
  const [searchInput, setSearchInput] = useState('');
  const [reportDateFilter, setReportDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'report_date', sort_order: 'desc' });

  const debouncedSearch = useDebounce(searchInput, 400);

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

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearSalesReportStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSalesReportStatus());
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

  const formatReadableDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  };

  const formatCedis = (val) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', currencyDisplay: 'symbol' }).format(val || 0);

  const openDeleteModal = (report) => {
    setSelectedReport(report);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExecute = () => {
    if (selectedReport?.id) {
      dispatch(deleteSalesReport(selectedReport.id));
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Financial logs, order indexes, and performance metrics in GH₵.
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/dashboard/sales-reports/new')}>Record Report</Button>
      </div>

      <Card className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 text-sm bg-gray-50/50"
            />
          </div>

          <div className="relative w-full sm:w-48 flex items-center">
            <Calendar className="absolute left-3 text-gray-400 pointer-events-none" size={14} />
            <input
              type="date"
              value={reportDateFilter}
              onChange={(e) => { setReportDateFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 text-sm bg-gray-50/50"
            />
            {reportDateFilter && (
              <button onClick={() => { setReportDateFilter(''); setCurrentPage(1); }} className="absolute right-2.5 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end w-full md:w-auto text-sm">
          <span className="text-gray-400 font-medium whitespace-nowrap">Rows:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
          {loading && <Loader2 className="animate-spin text-gray-400 ml-1" size={14} />}
        </div>
      </Card>

      <Card padded={false}>
        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-gray-400" size={24} />
            <span className="text-sm text-gray-400">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No matching sales reports</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[950px]">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 w-44 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('report_date')}>
                      <div className="flex items-center gap-1.5">Date <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('total_orders')}>
                      <div className="flex items-center justify-end gap-1.5">Orders <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('total_customers')}>
                      <div className="flex items-center justify-end gap-1.5">Customers <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('total_sales')}>
                      <div className="flex items-center justify-end gap-1.5">Gross Sales <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('average_order_value')}>
                      <div className="flex items-center justify-end gap-1.5">Avg Value <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('total_revenue')}>
                      <div className="flex items-center justify-end gap-1.5">Net Revenue <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('total_discounts')}>
                      <div className="flex items-center justify-end gap-1.5">Discounts <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr key={report.id || report.report_date} onClick={() => navigate(`/dashboard/sales-reports/${report.id}/edit`)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                      <td className="py-3.5 px-4 font-bold text-gray-950">{formatReadableDate(report.report_date)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-600">{report.total_orders?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-600">{report.total_customers?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-900 font-semibold">{formatCedis(report.total_sales)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-500">{formatCedis(report.average_order_value)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-green-700 font-bold">{formatCedis(report.total_revenue)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-red-600">-{formatCedis(report.total_discounts)}</td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/dashboard/sales-reports/${report.id}/edit`)}
                          className="inline-flex p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => openDeleteModal(report)}
                          className="inline-flex p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-md transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <Pagination meta={pagination} onPageChange={(page) => setCurrentPage(page)} />
            </div>
          </>
        )}
      </Card>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        isDeleting={mutationLoading}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteExecute}
        title="Delete Sales Report"
        message={`Are you sure you want to delete the report for ${formatReadableDate(selectedReport?.report_date)}?`}
      />
    </div>
  );
};

export default SalesReports;
