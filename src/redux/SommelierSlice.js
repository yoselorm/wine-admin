import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Some list endpoints here haven't been exercised against a live backend yet (frontend.md §4.12
// is not deployed), so unwrap defensively: accept either a flat array or a nested {data: [...]}.
const unwrapList = (payload) => {
  const d = payload?.data ?? payload;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

// 1. Chat with the sommelier as a test — throttled 20/min, stored apart from customer chats.
export const testSommelier = createAsyncThunk(
  'sommelier/test',
  async ({ prompt, session_id, as_user_id }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/sommelier/test`, { prompt, session_id, as_user_id });
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        return rejectWithValue('Rate limit hit — please wait a moment before sending another test message.');
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to reach the sommelier.');
    }
  }
);

// 2. List test sessions, newest first
export const fetchSommelierTests = createAsyncThunk(
  'sommelier/fetchTests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/sommelier/tests`, { params });
      return unwrapList(response.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load test sessions.');
    }
  }
);

// 3. Replay one test conversation
export const fetchSommelierTestSession = createAsyncThunk(
  'sommelier/fetchTestSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/sommelier/test/${sessionId}`);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load that conversation.');
    }
  }
);

// 4. Statistics for test chats only (excluded from customer analytics)
export const fetchSommelierTestStats = createAsyncThunk(
  'sommelier/fetchTestStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/sommelier/test-stats`);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load test statistics.');
    }
  }
);

const sommelierSlice = createSlice({
  name: 'sommelier',
  initialState: {
    activeSessionId: null,
    turns: [],           // [{ prompt, response, recommendation_type, recommended_products, diagnostics, created_at }]
    sending: false,
    sendError: null,

    tests: [],
    testsLoading: false,
    testsError: null,

    stats: null,
    statsLoading: false,
    statsError: null,

    replayLoading: false,
    replayError: null,
  },
  reducers: {
    clearSommelierErrors: (state) => {
      state.sendError = null;
      state.testsError = null;
      state.statsError = null;
      state.replayError = null;
    },
    startNewSession: (state, action) => {
      state.activeSessionId = action.payload;
      state.turns = [];
    },
  },
  extraReducers: (builder) => {
    builder
      /* Send test message */
      .addCase(testSommelier.pending, (state) => {
        state.sending = true;
        state.sendError = null;
      })
      .addCase(testSommelier.fulfilled, (state, action) => {
        state.sending = false;
        const data = action.payload || {};
        state.activeSessionId = action.meta.arg.session_id;
        state.turns.push({
          prompt: action.meta.arg.prompt,
          response: data.response,
          recommendation_type: data.recommendation_type,
          recommended_products: data.recommended_products || [],
          diagnostics: data.diagnostics || null,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(testSommelier.rejected, (state, action) => {
        state.sending = false;
        state.sendError = action.payload;
      })

      /* List sessions */
      .addCase(fetchSommelierTests.pending, (state) => {
        state.testsLoading = true;
        state.testsError = null;
      })
      .addCase(fetchSommelierTests.fulfilled, (state, action) => {
        state.testsLoading = false;
        state.tests = action.payload;
      })
      .addCase(fetchSommelierTests.rejected, (state, action) => {
        state.testsLoading = false;
        state.testsError = action.payload;
      })

      /* Replay session */
      .addCase(fetchSommelierTestSession.pending, (state) => {
        state.replayLoading = true;
        state.replayError = null;
      })
      .addCase(fetchSommelierTestSession.fulfilled, (state, action) => {
        state.replayLoading = false;
        const data = action.payload || {};
        state.activeSessionId = data.session_id || state.activeSessionId;
        const rawTurns = Array.isArray(data.turns) ? data.turns : Array.isArray(data) ? data : [];
        state.turns = rawTurns.map((t) => ({
          prompt: t.prompt,
          response: t.response,
          recommendation_type: t.recommendation_type,
          recommended_products: t.recommended_products || [],
          diagnostics: t.diagnostics || null,
          created_at: t.created_at,
        }));
      })
      .addCase(fetchSommelierTestSession.rejected, (state, action) => {
        state.replayLoading = false;
        state.replayError = action.payload;
      })

      /* Stats */
      .addCase(fetchSommelierTestStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchSommelierTestStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSommelierTestStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });
  },
});

export const { clearSommelierErrors, startNewSession } = sommelierSlice.actions;
export default sommelierSlice.reducer;
