import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
// import DashboardOverview from './pages/DashboardOverview'; // Your overview page
import BlogCategories from './pages/BlogCategories';       // Your categories page
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Blogs from './pages/BlogPage';
import Brands from './pages/Brands';
import BrandDetail from './pages/BrandDetail';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import WineAttributes from './pages/WineAttributes';
import WineRegions from './pages/WineRegions';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import ShippingRates from './pages/ShippingRates';
import ShippingZones from './pages/ShippingZone';
import FoodDishes from './pages/FoodDishes';
import FoodAttributes from './pages/FoodAttributes';
import WineFoodPairings from './pages/WineFoodPairings';
import SalesReports from './pages/SalesReport';
import Intelligence from './pages/Intelligence';
import AdminPages from './pages/AdminPages';
import ProductDetailPage from './pages/ProductDetails';
import BlogDetailPage from './pages/BlogDetails';
import PageDetailPage from './pages/PageDetails';
import PageForm from './components/PageForm';

function App() {
  return (
    <Routes>
      {/* Public Guest Auth Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected Master Layout Route - Notice it's NOT self-closing anymore */}
      <Route
        path="/dashboard"
        element = {
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* These components inject right into the <Outlet /> inside DashboardLayout */}
        <Route path="blog-categories" element={<BlogCategories />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:id" element={<BlogDetailPage />} />

        <Route path="brands" element={<Brands />} />
        <Route path="brands/:id" element={<BrandDetail />} />

        <Route path="categories" element={<Categories /> } />
        <Route path="products" element={<Products /> } />
        <Route path="products/:id" element={<ProductDetailPage /> } />  {/* Optional: Product detail page if needed */}
        <Route path="inventory" element={<Inventory /> } /> 

        <Route path="wine-attributes" element={<WineAttributes />} />
        <Route path="wine-regions" element={<WineRegions/>} />

        <Route path="orders" element={<Orders/>} />
        <Route path="coupons" element={<Coupons/>} />
        <Route path="shipping-rates" element={<ShippingRates/>} />
        <Route path="shipping-zones" element={<ShippingZones/>} />

        <Route path="food-dishes" element={<FoodDishes/>} />
        <Route path="food-attributes" element={<FoodAttributes/>} />
        <Route path="wine-food-pairings" element={<WineFoodPairings/>} />

        <Route path="sales-reports" element={<SalesReports/>} />
        <Route path="intelligence" element={<Intelligence/>} />

        <Route path="pages" element={<AdminPages/>} />
        <Route path="pages/:id" element={<PageDetailPage/>} />
        <Route path="pages/create" element={<PageForm/>} />  

        {/* You will list your other 17 sub-routes right here following this pattern */}
      </Route>

      {/* Wildcard Global Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;