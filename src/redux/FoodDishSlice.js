import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Food Dishes List (Handles params: page, per_page, sort_by, sort_order, search)
export const fetchFoodDishes = createAsyncThunk(
  'foodDishes/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Query parameters mapped exactly from the GET request block in Screenshot 2026-06-26 at 11.25.26.png
      const response = await api.get(`${api_url}/v1/admin/food-dishes`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve food dishes catalog.'
      );
    }
  }
);

// 2. Create a New Food Dish
// Payload schema structure match: { name, description, origin, image_url }
export const createFoodDish = createAsyncThunk(
  'foodDishes/create',
  async (dishData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/food-dishes`, dishData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save the new food dish entry.'
      );
    }
  }
);

// 3. Update an Existing Food Dish
export const updateFoodDish = createAsyncThunk(
  'foodDishes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/food-dishes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update selected food dish recipe.'
      );
    }
  }
);

// 4. Delete a Food Dish Record
export const deleteFoodDish = createAsyncThunk(
  'foodDishes/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/food-dishes/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove selected food dish entry.'
      );
    }
  }
);

const initialState = {
  foodDishes: [],
  pagination: null,
  loading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const foodDishSlice = createSlice({
  name: 'foodDishes',
  initialState,
  reducers: {
    clearFoodDishStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch List ---
      .addCase(fetchFoodDishes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoodDishes.fulfilled, (state, action) => {
        state.loading = false;
        state.foodDishes = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchFoodDishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createFoodDish.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createFoodDish.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Food dish item registered successfully!';
      })
      .addCase(createFoodDish.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateFoodDish.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateFoodDish.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Food dish composition parameters updated.';
      })
      .addCase(updateFoodDish.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteFoodDish.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteFoodDish.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.foodDishes = state.foodDishes.filter(item => item.id !== action.payload.id);
        state.successMessage = action.payload.message || 'Food dish omitted from catalog successfully.';
      })
      .addCase(deleteFoodDish.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFoodDishStatus } = foodDishSlice.actions;
export default foodDishSlice.reducer;