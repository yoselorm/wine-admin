import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Shipping Zones List (Handles params: page, per_page, sort_by, sort_order, search)
export const fetchShippingZones = createAsyncThunk(
  'shippingZones/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Mapping parameter criteria directly from the GET block in Screenshot 2026-06-26 at 11.00.12.png
      const response = await api.get(`${api_url}/v1/admin/shipping-zones`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch administrative shipping zones.'
      );
    }
  }
);

// 2. Create a New Shipping Zone
// Payload structure: { name, description }
export const createShippingZone = createAsyncThunk(
  'shippingZones/create',
  async (zoneData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/shipping-zones`, zoneData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to establish new shipping zone.'
      );
    }
  }
);

// 3. Update an Existing Shipping Zone
export const updateShippingZone = createAsyncThunk(
  'shippingZones/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/shipping-zones/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update target shipping zone configurations.'
      );
    }
  }
);

// 4. Delete a Shipping Zone
export const deleteShippingZone = createAsyncThunk(
  'shippingZones/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/shipping-zones/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to terminate target shipping zone.'
      );
    }
  }
);

const initialState = {
  shippingZones: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const shippingZoneSlice = createSlice({
  name: 'shippingZones',
  initialState,
  reducers: {
    clearShippingZoneStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchShippingZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShippingZones.fulfilled, (state, action) => {
        state.loading = false;
        state.shippingZones = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchShippingZones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createShippingZone.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createShippingZone.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Shipping zone initialized successfully!';
      })
      .addCase(createShippingZone.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateShippingZone.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateShippingZone.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Shipping zone parameter matrix updated.';
      })
      .addCase(updateShippingZone.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteShippingZone.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteShippingZone.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.shippingZones = state.shippingZones.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Shipping zone deleted successfully.';
      })
      .addCase(deleteShippingZone.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShippingZoneStatus } = shippingZoneSlice.actions;
export default shippingZoneSlice.reducer;