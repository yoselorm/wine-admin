import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Coupons List (Handles params: page, per_page, sort_by, sort_order, search, type, is_active)
export const fetchCoupons = createAsyncThunk(
  'coupons/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Direct parameter matching from Screenshot 2026-06-26 at 10.32.51.png
      const response = await api.get(`${api_url}/v1/admin/coupons`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch promotional coupons.'
      );
    }
  }
);

// 2. Create a New Coupon
// Payload structure: { code, type, value, expires_at, usage_limit, is_active, description }
export const createCoupon = createAsyncThunk(
  'coupons/create',
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/coupons`, couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create new promotional coupon.'
      );
    }
  }
);

// 3. Update an Existing Coupon
export const updateCoupon = createAsyncThunk(
  'coupons/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/coupons/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update target coupon.'
      );
    }
  }
);

// 4. Delete a Coupon
export const deleteCoupon = createAsyncThunk(
  'coupons/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/coupons/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to terminate promotional coupon.'
      );
    }
  }
);

const initialState = {
  coupons: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    clearCouponStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createCoupon.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Coupon code established successfully!';
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateCoupon.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Coupon parameter matrix updated!';
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteCoupon.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.coupons = state.coupons.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Coupon deleted successfully.';
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponStatus } = couponSlice.actions;
export default couponSlice.reducer;