import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import BlogCategories from './pages/BlogCategories';
import BlogCategoryForm from './pages/BlogCategoryForm';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Blogs from './pages/BlogPage';
import BlogForm from './pages/BlogForm';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import WineRegions from './pages/WineRegions';
import FoodAndPairings from './pages/FoodAndPairings';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Coupons from './pages/Coupons';
import Shipping from './pages/Shipping';
import Suburbs from './pages/Suburbs';
import SalesReports from './pages/SalesReport';
import SalesReportForm from './pages/SalesReportForm';
import Intelligence from './pages/Intelligence';
import SommelierTester from './pages/SommelierTester';
import QuizEditor from './pages/QuizEditor';
import AttributeTypes from './pages/AttributeTypes';
import ProductAttributes from './pages/ProductAttributes';
import WineCharacteristics from './pages/WineCharacteristics';
import InsightsCatalogue from './pages/InsightsCatalogue';
import PairingMatrix from './pages/PairingMatrix';
import QuizCoverage from './pages/QuizCoverage';
import DataHealth from './pages/DataHealth';
import Demand from './pages/Demand';
import AdminPages from './pages/AdminPages';
import ProductDetailPage from './pages/ProductDetails';
import ProductForm from './pages/ProductForm';
import BlogDetailPage from './pages/BlogDetails';
import PageDetailPage from './pages/PageDetails';
import SitePageForm from './pages/SitePageForm';
import Customers from './pages/Customers';
import Reviews from './pages/Reviews';
import AdminsRoles from './pages/AdminsRoles';
import Activity from './pages/Activity';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* Public Guest Auth Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

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
        <Route index element={<DashboardPage />} />
        <Route path="intelligence" element={<Intelligence/>} />
        <Route path="sommelier-tester" element={<SommelierTester/>} />
        <Route path="insights/catalogue" element={<InsightsCatalogue/>} />
        <Route path="insights/pairing-matrix" element={<PairingMatrix/>} />
        <Route path="insights/quiz-coverage" element={<QuizCoverage/>} />
        <Route path="insights/data-health" element={<DataHealth/>} />
        <Route path="insights/demand" element={<Demand/>} />

        <Route path="products" element={<Products /> } />
        <Route path="products/new" element={<ProductForm /> } />
        <Route path="products/:id/edit" element={<ProductForm /> } />
        <Route path="products/:id" element={<ProductDetailPage /> } />
        <Route path="inventory" element={<Inventory /> } />
        <Route path="categories" element={<Categories /> } />
        <Route path="wine-regions" element={<WineRegions/>} />
        <Route path="brands" element={<Brands />} />
        <Route path="food-pairings" element={<FoodAndPairings/>} />
        <Route path="product-attributes" element={<ProductAttributes/>} />
        <Route path="attribute-types" element={<AttributeTypes/>} />
        {/* The names these screens shipped under. Kept so an open tab or a pasted link still lands. */}
        <Route path="wine-attributes" element={<Navigate to="/dashboard/product-attributes" replace />} />
        <Route path="attribute-vocabulary" element={<Navigate to="/dashboard/attribute-types" replace />} />
        <Route path="wine-characteristics" element={<WineCharacteristics/>} />
        <Route path="quiz-editor" element={<QuizEditor/>} />

        <Route path="orders" element={<Orders/>} />
        <Route path="orders/:id" element={<OrderDetail/>} />
        <Route path="coupons" element={<Coupons/>} />
        <Route path="shipping" element={<Shipping/>} />
        <Route path="suburbs" element={<Suburbs/>} />

        <Route path="customers" element={<Customers/>} />
        <Route path="reviews" element={<Reviews/>} />

        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/new" element={<BlogForm />} />
        <Route path="blogs/:id/edit" element={<BlogForm />} />
        <Route path="blogs/:id" element={<BlogDetailPage />} />
        <Route path="blog-categories" element={<BlogCategories />} />
        <Route path="blog-categories/new" element={<BlogCategoryForm />} />
        <Route path="blog-categories/:id/edit" element={<BlogCategoryForm />} />

        <Route path="admins-roles" element={<AdminsRoles/>} />
        <Route path="activity" element={<Activity/>} />
        <Route path="profile" element={<Profile/>} />

        {/* Kept reachable, not in primary nav */}
        <Route path="sales-reports" element={<SalesReports/>} />
        <Route path="sales-reports/new" element={<SalesReportForm/>} />
        <Route path="sales-reports/:id/edit" element={<SalesReportForm/>} />
        <Route path="pages" element={<AdminPages/>} />
        <Route path="pages/new" element={<SitePageForm/>} />
        <Route path="pages/:id/edit" element={<SitePageForm/>} />
        <Route path="pages/:id" element={<PageDetailPage/>} />
      </Route>

      {/* Wildcard Global Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
