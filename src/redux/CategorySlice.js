import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api'; 
import { api_url } from '../utils/config';

// Helper function to handle potential multipart/form-data for image uploads
const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// 1. Fetch All Categories (GET) with Query Params
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const url = `${api_url}/v1/admin/categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// 2. Get Specific Category Detail (GET)
export const fetchCategoryById = createAsyncThunk(
  'categories/fetchCategoryById',
  async (categoryParam, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/categories/${categoryParam}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch category details');
    }
  }
);

// 3. Create Category (POST) - Handles both JSON & Multipart Image Uploads
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const hasFile = categoryData.image_url instanceof File;
      const payload = hasFile ? prepareFormData(categoryData) : categoryData;
      
      const response = await api.post(`${api_url}/v1/admin/categories`, payload, {
        headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create category');
    }
  }
);

// 4. Update Category (PUT/POST simulation for multipart edits)
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const hasFile = categoryData.image_url instanceof File;
      let response;
      
      if (hasFile) {
        const payload = prepareFormData(categoryData);
        response = await api.post(`${api_url}/v1/admin/categories/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/categories/${id}`, categoryData);
      }
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update category');
    }
  }
);

// 5. Delete Category (DELETE)
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (categoryParam, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/categories/${categoryParam}`);
      return categoryParam;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete category');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    categories: [],
    currentCategory: null,
    loading: false,
    mutationLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearCategoryStatus: (state) => {
      state.error = null;
      state.message = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload?.data || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch Individual
      .addCase(fetchCategoryById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Create
      .addCase(createCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories.unshift(action.payload);
        state.message = "Category created successfully";
      })
      .addCase(createCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      // Update
      .addCase(updateCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories = state.categories.map((c) => c.id === action.payload.id ? action.payload : c);
        if (state.currentCategory?.id === action.payload.id) state.currentCategory = action.payload;
        state.message = "Category updated successfully";
      })
      .addCase(updateCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      // Delete
      .addCase(deleteCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories = state.categories.filter((c) => c.id !== action.payload);
        state.message = "Category deleted successfully";
      })
      .addCase(deleteCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearCategoryStatus, clearCurrentCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;