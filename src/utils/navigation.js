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
  MapPin,
  HelpCircle,
  BarChart3,
  Table2,
  Target,
  HeartPulse,
  TrendingUp,
  Bot,
  Sliders,
  Tags,
  Library,
  FileBarChart,
} from 'lucide-react';

export const groupedSidebarLinks = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null, end: true },
    ],
  },
  {
    category: 'Catalog',
    items: [
      { name: 'Products', path: '/dashboard/products', icon: Wine, permission: 'manage-products' },
      { name: 'Inventory', path: '/dashboard/inventory', icon: Layers, permission: 'manage-inventory' },
      { name: 'Categories', path: '/dashboard/categories', icon: FolderTree, permission: 'manage-categories' },
      { name: 'Wine Regions', path: '/dashboard/wine-regions', icon: Globe, permission: 'manage-wine-regions' },
      { name: 'Brands', path: '/dashboard/brands', icon: Factory, permission: 'manage-brands' },
      { name: 'Food & Pairings', path: '/dashboard/food-pairings', icon: Utensils, permission: 'manage-food-dishes' },
      { name: 'Wine Characteristics', path: '/dashboard/wine-characteristics', icon: Sliders, permission: 'manage-products' },
      { name: 'Product Attributes', path: '/dashboard/product-attributes', icon: Tags, permission: 'manage-products' },
      { name: 'Attribute Types & Values', path: '/dashboard/attribute-types', icon: Library, permission: 'manage-wine-attributes' },
      { name: 'Quiz Editor', path: '/dashboard/quiz-editor', icon: HelpCircle, permission: 'manage-products' },
    ],
  },
  {
    category: 'Insights',
    items: [
      { name: 'Intelligence', path: '/dashboard/intelligence', icon: BrainCircuit, permission: 'view-analytics' },
      { name: 'Sommelier Tester', path: '/dashboard/sommelier-tester', icon: Bot, permission: 'view-analytics' },
      { name: 'Catalogue', path: '/dashboard/insights/catalogue', icon: BarChart3, permission: 'view-analytics' },
      { name: 'Pairing Matrix', path: '/dashboard/insights/pairing-matrix', icon: Table2, permission: 'view-analytics' },
      { name: 'Quiz Coverage', path: '/dashboard/insights/quiz-coverage', icon: Target, permission: 'view-analytics' },
      { name: 'Data Health', path: '/dashboard/insights/data-health', icon: HeartPulse, permission: 'view-analytics' },
      { name: 'Demand', path: '/dashboard/insights/demand', icon: TrendingUp, permission: 'view-analytics' },
      { name: 'Reports', path: '/dashboard/reports', icon: FileBarChart, permission: 'view-analytics' },
    ],
  },
  {
    category: 'Sales',
    items: [
      { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag, permission: 'manage-orders' },
      { name: 'Coupons', path: '/dashboard/coupons', icon: Ticket, permission: 'manage-coupons' },
      { name: 'Shipping', path: '/dashboard/shipping', icon: Truck, permission: 'manage-shipping-zones' },
      // Not part of the confirmed permission catalog yet — show to every admin for now.
      { name: 'Suburbs', path: '/dashboard/suburbs', icon: MapPin, permission: null },
    ],
  },
  {
    category: 'Customers',
    items: [
      { name: 'Customers', path: '/dashboard/customers', icon: Users, permission: 'view-customers' },
      { name: 'Reviews', path: '/dashboard/reviews', icon: Star, permission: 'view-reviews' },
    ],
  },
  {
    category: 'Content',
    items: [
      { name: 'Blogs', path: '/dashboard/blogs', icon: FileText, permission: 'manage-blogs' },
      { name: 'Blog Categories', path: '/dashboard/blog-categories', icon: BookOpen, permission: 'manage-blog-categories' },
    ],
  },
  {
    category: 'Administration',
    items: [
      { name: 'Admins & Roles', path: '/dashboard/admins-roles', icon: ShieldCheck, permission: 'manage-admins' },
      { name: 'Activity', path: '/dashboard/activity', icon: History, permission: 'view-activity' },
    ],
  },
];
