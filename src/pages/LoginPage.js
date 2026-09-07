import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Wine } from 'lucide-react';
import { loginAdmin, clearStatus } from '../redux/AuthSlice';
import InputField from '../components/InputField';
import toast from '../components/Toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginAdmin(formData)).unwrap();
      toast.success('Login successful! Welcome back.');
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-gray-50 font-sans selection:bg-violet-200 selection:text-violet-900">

      <div className="md:col-span-5 flex items-center justify-center p-8 bg-white border-r border-gray-100">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white">
              <Wine size={18} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Please enter your administration credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1">
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@wine2u.com"
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-end pb-5">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg shadow-sm active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden md:flex md:col-span-7 flex-col justify-between p-12 relative overflow-hidden bg-violet-600">
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-200">
            Internal Portal
          </span>
        </div>

        <div className="max-w-xl z-10 my-auto space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Curating global vintages with precise digital controls.
          </h2>
          <p className="text-violet-100 text-base max-w-md font-light leading-relaxed">
            Manage your fine wine portfolio, monitor order logistics, and update storefront allocations in real-time.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between border-t border-violet-400/40 pt-4">
          <p className="text-xs text-violet-200/70">
            &copy; {new Date().getFullYear()} Wine2U.
          </p>
          <span className="text-xs px-2.5 py-1 rounded bg-violet-500/40 text-violet-100 font-mono">
            v1.0.0
          </span>
        </div>
      </div>

    </div>
  );
};

export default Login;
