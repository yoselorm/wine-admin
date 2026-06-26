import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';


export const fetchPages = createAsyncThunk(
  'pages/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/pages`, { params });
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch the list of pages.'
      );
    }
  }
);

// 2. Fetch a Specific Page by ID/Slug
export const fetchPageDetails = createAsyncThunk(
  'pages/fetchDetails',
  async (pageKey, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/pages/${pageKey}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve page details.'
      );
    }
  }
);

// 3. Create a New Page
// Expected request body fields from Screenshot 2026-06-26 at 12.25.48.png:
// title, slug, content, is_published, meta_keywords, meta_title, meta_description
export const createPage = createAsyncThunk(
  'pages/create',
  async (pageData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/pages`, pageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create the page.'
      );
    }
  }
);

// 4. Update an Existing Page
export const updatePage = createAsyncThunk(
  'pages/update',
  async ({ pageKey, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/pages/${pageKey}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update the page.'
      );
    }
  }
);

// 5. Delete a Page
export const deletePage = createAsyncThunk(
  'pages/delete',
  async (pageKey, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/pages/${pageKey}`);
      return { pageKey, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete the page.'
      );
    }
  }
);

const initialState = {
  pagesList: [],
  currentPageDetails: null,
  pagination: null,
  loading: false,
  detailsLoading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    clearPagesStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentPageDetails: (state) => {
      state.currentPageDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pagesList = action.payload.data || [];
        state.pagination = action.payload.meta || null;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Details ---
      .addCase(fetchPageDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchPageDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentPageDetails = action.payload.data || action.payload;
      })
      .addCase(fetchPageDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createPage.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createPage.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Page created successfully!';
      })
      .addCase(createPage.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updatePage.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updatePage.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Page updated successfully!';
      })
      .addCase(updatePage.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deletePage.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deletePage.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.pagesList = state.pagesList.filter(page => page.id !== action.payload.pageKey && page.slug !== action.payload.pageKey);
        state.successMessage = action.payload.message || 'Page deleted successfully.';
      })
      .addCase(deletePage.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPagesStatus, clearCurrentPageDetails } = pagesSlice.actions;
export default pagesSlice.reducer;