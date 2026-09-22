import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { EventItem, Complaint, LostFoundItem } from '../types.ts';
import {
  User,
  GraduationCap,
  Calendar,
  AlertOctagon,
  Package,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  QrCode,
  Edit2,
  Check,
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (tab: string, itemId?: string) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, updateUser, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'events' | 'complaints' | 'lostfound'>('events');
  const [registeredEvents, setRegisteredEvents] = useState<EventItem[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [userLostItems, setUserLostItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setPhone(user.phone || '');

    async function loadUserData() {
      setLoading(true);
      try {
        const [eRes, cRes, lRes] = await Promise.all([
          api.events.list(),
          api.complaints.list(),
          api.lostFound.list(),
        ]);

        // Filter user events
        const myEvents = (eRes.events || []).filter((e) => Boolean(e.isUserRegistered));
        setRegisteredEvents(myEvents);

        // Filter user complaints
        const myComplaints = (cRes.complaints || []).filter(
          (c) => user && c.submittedBy.id === user._id
        );
        setUserComplaints(myComplaints);

        // Filter user lost & found
        const myLost = (lRes.items || []).filter(
          (i) => user && i.postedBy.id === user._id
        );
        setUserLostItems(myLost);
      } catch (err) {
        console.error('Failed to load user profile items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      updateUser({ phone });
      showToast('Profile Saved', 'Emergency contact phone updated.', 'success');
      setIsEditing(false);
    } catch (err: any) {
      showToast('Update failed', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEventSeat = async (eventId: string) => {
    if (!confirm('Cancel your registration for this event?')) return;
    try {
      await api.events.cancelRegistration(eventId);
      showToast('Seat Cancelled', 'Registration cancelled.', 'info');
      setRegisteredEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900">Sign in to access your Campus Profile</h3>
        <button
          onClick={() => setShowAuthModal(true)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div id="profile-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          Member Profile & Digital Student ID
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Official University credentials, campus registration pass, and student service records.
        </p>
      </div>

      {/* Two Column Layout: ID Card on Left, Details & Tabs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Digital Campus Identity Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            id="digital-id-card"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-6 shadow-xl border border-slate-700/80"
          >
            {/* Card Background Watermark */}
            <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* University Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                  SCH
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-blue-200">
                    Smart Campus University
                  </h4>
                  <p className="text-[10px] text-slate-400">Institutional Identity Card</p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-blue-300">
                {user.role}
              </span>
            </div>

            {/* Member Info */}
            <div className="flex items-start gap-4 mb-5">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-slate-800"
              />

              <div className="space-y-1">
                <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                  {user.fullName}
                </h3>
                <p className="font-mono text-xs text-blue-300 font-semibold tracking-wider">
                  {user.collegeId}
                </p>
                <p className="text-xs text-slate-300">{user.department}</p>
                {user.semester && (
                  <p className="text-[11px] text-slate-400">Academic Year: {user.semester}</p>
                )}
              </div>
            </div>

            {/* Simulated Barcode & QR code */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex gap-1 h-7 items-center opacity-80">
                  <div className="w-1 h-7 bg-white" />
                  <div className="w-2 h-7 bg-white" />
                  <div className="w-0.5 h-7 bg-white" />
                  <div className="w-1.5 h-7 bg-white" />
                  <div className="w-1 h-7 bg-white" />
                  <div className="w-3 h-7 bg-white" />
                  <div className="w-1 h-7 bg-white" />
                  <div className="w-0.5 h-7 bg-white" />
                  <div className="w-2 h-7 bg-white" />
                  <div className="w-1.5 h-7 bg-white" />
                </div>
                <p className="text-[9px] font-mono text-slate-400 tracking-widest">
                  VALID: 2024 - 2028 ACADEMIC CYCLE
                </p>
              </div>

              <div className="w-12 h-12 bg-white p-1 rounded-xl flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Profile Information</h4>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit2 className="w-3 h-3" />
                {isEditing ? 'Cancel' : 'Edit Contact'}
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user.department}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {isEditing ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 019 2831"
                      className="px-2 py-1 text-xs border border-slate-300 rounded-lg flex-1"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <span>{user.phone || 'No phone registered'}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Activity Tabs (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-3 gap-4">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Registered Events ({registeredEvents.length})
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeTab === 'complaints'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Grievance Tickets ({userComplaints.length})
            </button>

            <button
              onClick={() => setActiveTab('lostfound')}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 ${
                activeTab === 'lostfound'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Lost & Found Reports ({userLostItems.length})
            </button>
          </div>

          <div className="p-6">
            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {registeredEvents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    You have not registered for any upcoming events yet.
                  </div>
                ) : (
                  registeredEvents.map((event) => (
                    <div
                      key={event._id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {event.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{event.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {event.date} • {event.startTime} • {event.venue}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelEventSeat(event._id)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl transition-colors shrink-0"
                      >
                        Cancel Seat
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-3">
                {userComplaints.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    No grievance tickets submitted.
                  </div>
                ) : (
                  userComplaints.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => onNavigate('complaints', c._id)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                            {c.complaintId}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {c.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{c.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.location}</p>
                      </div>

                      <span className="text-xs font-semibold text-amber-600 hover:underline shrink-0">
                        View Tracker →
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lost & Found Tab */}
            {activeTab === 'lostfound' && (
              <div className="space-y-3">
                {userLostItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    No lost or found items posted.
                  </div>
                ) : (
                  userLostItems.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => onNavigate('lost-found', item._id)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-violet-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">{item.status}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.itemName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
                      </div>

                      <span className="text-xs font-semibold text-violet-600 hover:underline shrink-0">
                        Inspect →
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
