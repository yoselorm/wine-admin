import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config'; 

// 1. Fetch Audit Logs with parameters (limit, product_id)
export const fetchInventoryLogs = createAsyncThunk(
  'inventory/fetchLogs',
  async (params, { rejectWithValue }) => {
    try {
      // Maps parameters from Screenshot 2026-06-26 at 09.32.25.png
      const response = await api.get(`${api_url}/v1/admin/inventory/logs`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch inventory logs.'
      );
    }
  }
);

// 2. Post Manual Stock Level Adjustments 
export const adjustInventory = createAsyncThunk(
  'inventory/adjustStock',
  async (adjustmentData, { rejectWithValue }) => {
    try {
      // Body payload: { product_id, quantity_change, reason, change_type }
      const response = await api.post(`${api_url}/v1/admin/inventory/adjust`, adjustmentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply stock adjustment.'
      );
    }
  }
);

const initialState = {
  logs: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Inventory Logs ---
      .addCase(fetchInventoryLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchInventoryLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Adjust Stock Levels ---
      .addCase(adjustInventory.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(adjustInventory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Inventory adjusted successfully!';
      })
      .addCase(adjustInventory.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearInventoryStatus } = inventorySlice.actions;
export default inventorySlice.reducer;