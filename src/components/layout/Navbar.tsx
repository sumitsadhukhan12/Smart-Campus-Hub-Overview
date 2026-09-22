import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { UserRole } from '../../types.ts';
import {
  Search,
  Bell,
  Check,
  CheckCheck,
  LogOut,
  User as UserIcon,
  Shield,
  GraduationCap,
  Building,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export default function Navbar({ onOpenSearch, onToggleSidebar, onNavigate }: NavbarProps) {
  const { user, logout, switchDemoRole, setShowAuthModal, setAuthModalTab } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-600" />
            Admin
          </span>
        );
      case 'faculty':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
            <Building className="w-3 h-3 text-indigo-600" />
            Faculty
          </span>
        );
      case 'student':
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-blue-600" />
            Student
          </span>
        );
    }
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between"
    >
      {/* Left: Mobile menu toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          id="brand-logo-btn"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-base text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
              Smart Campus Hub
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden md:block">
              One Campus. One Platform. Everything Connected.
            </p>
          </div>
        </button>
      </div>

      {/* Center: Global Search Bar Button */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          id="navbar-search-btn"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm transition-all group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span>Search notices, events, notes, grievances...</span>
          </span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white rounded border border-slate-300 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          id="mobile-search-btn"
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 1-Click Role Switcher */}
        {user && (
          <div className="relative">
            <button
              id="role-switcher-btn"
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
                setShowNotifications(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-700 transition-all"
              title="Switch demo role to test Student / Faculty / Admin features"
            >
              {getRoleBadge(user.role)}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleSwitcher && (
              <div
                id="role-switcher-dropdown"
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                <button
                  id="switch-student-btn"
                  onClick={() => {
                    switchDemoRole('student');
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors ${
                    user.role === 'student'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Student View
                  </span>
                  {user.role === 'student' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
                <button
                  id="switch-faculty-btn"
                  onClick={() => {
                    switchDemoRole('faculty');
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors ${
                    user.role === 'faculty'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Faculty View
                  </span>
                  {user.role === 'faculty' && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
                <button
                  id="switch-admin-btn"
                  onClick={() => {
                    switchDemoRole('admin');
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors ${
                    user.role === 'admin'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    Admin View
                  </span>
                  {user.role === 'admin' && <Check className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        {user && (
          <div className="relative">
            <button
              id="notifications-bell-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleSwitcher(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  id="unread-notifications-badge"
                  className="absolute top-1 right-1 min-w-4.5 h-4.5 px-1 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-dropdown-menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-800">Campus Alerts</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      id="mark-all-read-btn"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        id={`notif-item-${n._id}`}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n._id);
                          if (n.link) {
                            const tab = n.link.replace('/', '');
                            onNavigate(tab);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                          !n.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <span
                          className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile / Sign In */}
        {user ? (
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setShowRoleSwitcher(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
            >
              <img
                src={user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                alt={user.fullName}
                className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-1">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{user.collegeId}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="p-3 bg-slate-50 rounded-xl mb-2">
                  <p className="font-bold text-xs text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {user.collegeId}
                    </span>
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                <button
                  id="view-profile-btn"
                  onClick={() => {
                    onNavigate('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Digital ID & Profile
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  id="logout-btn"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="nav-login-btn"
              onClick={() => {
                setAuthModalTab('login');
                setShowAuthModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              id="nav-register-btn"
              onClick={() => {
                setAuthModalTab('register');
                setShowAuthModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
