import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Bell, Calendar, FileText, HelpCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    notices: any[];
    events: any[];
    complaints: any[];
    lostFound: any[];
    resources: any[];
  }>({ notices: [], events: [], complaints: [], lostFound: [], resources: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ notices: [], events: [], complaints: [], lostFound: [], resources: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ notices: [], events: [], complaints: [], lostFound: [], resources: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.global(query.trim());
        setResults(res.results);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits =
    results.notices.length +
    results.events.length +
    results.complaints.length +
    results.lostFound.length +
    results.resources.length;

  return (
    <div id="global-search-backdrop" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div
        id="global-search-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notices, events, grievances, lost items, resources..."
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-base outline-none font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              id="clear-search-btn"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="close-search-modal-btn"
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 bg-slate-200/70 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
              <p className="text-sm font-medium text-slate-600">Quick Campus Search</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Type at least 2 characters to search across official notices, upcoming college events, grievance tickets, lost belongings, and academic notes.
              </p>
            </div>
          )}

          {query && totalHits === 0 && !loading && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-medium text-slate-600">No matching campus records found</p>
              <p className="text-xs text-slate-400 mt-1">Try refining with different keywords or department name.</p>
            </div>
          )}

          {/* Notices */}
          {results.notices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Campus Notices ({results.notices.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.notices.map((n) => (
                  <button
                    key={n._id}
                    id={`search-notice-${n._id}`}
                    onClick={() => {
                      onNavigate('notices', n._id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-blue-700">
                          {n.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {n.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 ml-2 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Events & Hackathons ({results.events.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.events.map((e) => (
                  <button
                    key={e._id}
                    id={`search-event-${e._id}`}
                    onClick={() => {
                      onNavigate('events', e._id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-emerald-700">
                          {e.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          {e.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Venue: {e.venue} • {e.registeredCount}/{e.maxParticipants} Registered
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 ml-2 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Complaints */}
          {results.complaints.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Grievances / Complaints ({results.complaints.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.complaints.map((c) => (
                  <button
                    key={c._id}
                    id={`search-complaint-${c._id}`}
                    onClick={() => {
                      onNavigate('complaints', c._id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-100 flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          {c.complaintId}
                        </span>
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-amber-800">
                          {c.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: <span className="font-medium text-slate-700">{c.status}</span> • Location: {c.location}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 shrink-0 ml-2 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lost & Found */}
          {results.lostFound.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5 text-violet-600" />
                <span>Lost & Found Items ({results.lostFound.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.lostFound.map((l) => (
                  <button
                    key={l._id}
                    id={`search-lostfound-${l._id}`}
                    onClick={() => {
                      onNavigate('lost-found', l._id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-violet-50/70 border border-transparent hover:border-violet-100 flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                            l.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {l.type}
                        </span>
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-violet-800">
                          {l.itemName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Location: {l.location} • Status: {l.status}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 shrink-0 ml-2 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Academic Resources */}
          {results.resources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Academic Resources ({results.resources.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.resources.map((r) => (
                  <button
                    key={r._id}
                    id={`search-resource-${r._id}`}
                    onClick={() => {
                      onNavigate('resources', r._id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 flex items-start justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-indigo-800">
                          {r.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {r.resourceType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Subject: {r.subject} • {r.department} • {r.fileSize}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-2 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
