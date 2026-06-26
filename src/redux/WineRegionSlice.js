import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Wine Regions List (Handles query params: page, per_page, sort_by, sort_order, search, type)
export const fetchWineRegions = createAsyncThunk(
  'wineRegions/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Maps configuration parameters from Screenshot 2026-06-26 at 10.06.19.png
      const response = await api.get(`${api_url}/v1/admin/wine-regions`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wine regions.'
      );
    }
  }
);

// 2. Create a New Wine Region
// Payload matching schema: { name, slug, description, type, parent_id, iso_code, flag_url, image_url, is_published, position }
export const createWineRegion = createAsyncThunk(
  'wineRegions/create',
  async (regionData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-regions`, regionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create wine region.'
      );
    }
  }
);

// 3. Update an Existing Wine Region
export const updateWineRegion = createAsyncThunk(
  'wineRegions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/wine-regions/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wine region.'
      );
    }
  }
);

// 4. Delete a Wine Region
export const deleteWineRegion = createAsyncThunk(
  'wineRegions/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/wine-regions/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete wine region.'
      );
    }
  }
);

const initialState = {
  regions: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const wineRegionSlice = createSlice({
  name: 'wineRegions',
  initialState,
  reducers: {
    clearWineRegionStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchWineRegions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWineRegions.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchWineRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createWineRegion.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createWineRegion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine region registered successfully!';
      })
      .addCase(createWineRegion.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateWineRegion.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateWineRegion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine region updated successfully!';
      })
      .addCase(updateWineRegion.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteWineRegion.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteWineRegion.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.regions = state.regions.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Wine region deleted successfully!';
      })
      .addCase(deleteWineRegion.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWineRegionStatus } = wineRegionSlice.actions;
export default wineRegionSlice.reducer;