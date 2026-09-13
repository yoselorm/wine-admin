import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// GET /admin/suburbs uses the NESTED paginator shape (data.data + data.meta), unlike most other
// admin-side reference data — filters: search, shipping_zone_id.
export const fetchSuburbs = createAsyncThunk(
  'suburbs/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/suburbs`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch suburbs.');
    }
  }
);

// Payload: { name, latitude, longitude, shipping_zone_id }
export const createSuburb = createAsyncThunk(
  'suburbs/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/suburbs`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create suburb.');
    }
  }
);

export const updateSuburb = createAsyncThunk(
  'suburbs/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${api_url}/v1/admin/suburbs/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update suburb.');
    }
  }
);

export const deleteSuburb = createAsyncThunk(
  'suburbs/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/suburbs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete suburb.');
    }
  }
);

const initialState = {
  suburbs: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const suburbSlice = createSlice({
  name: 'suburbs',
  initialState,
  reducers: {
    clearSuburbStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuburbs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSuburbs.fulfilled, (state, action) => {
        state.loading = false;
        state.suburbs = action.payload.data?.data || [];
        state.pagination = action.payload.data?.meta || null;
      })
      .addCase(fetchSuburbs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createSuburb.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createSuburb.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Suburb added successfully.';
        if (action.payload?.data) state.suburbs.unshift(action.payload.data);
      })
      .addCase(createSuburb.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateSuburb.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateSuburb.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Suburb updated successfully.';
        const updated = action.payload?.data;
        if (updated) state.suburbs = state.suburbs.map((s) => (s.id === updated.id ? updated : s));
      })
      .addCase(updateSuburb.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteSuburb.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteSuburb.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Suburb removed successfully.';
        state.suburbs = state.suburbs.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteSuburb.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearSuburbStatus } = suburbSlice.actions;
export default suburbSlice.reducer;
