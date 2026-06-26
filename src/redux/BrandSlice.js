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

export const fetchBrands = createAsyncThunk(
  'brands/fetchBrands',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const url = `${api_url}/v1/admin/brands${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch brands');
    }
  }
);

// 2. Get Specific Brand Detail (GET)
export const fetchBrandById = createAsyncThunk(
  'brands/fetchBrandById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/brands/${id}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch brand details');
    }
  }
);

// 3. Create Brand (POST) - Handles both JSON & Multipart Logo Uploads
export const createBrand = createAsyncThunk(
  'brands/createBrand',
  async (brandData, { rejectWithValue }) => {
    try {
      const hasFile = brandData.logo_url instanceof File;
      const payload = hasFile ? prepareFormData(brandData) : brandData;
      
      const response = await api.post(`${api_url}/v1/admin/brands`, payload, {
        headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create brand');
    }
  }
);

// 4. Update Brand (PUT/POST simulation for multipart edits)
export const updateBrand = createAsyncThunk(
  'brands/updateBrand',
  async ({ id, brandData }, { rejectWithValue }) => {
    try {
      const hasFile = brandData.logo_url instanceof File;
      
      let response;
      if (hasFile) {
        const payload = prepareFormData(brandData);
        response = await api.post(`${api_url}/v1/admin/brands/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`${api_url}/v1/admin/brands/${id}`, brandData);
      }
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update brand');
    }
  }
);

// 5. Delete Brand (DELETE)
export const deleteBrand = createAsyncThunk(
  'brands/deleteBrand',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/brands/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete brand');
    }
  }
);

const brandSlice = createSlice({
  name: 'brands',
  initialState: {
    brands: [],
    currentBrand: null,
    loading: false,
    mutationLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearBrandStatus: (state) => {
      state.error = null;
      state.message = null;
    },
    clearCurrentBrand: (state) => {
      state.currentBrand = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload?.data || [];
      })
      .addCase(fetchBrands.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchBrandById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBrandById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBrand = action.payload;
      })
      .addCase(fetchBrandById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createBrand.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.brands.unshift(action.payload);
        state.message = "Brand created successfully";
      })
      .addCase(createBrand.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateBrand.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.brands = state.brands.map((b) => b.id === action.payload.id ? action.payload : b);
        if (state.currentBrand?.id === action.payload.id) state.currentBrand = action.payload;
        state.message = "Brand updated successfully";
      })
      .addCase(updateBrand.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteBrand.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.brands = state.brands.filter((b) => b.id !== action.payload);
        state.message = "Brand deleted successfully";
      })
      .addCase(deleteBrand.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; });
  },
});

export const { clearBrandStatus, clearCurrentBrand } = brandSlice.actions;
export default brandSlice.reducer;