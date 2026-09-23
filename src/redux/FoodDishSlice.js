import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// 1. Fetch Food Dishes List (Handles params: page, per_page, sort_by, sort_order, search)
// Every dish, for the pairing picker, which needs all of them at once.
//
// fetchFoodDishes is paginated and the product form called it with no page size, so the picker
// offered fifteen of seventy-nine dishes — a wine could not be paired with the other sixty-four at
// all, and nothing about the list said so.
export const fetchAllFoodDishes = createAsyncThunk(
  'foodDishes/fetchAllForPicker',
  async (_, { rejectWithValue }) => {
    try {
      const all = [];
      let page = 1;
      let lastPage = 1;

      do {
        const { data } = await api.get(`${api_url}/v1/admin/food-dishes`, { params: { page, per_page: 100 } });
        all.push(...(data?.data || []));
        lastPage = data?.meta?.last_page ?? 1;
        page += 1;
      } while (page <= lastPage && page < 25);

      return all;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dishes.');
    }
  }
);

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

// The upload file field is `image`, not `image_url` — food dishes don't accept a URL string at
// all, so a plain string (an existing image, unchanged) is dropped rather than resent; omitting
// the field is what keeps the existing image on an update.
const withDishImageField = (dishData) => {
  const { image_url, ...rest } = dishData;
  return image_url instanceof File ? { ...rest, image: image_url } : rest;
};

// 2. Create a New Food Dish
// Payload schema structure match: { name, description, origin, image_url }
export const createFoodDish = createAsyncThunk(
  'foodDishes/create',
  async (dishData, { rejectWithValue }) => {
    try {
      const hasFile = dishData.image_url instanceof File;
      const payload = hasFile ? prepareFormData(withDishImageField(dishData)) : withDishImageField(dishData);
      const response = await api.post(`${api_url}/v1/admin/food-dishes`, payload, {
        headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
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
      const hasFile = data.image_url instanceof File;
      let response;
      if (hasFile) {
        // PHP never populates uploaded files on PUT/PATCH bodies, so multipart updates must go
        // over POST with Laravel's _method spoof field to still hit the PUT route/controller.
        const payload = prepareFormData(withDishImageField(data));
        payload.append('_method', 'PUT');
        response = await api.post(`${api_url}/v1/admin/food-dishes/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/food-dishes/${id}`, withDishImageField(data));
      }
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
  allFoodDishes: [],
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
      .addCase(fetchAllFoodDishes.fulfilled, (state, action) => { state.allFoodDishes = action.payload || []; })
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