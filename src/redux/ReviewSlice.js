import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Defaults to the pending queue; pass status: 'all' or a comma-separated list to opt out.
// Also filters: rating, product_id, user_id, search
export const fetchReviews = createAsyncThunk(
  'reviews/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/reviews`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews.');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/reviews/${id}`, data);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review.');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/reviews/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review.');
    }
  }
);

const initialState = {
  reviews: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data?.data || [];
        state.pagination = action.payload.data?.meta || null;
      })
      .addCase(fetchReviews.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateReview.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Review updated.';
        // Moderation actions (approve/reject) remove the item from the pending queue view
        state.reviews = state.reviews.filter((r) => r.id !== action.payload.id);
      })
      .addCase(updateReview.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteReview.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Review deleted.';
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearReviewStatus } = reviewSlice.actions;
export default reviewSlice.reducer;
