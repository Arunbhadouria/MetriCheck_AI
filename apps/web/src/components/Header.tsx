import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Wifi, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationDrawer } from './NavigationDrawer';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'Legal Metrology · Government of India',
  showBack = false,
  showMenu = true
}) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30">
        <div className="gov-tricolor" />
        <div className="bg-navy-900 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Hamburger Menu Button */}
            {showMenu && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/60 shadow-xs flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer"
                aria-label="Open Navigation Menu"
                aria-expanded={drawerOpen}
                aria-haspopup="dialog"
                title="मेनू • Menu"
              >
                <Menu className="w-4 h-4 text-amber-400 shrink-0" />
              </button>
            )}

            {/* Back Button (if requested) */}
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-700/60 shadow-xs transition active:scale-95 cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-slate-200 shrink-0" />
              </button>
            )}

            {/* Emblem & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-navy-950 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs">
                म
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold leading-tight truncate text-white">{title}</h1>
                <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium truncate">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Right Status Badges */}
          <div className="flex-none flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Secure Portal</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-slate-200 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold">
              <Wifi className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Online</span>
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Drawer Overlay */}
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
