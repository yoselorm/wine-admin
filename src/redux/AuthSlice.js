import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/Api'; 
import { api_url } from '../utils/config';

const getInitialData = () => {
  const data = localStorage.getItem('admin_data');
  return data ? JSON.parse(data) : null;
};

const initialData = getInitialData();


// 1. Admin Login
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/admin/login`, credentials);
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

// 2. Admin Register
export const registerAdmin = createAsyncThunk(
  'auth/registerAdmin',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/admin/register`, userData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

// 3. Forgot Password (Send Reset Link)
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/admin/forgot-password`, { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send reset link');
    }
  }
);

// 4. Reset Password (The actual change)
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/admin/reset-password`, resetData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Password reset failed');
    }
  }
);

// 5. Send Email Verification Notification
export const sendVerificationEmail = createAsyncThunk(
  'auth/sendVerificationEmail',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(`${api_url}/admin/email/verification-notification`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send verification link');
    }
  }
);

// 6. Verify Email Link (GET request)
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ id, hash }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${api_url}/admin/verify-email/${id}/${hash}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Email verification failed');
    }
  }
);

// 7. Admin Logout
export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async (_, { rejectWithValue }) => {
    try {
      await api.post(`${api_url}/admin/logout`);
      localStorage.removeItem('admin_data');
      return true;
    } catch (err) {
      localStorage.removeItem('admin_data'); 
      return rejectWithValue('Logout error');
    }
  }
);



const authSlice = createSlice({
  name: 'auth',
  initialState: {
    admin: initialData || null,
    token: initialData?.token || null,
    isAuthenticated: !!initialData?.token,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearStatus: (state) => {
      state.error = null;
      state.message = null;
    },
    forceLogout: (state) => {
      localStorage.removeItem('admin_data');
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('admin_data', JSON.stringify(action.payload));
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(registerAdmin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Registration successful";
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(forgotPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || "Reset link sent successfully";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(sendVerificationEmail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendVerificationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || "Verification link sent to email";
      })
      .addCase(sendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyEmail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || "Email verified successfully";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(logoutAdmin.pending, (state) => { state.loading = true; })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.message = null;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.loading = false;
        state.admin = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearStatus, forceLogout } = authSlice.actions;
export default authSlice.reducer;