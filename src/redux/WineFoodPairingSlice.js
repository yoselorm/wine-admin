import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Wine Food Pairings List
// Handles explicit query params: page, per_page, sort_by, sort_order, product_id, dish_id, admin_id
export const fetchWineFoodPairings = createAsyncThunk(
  'wineFoodPairings/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Passes query filters mapped from the GET request block in the provided documentation
      const response = await api.get(`${api_url}/v1/admin/wine-food-pairings`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve wine food pairings catalog.'
      );
    }
  }
);

// 2. Create a New Wine Food Pairing Relation
// Expected JSON payload structure: { product_id, dish_id, reason, admin_id }
export const createWineFoodPairing = createAsyncThunk(
  'wineFoodPairings/create',
  async (pairingData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-food-pairings`, pairingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save the new pairing rule.'
      );
    }
  }
);

// 3. Update an Existing Wine Food Pairing Relation
export const updateWineFoodPairing = createAsyncThunk(
  'wineFoodPairings/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/wine-food-pairings/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update selected wine food pairing.'
      );
    }
  }
);

// 4. Delete a Wine Food Pairing Relation record
export const deleteWineFoodPairing = createAsyncThunk(
  'wineFoodPairings/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/wine-food-pairings/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove selected wine food pairing rule.'
      );
    }
  }
);

const initialState = {
  pairings: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const wineFoodPairingSlice = createSlice({
  name: 'wineFoodPairings',
  initialState,
  reducers: {
    clearPairingStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchWineFoodPairings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWineFoodPairings.fulfilled, (state, action) => {
        state.loading = false;
        state.pairings = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchWineFoodPairings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createWineFoodPairing.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createWineFoodPairing.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine food pairing established successfully!';
      })
      .addCase(createWineFoodPairing.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateWineFoodPairing.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateWineFoodPairing.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Pairing logic criteria modified.';
      })
      .addCase(updateWineFoodPairing.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteWineFoodPairing.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteWineFoodPairing.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.pairings = state.pairings.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Pairing logic removed from register data.';
      })
      .addCase(deleteWineFoodPairing.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPairingStatus } = wineFoodPairingSlice.actions;
export default wineFoodPairingSlice.reducer;