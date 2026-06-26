import { 
  LayoutDashboard, 
  Wine, 
  Layers, 
  Tags, 
  FolderTree, 
  Factory, 
  ShoppingBag, 
  Ticket, 
  Truck, 
  Globe, 
  Utensils, 
  ChefHat, 
  FileText, 
  BookOpen, 
  Settings, 
  BarChart3, 
  BrainCircuit, 
  Users, 
  ShieldCheck 
} from 'lucide-react';

export const groupedSidebarLinks = [
  {
    category: 'Core Panel',
    type: 'single',
    name: 'Dashboard Summary',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    category: 'Store Management',
    type: 'dropdown',
    icon: Wine,
    subLinks: [
      { name: 'Products Catalog', path: '/dashboard/products', permission: 'manage_products' },
      { name: 'Inventory Logs', path: '/dashboard/inventory', permission: 'manage_inventory' },
      { name: 'Wine Attributes', path: '/dashboard/wine-attributes', permission: 'manage_wine_attributes' },
      { name: 'Wine Regions', path: '/dashboard/wine-regions', permission: 'manage_wine_regions' },
      { name: 'Brands', path: '/dashboard/brands', permission: 'manage_brands' },
      { name: 'Categories', path: '/dashboard/categories', permission: 'manage_categories' },
    ]
  },
  {
    category: 'Sales & Logistics',
    type: 'dropdown',
    icon: ShoppingBag,
    subLinks: [
      { name: 'Orders Queue', path: '/dashboard/orders', permission: 'manage_orders' },
      { name: 'Coupons / Promos', path: '/dashboard/coupons', permission: 'manage_coupons' },
      { name: 'Shipping Rates', path: '/dashboard/shipping-rates', permission: 'manage_shipping' },
      { name: 'Shipping Zones', path: '/dashboard/shipping-zones', permission: 'manage_shipping' },
    ]
  },
  {
    category: 'Culinary Experience',
    type: 'dropdown',
    icon: Utensils,
    subLinks: [
      { name: 'Food Dishes', path: '/dashboard/food-dishes', permission: 'manage_food' },
      { name: 'Food Attributes', path: '/dashboard/food-attributes', permission: 'manage_food' },
      { name: 'Wine & Food Pairings', path: '/dashboard/wine-food-pairings', permission: 'manage_pairings' },
    ]
  },
  {
    category: 'Content & Editorial',
    type: 'dropdown',
    icon: FileText,
    subLinks: [
      { name: 'Blog Posts', path: '/dashboard/blogs', permission: 'manage_blogs' },
      { name: 'Blog Categories', path: '/dashboard/blog-categories', permission: 'manage_blogs' },
      { name: 'Pages Layout Manager', path: '/dashboard/pages', permission: 'manage_pages' },
    ]
  },
  {
    category: 'Analytics/Accounts',
    type: 'dropdown',
    icon: BarChart3,
    subLinks: [
      { name: 'Sales Reports', path: '/dashboard/sales-reports', permission: 'view_analytics' },
      { name: 'Business Intelligence', path: '/dashboard/intelligence', permission: 'view_analytics' },
    //   { name: 'User Directory', path: '/dashboard/user-auth', permission: 'manage_users' },
    //   { name: 'Admin Staff Directory', path: '/dashboard/admin-auth', permission: 'manage_admins' },
    ]
  }
];