import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { EventItem, EventCategory } from '../types.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface EventsPageProps {
  initialEventId?: string | null;
}

export default function EventsPage({ initialEventId }: EventsPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Modal states
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('Workshop');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formEndTime, setFormEndTime] = useState('01:00 PM');
  const [formVenue, setFormVenue] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState('120');
  const [formRegistrationDeadline, setFormRegistrationDeadline] = useState('');
  const [formBanner, setFormBanner] = useState('');

  const categories: EventCategory[] = [
    'Workshop',
    'Seminar',
    'Cultural',
    'Sports',
    'Technical',
    'Hackathon',
    'Club',
    'Placement',
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.events.list({
        category: selectedCategory,
        filter: timeFilter === 'all' ? undefined : timeFilter,
        search,
      });
      setEvents(res.events || []);

      if (initialEventId) {
        const found = (res.events || []).find((e) => e._id === initialEventId);
        if (found) setActiveEvent(found);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, timeFilter, search]);

  const handleRegister = async (eventId: string, title: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      await api.events.register(eventId);
      showToast('Registration Confirmed', `Seat booked successfully for ${title}!`, 'success');
      fetchEvents();
      if (activeEvent?._id === eventId) {
        setActiveEvent((prev) => (prev ? { ...prev, isUserRegistered: true, registeredCount: prev.registeredCount + 1 } : null));
      }
    } catch (err: any) {
      showToast('Registration Failed', err.message, 'warning');
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!confirm('Cancel your event seat registration?')) return;
    try {
      await api.events.cancelRegistration(eventId);
      showToast('Registration Cancelled', 'Your seat has been released.', 'info');
      fetchEvents();
      if (activeEvent?._id === eventId) {
        setActiveEvent((prev) => (prev ? { ...prev, isUserRegistered: false, registeredCount: Math.max(0, prev.registeredCount - 1) } : null));
      }
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formVenue) return;

    setSubmitting(true);
    try {
      const payload: Partial<EventItem> = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        venue: formVenue,
        organizer: formOrganizer || user?.fullName,
        maxParticipants: Number(formMaxParticipants) || 100,
        registrationDeadline: formRegistrationDeadline || formDate,
        banner: formBanner || undefined,
      };

      await api.events.create(payload);
      showToast('Event Created', 'Event published to campus calendar.', 'success');
      setShowCreateModal(false);
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormDate('');
      setFormVenue('');
      setFormBanner('');
      fetchEvents();
    } catch (err: any) {
      showToast('Creation Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.events.delete(id);
      showToast('Event Removed', 'Event removed from calendar.', 'info');
      if (activeEvent?._id === id) setActiveEvent(null);
      fetchEvents();
    } catch (err: any) {
      showToast('Delete error', err.message, 'error');
    }
  };

  const canCreate = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div id="events-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Campus Events & Hackathons
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse upcoming workshops, technical symposiums, cultural celebrations, and register with 1 click.
          </p>
        </div>

        {canCreate && (
          <button
            id="create-event-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Campus Event
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="event-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, organizer, or venue..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Time Filter Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTimeFilter('upcoming')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeFilter === 'upcoming' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeFilter('past')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeFilter === 'past' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading campus events...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-semibold text-slate-700">No events found</p>
          <p className="text-xs text-slate-400 mt-1">Try changing the category or date filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isFull = event.registeredCount >= event.maxParticipants;
            const progress = Math.min(100, Math.round((event.registeredCount / event.maxParticipants) * 100));

            return (
              <div
                key={event._id}
                id={`event-card-${event._id}`}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs hover:shadow-lg transition-all group"
              >
                {/* Banner Header */}
                <div className="h-44 w-full relative overflow-hidden bg-slate-800">
                  <img
                    src={event.banner}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    {event.category}
                  </div>

                  {canCreate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event._id);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{event.date} • {event.startTime}</span>
                    </div>

                    <h3
                      onClick={() => setActiveEvent(event)}
                      className="font-bold text-base text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors line-clamp-1"
                    >
                      {event.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Organized by {event.organizer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Progress & Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Seat Capacity</span>
                        <span className="font-bold text-slate-800">
                          {event.registeredCount} / {event.maxParticipants} booked
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isFull ? 'bg-rose-500' : progress > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveEvent(event)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Details
                      </button>

                      {event.isUserRegistered ? (
                        <button
                          onClick={() => handleCancelRegistration(event._id)}
                          className="flex-1 py-2 bg-emerald-100 hover:bg-rose-50 text-emerald-800 hover:text-rose-700 border border-emerald-300 hover:border-rose-300 text-xs font-semibold rounded-xl transition-all"
                        >
                          Booked ✓ (Cancel)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(event._id, event.title)}
                          disabled={isFull}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                        >
                          {isFull ? 'Sold Out' : 'Register'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      {activeEvent && (
        <div
          id="event-detail-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="event-detail-modal"
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="h-56 w-full relative bg-slate-900">
              <img
                src={activeEvent.banner}
                alt={activeEvent.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setActiveEvent(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white uppercase tracking-wider">
                {activeEvent.category}
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{activeEvent.date} ({activeEvent.startTime} - {activeEvent.endTime})</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{activeEvent.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Location & Venue</span>
                  <strong className="text-slate-800">{activeEvent.venue}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Event Organizer</span>
                  <strong className="text-slate-800">{activeEvent.organizer}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registration Deadline</span>
                  <strong className="text-slate-800">{activeEvent.registrationDeadline}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Confirmed Participants</span>
                  <strong className="text-slate-800">{activeEvent.registeredCount} of {activeEvent.maxParticipants}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-slate-800 mb-1">About This Event</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {activeEvent.description}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setActiveEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>

              {activeEvent.isUserRegistered ? (
                <button
                  onClick={() => handleCancelRegistration(activeEvent._id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Cancel Registration
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(activeEvent._id, activeEvent.title)}
                  disabled={activeEvent.registeredCount >= activeEvent.maxParticipants}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  Confirm Seat Registration
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal (Faculty & Admin) */}
      {showCreateModal && (
        <div
          id="create-event-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="create-event-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Host Campus Event</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. AI & Cloud Architecture Masterclass"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="01:00 PM"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Venue *</label>
                  <input
                    type="text"
                    required
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="Main Auditorium / Tech Lab 3"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Seat Capacity</label>
                  <input
                    type="number"
                    value={formMaxParticipants}
                    onChange={(e) => setFormMaxParticipants(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Outline speakers, agenda, prerequisites, certificate information..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {submitting ? 'Creating...' : 'Launch Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
