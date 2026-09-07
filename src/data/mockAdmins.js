// In-memory placeholder store for the Admins & Roles design proposal screen.
// Resets on page reload — swap for real API calls once RBAC endpoints exist.

export const AREAS = [
  'Dashboard', 'Admins & Roles', 'Products', 'Brands', 'Categories', 'Wine Regions',
  'Wine Attributes', 'Food Dishes & Pairings', 'Blogs', 'Blog Categories', 'Pages',
  'Orders', 'Inventory', 'Shipping Zones', 'Shipping Rates', 'Coupons',
  'Sales Reports', 'Intelligence', 'Analytics',
];

export const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'catalog_manager', label: 'Catalog Manager' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'order_manager', label: 'Order Manager' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'shipping_manager', label: 'Shipping Manager' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'analytics_viewer', label: 'Analytics Viewer' },
];

const ROLE_PERMISSIONS = {
  super_admin: { manage: 'all', view: [] },
  catalog_manager: {
    manage: ['Products', 'Brands', 'Categories', 'Wine Regions', 'Wine Attributes', 'Food Dishes & Pairings'],
    view: ['Dashboard'],
  },
  content_manager: {
    manage: ['Blogs', 'Blog Categories', 'Pages'],
    view: ['Dashboard'],
  },
  order_manager: {
    manage: ['Orders', 'Shipping Zones', 'Shipping Rates'],
    view: ['Dashboard', 'Inventory'],
  },
  inventory_manager: {
    manage: ['Inventory'],
    view: ['Dashboard', 'Products'],
  },
  shipping_manager: {
    manage: ['Shipping Zones', 'Shipping Rates'],
    view: ['Dashboard', 'Orders'],
  },
  marketing_manager: {
    manage: ['Coupons', 'Blogs', 'Blog Categories'],
    view: ['Dashboard', 'Orders', 'Intelligence'],
  },
  analytics_viewer: {
    manage: [],
    view: ['Dashboard', 'Sales Reports', 'Intelligence', 'Analytics'],
  },
};

export const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

// Returns { level: 'manage' | 'view' | 'none' } for a given role + area
export const permissionLevel = (roleValue, area) => {
  const perms = ROLE_PERMISSIONS[roleValue];
  if (!perms) return 'none';
  if (perms.manage === 'all') return 'manage';
  if (perms.manage.includes(area)) return 'manage';
  if (perms.view.includes(area)) return 'view';
  return 'none';
};

let admins = [
  { id: 1, firstName: 'Nana', lastName: 'Serwaa', email: 'nana@wine2u.com', role: 'super_admin' },
  { id: 2, firstName: 'Kwabena', lastName: 'Osei', email: 'kwabena@wine2u.com', role: 'catalog_manager' },
  { id: 3, firstName: 'Akosua', lastName: 'Frimpong', email: 'akosua@wine2u.com', role: 'content_manager' },
  { id: 4, firstName: 'Yaw', lastName: 'Boakye', email: 'yaw@wine2u.com', role: 'order_manager' },
  { id: 5, firstName: 'Efya', lastName: 'Owusu', email: 'efya@wine2u.com', role: 'marketing_manager' },
];

export const getAdmins = () => admins;

export const addAdmin = (admin) => {
  admins = [...admins, { id: Date.now(), ...admin }];
  return admins;
};

export const updateAdminRole = (id, role) => {
  admins = admins.map((a) => (a.id === id ? { ...a, role } : a));
  return admins;
};

export const removeAdmin = (id) => {
  admins = admins.filter((a) => a.id !== id);
  return admins;
};
