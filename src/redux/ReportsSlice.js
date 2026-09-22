import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// One report over one period, assembled from the analytics endpoints.
//
// They all take the same `from`/`to` now, so a single range can be asked of every one of them at
// once and the answers line up. That is the whole reason this page can exist: before, only revenue
// read a range, and it applied it to a third of its own query.
//
// Deliberately not the sales_reports resource, which is a table of figures an admin types in by
// hand. That is bookkeeping — a record of what was reported. This is what the orders actually say.

export const fetchReport = createAsyncThunk(
  'reports/fetch',
  async ({ from, to }, { rejectWithValue }) => {
    const params = { from, to };
    const get = (path, extra) =>
      api.get(`${api_url}/v1/admin/${path}`, { params: { ...params, ...extra } })
        .then((r) => r.data?.data ?? r.data)
        .catch(() => null);

    try {
      const [revenue, topProducts, customers, coupons, locations, wallet] = await Promise.all([
        get('analytics/revenue', { period: 'daily' }),
        get('analytics/top-products', { limit: 8 }),
        get('analytics/customers'),
        get('analytics/coupons'),
        get('analytics/locations'),
        get('analytics/wallet'),
      ]);
      return { revenue, topProducts, customers, coupons, locations, wallet, from, to };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Could not build the report.');
    }
  }
);

const initialState = {
  revenue: null, topProducts: null, customers: null, coupons: null, locations: null, wallet: null,
  from: null, to: null, loading: false, error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReport.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReport.fulfilled, (state, action) => {
        Object.assign(state, action.payload, { loading: false });
      })
      .addCase(fetchReport.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default reportsSlice.reducer;
