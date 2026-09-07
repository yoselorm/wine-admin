import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { getInitialTheme, applyTheme, persistTheme } from '../utils/theme';

const DashboardHeader = ({ admin, roles, onMenuOpen, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6">
      <button
        type="button"
        onClick={onMenuOpen}
        className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center font-bold text-xs text-violet-700 uppercase">
              {admin?.first_name?.[0]}
              {admin?.last_name?.[0]}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {admin?.first_name} {admin?.last_name}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {roles[0]?.replace(/_/g, ' ') || 'Administrator'}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-popover py-1.5 z-40">
              <button
                onClick={() => { setMenuOpen(false); navigate('/dashboard/profile'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={15} className="text-gray-400" /> Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
