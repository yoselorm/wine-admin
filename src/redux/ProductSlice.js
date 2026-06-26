import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api'; 
import { api_url } from '../utils/config';

// Helper to prepare multi-part form payloads if your product creation includes image files/binary drops
const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// 1. Get Products (GET) - Supports all filter parameters from your Swagger documentation
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Pagination & Ordering parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      // Search & Structural filter parameters
      if (params.search) queryParams.append('search', params.search);
      if (params.brand_id) queryParams.append('brand_id', params.brand_id);
      if (params.category_id) queryParams.append('category_id', params.category_id);
      
      // Boolean status filters
      if (params.is_published !== undefined && params.is_published !== '') {
        queryParams.append('is_published', params.is_published);
      }
      if (params.is_featured !== undefined && params.is_featured !== '') {
        queryParams.append('is_featured', params.is_featured);
      }

      const response = await api.get(`${api_url}/v1/admin/products?${queryParams.toString()}`);
      return response.data; // Expected structure: { data: [...], meta: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// 2. Get Specific Product Detail (GET)
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/products/${id}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch product details');
    }
  }
);

// 3. Create Product (POST)
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      // Check if image handles are raw files to switch header contexts
      const hasFile = productData.image_url instanceof File;
      const payload = hasFile ? prepareFormData(productData) : productData;
      
      const response = await api.post(`${api_url}/v1/admin/products`, payload, {
        headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product');
    }
  }
);

// 4. Update Product (PUT / POST multipart simulation)
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const hasFile = productData.image_url instanceof File;
      let response;
      
      if (hasFile) {
        const payload = prepareFormData(productData);
        response = await api.post(`${api_url}/v1/admin/products/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/products/${id}`, productData);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

// 5. Delete Product (DELETE)
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    pagination: null,
    loading: false,
    mutationLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearProductStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      /* Fetch List Cases */
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        state.pagination = action.payload?.meta || null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Fetch Detail Cases */
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Create Cases */
      .addCase(createProduct.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload?.message || 'Product registered successfully.';
        if (action.payload?.data) {
          state.items.unshift(action.payload.data);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      /* Update Cases */
      .addCase(updateProduct.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload?.message || 'Product records committed successfully.';
        const updated = action.payload?.data;
        if (updated) {
          state.items = state.items.map((item) => (item.id === updated.id ? updated : item));
          if (state.currentProduct?.id === updated.id) {
            state.currentProduct = updated;
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      /* Delete Cases */
      .addCase(deleteProduct.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Product dropped from inventory catalog.';
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductStatus, clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;