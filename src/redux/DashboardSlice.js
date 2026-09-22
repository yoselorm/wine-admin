import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// Everything the dashboard shows, from the analytics endpoints that already exist.
//
// The screen shipped with its figures written into the file — ₵24,580 of revenue, 312 orders,
// customers named Amara Mensah — against a note saying the endpoints were not available yet. They
// are, and have been: revenue, wallet, sommelier, inventory and intelligence all answer today. A
// dashboard that invents its numbers is worse than one that admits it has none, because the first
// gets believed.
//
// Fetched together rather than tile by tile: they are read once on load, and a page that fills in
// over eight separate spinners is harder to read than one that arrives whole.

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    const now = Date.now();
    // Two windows so the change against the previous period is measured rather than asserted.
    const current = { from: iso(now - 29 * DAY), to: iso(now) };
    const previous = { from: iso(now - 59 * DAY), to: iso(now - 30 * DAY) };

    const get = (path, params) =>
      api.get(`${api_url}/v1/admin/${path}`, { params }).then((r) => r.data?.data ?? r.data).catch(() => null);

    try {
      const [revenue, priorRevenue, wallet, priorWallet, sommelier, orders, lowStock, alerts] = await Promise.all([
        get('analytics/revenue', { ...current, period: 'daily' }),
        get('analytics/revenue', { ...previous, period: 'daily' }),
        // No date range: this endpoint does not take one, and passing one would
        // only make the response look period-scoped when it is not.
        get('analytics/wallet'),
        Promise.resolve(null),
        get('analytics/sommelier', current),
        // include=user, or the row has a user_id and no name to show for it. The
        // resource already carries the customer; it is only loaded when asked for.
        get('orders', { per_page: 5, sort_by: 'created_at', sort_order: 'desc', include: 'user' }),
        get('products', { sort_by: 'stock_quantity', sort_order: 'asc', per_page: 8 }),
        get('intelligence/alerts', { per_page: 3 }),
      ]);

      return { revenue, priorRevenue, wallet, priorWallet, sommelier, orders, lowStock, alerts };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Could not load the dashboard.');
    }
  }
);

const initialState = {
  revenue: null,
  priorRevenue: null,
  wallet: null,
  priorWallet: null,
  sommelier: null,
  orders: [],
  lowStock: [],
  alerts: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        const p = action.payload;
        state.loading = false;
        state.revenue = p.revenue;
        state.priorRevenue = p.priorRevenue;
        state.wallet = p.wallet;
        state.priorWallet = p.priorWallet;
        state.sommelier = p.sommelier;
        // Orders and products answer with a paginated envelope; alerts nests one inside `data`.
        state.orders = Array.isArray(p.orders) ? p.orders : p.orders?.data || [];
        state.lowStock = Array.isArray(p.lowStock) ? p.lowStock : p.lowStock?.data || [];
        state.alerts = p.alerts?.data || (Array.isArray(p.alerts) ? p.alerts : []);
      })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default dashboardSlice.reducer;
