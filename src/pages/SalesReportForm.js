import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag, Users } from 'lucide-react';
import { fetchSalesReports, createSalesReport, updateSalesReport, clearSalesReportStatus } from '../redux/SalesReportSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from '../components/Toast';

const emptyForm = {
  report_date: new Date().toISOString().split('T')[0],
  total_orders: '', total_customers: '', total_sales: '',
  average_order_value: '', total_revenue: '', total_discounts: '',
};

const SalesReportForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reports, mutationLoading, error, successMessage } = useSelector((s) => s.salesReports);

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchSalesReports({ per_page: 200 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && reports?.length) {
      const report = reports.find((r) => String(r.id) === String(id));
      if (report) {
        setFormData({
          report_date: report.report_date ? report.report_date.split('T')[0] : '',
          total_orders: report.total_orders ?? '', total_customers: report.total_customers ?? '',
          total_sales: report.total_sales ?? '', average_order_value: report.average_order_value ?? '',
          total_revenue: report.total_revenue ?? '', total_discounts: report.total_discounts ?? '',
        });
      }
    }
  }, [id, isEditing, reports]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearSalesReportStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSalesReportStatus());
      navigate('/dashboard/sales-reports');
    }
  }, [error, successMessage, dispatch, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericalPayload = {
      ...formData,
      total_orders: parseInt(formData.total_orders, 10),
      total_customers: parseInt(formData.total_customers, 10),
      total_sales: parseFloat(formData.total_sales),
      average_order_value: parseFloat(formData.average_order_value),
      total_revenue: parseFloat(formData.total_revenue),
      total_discounts: parseFloat(formData.total_discounts),
    };
    if (isEditing) {
      dispatch(updateSalesReport({ id, data: numericalPayload }));
    } else {
      dispatch(createSalesReport(numericalPayload));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/sales-reports')}
          className="p-2 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit Sales Report' : 'Record Daily Sales Report'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Log daily financial metrics, expressed in GH₵.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Report Date *</label>
              <input type="date" required name="report_date" disabled={isEditing} value={formData.report_date} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-400" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Total Orders *</label>
              <div className="relative">
                <ShoppingBag className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input type="number" required min="0" step="1" name="total_orders" placeholder="e.g., 855" value={formData.total_orders} onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Total Customers *</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input type="number" required min="0" step="1" name="total_customers" placeholder="e.g., 373" value={formData.total_customers} onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Gross Sales (GH₵) *</label>
              <input type="number" required min="0" step="0.01" name="total_sales" placeholder="e.g., 53552.58" value={formData.total_sales} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Average Order Value (GH₵) *</label>
              <input type="number" required min="0" step="0.01" name="average_order_value" placeholder="e.g., 291.14" value={formData.average_order_value} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Total Revenue (GH₵) *</label>
              <input type="number" required min="0" step="0.01" name="total_revenue" placeholder="e.g., 20553.02" value={formData.total_revenue} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Total Discounts (GH₵) *</label>
              <input type="number" required min="0" step="0.01" name="total_discounts" placeholder="e.g., 4522.25" value={formData.total_discounts} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" appearance="secondary" onClick={() => navigate('/dashboard/sales-reports')}>Cancel</Button>
          <Button type="submit" disabled={mutationLoading}>
            {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
            {isEditing ? 'Update Report' : 'Save Report'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SalesReportForm;
