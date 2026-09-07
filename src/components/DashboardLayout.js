import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../redux/AuthSlice';

import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import toast from './Toast';

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { admin, loading } = useSelector((state) => state.auth);
  const roles = admin?.admin_roles || [];
  const permissions = admin?.admin_permissions || [];

  const handleLogout = async () => {
    try {
      await dispatch(logoutAdmin()).unwrap();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (err) {
      toast.error(err || 'Failed to safely terminate session.');
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex text-gray-900 font-sans antialiased overflow-hidden">

      {/* 1. DESKTOP SIDEBAR FIXED DOCK */}
      <aside className="hidden md:block w-60 flex-shrink-0 h-screen">
        <DashboardSidebar
          roles={roles}
          permissions={permissions}
          onLogout={handleLogout}
          loading={loading}
        />
      </aside>

      {/* 2. CORE WORKSPACE ENVIRONMENT */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <DashboardHeader
          admin={admin}
          roles={roles}
          onMenuOpen={() => setIsMobileOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Nested Route Rendering Console */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-content w-full mx-auto p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. MOBILE DRAW SLIDEOUT PANEL */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop Blur Mask */}
          <div
            className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Sidebar Drawer Element */}
          <div className="relative w-60 max-w-xs h-full shadow-2xl z-50 animate-slide-in">
            <DashboardSidebar
              roles={roles}
              permissions={permissions}
              onLogout={handleLogout}
              loading={loading}
              isMobile={true}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}


    </div>
  );
};

export default DashboardLayout;