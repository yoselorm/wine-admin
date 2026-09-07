import {
  LayoutDashboard,
  BrainCircuit,
  Wine,
  Layers,
  FolderTree,
  Globe,
  Factory,
  Utensils,
  ShoppingBag,
  Ticket,
  Truck,
  FileText,
  BookOpen,
  Users,
  Star,
  ShieldCheck,
  History,
} from 'lucide-react';

export const groupedSidebarLinks = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null, end: true },
      { name: 'Intelligence', path: '/dashboard/intelligence', icon: BrainCircuit, permission: 'view_analytics' },
    ],
  },
  {
    category: 'Catalog',
    items: [
      { name: 'Products', path: '/dashboard/products', icon: Wine, permission: 'manage_products' },
      { name: 'Inventory', path: '/dashboard/inventory', icon: Layers, permission: 'manage_inventory' },
      { name: 'Categories', path: '/dashboard/categories', icon: FolderTree, permission: 'manage_categories' },
      { name: 'Wine Regions', path: '/dashboard/wine-regions', icon: Globe, permission: 'manage_wine_regions' },
      { name: 'Brands', path: '/dashboard/brands', icon: Factory, permission: 'manage_brands' },
      { name: 'Food & Pairings', path: '/dashboard/food-pairings', icon: Utensils, permission: 'manage_food' },
    ],
  },
  {
    category: 'Sales',
    items: [
      { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag, permission: 'manage_orders' },
      { name: 'Coupons', path: '/dashboard/coupons', icon: Ticket, permission: 'manage_coupons' },
      { name: 'Shipping', path: '/dashboard/shipping', icon: Truck, permission: 'manage_shipping' },
    ],
  },
  {
    category: 'Customers',
    items: [
      { name: 'Customers', path: '/dashboard/customers', icon: Users, permission: null },
      { name: 'Reviews', path: '/dashboard/reviews', icon: Star, permission: null },
    ],
  },
  {
    category: 'Content',
    items: [
      { name: 'Blogs', path: '/dashboard/blogs', icon: FileText, permission: 'manage_blogs' },
      { name: 'Blog Categories', path: '/dashboard/blog-categories', icon: BookOpen, permission: 'manage_blogs' },
    ],
  },
  {
    category: 'Administration',
    items: [
      { name: 'Admins & Roles', path: '/dashboard/admins-roles', icon: ShieldCheck, permission: null },
      { name: 'Activity', path: '/dashboard/activity', icon: History, permission: null },
    ],
  },
];
