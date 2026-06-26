import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, clearStatus } from '../redux/AuthSlice';
import InputField from '../components/InputField';
import toast from '../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, message } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearStatus());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email)).unwrap()
      .then(() => {
        console.log('Password reset instructions sent successfully.');
        toast.success('Password reset instructions sent successfully. Please check your email.');
      })
      .catch((err) => {
        console.error('Error sending password reset instructions:', err);
        toast.error('Failed to send password reset instructions. Please try again.');
      });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-zinc-50 font-sans selection:bg-[#c4945c] selection:text-white">
      
      {/* LEFT PANEL: Form */}
      <div className="md:col-span-5 flex items-center justify-center p-8 bg-white border-r border-zinc-100">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 tracking-wider uppercase flex items-center gap-1 transition-colors mb-4"
            >
              ← Back to Login
            </button>
            <h1 className="text-2xl font-serif font-bold text-zinc-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Enter your email address and we'll send you a secure link to reset your account credentials.
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vintnershop.com"
            />

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2c4236' }}
              className="w-full py-3 px-4 text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-95 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending instructions...</span>
                </div>
              ) : (
                'Send Password Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Info Graphic */}
      <div 
        className="hidden md:flex md:col-span-7 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#2c4236' }}
      >
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c4945c]">
            Security Protocol
          </span>
        </div>

        <div className="max-w-xl z-10 my-auto space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif text-white leading-tight font-medium">
            Securing access to your premium vault.
          </h2>
          <p className="text-zinc-300 text-base max-w-md font-light leading-relaxed">
            All token resets are encrypted and automatically expire. Please verify your identity safely via your authorized corporate email account.
          </p>
        </div>

        <div className="z-10 pt-4 border-t border-emerald-900/40">
          <p className="text-xs text-emerald-200/50">
            &copy; {new Date().getFullYear()} Wine Digital Ecommerce.
          </p>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;