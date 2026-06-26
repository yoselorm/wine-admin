import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Active Intelligence Alerts
// Query parameters supported: limit (Default: 10)
export const fetchIntelligenceAlerts = createAsyncThunk(
  'intelligence/fetchAlerts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/intelligence/alerts`, { 
        params: { limit: 10, ...params } 
      });
      return response.data.data; // Structure matches: { data: [...], meta: {...}, message: "" }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve active system intelligence alerts.'
      );
    }
  }
);

// 2. Fetch Market Indicators Catalog
// No additional endpoint query parameters documented
export const fetchMarketIndicators = createAsyncThunk(
  'intelligence/fetchIndicators',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/intelligence/market-indicators`);
      return response.data; // Structure matches: { data: [...], message: "" }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve structural market indicators data matrix.'
      );
    }
  }
);

const initialState = {
  alerts: [],
  indicators: [],
  alertsPagination: null,
  alertsLoading: false,
  indicatorsLoading: false,
  error: null,
};

const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    clearIntelligenceError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Active Intelligence Alerts ---
      .addCase(fetchIntelligenceAlerts.pending, (state) => {
        state.alertsLoading = true;
        state.error = null;
      })
      .addCase(fetchIntelligenceAlerts.fulfilled, (state, action) => {
        state.alertsLoading = false;
        state.alerts = action.payload.data || [];
        state.alertsPagination = action.payload.meta || null;
      })
      .addCase(fetchIntelligenceAlerts.rejected, (state, action) => {
        state.alertsLoading = false;
        state.error = action.payload;
      })

      // --- Fetch Market Indicators ---
      .addCase(fetchMarketIndicators.pending, (state) => {
        state.indicatorsLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketIndicators.fulfilled, (state, action) => {
        state.indicatorsLoading = false;
        state.indicators = action.payload.data || [];
      })
      .addCase(fetchMarketIndicators.rejected, (state, action) => {
        state.indicatorsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearIntelligenceError } = intelligenceSlice.actions;
export default intelligenceSlice.reducer;