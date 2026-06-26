import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, clearStatus } from '../redux/AuthSlice';
import InputField from '../components/InputField';
import toast from '../components/Toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

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
    const response = await dispatch(loginAdmin(formData)).unwrap();
    toast.success('Login successful! Welcome back.'); 

  } catch (err) {
    console.log('Login error:', err);
    toast.error('Login failed. Please check your credentials.');
  }
};

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-zinc-50 font-sans selection:bg-[#c4945c] selection:text-white">
      
      <div className="md:col-span-5 flex items-center justify-center p-8 bg-white border-r border-zinc-100">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <span className="text-2xl">🍷</span>
            <h1 className="text-2xl font-serif font-bold text-zinc-900 tracking-tight mt-2">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
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
              placeholder="admin@vintnershop.com"
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
                className="text-xs font-semibold text-[#c4945c] hover:text-[#b0824b] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2c4236' }} 
              className="w-full py-3 px-4 text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-95 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

      <div 
        className="hidden md:flex md:col-span-7 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#2c4236' }} // Primary Forest Green
      >
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c4945c]">
            Internal Portal
          </span>
        </div>

        <div className="max-w-xl z-10 my-auto space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif text-white leading-tight font-medium">
            Curating global vintages with precise digital controls.
          </h2>
          <p className="text-zinc-300 text-base max-w-md font-light leading-relaxed">
            Manage your fine wine portfolio, monitor order logistics, and update storefront allocations in real-time.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between border-t border-emerald-900/40 pt-4">
          <p className="text-xs text-emerald-200/50">
            &copy; {new Date().getFullYear()} Wine Digital Ecommerce.
          </p>
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-900/30 text-emerald-300 font-mono">
            v1.0.0
          </span>
        </div>
      </div>

    </div>
  );
};

export default Login;