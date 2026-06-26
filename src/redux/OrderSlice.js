import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. Fetch Orders List (Handles query parameters: limit, status)
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Maps query parameters from Screenshot 2026-06-26 at 10.26.01.png
      const response = await api.get(`${api_url}/v1/admin/orders`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch administrative orders.'
      );
    }
  }
);

// 2. Fetch Single Order Details (Expects a ULID path parameter)
export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve order details.'
      );
    }
  }
);

// 3. Update Order Status (Expects a ULID path parameter and request body layout: { status })
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/orders/${orderId}`, { status });
      return { orderId, status, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update target order status.'
      );
    }
  }
);

const initialState = {
  orders: [],
  selectedOrder: null,
  pagination: null,
  loading: false,
  detailsLoading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Orders List ---
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data || action.payload.items || [];
        state.pagination = action.payload.meta || action.payload.pagination || null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Order Details ---
      .addCase(fetchOrderDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedOrder = action.payload.data || action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })

      // --- Update Order Status ---
      .addCase(updateOrderStatus.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.mutationLoading = false;
        
        // Optimistically update status inline within the local inventory arrays if matching
        state.orders = state.orders.map(order => 
          order.id === action.payload.orderId 
            ? { ...order, status: action.payload.status } 
            : order
        );

        if (state.selectedOrder && state.selectedOrder.id === action.payload.orderId) {
          state.selectedOrder.status = action.payload.status;
        }

        state.successMessage = action.payload.data?.message || 'Order status updated successfully!';
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderStatus, clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;