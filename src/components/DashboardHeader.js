import React from 'react';
import { Menu } from 'lucide-react';

const DashboardHeader = ({ admin, roles, onMenuOpen }) => {
  return (
    <header className="h-16 bg-white border-b border-zinc-100 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm/50">
      {/* Mobile Hamburg Trigger */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">
          Systems Mainframe
        </span>
      </div>

      {/* Admin Profile Details */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-800 leading-tight">
            {admin?.first_name} {admin?.last_name}
          </p>
          <p className="text-[10px] font-bold text-[#c4945c] uppercase tracking-wider mt-0.5">
            {roles[0]?.replace('_', ' ') || 'Administrator'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-zinc-50 border border-zinc-200/80 flex items-center justify-center font-bold text-xs text-zinc-700 uppercase tracking-wider shadow-sm">
          {admin?.first_name?.[0]}
          {admin?.last_name?.[0]}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;