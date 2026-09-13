import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Returns { kpis, customers }
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/customers`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers.');
    }
  }
);

export const fetchCustomerDetails = createAsyncThunk(
  'customers/fetchDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/customers/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer details.');
    }
  }
);

export const fetchCustomerWalletTransactions = createAsyncThunk(
  'customers/fetchWalletTransactions',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/customers/${id}/wallet-transactions`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet transactions.');
    }
  }
);

const initialState = {
  customers: [],
  kpis: null,
  pagination: null,
  selectedCustomer: null,
  walletTransactions: [],
  loading: false,
  detailsLoading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
      state.walletTransactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.data?.customers?.data || [];
        state.kpis = action.payload.data?.kpis || null;
        state.pagination = action.payload.data?.customers?.meta || null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchCustomerDetails.pending, (state) => { state.detailsLoading = true; state.error = null; })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => { state.detailsLoading = false; state.error = action.payload; })

      .addCase(fetchCustomerWalletTransactions.fulfilled, (state, action) => {
        state.walletTransactions = action.payload.data || [];
      });
  },
});

export const { clearCustomerError, clearSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
