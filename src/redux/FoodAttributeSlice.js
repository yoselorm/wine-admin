import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Food Attributes List (Handles query params: page, per_page, sort_by, sort_order, search)
export const fetchFoodAttributes = createAsyncThunk(
  'foodAttributes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Maps configuration properties matching the GET payload layout in Screenshot 2026-06-26 at 11.35.25.png
      const response = await api.get(`${api_url}/v1/admin/food-attributes`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve food attributes list.'
      );
    }
  }
);

// 2. Create a New Food Attribute Rule Matrix
// Payload schema match: { dish_id, attribute_type, value }
export const createFoodAttribute = createAsyncThunk(
  'foodAttributes/create',
  async (attributeData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/food-attributes`, attributeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to register new food attribute.'
      );
    }
  }
);

// 3. Update an Existing Food Attribute
export const updateFoodAttribute = createAsyncThunk(
  'foodAttributes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/food-attributes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update target food attribute node.'
      );
    }
  }
);

// 4. Delete a Food Attribute Node
export const deleteFoodAttribute = createAsyncThunk(
  'foodAttributes/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/food-attributes/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to purge selected food attribute metric.'
      );
    }
  }
);

const initialState = {
  foodAttributes: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const foodAttributeSlice = createSlice({
  name: 'foodAttributes',
  initialState,
  reducers: {
    clearFoodAttributeStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchFoodAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoodAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.foodAttributes = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchFoodAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createFoodAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createFoodAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Food attribute assigned successfully!';
      })
      .addCase(createFoodAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateFoodAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateFoodAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Food attribute details updated.';
      })
      .addCase(updateFoodAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteFoodAttribute.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteFoodAttribute.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.foodAttributes = state.foodAttributes.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Food attribute rule removed successfully.';
      })
      .addCase(deleteFoodAttribute.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFoodAttributeStatus } = foodAttributeSlice.actions;
export default foodAttributeSlice.reducer;