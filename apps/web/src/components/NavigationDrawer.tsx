import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, LayoutDashboard, Scan, FileSpreadsheet, ShieldCheck,
  LogOut, ChevronRight, UserCheck, ExternalLink, HelpCircle,
  Building2, MapPin, BookOpen
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('metricheck_user') || '{}');
    } catch {
      return {};
    }
  })();

  const officerName = user?.name || 'Amit Verma';
  const officerEmpId = user?.employeeId || 'LM-MP-0421';
  const officerDistrict = user?.jurisdictionDistrict || 'Indore';
  const officerState = user?.jurisdictionState || 'Madhya Pradesh';
  const officerZone = user?.jurisdictionZone || 'Zone 01';

  const initials = officerName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AV';

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('metricheck_token');
    localStorage.removeItem('metricheck_user');
    onClose();
    navigate('/');
  };

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'डैशबोर्ड • Dashboard',
      path: '/inspector/dashboard',
      icon: <LayoutDashboard className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'scan',
      label: 'नया निरीक्षण • New Inspection',
      path: '/inspector/inspections/new',
      icon: <Scan className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'all_inspections',
      label: 'सभी निरीक्षण • All Inspections',
      path: '/inspector/inspections',
      icon: <FileSpreadsheet className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'id_card',
      label: 'पहचान पत्र • Officer ID',
      path: '/inspector/dashboard?tab=id_card',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'laws',
      label: 'विधिक नियम • Acts & Rules',
      path: '/inspector/laws',
      icon: <BookOpen className="w-5 h-5 text-indigo-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-72 max-w-[85vw] bg-navy-950 text-slate-100 shadow-2xl border-r border-white/10 flex flex-col z-10 transition-transform duration-300 transform ease-in-out">
          {/* National Tricolor Line */}
          <div className="gov-tricolor shrink-0" />

          {/* Drawer Top Header */}
          <div className="p-4 bg-navy-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-xs shadow-sm">
                म
              </div>
              <h3 className="text-xs font-bold text-white tracking-tight">MetriCheck AI</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Officer Profile Card */}
          <div className="p-3.5 bg-navy-900/50 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{officerName}</h4>
                <p className="text-[11px] font-mono text-slate-300 truncate">{officerEmpId} • {officerZone}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const currentFullPath = `${location.pathname}${location.search}`;
              const isActive = item.path.includes('?')
                ? currentFullPath === item.path
                : location.pathname === item.path && (!location.search || location.search === '?tab=dashboard');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/40 text-white font-bold shadow-xs'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{item.icon}</div>
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 bg-navy-900/90 border-t border-white/10 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>लॉगआउट • Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
