import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../redux/AuthSlice';

import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import toast from './Toast';

const DashboardLayout = () => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { admin, loading } = useSelector((state) => state.auth);
  const roles = admin?.admin_roles || [];
  const permissions = admin?.admin_permissions || [];

  const handleToggleDropdown = (categoryName) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

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
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans antialiased selection:bg-[#c4945c] selection:text-white">
      
      {/* 1. DESKTOP SIDEBAR FIXED DOCK */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-20 shadow-xl">
        <DashboardSidebar 
          roles={roles}
          permissions={permissions}
          openDropdowns={openDropdowns}
          onToggleDropdown={handleToggleDropdown}
          onLogout={handleLogout}
          loading={loading}
        />
      </aside>

      {/* 2. CORE WORKSPACE ENVIRONMENT */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <DashboardHeader 
          admin={admin}
          roles={roles}
          onMenuOpen={() => setIsMobileOpen(true)}
        />

        {/* Dynamic Nested Route Rendering Console */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* 3. MOBILE DRAW SLIDEOUT PANEL */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop Blur Mask */}
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Sidebar Drawer Element */}
          <div className="relative w-64 max-w-xs h-full shadow-2xl z-50 animate-slide-in">
            <DashboardSidebar 
              roles={roles}
              permissions={permissions}
              openDropdowns={openDropdowns}
              onToggleDropdown={handleToggleDropdown}
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