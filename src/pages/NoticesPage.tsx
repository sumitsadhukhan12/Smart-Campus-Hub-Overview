import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { Notice, NoticeCategory, PriorityLevel } from '../types.ts';
import {
  Bell,
  Search,
  Filter,
  Pin,
  Calendar,
  Building,
  User,
  Plus,
  X,
  Trash2,
  Edit2,
  FileText,
  Download,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface NoticesPageProps {
  initialNoticeId?: string | null;
}

export default function NoticesPage({ initialNoticeId }: NoticesPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Modal states
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for creating notice
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('Academic');
  const [formDepartment, setFormDepartment] = useState('All');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('medium');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');

  const categories: NoticeCategory[] = [
    'General',
    'Examination',
    'Academic',
    'Holiday',
    'Placement',
    'Scholarship',
    'Department',
    'Emergency',
  ];

  const departments = [
    'All',
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
  ];

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.notices.list({
        category: selectedCategory,
        department: selectedDepartment,
        priority: selectedPriority,
        search,
      });
      setNotices(res.notices || []);

      if (initialNoticeId) {
        const found = (res.notices || []).find((n) => n._id === initialNoticeId);
        if (found) setActiveNotice(found);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory, selectedDepartment, selectedPriority, search]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription) return;

    setSubmitting(true);
    try {
      const payload: Partial<Notice> = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        department: formDepartment,
        priority: formPriority,
        isPinned: formIsPinned,
        expiryDate: formExpiryDate || undefined,
        attachment: formAttachmentName
          ? {
              name: formAttachmentName.endsWith('.pdf') ? formAttachmentName : `${formAttachmentName}.pdf`,
              url: `https://campus.edu/docs/${encodeURIComponent(formAttachmentName)}.pdf`,
              size: '1.8 MB',
            }
          : undefined,
      };

      await api.notices.create(payload);
      showToast('Notice Published', 'Notice has been published to all students & staff.', 'success');
      setShowCreateModal(false);
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormExpiryDate('');
      setFormAttachmentName('');
      setFormIsPinned(false);
      fetchNotices();
    } catch (err: any) {
      showToast('Publication Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.notices.delete(id);
      showToast('Notice Deleted', 'Notice removed from campus bulletin.', 'info');
      if (activeNotice?._id === id) setActiveNotice(null);
      fetchNotices();
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    }
  };

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const canPublish = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div id="notices-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-600" />
            Campus Notice Board
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Official bulletins, academic dates, examination timetables, and campus notifications.
          </p>
        </div>

        {canPublish && (
          <button
            id="create-notice-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish New Notice
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
              id="notice-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices by title, keyword, or publisher..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* Department Filter */}
          <select
            id="notice-dept-filter"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="All">All Departments</option>
            {departments.slice(1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            id="notice-priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="All">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading campus notices...
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-semibold text-slate-700">No notices found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => {
            const isAuthorized =
              user?.role === 'admin' || (user?.role === 'faculty' && notice.publishedBy.id === user._id);

            return (
              <div
                key={notice._id}
                id={`notice-card-${notice._id}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-2xs hover:shadow-md ${
                  notice.isPinned
                    ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {notice.isPinned && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        {notice.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(
                          notice.priority
                        )}`}
                      >
                        {notice.priority}
                      </span>
                    </div>

                    {isAuthorized && (
                      <button
                        onClick={() => handleDeleteNotice(notice._id)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3
                    onClick={() => setActiveNotice(notice)}
                    className="font-bold text-base text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {notice.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {notice.publishedBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {notice.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {notice.attachment && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold text-[11px] bg-blue-50 px-2 py-0.5 rounded">
                        <FileText className="w-3 h-3" />
                        PDF Attached
                      </span>
                    )}
                    <button
                      onClick={() => setActiveNotice(notice)}
                      className="text-xs font-semibold text-blue-600 hover:underline ml-1"
                    >
                      Read Full →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice Detail Modal */}
      {activeNotice && (
        <div
          id="notice-detail-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="notice-detail-modal"
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                    {activeNotice.category}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityStyle(
                      activeNotice.priority
                    )}`}
                  >
                    Priority: {activeNotice.priority}
                  </span>
                  {activeNotice.isPinned && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{activeNotice.title}</h2>
              </div>
              <button
                onClick={() => setActiveNotice(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span>
                  <strong>Published by:</strong> {activeNotice.publishedBy.name} ({activeNotice.publishedBy.role})
                </span>
                <span>
                  <strong>Department:</strong> {activeNotice.department}
                </span>
                <span>
                  <strong>Date:</strong> {new Date(activeNotice.publishDate).toLocaleDateString()}
                </span>
                {activeNotice.expiryDate && (
                  <span>
                    <strong>Valid Until:</strong> {activeNotice.expiryDate}
                  </span>
                )}
              </div>

              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {activeNotice.description}
              </div>

              {activeNotice.attachment && (
                <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {activeNotice.attachment.name}
                      </p>
                      <p className="text-xs text-slate-500">{activeNotice.attachment.size} • Official Document</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Downloading', `Downloading ${activeNotice.attachment?.name}...`, 'info');
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveNotice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Notice Modal (Faculty & Admin) */}
      {showCreateModal && (
        <div
          id="create-notice-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="create-notice-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">Publish Official Notice</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. End Semester Exam Timetable Released"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent (Red Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide complete circular details, timings, guidelines, and directives..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment File Name (PDF)</label>
                <input
                  type="text"
                  value={formAttachmentName}
                  onChange={(e) => setFormAttachmentName(e.target.value)}
                  placeholder="e.g. Exam_Schedule_Spring_2026.pdf"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-notice-check"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="pin-notice-check" className="text-xs font-semibold text-slate-700">
                  Pin this notice to top of board
                </label>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {submitting ? 'Publishing...' : 'Publish to Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
