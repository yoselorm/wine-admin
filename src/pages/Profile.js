import React from 'react';
import { useSelector } from 'react-redux';
import { Mail, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Profile = () => {
  const { admin } = useSelector((state) => state.auth);
  const roles = admin?.admin_roles || [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your administrator account details.</p>
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
              <Badge key={role} tone="violet" size="lg">
                <ShieldCheck size={11} className="mr-1" />
                {role.replace(/_/g, ' ')}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-400">No roles assigned.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
