// Confirmed against a real /admin/login response: the admin object carries flat string arrays
// directly — `admin_roles: ["super_admin"]` and `admin_permissions: ["manage-admins", ...]` —
// not the nested `roles: [{ id, name }]` shape the integration doc's example showed.
export const getAdminRoleNames = (admin) => admin?.admin_roles || [];

export const getAdminPermissionNames = (admin) => admin?.admin_permissions || [];

// super_admin always passes; everyone else needs the named permission in their effective set.
export const hasPermission = (admin, permission) => {
  if (!permission) return true;
  if (getAdminRoleNames(admin).includes('super_admin')) return true;
  return getAdminPermissionNames(admin).includes(permission);
};
