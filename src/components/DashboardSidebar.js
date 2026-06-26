import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { groupedSidebarLinks } from "../utils/navigation";

const DashboardSidebar = ({
  roles,
  permissions,
  openDropdowns,
  onToggleDropdown,
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
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Sidebar Header / Brand Identity */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-900/60 gap-2.5 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base">
            🍷
          </div>
          <div>
            <h1 className="font-serif font-bold tracking-wide text-sm text-zinc-100">
              Vintner Panel
            </h1>
            <p className="text-[9px] text-[#c4945c] font-bold uppercase tracking-widest">
              Winery Portal
            </p>
          </div>
        </div>
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="text-zinc-500 hover:text-zinc-200 p-1 md:hidden transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dynamic Nav Structure Grid */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {groupedSidebarLinks.map((group) => {
          const IconComponent = group.icon;

          // 1. Single Top Level Links
          if (group.type === "single") {
            if (!hasAccess(group.permission)) return null;
            return (
              <NavLink
                key={group.name}
                to={group.path}
                end
                onClick={() => isMobile && onCloseMobile()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white font-bold border border-zinc-800/80"
                      : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                  }`
                }
              >
                {/* React Router passes an object with isActive right here! */}
                {({ isActive }) => (
                  <>
                    <IconComponent
                      size={16}
                      className={
                        isActive ? "text-[#c4945c]" : "text-zinc-500 opacity-80"
                      }
                    />
                    <span className={isActive ? "text-[#c4945c]" : ""}>
                      {group.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }
          // 2. Multi-Level Dropdowns
          const authorizedSubLinks = group.subLinks.filter((sub) =>
            hasAccess(sub.permission),
          );
          if (authorizedSubLinks.length === 0) return null;

          const isDropdownOpen = !!openDropdowns[group.category];

          return (
            <div key={group.category} className="space-y-1">
              <button
                type="button"
                onClick={() => onToggleDropdown(group.category)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={14} className="opacity-70" />
                  <span>{group.category}</span>
                </div>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 text-zinc-500 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="pl-4 ml-2 border-l border-zinc-900 space-y-1 mt-1 transition-all duration-200 animate-fade-in">
                  {authorizedSubLinks.map((sub) => (
                    <NavLink
                      key={sub.name}
                      to={sub.path}
                      onClick={() => isMobile && onCloseMobile()}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-xs font-medium rounded-md transition-all border-l-2 ${
                          isActive
                            ? "text-white font-semibold border-[#c4945c] bg-zinc-900/60"
                            : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/20"
                        }`
                      }
                    >
                      {sub.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Exit Footer Control */}
      <div className="p-4 border-t border-zinc-900/60 bg-zinc-950/20">
        <button
          type="button"
          onClick={onLogout}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-red-950/10 rounded-lg transition-colors group disabled:opacity-50 focus:outline-none"
        >
          <LogOut
            size={15}
            className="text-zinc-500 group-hover:text-zinc-300 transition-colors"
          />
          <span>{loading ? "Logging out..." : "Sign Out Session"}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
