import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch All Sales Reports
// Query parameters supported: page, per_page, sort_by, sort_order, search, report_date
export const fetchSalesReports = createAsyncThunk(
  'salesReports/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/sales-reports`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve sales reports logs.'
      );
    }
  }
);

// 2. Create a New Sales Report
// Expected body payload keys: report_date, total_orders, total_customers, total_sales, average_order_value, total_revenue, total_discounts
export const createSalesReport = createAsyncThunk(
  'salesReports/create',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/sales-reports`, reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate the sales report entries.'
      );
    }
  }
);

// 3. Update an Existing Sales Report Node
export const updateSalesReport = createAsyncThunk(
  'salesReports/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/sales-reports/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to adjust target sales report metrics.'
      );
    }
  }
);

// 4. Delete/Purge a Sales Report
export const deleteSalesReport = createAsyncThunk(
  'salesReports/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/sales-reports/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to drop selected sales record.'
      );
    }
  }
);

const initialState = {
  reports: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const salesReportSlice = createSlice({
  name: 'salesReports',
  initialState,
  reducers: {
    clearSalesReportStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchSalesReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchSalesReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createSalesReport.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createSalesReport.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Sales report archived successfully!';
      })
      .addCase(createSalesReport.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateSalesReport.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateSalesReport.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Sales report properties modified.';
      })
      .addCase(updateSalesReport.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteSalesReport.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteSalesReport.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.reports = state.reports.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Sales report record completely dropped.';
      })
      .addCase(deleteSalesReport.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSalesReportStatus } = salesReportSlice.actions;
export default salesReportSlice.reducer;