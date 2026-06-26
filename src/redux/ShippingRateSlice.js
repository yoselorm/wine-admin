import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Shipping Rates List (Handles params: page, per_page, sort_by, sort_order, shipping_zone_id)
export const fetchShippingRates = createAsyncThunk(
  'shippingRates/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Maps configuration properties matching the GET payload layout in Screenshot 2026-06-26 at 10.50.58.png
      const response = await api.get(`${api_url}/v1/admin/shipping-rates`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve administrative shipping rates.'
      );
    }
  }
);

// 2. Create a New Shipping Rate 
// Payload structure match: { shipping_zone_id, min_weight, max_weight, price }
export const createShippingRate = createAsyncThunk(
  'shippingRates/create',
  async (rateData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/shipping-rates`, rateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to register the new shipping matrix rule.'
      );
    }
  }
);

// 3. Update an Existing Shipping Rate
export const updateShippingRate = createAsyncThunk(
  'shippingRates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/shipping-rates/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update target shipping rate configuration.'
      );
    }
  }
);

// 4. Delete a Shipping Rate Rule Matrix
export const deleteShippingRate = createAsyncThunk(
  'shippingRates/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/shipping-rates/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to purge selected shipping rate matrix node.'
      );
    }
  }
);

const initialState = {
  shippingRates: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const shippingRateSlice = createSlice({
  name: 'shippingRates',
  initialState,
  reducers: {
    clearShippingRateStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchShippingRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShippingRates.fulfilled, (state, action) => {
        state.loading = false;
        state.shippingRates = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchShippingRates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createShippingRate.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createShippingRate.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Shipping matrix threshold added successfully!';
      })
      .addCase(createShippingRate.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateShippingRate.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateShippingRate.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Shipping weight configurations updated.';
      })
      .addCase(updateShippingRate.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteShippingRate.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteShippingRate.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.shippingRates = state.shippingRates.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Shipping weight matrix tier terminated successfully.';
      })
      .addCase(deleteShippingRate.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShippingRateStatus } = shippingRateSlice.actions;
export default shippingRateSlice.reducer;