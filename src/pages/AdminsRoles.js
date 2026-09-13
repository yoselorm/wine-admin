import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShieldCheck, Loader2, Pencil, Power } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import toast from '../components/Toast';
import {
  fetchAdmins,
  inviteAdmin,
  updateAdmin,
  deactivateAdmin,
  reactivateAdmin,
  deleteAdmin,
  fetchRoles,
  fetchPermissions,
  clearAdminStatus,
} from '../redux/AdminSlice';

const emptyForm = { first_name: '', last_name: '', email: '', roles: [] };

const roleName = (r) => (typeof r === 'string' ? r : r?.name);
const permName = (p) => (typeof p === 'string' ? p : p?.name);
const toLabel = (slug) => slug.replace(/^(view|manage)-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AdminsRoles = () => {
  const dispatch = useDispatch();
  const { admin: currentAdmin } = useSelector((s) => s.auth);
  const { admins, roles, permissions, loading, rolesLoading, mutationLoading, error, successMessage } = useSelector((s) => s.admins);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [previewRole, setPreviewRole] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [editingRolesFor, setEditingRolesFor] = useState(null);
  const [editingRoleSelection, setEditingRoleSelection] = useState([]);

  useEffect(() => {
    dispatch(fetchAdmins());
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (!previewRole && roles?.length) {
      const firstNonSuper = roles.find((r) => roleName(r) !== 'super_admin') || roles[0];
      setPreviewRole(roleName(firstNonSuper));
    }
  }, [roles, previewRole]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearAdminStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearAdminStatus());
      setForm(emptyForm);
      setDeleteTarget(null);
      setDeactivateTarget(null);
      setEditingRolesFor(null);
    }
  }, [error, successMessage, dispatch]);

  const superAdminCount = admins.filter((a) => (a.roles || []).map(roleName).includes('super_admin')).length;

  // Derive resource "areas" from the view-x / manage-x permission naming convention
  const areas = useMemo(() => {
    const set = new Set();
    permissions.forEach((p) => set.add(toLabel(permName(p))));
    return Array.from(set).sort();
  }, [permissions]);

  const levelForArea = (roleValue, area) => {
    const role = roles.find((r) => roleName(r) === roleValue);
    if (!role) return 'none';
    if (roleValue === 'super_admin') return 'manage';
    const rolePerms = (role.permissions || []).map(permName);
    const slug = area.toLowerCase().replace(/\s+/g, '-');
    if (rolePerms.includes(`manage-${slug}`)) return 'manage';
    if (rolePerms.includes(`view-${slug}`)) return 'view';
    return 'none';
  };

  const levelBadge = (level) => {
    if (level === 'manage') return <Badge tone="green">Manage</Badge>;
    if (level === 'view') return <Badge tone="yellow">Read-only</Badge>;
    return <Badge tone="neutral">No access</Badge>;
  };

  const validate = () => {
    const next = {};
    if (!form.first_name.trim()) next.first_name = 'Required';
    if (!form.last_name.trim()) next.last_name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.roles.length === 0) next.roles = 'Select at least one role.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(inviteAdmin(form));
  };

  const toggleFormRole = (role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  };

  const openEditRoles = (admin) => {
    setEditingRolesFor(admin);
    setEditingRoleSelection((admin.roles || []).map(roleName));
  };

  const toggleEditRole = (role) => {
    setEditingRoleSelection((sel) => (sel.includes(role) ? sel.filter((r) => r !== role) : [...sel, role]));
  };

  const saveEditingRoles = () => {
    if (editingRoleSelection.length === 0) {
      toast.error('An admin must have at least one role.');
      return;
    }
    if (
      (editingRolesFor.roles || []).map(roleName).includes('super_admin') &&
      !editingRoleSelection.includes('super_admin') &&
      superAdminCount <= 1
    ) {
      toast.error('At least one Super Admin must remain.');
      return;
    }
    dispatch(updateAdmin({ id: editingRolesFor.id, data: { roles: editingRoleSelection } }));
  };

  const handleDeactivateToggle = (admin) => {
    if (admin.status === 'inactive') {
      dispatch(reactivateAdmin(admin.id));
    } else {
      if ((admin.roles || []).map(roleName).includes('super_admin') && superAdminCount <= 1) {
        toast.error('At least one Super Admin must remain.');
        return;
      }
      setDeactivateTarget(admin);
    }
  };

  const handleRemove = (admin) => {
    if ((admin.roles || []).map(roleName).includes('super_admin') && superAdminCount <= 1) {
      toast.error('At least one Super Admin must remain.');
      return;
    }
    setDeleteTarget(admin);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admins &amp; Roles</h1>
        <p className="text-sm text-gray-500 mt-1">Who can sign in to this panel and what each role can touch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADMINS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Admins</h3>
          {loading && admins.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {admins.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-xs text-violet-700 uppercase flex-shrink-0">
                      {a.first_name?.[0]}{a.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        {a.first_name} {a.last_name}
                        {a.id === currentAdmin?.id && <span className="text-gray-400 font-normal">(you)</span>}
                        {a.status === 'inactive' && <Badge tone="neutral" size="sm">Inactive</Badge>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{a.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(a.roles || []).map((r) => (
                          <Badge key={roleName(r)} tone="violet" size="sm">{toLabel(roleName(r))}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openEditRoles(a)} title="Edit roles" className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-md">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeactivateToggle(a)} title={a.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-gray-50 rounded-md">
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleRemove(a)} className="text-gray-300 hover:text-red-500 text-lg leading-none px-1">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleInvite} className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invite Admin</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input placeholder="First name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <input placeholder="Last name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
              </div>
            </div>
            <div>
              <input type="email" placeholder="email@wine2u.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Roles</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <button type="button" key={roleName(r)} onClick={() => toggleFormRole(roleName(r))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.roles.includes(roleName(r)) ? 'bg-white border-violet-500 text-violet-600' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'
                    }`}>
                    {toLabel(roleName(r))}
                  </button>
                ))}
              </div>
              {errors.roles && <p className="text-xs text-red-600 mt-1">{errors.roles}</p>}
            </div>
            <Button type="submit" disabled={mutationLoading} className="w-full justify-center">
              {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />} Send Invite
            </Button>
            <p className="text-xs text-gray-400">They set their own password from the invite email.</p>
          </form>
        </div>

        {/* ROLE PERMISSIONS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Role Permissions</h3>
          {rolesLoading && roles.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
          ) : (
            <>
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value)}
                className="w-full px-3 py-2 mb-3 border border-gray-200 rounded-md bg-white text-sm font-medium focus:outline-none focus:border-violet-500"
              >
                {roles.map((r) => <option key={roleName(r)} value={roleName(r)}>{toLabel(roleName(r))}</option>)}
              </select>
              <div className="divide-y divide-gray-100">
                {areas.map((area) => (
                  <div key={area} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      {area === 'Admins' && <ShieldCheck size={13} className="text-gray-400" />}
                      {area}
                    </span>
                    {levelBadge(levelForArea(previewRole, area))}
                  </div>
                ))}
                {areas.length === 0 && <p className="text-sm text-gray-400 py-4">No permissions catalog available.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* EDIT ROLES MODAL */}
      {editingRolesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/30 backdrop-blur-xs" onClick={() => setEditingRolesFor(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-modal z-10 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-1">Edit Roles</h3>
            <p className="text-sm text-gray-500 mb-4">{editingRolesFor.first_name} {editingRolesFor.last_name}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {roles.map((r) => (
                <button type="button" key={roleName(r)} onClick={() => toggleEditRole(roleName(r))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    editingRoleSelection.includes(roleName(r)) ? 'bg-white border-violet-500 text-violet-600' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'
                  }`}>
                  {toLabel(roleName(r))}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button appearance="secondary" onClick={() => setEditingRolesFor(null)}>Cancel</Button>
              <Button onClick={saveEditingRoles} disabled={mutationLoading}>
                {mutationLoading && <Loader2 size={14} className="animate-spin mr-1.5" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch(deleteAdmin(deleteTarget.id))}
        title="Remove Admin"
        message={`Remove ${deleteTarget?.first_name} ${deleteTarget?.last_name}'s access to this panel? This cannot be undone.`}
      />
      <ConfirmDeleteModal
        isOpen={!!deactivateTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => dispatch(deactivateAdmin(deactivateTarget.id))}
        title="Deactivate Admin"
        message={`${deactivateTarget?.first_name} ${deactivateTarget?.last_name} will no longer be able to sign in until reactivated.`}
      />
    </div>
  );
};

export default AdminsRoles;
