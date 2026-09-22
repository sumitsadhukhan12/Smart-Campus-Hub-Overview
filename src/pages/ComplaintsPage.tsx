import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { Complaint, ComplaintCategory, ComplaintStatus, PriorityLevel } from '../types.ts';
import {
  AlertOctagon,
  Search,
  Plus,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  User,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

interface ComplaintsPageProps {
  initialComplaintId?: string | null;
}

export default function ComplaintsPage({ initialComplaintId }: ComplaintsPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Active / Selected complaint
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Submit Complaint form
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ComplaintCategory>('Infrastructure');
  const [formLocation, setFormLocation] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('medium');
  const [formImage, setFormImage] = useState('');

  // Status update form for Admin/Faculty
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Response message
  const [responseMsg, setResponseMsg] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  const categories: ComplaintCategory[] = [
    'Infrastructure',
    'Hostel',
    'Library',
    'Internet',
    'Classroom',
    'Electricity',
    'Cleanliness',
    'Transport',
    'Academic',
    'Other',
  ];

  const statuses: ComplaintStatus[] = [
    'Submitted',
    'Under Review',
    'In Progress',
    'Resolved',
    'Closed',
  ];

  const fetchComplaints = async () => {
    if (!user) {
      setComplaints([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.complaints.list({
        category: selectedCategory,
        status: selectedStatus,
        priority: selectedPriority,
        search,
      });
      setComplaints(res.complaints || []);

      if (initialComplaintId) {
        const found = (res.complaints || []).find(
          (c) => c._id === initialComplaintId || c.complaintId === initialComplaintId
        );
        if (found) setActiveComplaint(found);
      } else if (!activeComplaint && res.complaints && res.complaints.length > 0) {
        setActiveComplaint(res.complaints[0]);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user, selectedCategory, selectedStatus, selectedPriority, search]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation) return;

    setSubmitting(true);
    try {
      const res = await api.complaints.create({
        title: formTitle,
        description: formDescription,
        category: formCategory,
        location: formLocation,
        priority: formPriority,
        image: formImage || undefined,
      });

      showToast('Grievance Lodged', res.message, 'success');
      setShowSubmitModal(false);
      setFormTitle('');
      setFormDescription('');
      setFormLocation('');
      setFormImage('');
      fetchComplaints();
      if (res.complaint) setActiveComplaint(res.complaint);
    } catch (err: any) {
      showToast('Submission Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!activeComplaint) return;
    setUpdatingStatus(true);
    try {
      const res = await api.complaints.updateStatus(activeComplaint._id, newStatus, statusNote);
      showToast('Status Updated', `Ticket changed to ${newStatus}`, 'success');
      setStatusNote('');
      setActiveComplaint(res.complaint);
      setComplaints((prev) =>
        prev.map((c) => (c._id === res.complaint._id ? res.complaint : c))
      );
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !responseMsg.trim()) return;

    setSendingResponse(true);
    try {
      const res = await api.complaints.postResponse(activeComplaint._id, responseMsg);
      showToast('Response Logged', 'Message posted to discussion thread.', 'success');
      setResponseMsg('');
      setActiveComplaint(res.complaint);
      setComplaints((prev) =>
        prev.map((c) => (c._id === res.complaint._id ? res.complaint : c))
      );
    } catch (err: any) {
      showToast('Response error', err.message, 'error');
    } finally {
      setSendingResponse(false);
    }
  };

  const getStatusStepIndex = (status: ComplaintStatus) => {
    return statuses.indexOf(status);
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const canManageStatus = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div id="complaints-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Submit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-amber-600" />
            Campus Grievance Redressal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit, track, and resolve facility issues, academic concerns, hostel grievances, and IT faults.
          </p>
        </div>

        <button
          id="submit-complaint-btn"
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowSubmitModal(true);
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          File New Grievance
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="complaint-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID (e.g. CMP-2026), location, issue..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="complaint-cat-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="complaint-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            <option value="All">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            id="complaint-priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            <option value="All">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint Tickets List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
            <span>Ticket Queue ({complaints.length})</span>
            {user?.role === 'student' && <span>Showing your tickets</span>}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-700">No grievance tickets found</p>
              <p className="text-xs text-slate-400 mt-1">Submit a grievance above to track resolution.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {complaints.map((c) => {
                const isSelected = activeComplaint?._id === c._id;
                return (
                  <div
                    key={c._id}
                    id={`complaint-card-${c._id}`}
                    onClick={() => setActiveComplaint(c)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/40 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {c.complaintId}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.location}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Complaint Detail & Lifecycle Tracker (7 cols) */}
        <div className="lg:col-span-7">
          {activeComplaint ? (
            <div
              id="active-complaint-detail"
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                      {activeComplaint.complaintId}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusBadge(
                        activeComplaint.status
                      )}`}
                    >
                      {activeComplaint.status}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded-lg">
                      {activeComplaint.category}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    Logged: {new Date(activeComplaint.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{activeComplaint.title}</h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  <span>
                    <strong>Filed by:</strong> {activeComplaint.submittedBy.name} ({activeComplaint.submittedBy.department})
                  </span>
                  <span>
                    <strong>Location:</strong> {activeComplaint.location}
                  </span>
                  <span>
                    <strong>Priority:</strong>{' '}
                    <span className="capitalize font-bold text-slate-700">{activeComplaint.priority}</span>
                  </span>
                </div>
              </div>

              {/* 5-Step Visual Lifecycle Stepper */}
              <div className="p-6 border-b border-slate-100 bg-white">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Resolution Lifecycle Progress
                </h4>

                <div className="relative flex items-center justify-between">
                  {/* Background progress line */}
                  <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
                  <div
                    className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-emerald-500 -z-0 transition-all duration-300"
                    style={{
                      width: `${(getStatusStepIndex(activeComplaint.status) / (statuses.length - 1)) * 92}%`,
                    }}
                  />

                  {statuses.map((step, idx) => {
                    const currentIdx = getStatusStepIndex(activeComplaint.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isCurrent
                              ? 'bg-amber-600 text-white ring-4 ring-amber-100'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 text-center whitespace-nowrap ${
                            isCurrent ? 'text-amber-700 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail & Description Body */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Issue Description
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {activeComplaint.description}
                  </p>
                </div>

                {activeComplaint.image && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Photographic Proof Attached
                    </h4>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 max-w-sm">
                      <img
                        src={activeComplaint.image}
                        alt="Proof"
                        className="w-full h-44 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Status Update Control (Admin & Faculty) */}
                {canManageStatus && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Admin Redressal Action
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium">Update complaint progress</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                          className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Officer Note / Action Taken
                        </label>
                        <input
                          type="text"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="e.g. Electrician dispatched; breaker replaced"
                          className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs"
                    >
                      {updatingStatus ? 'Saving...' : 'Apply Status Update'}
                    </button>
                  </div>
                )}

                {/* Audit Timeline Log */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Audit Log & Activity History
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                    {activeComplaint.timeline.map((entry, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        <p className="text-xs font-bold text-slate-800">
                          {entry.status} • <span className="font-normal text-slate-500">{entry.note}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          By {entry.updatedBy} at {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discussion / Responses Thread */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    Discussion & Resolution Notes ({activeComplaint.responses.length})
                  </h4>

                  <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
                    {activeComplaint.responses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No notes posted yet.</p>
                    ) : (
                      activeComplaint.responses.map((resp) => (
                        <div key={resp.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800">
                              {resp.authorName}{' '}
                              <span className="text-[10px] font-semibold text-blue-600 capitalize">
                                ({resp.authorRole})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{resp.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add response form */}
                  <form onSubmit={handleSendResponse} className="flex gap-2">
                    <input
                      type="text"
                      value={responseMsg}
                      onChange={(e) => setResponseMsg(e.target.value)}
                      placeholder="Add a remark or inquiry regarding this ticket..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!responseMsg.trim() || sendingResponse}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <p className="font-bold text-slate-700">Select a ticket to inspect details</p>
              <p className="text-xs text-slate-400 mt-1">
                View stage progression, response threads, and admin action logs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Grievance Modal */}
      {showSubmitModal && (
        <div
          id="submit-complaint-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="submit-complaint-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">File Grievance Ticket</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Subject / Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Library 3rd Floor Wi-Fi unreachable"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="low">Low (Standard)</option>
                    <option value="medium">Medium (Within 48h)</option>
                    <option value="high">High (Needs Attention)</option>
                    <option value="urgent">Urgent (Safety / Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exact Campus Location *</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Block B, Room 304 / Boys Hostel Block 2"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the problem accurately to help the maintenance team resolve it faster..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL (Optional Proof)</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {submitting ? 'Lodging...' : 'File Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
