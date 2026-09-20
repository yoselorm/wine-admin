import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Mirrors WineAttributeSlice.js — same CRUD shape, sibling resource. Unlike the fixed 8-axis
// constant this used to be, an admin can define new axis types here; the product form's
// Characteristics picker reads from this list instead of a hardcoded one.

// 1. Fetch Wine Characteristics (Handles: page, per_page, sort_by, sort_order, search)
export const fetchWineCharacteristics = createAsyncThunk(
  'wineCharacteristics/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/wine-characteristics`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wine characteristics.'
      );
    }
  }
);

// 2. Create New Wine Characteristic (Payload: axis, score)
export const createWineCharacteristic = createAsyncThunk(
  'wineCharacteristics/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-characteristics`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create wine characteristic.'
      );
    }
  }
);

// 3. Update Wine Characteristic
export const updateWineCharacteristic = createAsyncThunk(
  'wineCharacteristics/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/wine-characteristics/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wine characteristic.'
      );
    }
  }
);

// 4. Delete Wine Characteristic
export const deleteWineCharacteristic = createAsyncThunk(
  'wineCharacteristics/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/wine-characteristics/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete wine characteristic.'
      );
    }
  }
);

const initialState = {
  characteristics: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const wineCharacteristicSlice = createSlice({
  name: 'wineCharacteristics',
  initialState,
  reducers: {
    clearWineCharacteristicStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWineCharacteristics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWineCharacteristics.fulfilled, (state, action) => {
        state.loading = false;
        state.characteristics = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchWineCharacteristics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createWineCharacteristic.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createWineCharacteristic.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine characteristic created successfully!';
      })
      .addCase(createWineCharacteristic.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      .addCase(updateWineCharacteristic.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateWineCharacteristic.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine characteristic updated successfully!';
      })
      .addCase(updateWineCharacteristic.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteWineCharacteristic.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteWineCharacteristic.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.characteristics = state.characteristics.filter((item) => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Wine characteristic removed successfully!';
      })
      .addCase(deleteWineCharacteristic.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWineCharacteristicStatus } = wineCharacteristicSlice.actions;
export default wineCharacteristicSlice.reducer;
