import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ShieldCheck, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import toast from '../components/Toast';
import { fetchProfile, updateProfile, updateOwnPassword, clearStatus } from '../redux/AuthSlice';

const roleName = (r) => (typeof r === 'string' ? r : r?.name);

const Profile = () => {
  const dispatch = useDispatch();
  const { admin, loading, error, message } = useSelector((state) => state.auth);
  const roles = admin?.roles || admin?.admin_roles || [];

  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (admin) {
      setProfileForm({
        first_name: admin.first_name || '',
        last_name: admin.last_name || '',
        email: admin.email || '',
      });
    }
  }, [admin]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearStatus()); }
    if (message) { toast.success(message); dispatch(clearStatus()); }
  }, [error, message, dispatch]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(profileForm));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('New passwords do not match.');
      return;
    }
    dispatch(updateOwnPassword(passwordForm)).then((res) => {
      if (!res.error) setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    });
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your administrator account details.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center font-bold text-xl text-violet-700 uppercase">
            {admin?.first_name?.[0]}{admin?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{admin?.first_name} {admin?.last_name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <Mail size={13} /> {admin?.email || '—'}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Roles & Permissions">
        <div className="flex flex-wrap gap-2">
          {roles.length > 0 ? (
            roles.map((role) => (
              <Badge key={roleName(role)} tone="violet" size="lg">
                <ShieldCheck size={11} className="mr-1" />
                {roleName(role).replace(/_/g, ' ')}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-400">No roles assigned.</p>
          )}
        </div>
      </Card>

      <form onSubmit={handleProfileSubmit}>
        <Card title="Account Details">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">First Name</label>
              <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Last Name</label>
              <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-1.5" />} Save Changes
            </Button>
          </div>
        </Card>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <Card title="Change Password">
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Current Password</label>
              <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">New Password</label>
                <input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input type="password" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-1.5" />} Update Password
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default Profile;
