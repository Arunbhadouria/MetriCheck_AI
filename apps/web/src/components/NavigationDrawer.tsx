import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, LayoutDashboard, Scan, FileSpreadsheet, ShieldCheck,
  LogOut, ChevronRight, UserCheck, ExternalLink, HelpCircle,
  Building2, MapPin, BookOpen, Home, Clock, Scale, ShoppingBag,
  Download, Smartphone, Users
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isConsumerRoute = location.pathname.startsWith('/consumer') || location.pathname.startsWith('/citizen');

  // Citizen data
  const citizenUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('metricheck_citizen_user') || 'null');
    } catch {
      return null;
    }
  })();

  // Officer data
  const officerUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('metricheck_user') || '{}');
    } catch {
      return {};
    }
  })();

  const officerName = officerUser?.name || 'Amit Verma';
  const officerEmpId = officerUser?.employeeId || 'LM-MP-0421';
  const officerZone = officerUser?.jurisdictionZone || 'Zone 01';

  const officerInitials = officerName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AV';

  // WCAG Focus Trap and Keyboard Management
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerPanelRef.current) {
        const focusableElements = drawerPanelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
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

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  const handleInstallApp = () => {
    onClose();
    window.dispatchEvent(new Event('open-pwa-install'));
  };

  const handleLogout = () => {
    if (isConsumerRoute) {
      localStorage.removeItem('metricheck_citizen_token');
      localStorage.removeItem('metricheck_citizen_user');
      onClose();
      navigate('/landing');
    } else {
      localStorage.removeItem('metricheck_token');
      localStorage.removeItem('metricheck_user');
      onClose();
      navigate('/login');
    }
  };

  if (!isOpen) return null;

  // Dedicated Consumer Navigation Items
  const consumerNavItems = [
    {
      id: 'consumer_dashboard',
      label: 'उपभोक्ता डैशबोर्ड • Dashboard',
      path: '/consumer/dashboard',
      icon: <Home className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'consumer_scan',
      label: 'सामान स्कैन करें • Scan Product',
      path: '/consumer/scan',
      icon: <Scan className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'consumer_history',
      label: 'स्कैन इतिहास • Scan History',
      path: '/consumer/dashboard?tab=history',
      icon: <Clock className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'consumer_grievances',
      label: 'मेरी शिकायतें • My Grievances',
      path: '/consumer/dashboard?tab=grievances',
      icon: <Scale className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'consumer_rights',
      label: 'उपभोक्ता अधिकार • Legal Rights',
      path: '/consumer/dashboard?tab=rights',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />
    }
  ];

  // Dedicated Inspector Navigation Items
  const officerNavItems = [
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
      id: 'officers_directory',
      label: 'अधिकारी निर्देशिका • Officer Directory',
      path: '/inspector/officers',
      icon: <Users className="w-5 h-5 text-teal-400" />
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

  const navItems = isConsumerRoute ? consumerNavItems : officerNavItems;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="मुख्य नेविगेशन मेनू • Main Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div
          ref={drawerPanelRef}
          className="w-72 max-w-[85vw] bg-navy-950 text-slate-100 shadow-2xl border-r border-white/10 flex flex-col z-10 transition-transform duration-300 transform ease-in-out"
        >
          {/* National Tricolor Line */}
          <div className="gov-tricolor shrink-0" />

          {/* Drawer Top Header */}
          <div className="p-4 bg-navy-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-xs shadow-sm" aria-hidden="true">
                म
              </div>
              <div>
                <h3 id="drawer-title" className="text-xs font-bold text-white tracking-tight">
                  {isConsumerRoute ? 'नागरिक सेवा • Citizen Portal' : 'MetriCheck AI Inspector'}
                </h3>
                <p className="text-[9px] text-slate-400">Legal Metrology India</p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Profile Card (Context Aware) */}
          {isConsumerRoute ? (
            <div className="p-3.5 bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border-b border-white/10">
              {citizenUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-navy-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                    {citizenUser.name?.substring(0, 2)?.toUpperCase() || 'ना'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate">{citizenUser.name}</h4>
                      <span className="badge badge-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-bold">नागरिक</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono truncate">{citizenUser.phone || '9826012345'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">नागरिक उपभोक्ता</h4>
                      <p className="text-[10px] text-slate-400">विधिक मापविज्ञान सत्यापन</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigate('/consumer/auth')}
                    className="btn btn-xs bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold border-none cursor-pointer"
                  >
                    लॉगिन
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-navy-900/50 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                  {officerInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{officerName}</h4>
                  <p className="text-[11px] font-mono text-slate-300 truncate">{officerEmpId} • {officerZone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const currentFullPath = `${location.pathname}${location.search}`;
              const isActive = item.path.includes('?')
                ? currentFullPath === item.path
                : location.pathname === item.path && (!location.search || location.search === '?tab=dashboard' || location.search === '?tab=overview');

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
          <div className="p-3.5 bg-navy-900/90 border-t border-white/10 shrink-0 space-y-2">
            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-between transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ऐप इंस्टॉल करें • Install App</span>
                </div>
                <span className="badge badge-xs bg-amber-500 text-navy-950 font-black text-[9px] px-1.5 py-0.5">PWA</span>
              </button>
            )}

            {isConsumerRoute ? (
              citizenUser ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>नागरिक लॉगआउट • Citizen Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigate('/consumer/auth')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>नागरिक लॉगिन / पंजीकरण • Login</span>
                </button>
              )
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>लॉगआउट • Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
