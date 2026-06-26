import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword, clearStatus } from '../redux/AuthSlice';

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, message } = useSelector((state) => state.auth);

  const [values, setValues] = useState({ password: '', passwordConfirmation: '' });
  const [validationError, setValidationError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    dispatch(clearStatus());
    const tokenParam = searchParams.get('token') || '';
    setToken(tokenParam);
  }, [dispatch, searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    if (!values.password || !values.passwordConfirmation) {
      setValidationError('Please enter a new password and confirm it.');
      return;
    }

    if (values.password !== values.passwordConfirmation) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (!token) {
      setValidationError('Password reset token is missing.');
      return;
    }

    dispatch(resetPassword({ token, password: values.password, password_confirmation: values.passwordConfirmation }));
  };

  useEffect(() => {
    if (message && !loading && !error) {
      const timeout = setTimeout(() => navigate('/login', { replace: true }), 1800);
      return () => clearTimeout(timeout);
    }
  }, [message, error, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-semibold text-slate-100">Reset Password</p>
          <p className="mt-3 text-sm text-slate-400">Enter a new password to restore access to your account.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              placeholder="New password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="passwordConfirmation">
              Confirm new password
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              value={values.passwordConfirmation}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
            />
          </div>

          {validationError || error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {validationError || error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-rose-400 hover:to-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Resetting password…' : 'Reset password'}
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-400">
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
