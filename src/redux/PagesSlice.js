import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch All Pages
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

// 2. Fetch a Specific Page 
export const fetchPage = createAsyncThunk( // Renamed to fetchPage
  'pages/fetchOne',
  async (pageIdentifier, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/pages/${pageIdentifier}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve page details.'
      );
    }
  }
);

// 3. Create a New Page
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
  // Updated parameters to match what PageModal sends: { pageIdentifier, pageData }
  async ({ pageIdentifier, pageData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/pages/${pageIdentifier}`, pageData);
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
  // Updated parameter name to pageIdentifier
  async (pageIdentifier, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${api_url}/v1/admin/pages/${pageIdentifier}`);
      return { pageIdentifier, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete the page.'
      );
    }
  }
);

// Updated state keys to match UI components
const initialState = {
  data: [],              // Was: pagesList
  currentPage: null,     // Was: currentPageDetails
  meta: null,            // Was: pagination
  loading: false,
  actionLoading: false,  // Was: mutationLoading
  error: null,
  successMessage: null,
};

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    clearErrors: (state) => { // Was: clearPagesStatus
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentPage: (state) => { // Was: clearCurrentPageDetails
      state.currentPage = null;
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
        state.data = action.payload.data || [];
        state.meta = action.payload.meta || null;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Details ---
      .addCase(fetchPage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchPage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentPage = action.payload.data || action.payload;
      })
      .addCase(fetchPage.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createPage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || 'Page created successfully!';
      })
      .addCase(createPage.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updatePage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updatePage.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message || 'Page updated successfully!';
      })
      .addCase(updatePage.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deletePage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deletePage.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Filters against data instead of pagesList
        state.data = state.data.filter(
          page => page.id !== action.payload.pageIdentifier && page.slug !== action.payload.pageIdentifier
        );
        state.successMessage = action.payload.message || 'Page deleted successfully.';
      })
      .addCase(deletePage.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearErrors, clearCurrentPage } = pagesSlice.actions;
export default pagesSlice.reducer;