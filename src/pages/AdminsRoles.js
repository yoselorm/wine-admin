import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProposalNotice from '../components/ui/ProposalNotice';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';
import { AREAS, ROLES, roleLabel, permissionLevel, getAdmins, addAdmin, updateAdminRole, removeAdmin } from '../data/mockAdmins';
import { useSelector } from 'react-redux';

const emptyForm = { firstName: '', lastName: '', email: '', role: 'analytics_viewer' };

const levelBadge = (level) => {
  if (level === 'manage') return <Badge tone="green">Manage</Badge>;
  if (level === 'view') return <Badge tone="yellow">Read-only</Badge>;
  return <Badge tone="neutral">No access</Badge>;
};

const AdminsRoles = () => {
  const { admin: currentAdmin } = useSelector((s) => s.auth);
  const [admins, setAdmins] = useState(getAdmins());
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [previewRole, setPreviewRole] = useState('catalog_manager');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const superAdminCount = admins.filter((a) => a.role === 'super_admin').length;

  const handleRoleChange = (admin, newRole) => {
    if (admin.role === 'super_admin' && newRole !== 'super_admin' && superAdminCount <= 1) {
      toast.error('At least one Super Admin must remain.');
      return;
    }
    setAdmins(updateAdminRole(admin.id, newRole));
  };

  const handleRemove = (admin) => {
    if (admin.role === 'super_admin' && superAdminCount <= 1) {
      toast.error('At least one Super Admin must remain.');
      return;
    }
    setDeleteTarget(admin);
  };

  const executeRemove = () => {
    if (deleteTarget) {
      setAdmins(removeAdmin(deleteTarget.id));
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} removed.`);
      setDeleteTarget(null);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    else if (admins.some((a) => a.email.toLowerCase() === form.email.toLowerCase())) next.email = 'Already in use.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setAdmins(addAdmin(form));
    toast.success(`Invitation sent to ${form.email}.`);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admins &amp; Roles</h1>
        <p className="text-sm text-gray-500 mt-1">Who can sign in to this panel and what each role can touch, per the RBAC specification.</p>
      </div>

      <ProposalNotice>
        The API only has admin registration today — the management endpoints this screen needs are specified in the backend report.
      </ProposalNotice>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADMINS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Admins</h3>
          <div className="divide-y divide-gray-100">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-xs text-violet-700 uppercase flex-shrink-0">
                    {a.firstName[0]}{a.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {a.firstName} {a.lastName} {a.id === currentAdmin?.id && <span className="text-gray-400 font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={a.role}
                    onChange={(e) => handleRoleChange(a, e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button onClick={() => handleRemove(a)} className="text-gray-300 hover:text-red-500 text-lg leading-none px-1">×</button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleInvite} className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invite Admin</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input placeholder="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input type="email" placeholder="email@wine2u.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full justify-center">Send Invite</Button>
            <p className="text-xs text-gray-400">They set their own password from the invite email.</p>
          </form>
        </div>

        {/* ROLE PERMISSIONS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Role Permissions</h3>
          <select
            value={previewRole}
            onChange={(e) => setPreviewRole(e.target.value)}
            className="w-full px-3 py-2 mb-3 border border-gray-200 rounded-md bg-white text-sm font-medium focus:outline-none focus:border-violet-500"
          >
            {ROLES.filter((r) => r.value !== 'super_admin').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="divide-y divide-gray-100">
            {AREAS.map((area) => (
              <div key={area} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 flex items-center gap-1.5">
                  {area === 'Admins & Roles' && <ShieldCheck size={13} className="text-gray-400" />}
                  {area}
                </span>
                {levelBadge(permissionLevel(previewRole, area))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeRemove}
        title="Remove Admin"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}'s access to this panel?`}
      />
    </div>
  );
};

export default AdminsRoles;
