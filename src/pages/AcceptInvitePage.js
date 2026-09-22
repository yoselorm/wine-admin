import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wine, Loader2, AlertCircle } from 'lucide-react';
import { acceptInvite, fetchInvite, clearStatus } from '../redux/AuthSlice';
import InputField from '../components/InputField';
import toast from '../components/Toast';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, invite, inviteLoading, inviteError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ password: '', password_confirmation: '' });

  // The invitation carries the email, so the link no longer has to — and a dead one is caught here
  // rather than after a password has been chosen.
  useEffect(() => {
    if (token) dispatch(fetchInvite(token));
  }, [token, dispatch]);

  const email = invite?.email || searchParams.get('email') || '';
  const roles = invite?.roles || [];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('This invite link is missing its token.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      dispatch(clearStatus());
      await dispatch(acceptInvite({ token, ...formData })).unwrap();
      toast.success('Welcome to Wine2U! Your account is ready.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'This invite link is invalid or has expired.');
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
              Set your password
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {email
                ? <>Finish setting up <span className="font-medium text-gray-700">{email}</span> to join the admin panel.</>
                : 'Finish setting up your account to join the admin panel.'}
            </p>
            {roles.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                You have been invited as{' '}
                <span className="font-medium text-gray-700">
                  {roles.map((r) => r.replace(/_/g, ' ')).join(', ')}
                </span>.
              </p>
            )}
          </div>

          {inviteLoading && (
            <p className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Loader2 size={14} className="animate-spin" /> Checking this invitation…
            </p>
          )}

          {inviteError && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-md bg-red-50 border border-red-100">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">{inviteError}</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Invitations expire. Ask whoever invited you to send another.
                </p>
              </div>
            </div>
          )}

          {!inviteError && (
          <form onSubmit={handleSubmit} className="space-y-1">
            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <InputField
              label="Confirm Password"
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="••••••••"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Setting up account...</span>
                </div>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>
          )}
        </div>
      </div>

      <div className="hidden md:flex md:col-span-7 flex-col justify-between p-12 relative overflow-hidden bg-violet-600">
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Internal Portal</span>
        </div>
        <div className="max-w-xl z-10 my-auto space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            You&apos;ve been invited to join the team.
          </h2>
          <p className="text-violet-100 text-base max-w-md font-light leading-relaxed">
            Set a password to activate your account and start managing the Wine2U catalog.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
