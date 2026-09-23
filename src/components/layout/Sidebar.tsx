import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Bell,
  Calendar,
  AlertOctagon,
  Search,
  BookOpen,
  BarChart3,
  UserCheck,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentTab, onNavigate, isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['student', 'faculty', 'admin'],
      badge: null,
    },
    {
      id: 'notices',
      label: 'Campus Notices',
      icon: Bell,
      roles: ['student', 'faculty', 'admin'],
      badge: 'Live',
    },
    {
      id: 'events',
      label: 'Events & Fests',
      icon: Calendar,
      roles: ['student', 'faculty', 'admin'],
      badge: '3 New',
    },
    {
      id: 'complaints',
      label: 'Grievance Redressal',
      icon: AlertOctagon,
      roles: ['student', 'faculty', 'admin'],
      badge: null,
    },
    {
      id: 'lost-found',
      label: 'Lost & Found',
      icon: Search,
      roles: ['student', 'faculty', 'admin'],
      badge: null,
    },
    {
      id: 'resources',
      label: 'Academic Resources',
      icon: BookOpen,
      roles: ['student', 'faculty', 'admin'],
      badge: 'PDFs',
    },
    {
      id: 'admin',
      label: 'Admin Control Center',
      icon: BarChart3,
      roles: ['admin', 'faculty'],
      badge: 'Admin',
    },
    {
      id: 'profile',
      label: 'Digital ID & Profile',
      icon: UserCheck,
      roles: ['student', 'faculty', 'admin'],
      badge: null,
    },
  ];

  const userRole = user?.role || 'student';
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-campus-assistant'));
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const renderNavList = (isMobile: boolean) => (
    <div className="space-y-1">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`${isMobile ? 'mobile-' : ''}sidebar-nav-${item.id}`}
            onClick={() => {
              onNavigate(item.id);
              if (isMobile) {
                onClose();
              }
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badge === 'Admin'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderHelplineAndUser = () => (
    <>
      {/* Campus Emergency / Hotline Box */}
      <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2 mb-1.5">
          <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white">Campus Helpline</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight mb-2">
          24/7 Security & Health Centre Assistance
        </p>
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/40">
          <span>Security: <strong>Ext. 911</strong></span>
          <span>+1 555-019-9000</span>
        </div>
      </div>

      {/* User Info Bar at Bottom */}
      {user && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
          <img
            src={user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
            alt={user.fullName}
            className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">
              {user.role} • {user.department.split(' ')[0]}
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="mobile-sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
        />
      )}

      {/* 2. Mobile Slide-out Drawer */}
      <aside
        id="campus-sidebar-mobile"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              C
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">Smart Campus</span>
              <span className="text-[10px] block text-slate-400">Hub Portal</span>
            </div>
          </div>
          <button
            id="close-sidebar-mobile-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          <div className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Campus Ecosystem
          </div>

          {renderNavList(true)}

          {/* Quick AI Assistant Button */}
          <div className="pt-2">
            <button
              onClick={handleOpenAiAssistant}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-200 transition-all group shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Campus AI Assistant</span>
              </span>
              <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
                Ask
              </span>
            </button>
          </div>

          <div className="pt-2 space-y-3">
            {renderHelplineAndUser()}
          </div>
        </div>
      </aside>

      {/* 3. Desktop Permanent / Collapsible Sidebar (Within Document Flow) */}
      {isOpen && (
        <aside
          id="campus-sidebar"
          className="hidden lg:flex flex-col w-64 shrink-0 sticky top-20 h-[calc(100vh-6.5rem)] bg-slate-900 text-slate-300 rounded-3xl border border-slate-800/90 shadow-md overflow-hidden animate-in fade-in duration-200"
          aria-label="Desktop Navigation Sidebar"
        >
          {/* Desktop Sidebar Header */}
          <div className="h-13 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Campus Portal
              </span>
            </div>
            <button
              onClick={onClose}
              title="Collapse sidebar"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Navigation Body */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
            {renderNavList(false)}

            {/* Quick AI Assistant Action */}
            <div className="pt-1">
              <button
                onClick={handleOpenAiAssistant}
                className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-200 transition-all group shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>Campus AI Help</span>
                </span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
                  Gemini
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Footer Section */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
            {renderHelplineAndUser()}
          </div>
        </aside>
      )}
    </>
  );
}
