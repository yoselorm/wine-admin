import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api'; 
import { api_url } from '../utils/config';

// 1. Get Blog Categories (GET) - Supports Server-side Pagination & Search Filters
export const fetchBlogCategories = createAsyncThunk(
  'blogCategories/fetchBlogCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Build query string based on Swagger specifications (page, per_page, search, etc.)
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const url = `${api_url}/v1/admin/blog-categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data; // Keeping full data envelope for pagination handling if needed
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch blog categories');
    }
  }
);

const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// The upload file field is `image`, not `image_url` — blog categories don't accept a URL string
// at all, so a plain string (an existing image, unchanged) is dropped rather than resent;
// omitting the field is what keeps the existing image on an update.
const withBlogCategoryImageField = (categoryData) => {
  const { image_url, ...rest } = categoryData;
  return image_url instanceof File ? { ...rest, image: image_url } : rest;
};

// 2. Create Blog Category (POST)
export const createBlogCategory = createAsyncThunk(
  'blogCategories/createBlogCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const hasFile = categoryData.image_url instanceof File;
      const payload = hasFile ? prepareFormData(withBlogCategoryImageField(categoryData)) : withBlogCategoryImageField(categoryData);
      const response = await api.post(`${api_url}/v1/admin/blog-categories`, payload, {
        headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create blog category');
    }
  }
);

// 3. Update Blog Category (PUT/POST simulation for multipart edits)
export const updateBlogCategory = createAsyncThunk(
  'blogCategories/updateBlogCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const hasFile = categoryData.image_url instanceof File;
      let response;
      if (hasFile) {
        // PHP never populates uploaded files on PUT/PATCH bodies, so multipart updates must go
        // over POST with Laravel's _method spoof field to still hit the PUT route/controller.
        const payload = prepareFormData(withBlogCategoryImageField(categoryData));
        payload.append('_method', 'PUT');
        response = await api.post(`${api_url}/v1/admin/blog-categories/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/blog-categories/${id}`, withBlogCategoryImageField(categoryData));
      }
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update blog category');
    }
  }
);

// 4. Delete Blog Category (DELETE)
export const deleteBlogCategory = createAsyncThunk(
  'blogCategories/deleteBlogCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/blog-categories/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete blog category');
    }
  }
);

const blogCategorySlice = createSlice({
  name: 'blogCategories',
  initialState: {
    categories: [],
    pagination: null, 
    loading: false,
    mutationLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearCategoryStatus: (state) => {
      state.error = null;
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogCategories.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => {
        state.loading = false;
        // Adjust based on your exact pagination envelope structure (e.g., action.payload.data)
        state.categories = action.payload?.data || [];
        state.pagination = action.payload?.meta || null;
      })
      .addCase(fetchBlogCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createBlogCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createBlogCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories.unshift(action.payload);
        state.message = "Blog category created successfully";
      })
      .addCase(createBlogCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateBlogCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateBlogCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories = state.categories.map((cat) => cat.id === action.payload.id ? action.payload : cat);
        state.message = "Blog category updated successfully";
      })
      .addCase(updateBlogCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteBlogCategory.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteBlogCategory.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.categories = state.categories.filter((cat) => cat.id !== action.payload);
        state.message = "Blog category deleted successfully";
      })
      .addCase(deleteBlogCategory.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearCategoryStatus } = blogCategorySlice.actions;
export default blogCategorySlice.reducer;