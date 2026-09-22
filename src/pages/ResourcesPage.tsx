import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { AcademicResource, ResourceType } from '../types.ts';
import {
  BookOpen,
  Search,
  Download,
  Upload,
  FileText,
  Trash2,
  X,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ResourcesPageProps {
  initialResourceId?: string | null;
}

export default function ResourcesPage({ initialResourceId }: ResourcesPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDepartment, setFormDepartment] = useState('Computer Science & Engineering');
  const [formSemester, setFormSemester] = useState('Semester 4');
  const [formResourceType, setFormResourceType] = useState<ResourceType>('Notes');
  const [formDescription, setFormDescription] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileSize, setFormFileSize] = useState('2.8 MB');

  const departments = [
    'All',
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
  ];

  const semesters = [
    'All',
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  const resourceTypes: ResourceType[] = [
    'Notes',
    'Previous Year Questions',
    'Lab Manual',
    'Syllabus',
    'Study Material',
    'E-Book',
    'Assignment',
    'PDF',
  ];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.resources.list({
        department: selectedDepartment,
        semester: selectedSemester,
        type: selectedType,
        search,
      });
      setResources(res.resources || []);
    } catch (err) {
      console.error('Failed to fetch academic resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedDepartment, selectedSemester, selectedType, search]);

  const handleDownload = async (resource: AcademicResource) => {
    try {
      const res = await api.resources.download(resource._id);
      showToast('Download Started', `Downloading "${res.fileName}" (${res.resource.fileSize})...`, 'success');
      // Update local download count
      setResources((prev) =>
        prev.map((r) => (r._id === resource._id ? { ...r, downloadCount: r.downloadCount + 1 } : r))
      );
    } catch (err: any) {
      showToast('Download error', err.message, 'error');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSubject) return;

    setSubmitting(true);
    try {
      await api.resources.upload({
        title: formTitle,
        subject: formSubject,
        department: formDepartment,
        semester: formSemester,
        resourceType: formResourceType,
        description: formDescription,
        fileName: formFileName ? (formFileName.endsWith('.pdf') ? formFileName : `${formFileName}.pdf`) : `${formSubject.replace(/\s+/g, '_')}_Notes.pdf`,
        fileSize: formFileSize || '2.5 MB',
        fileUrl: `https://campus.edu/storage/academic/${encodeURIComponent(formTitle)}.pdf`,
      });

      showToast('Resource Uploaded', 'Published to campus academic repository.', 'success');
      setShowUploadModal(false);
      setFormTitle('');
      setFormSubject('');
      setFormDescription('');
      setFormFileName('');
      fetchResources();
    } catch (err: any) {
      showToast('Upload Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this academic resource from repository?')) return;
    try {
      await api.resources.delete(id);
      showToast('Resource Removed', 'File deleted from repository.', 'info');
      fetchResources();
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    }
  };

  const getTypeBadge = (type: ResourceType) => {
    switch (type) {
      case 'Notes':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Previous Year Questions':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Lab Manual':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Syllabus':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'E-Book':
      case 'Study Material':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div id="resources-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Academic Resource Repository
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Verified lecture notes, previous year question papers (PYQs), laboratory manuals, and course syllabi.
          </p>
        </div>

        <button
          id="upload-resource-btn"
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowUploadModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload Study Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="resource-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject (e.g. Operating Systems), title, or teacher..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Department Filter */}
          <select
            id="resource-dept-filter"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          >
            <option value="All">All Departments</option>
            {departments.slice(1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            id="resource-sem-filter"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          >
            <option value="All">All Semesters</option>
            {semesters.slice(1).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedType === 'All'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types
          </button>
          {resourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading academic resources...
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-semibold text-slate-700">No study materials found</p>
          <p className="text-xs text-slate-400 mt-1">Try refining search query or resetting filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => {
            const isOwner = user?._id === res.uploadedBy.id || user?.role === 'admin';

            return (
              <div
                key={res._id}
                id={`resource-card-${res._id}`}
                className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeBadge(
                          res.resourceType
                        )}`}
                      >
                        {res.resourceType}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {res.semester}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(res._id)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                    {res.title}
                  </h3>

                  <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                    Subject: {res.subject}
                  </p>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {res.description || 'Verified course curriculum notes and comprehensive syllabus content.'}
                  </p>

                  <div className="mt-3 pt-2 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{res.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Uploaded by {res.uploadedBy.name}</span>
                    </div>
                  </div>
                </div>

                {/* Footer & Download button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">{res.downloadCount}</span> downloads • {res.fileSize}
                  </div>

                  <button
                    id={`download-btn-${res._id}`}
                    onClick={() => handleDownload(res)}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-transparent font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div
          id="upload-resource-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="upload-resource-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-gradient-to-r from-indigo-800 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">Share Study Material</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Distributed Operating Systems - Complete Handouts"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Course *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Type</label>
                  <select
                    value={formResourceType}
                    onChange={(e) => setFormResourceType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {resourceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {departments.slice(1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Semester</label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {semesters.slice(1).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Topics Covered</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Units included, exam revision highlights, professor notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document File Name</label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    placeholder="OS_Module1_to_5.pdf"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">File Size</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="3.2 MB"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {submitting ? 'Uploading...' : 'Publish to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
