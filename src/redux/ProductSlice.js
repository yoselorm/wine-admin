import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api'; 
import { api_url } from '../utils/config';

// Helper to prepare multi-part form payloads when product images include raw file uploads.
// Laravel expects nested arrays/objects as bracketed keys (images[0][image], images[0][alt_text], ...),
// so plain values, arrays and objects are recursively flattened into that convention.
const appendToFormData = (formData, key, value) => {
  if (value === null || value === undefined) return;
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendToFormData(formData, `${key}[${index}]`, item));
    return;
  }
  if (typeof value === 'object') {
    Object.keys(value).forEach((nestedKey) => appendToFormData(formData, `${key}[${nestedKey}]`, value[nestedKey]));
    return;
  }
  if (value === '') return;
  formData.append(key, value);
};

const prepareFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => appendToFormData(formData, key, data[key]));
  return formData;
};

// True only when at least one image entry carries a raw File to upload — that's the one case
// that needs multipart; everything else (including keeping/reordering existing image_url entries)
// can go over plain JSON.
const hasImageUpload = (productData) =>
  Array.isArray(productData.images) && productData.images.some((img) => img?.image instanceof File);

// 0. Draft a wine card with AI (writes nothing — the draft is reviewed and saved via the update/create endpoints)
export const draftWineCard = createAsyncThunk(
  'products/draftWineCard',
  async (draftInput, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/wine-cards/draft`, draftInput);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        return rejectWithValue('Too many draft requests — please wait a minute and try again.');
      }
      if (err.response?.status === 403) {
        return rejectWithValue("You don't have permission to draft wine cards.");
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to draft wine card.');
    }
  }
);

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
      const hasFile = hasImageUpload(productData);
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
      const hasFile = hasImageUpload(productData);
      let response;

      if (hasFile) {
        // PHP never populates uploaded files on PUT/PATCH bodies, so multipart updates must go
        // over POST with Laravel's _method spoof field to still hit the PATCH route/controller.
        const payload = prepareFormData(productData);
        payload.append('_method', 'PATCH');
        response = await api.post(`${api_url}/v1/admin/products/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.patch(`${api_url}/v1/admin/products/${id}`, productData);
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

// 6. Preview Product (GET) - Shows exactly what the public product page returns, published or not.
// Only works on a saved product, so the flow is save (unpublished) -> preview -> publish.
export const previewProduct = createAsyncThunk(
  'products/previewProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/products/${id}/preview`);
      return response.data; // { message: "Preview only..." | "Live on the storefront.", data: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load product preview');
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
    draftLoading: false,
    draftError: null,
    error: null,
    successMessage: null,
    previewData: null,
    previewMessage: null,
    previewLoading: false,
    previewError: null,
  },
  reducers: {
    clearProductStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearDraftError: (state) => {
      state.draftError = null;
    },
    clearPreview: (state) => {
      state.previewData = null;
      state.previewMessage = null;
      state.previewError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* Wine Card AI Draft */
      .addCase(draftWineCard.pending, (state) => {
        state.draftLoading = true;
        state.draftError = null;
      })
      .addCase(draftWineCard.fulfilled, (state) => {
        state.draftLoading = false;
      })
      .addCase(draftWineCard.rejected, (state, action) => {
        state.draftLoading = false;
        state.draftError = action.payload;
      })

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
      })

      /* Preview Cases */
      .addCase(previewProduct.pending, (state) => {
        state.previewLoading = true;
        state.previewError = null;
      })
      .addCase(previewProduct.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.previewData = action.payload?.data || null;
        state.previewMessage = action.payload?.message || null;
      })
      .addCase(previewProduct.rejected, (state, action) => {
        state.previewLoading = false;
        state.previewError = action.payload;
      });
  },
});

export const { clearProductStatus, clearCurrentProduct, clearDraftError, clearPreview } = productSlice.actions;
export default productSlice.reducer;