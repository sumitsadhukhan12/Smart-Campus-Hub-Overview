import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { Notice, EventItem, Complaint, LostFoundItem } from '../types.ts';
import {
  Bell,
  Calendar,
  AlertOctagon,
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Pin,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ShieldAlert,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, itemId?: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [lostItems, setLostItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [nRes, eRes, cRes, lRes] = await Promise.all([
          api.notices.list(),
          api.events.list({ filter: 'upcoming' }),
          api.complaints.list(),
          api.lostFound.list({ status: 'Active' }),
        ]);

        setNotices(nRes.notices || []);
        setEvents(eRes.events || []);
        setComplaints(cRes.complaints || []);
        setLostItems(lRes.items || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const handleRegisterEvent = async (eventId: string, eventTitle: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await api.events.register(eventId);
      showToast('Registration Confirmed', `Seat reserved for ${eventTitle}!`, 'success');
      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? { ...e, registeredCount: e.registeredCount + 1, isUserRegistered: true }
            : e
        )
      );
    } catch (err: any) {
      showToast('Registration notice', err.message, 'warning');
    }
  };

  const pinnedNotices = notices.filter((n) => n.isPinned);
  const regularNotices = notices.filter((n) => !n.isPinned).slice(0, 4);
  const urgentNotice = notices.find((n) => n.priority === 'urgent');

  return (
    <div id="dashboard-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Emergency or Urgent Alert Ticker */}
      {urgentNotice && (
        <div
          id="urgent-notice-banner"
          className="bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-200 animate-bounce shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider bg-rose-800 px-2 py-0.5 rounded mr-2">
                Urgent Notice
              </span>
              <span className="text-xs sm:text-sm font-semibold">{urgentNotice.title}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('notices', urgentNotice._id)}
            className="text-xs font-semibold underline hover:text-rose-100 shrink-0"
          >
            Read Notice
          </button>
        </div>
      )}

      {/* Personalized Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>Campus Digital Network</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user ? user.fullName : 'Campus Member'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {user?.role === 'admin'
                ? 'Campus Administration Console active. Oversee academic affairs, grievance redressal, and system metrics.'
                : user?.role === 'faculty'
                ? `Department of ${user.department}. Manage course materials, departmental circulars, and symposiums.`
                : `Student Portal • ${user?.department || 'Engineering'} (${user?.semester || 'Semester 4'}). All campus services are synced.`}
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dash-quick-notices"
              onClick={() => onNavigate('notices')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold transition-colors"
            >
              Notices
            </button>
            <button
              id="dash-quick-events"
              onClick={() => onNavigate('events')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold transition-colors"
            >
              Events
            </button>
            <button
              id="dash-quick-complaints"
              onClick={() => onNavigate('complaints')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              Submit Grievance
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          id="stat-card-notices"
          onClick={() => onNavigate('notices')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Notices</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{notices.length}</div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{pinnedNotices.length} pinned</span> announcements
          </p>
        </div>

        <div
          id="stat-card-events"
          onClick={() => onNavigate('events')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Upcoming Events</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{events.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Open for registration
          </p>
        </div>

        <div
          id="stat-card-complaints"
          onClick={() => onNavigate('complaints')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              {user?.role === 'admin' ? 'Total Complaints' : 'Grievance Redressal'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{complaints.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            <span className="text-amber-600 font-semibold">
              {complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length} in progress
            </span>
          </p>
        </div>

        <div
          id="stat-card-lostfound"
          onClick={() => onNavigate('lost-found')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Lost & Found</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{lostItems.length}</div>
          <p className="text-[11px] text-violet-600 font-medium mt-1">
            Active listings to claim
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notices & Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Official Notices Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">Campus Circulars & Notices</h3>
                <p className="text-xs text-slate-500">Official university bulletins and examination notices</p>
              </div>
              <button
                onClick={() => onNavigate('notices')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View all ({notices.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Pinned notices first */}
              {pinnedNotices.map((notice) => (
                <div
                  key={notice._id}
                  id={`dash-pinned-${notice._id}`}
                  onClick={() => onNavigate('notices', notice._id)}
                  className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer flex items-start gap-3"
                >
                  <Pin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                        Pinned
                      </span>
                      <span className="text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-amber-200">
                        {notice.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(notice.publishDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900">{notice.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notice.description}</p>
                  </div>
                </div>
              ))}

              {/* Regular notices */}
              {regularNotices.map((notice) => (
                <div
                  key={notice._id}
                  id={`dash-notice-${notice._id}`}
                  onClick={() => onNavigate('notices', notice._id)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        {notice.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(notice.publishDate).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-slate-400">• Dept: {notice.department}</span>
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900">{notice.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notice.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events Spotlight */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">Featured Campus Events</h3>
                <p className="text-xs text-slate-500">Workshops, guest seminars, hackathons, and sports</p>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                All Events ({events.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.slice(0, 2).map((event) => (
                <div
                  key={event._id}
                  id={`dash-event-${event._id}`}
                  className="rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow group bg-slate-50/30"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                    <img
                      src={event.banner}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {event.category}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{event.date} • {event.startTime}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{event.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800">{event.registeredCount}</span> / {event.maxParticipants} Seats
                      </div>
                      <button
                        onClick={() => handleRegisterEvent(event._id, event.title)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          event.isUserRegistered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {event.isUserRegistered ? 'Registered ✓' : 'Register Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Grievance Status & Lost & Found */}
        <div className="space-y-6">
          {/* Grievance Redressal Status Mini-Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                Grievance Tickets
              </h3>
              <button
                onClick={() => onNavigate('complaints')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Track All
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Transparent 5-stage resolution monitoring for campus facilities and academic concerns.
            </p>

            <div className="space-y-2.5">
              {complaints.slice(0, 3).map((comp) => {
                let badgeColor = 'bg-amber-100 text-amber-800';
                if (comp.status === 'Resolved' || comp.status === 'Closed') {
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                } else if (comp.status === 'In Progress') {
                  badgeColor = 'bg-blue-100 text-blue-800';
                }

                return (
                  <div
                    key={comp._id}
                    onClick={() => onNavigate('complaints', comp._id)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-600">
                        {comp.complaintId}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{comp.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{comp.location}</p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('complaints')}
              className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              File a Grievance Ticket
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lost & Found Spotlight */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-violet-600" />
                Lost & Found Hub
              </h3>
              <button
                onClick={() => onNavigate('lost-found')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Browse All
              </button>
            </div>

            <div className="space-y-2.5">
              {lostItems.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  onClick={() => onNavigate('lost-found', item._id)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-violet-300 transition-colors cursor-pointer flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[10px] uppercase shrink-0 ${
                      item.type === 'lost'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {item.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.itemName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
