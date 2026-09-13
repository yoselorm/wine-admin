import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Filters: admin_id, action, subject_type, subject_id, search, date_from, date_to
export const fetchActivity = createAsyncThunk(
  'activity/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/activity`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity log.');
    }
  }
);

const initialState = {
  entries: [],
  pagination: null,
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    clearActivityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data?.data || [];
        state.pagination = action.payload.data?.meta || null;
      })
      .addCase(fetchActivity.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearActivityError } = activitySlice.actions;
export default activitySlice.reducer;
