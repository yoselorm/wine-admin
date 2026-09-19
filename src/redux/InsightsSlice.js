import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

const base = `${api_url}/v1/admin/insights`;

// 4a. Headline counts, top 5 per dimension
export const fetchCatalogueInsights = createAsyncThunk(
  'insights/fetchCatalogue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/catalogue`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load catalogue insights.');
    }
  }
);

// One dimension in full — an unknown dimension is a 404 listing the valid ones.
export const fetchFacet = createAsyncThunk(
  'insights/fetchFacet',
  async (dimension, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/facet/${dimension}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || `Failed to load the "${dimension}" facet.`);
    }
  }
);

// The drill-through — same filters as the public catalogue, sent verbatim from a facet value's
// `filter` object. Never build this query by hand.
export const fetchInsightWines = createAsyncThunk(
  'insights/fetchWines',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/wines`, { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load matching wines.');
    }
  }
);

// 4b. Pairings, all three views
export const fetchPairingsMatrix = createAsyncThunk(
  'insights/fetchPairingsMatrix',
  async (local, { rejectWithValue }) => {
    try {
      const params = local === undefined || local === '' ? {} : { local };
      const response = await api.get(`${base}/pairings/matrix`, { params });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load the pairings matrix.');
    }
  }
);

export const fetchWinePairings = createAsyncThunk(
  'insights/fetchWinePairings',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/pairings/wine/${productId}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load pairings for that wine.');
    }
  }
);

export const fetchDishPairings = createAsyncThunk(
  'insights/fetchDishPairings',
  async (dishId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/pairings/dish/${dishId}`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load pairings for that dish.');
    }
  }
);

// 4c. Quiz coverage + simulator
export const fetchCoverage = createAsyncThunk(
  'insights/fetchCoverage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/coverage`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load quiz coverage.');
    }
  }
);

export const simulateCoverage = createAsyncThunk(
  'insights/simulateCoverage',
  async (quiz_answers, { rejectWithValue }) => {
    try {
      const response = await api.post(`${base}/coverage/simulate`, { quiz_answers });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to run the simulation.');
    }
  }
);

// 4d. Data health checks
export const fetchGaps = createAsyncThunk(
  'insights/fetchGaps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/gaps`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load data health checks.');
    }
  }
);

// 4e. Demand against supply
export const fetchDemand = createAsyncThunk(
  'insights/fetchDemand',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base}/demand`);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load demand data.');
    }
  }
);

const emptyResource = { data: null, loading: false, error: null };

// Every one of these ten endpoints follows the same {data, loading, error} shape, so wire the
// pending/fulfilled/rejected cases generically instead of writing thirty near-identical blocks.
const addResourceCase = (builder, thunk, key, transform = (payload) => payload) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[key].loading = true;
      state[key].error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[key].loading = false;
      Object.assign(state[key], transform(action.payload, state));
    })
    .addCase(thunk.rejected, (state, action) => {
      state[key].loading = false;
      state[key].error = action.payload;
    });
};

const insightsSlice = createSlice({
  name: 'insights',
  initialState: {
    catalogue: { ...emptyResource },
    facet: { ...emptyResource, dimension: null },
    wines: { items: [], meta: null, loading: false, error: null },
    pairingsMatrix: { ...emptyResource },
    winePairings: { ...emptyResource },
    dishPairings: { ...emptyResource },
    coverage: { ...emptyResource },
    simulation: { ...emptyResource },
    gaps: { ...emptyResource },
    demand: { ...emptyResource },
  },
  reducers: {
    clearInsightWines: (state) => {
      state.wines = { items: [], meta: null, loading: false, error: null };
    },
    clearSimulation: (state) => {
      state.simulation = { ...emptyResource };
    },
  },
  extraReducers: (builder) => {
    addResourceCase(builder, fetchCatalogueInsights, 'catalogue', (data) => ({ data }));
    addResourceCase(builder, fetchFacet, 'facet', (data, state) => ({ data, dimension: data?.dimension ?? state.facet.dimension }));
    addResourceCase(builder, fetchPairingsMatrix, 'pairingsMatrix', (data) => ({ data }));
    addResourceCase(builder, fetchWinePairings, 'winePairings', (data) => ({ data }));
    addResourceCase(builder, fetchDishPairings, 'dishPairings', (data) => ({ data }));
    addResourceCase(builder, fetchCoverage, 'coverage', (data) => ({ data }));
    addResourceCase(builder, simulateCoverage, 'simulation', (data) => ({ data }));
    addResourceCase(builder, fetchGaps, 'gaps', (data) => ({ data }));
    addResourceCase(builder, fetchDemand, 'demand', (data) => ({ data }));

    builder
      .addCase(fetchInsightWines.pending, (state) => {
        state.wines.loading = true;
        state.wines.error = null;
      })
      .addCase(fetchInsightWines.fulfilled, (state, action) => {
        state.wines.loading = false;
        state.wines.items = action.payload?.data || [];
        state.wines.meta = action.payload?.meta || null;
      })
      .addCase(fetchInsightWines.rejected, (state, action) => {
        state.wines.loading = false;
        state.wines.error = action.payload;
      });
  },
});

export const { clearInsightWines, clearSimulation } = insightsSlice.actions;
export default insightsSlice.reducer;
