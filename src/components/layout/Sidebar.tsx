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
  Shield,
  HelpCircle,
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
      roles: ['admin', 'faculty'], // Admin full, faculty view
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

  const filteredItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          id="mobile-sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="campus-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
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
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Campus Ecosystem
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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

        {/* Campus Emergency / Hotline Box */}
        <div className="p-3 m-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Campus Helpline</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mb-2">
            24/7 Security & Health Centre Assistance
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-800/40">
            <span>Security: <strong>Ext. 911</strong></span>
            <span>+1 555-019-9000</span>
          </div>
        </div>

        {/* User Info Bar at Bottom */}
        {user && (
          <div className="p-3 border-t border-slate-800 flex items-center gap-3 bg-slate-950/30">
            <img
              src={user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={user.fullName}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role} • {user.department.split(' ')[0]}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
