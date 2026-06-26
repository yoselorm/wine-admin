import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Wine Attributes (Handles: page, per_page, sort_by, sort_order, search)
export const fetchWineAttributes = createAsyncThunk(
  'wineAttributes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/wine-attributes`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wine attributes.'
      );
    }
  }
);

// 2. Create New Wine Attribute (Payload: product_id, attribute_type, value)
export const createWineAttribute = createAsyncThunk(
  'wineAttributes/create',
  async (attributeData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-attributes`, attributeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create wine attribute.'
      );
    }
  }
);

// 3. Update Wine Attribute
export const updateWineAttribute = createAsyncThunk(
  'wineAttributes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/wine-attributes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wine attribute.'
      );
    }
  }
);

// 4. Delete Wine Attribute
export const deleteWineAttribute = createAsyncThunk(
  'wineAttributes/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/wine-attributes/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete wine attribute.'
      );
    }
  }
);

const initialState = {
  attributes: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const wineAttributeSlice = createSlice({
  name: 'wineAttributes',
  initialState,
  reducers: {
    clearWineAttributeStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchWineAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWineAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchWineAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine attribute created successfully!';
      })
      .addCase(createWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Wine attribute updated successfully!';
      })
      .addCase(updateWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteWineAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteWineAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.attributes = state.attributes.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Wine attribute removed successfully!';
      })
      .addCase(deleteWineAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWineAttributeStatus } = wineAttributeSlice.actions;
export default wineAttributeSlice.reducer;