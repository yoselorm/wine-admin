import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api';
import { api_url } from '../utils/config';

// 1. List admins — filters: search, role, status, per_page
export const fetchAdmins = createAsyncThunk(
  'admins/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/admins`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admins.');
    }
  }
);

// 2. Create admin directly
export const createAdmin = createAsyncThunk(
  'admins/create',
  async (adminData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/admins`, adminData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create admin.');
    }
  }
);

// 3. Invite admin (sends invite email)
export const inviteAdmin = createAsyncThunk(
  'admins/invite',
  async (inviteData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/admins/invite`, inviteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send invite.');
    }
  }
);

// 4. Update admin (roles synced via array of role names)
export const updateAdmin = createAsyncThunk(
  'admins/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${api_url}/v1/admin/admins/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update admin.');
    }
  }
);

// 5. Deactivate admin
export const deactivateAdmin = createAsyncThunk(
  'admins/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/admins/${id}/deactivate`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate admin.');
    }
  }
);

// 6. Reactivate admin
export const reactivateAdmin = createAsyncThunk(
  'admins/reactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/v1/admin/admins/${id}/reactivate`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reactivate admin.');
    }
  }
);

// 7. Delete admin
export const deleteAdmin = createAsyncThunk(
  'admins/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${api_url}/v1/admin/admins/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete admin.');
    }
  }
);

// 8. Roles catalog
export const fetchRoles = createAsyncThunk(
  'admins/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/roles`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles.');
    }
  }
);

// 9. Permissions catalog
export const fetchPermissions = createAsyncThunk(
  'admins/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/v1/admin/permissions`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions.');
    }
  }
);

const initialState = {
  admins: [],
  pagination: null,
  roles: [],
  permissions: [],
  loading: false,
  rolesLoading: false,
  mutationLoading: false,
  error: null,
  successMessage: null,
};

const adminSlice = createSlice({
  name: 'admins',
  initialState,
  reducers: {
    clearAdminStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = action.payload.data?.data || [];
        state.pagination = action.payload.data?.meta || null;
      })
      .addCase(fetchAdmins.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Admin created successfully.';
        if (action.payload?.data) state.admins.unshift(action.payload.data);
      })
      .addCase(createAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(inviteAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(inviteAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Invitation sent successfully.';
        if (action.payload?.data) state.admins.unshift(action.payload.data);
      })
      .addCase(inviteAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(updateAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Admin updated successfully.';
        const updated = action.payload?.data;
        if (updated) state.admins = state.admins.map((a) => (a.id === updated.id ? updated : a));
      })
      .addCase(updateAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deactivateAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deactivateAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Admin deactivated.';
        const updated = action.payload?.data;
        state.admins = state.admins.map((a) => (a.id === action.payload.id ? (updated || { ...a, status: 'inactive' }) : a));
      })
      .addCase(deactivateAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(reactivateAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(reactivateAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = action.payload.message || 'Admin reactivated.';
        const updated = action.payload?.data;
        state.admins = state.admins.map((a) => (a.id === action.payload.id ? (updated || { ...a, status: 'active' }) : a));
      })
      .addCase(reactivateAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(deleteAdmin.pending, (state) => { state.mutationLoading = true; state.error = null; })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.successMessage = 'Admin removed successfully.';
        state.admins = state.admins.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAdmin.rejected, (state, action) => { state.mutationLoading = false; state.error = action.payload; })

      .addCase(fetchRoles.pending, (state) => { state.rolesLoading = true; })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.roles = action.payload.data || action.payload || [];
      })
      .addCase(fetchRoles.rejected, (state, action) => { state.rolesLoading = false; state.error = action.payload; })

      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload.data || action.payload || [];
      });
  },
});

export const { clearAdminStatus } = adminSlice.actions;
export default adminSlice.reducer;
