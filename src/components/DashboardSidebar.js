import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Wine as WineLogo } from "lucide-react";
import { groupedSidebarLinks } from "../utils/navigation";

const DashboardSidebar = ({
  roles,
  permissions,
  onLogout,
  loading,
  isMobile = false,
  onCloseMobile,
}) => {
  const hasAccess = (linkPermission) => {
    if (!linkPermission) return true;
    if (roles.includes("super_admin")) return true;
    return permissions.includes(linkPermission);
  };

  return (
    <div className="dashboard-sidebar flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white">
            <WineLogo size={16} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 leading-tight">Wine2U</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin</p>
          </div>
        </div>
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-gray-700 p-1 md:hidden transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groupedSidebarLinks.map((group) => {
          const authorizedItems = group.items.filter((item) => hasAccess(item.permission));
          if (authorizedItems.length === 0) return null;

          return (
            <div key={group.category}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.category}
              </p>
              <div className="space-y-0.5">
                {authorizedItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? "bg-violet-50 text-violet-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={17} className={isActive ? "text-violet-600" : "text-gray-400"} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onLogout}
          disabled={loading}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50 focus:outline-none"
        >
          <LogOut size={17} className="text-gray-400" />
          <span>{loading ? "Logging out..." : "Log out"}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
