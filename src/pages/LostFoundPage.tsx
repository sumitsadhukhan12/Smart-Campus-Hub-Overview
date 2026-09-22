import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { LostFoundItem, LostFoundType } from '../types.ts';
import {
  Search,
  Plus,
  X,
  Package,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Trash2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface LostFoundPageProps {
  initialItemId?: string | null;
}

export default function LostFoundPage({ initialItemId }: LostFoundPageProps) {
  const { user, setShowAuthModal } = useAuth();
  const { showToast } = useNotifications();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal states
  const [activeItem, setActiveItem] = useState<LostFoundItem | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formType, setFormType] = useState<LostFoundType>('lost');
  const [formItemName, setFormItemName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Electronics');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formContactPhone, setFormContactPhone] = useState(user?.phone || '');
  const [formImage, setFormImage] = useState('');

  const categories = [
    'Electronics',
    'ID Cards & Documents',
    'Books & Notebooks',
    'Wallets & Keys',
    'Bags & Backpacks',
    'Clothing & Accessories',
    'Sports Gear',
    'Other',
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.lostFound.list({
        type: selectedType === 'all' ? undefined : selectedType,
        category: selectedCategory,
        search,
      });
      setItems(res.items || []);

      if (initialItemId) {
        const found = (res.items || []).find((i) => i._id === initialItemId);
        if (found) setActiveItem(found);
      }
    } catch (err) {
      console.error('Failed to fetch lost found items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedType, selectedCategory, search]);

  const handlePostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName || !formDescription || !formLocation) return;

    setSubmitting(true);
    try {
      await api.lostFound.create({
        type: formType,
        itemName: formItemName,
        description: formDescription,
        category: formCategory,
        location: formLocation,
        date: formDate,
        contactInfo: {
          name: user?.fullName || 'Campus Member',
          phone: formContactPhone,
          email: user?.email || '',
        },
        image: formImage || undefined,
      });

      showToast('Item Posted', `${formType === 'lost' ? 'Lost item' : 'Found item'} published to board.`, 'success');
      setShowPostModal(false);
      setFormItemName('');
      setFormDescription('');
      setFormLocation('');
      setFormImage('');
      fetchItems();
    } catch (err: any) {
      showToast('Posting Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    setSubmitting(true);
    try {
      const res = await api.lostFound.claim(activeItem._id, claimMessage);
      showToast('Claim Filed', res.message, 'success');
      setShowClaimModal(false);
      setClaimMessage('');
      setActiveItem(res.item);
      fetchItems();
    } catch (err: any) {
      showToast('Claim Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReturned = async (id: string) => {
    try {
      const res = await api.lostFound.markReturned(id);
      showToast('Success', res.message, 'success');
      setActiveItem(res.item);
      fetchItems();
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.lostFound.delete(id);
      showToast('Listing Removed', 'Item removed from Lost & Found.', 'info');
      if (activeItem?._id === id) setActiveItem(null);
      fetchItems();
    } catch (err: any) {
      showToast('Failed to delete', err.message, 'error');
    }
  };

  return (
    <div id="lost-found-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Post Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-violet-600" />
            Campus Lost & Found Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Reuniting lost student IDs, keys, calculators, electronics, and valuables across the campus.
          </p>
        </div>

        <button
          id="post-lostfound-btn"
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowPostModal(true);
          }}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Report Lost / Found Item
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="lostfound-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, location, description..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
            />
          </div>

          {/* Type Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('lost')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'lost' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Lost Items
            </button>
            <button
              onClick={() => setSelectedType('found')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === 'found' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Found Items
            </button>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-violet-600 text-white shadow-xs'
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
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading lost and found items...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="font-semibold text-slate-700">No items listed</p>
          <p className="text-xs text-slate-400 mt-1">Try changing the category or search keywords</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isLost = item.type === 'lost';
            const isReturned = item.status === 'Returned';
            const isOwner = user?._id === item.postedBy.id || user?.role === 'admin';

            return (
              <div
                key={item._id}
                id={`lostfound-card-${item._id}`}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs hover:shadow-lg transition-all group"
              >
                {/* Image / Thumbnail */}
                <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Package className="w-12 h-12 stroke-1" />
                      <span className="text-xs mt-1 text-slate-400">No image provided</span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm ${
                        isLost ? 'bg-rose-600 text-white' : 'bg-teal-600 text-white'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        isReturned
                          ? 'bg-emerald-600 text-white'
                          : item.status === 'Claim Requested'
                          ? 'bg-amber-600 text-white'
                          : 'bg-black/60 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>

                    <h3
                      onClick={() => setActiveItem(item)}
                      className="font-bold text-base text-slate-900 hover:text-violet-700 cursor-pointer transition-colors line-clamp-1"
                    >
                      {item.itemName}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveItem(item)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Inspect Details
                    </button>

                    {!isReturned && !isLost && (
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowAuthModal(true);
                            return;
                          }
                          setActiveItem(item);
                          setShowClaimModal(true);
                        }}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                      >
                        Claim Item
                      </button>
                    )}

                    {isOwner && !isReturned && (
                      <button
                        onClick={() => handleMarkReturned(item._id)}
                        className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl transition-colors"
                        title="Mark as Returned"
                      >
                        Returned ✓
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {activeItem && (
        <div
          id="lostfound-detail-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="lostfound-detail-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
          >
            {activeItem.image && (
              <div className="h-52 w-full bg-slate-900">
                <img
                  src={activeItem.image}
                  alt={activeItem.itemName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      activeItem.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {activeItem.type}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Status: {activeItem.status}
                  </span>
                </div>
                <button
                  onClick={() => setActiveItem(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{activeItem.itemName}</h2>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                {activeItem.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Category</span>
                  <strong className="text-slate-800">{activeItem.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Reported Date</span>
                  <strong className="text-slate-800">{activeItem.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Location Found / Lost</span>
                  <strong className="text-slate-800">{activeItem.location}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Contact Person</span>
                  <strong className="text-slate-800">{activeItem.contactInfo.name}</strong>
                </div>
              </div>

              {activeItem.contactInfo.phone && (
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-900 font-semibold">
                    <Phone className="w-4 h-4 text-violet-600" />
                    <span>Contact Number: {activeItem.contactInfo.phone}</span>
                  </div>
                  <span className="text-[11px] text-violet-700">Campus Verified</span>
                </div>
              )}

              {activeItem.claimedBy && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <h4 className="font-bold text-amber-900 mb-1">Claim Request Pending</h4>
                  <p className="text-amber-800">
                    <strong>{activeItem.claimedBy.name}</strong> ({activeItem.claimedBy.email}) claimed on{' '}
                    {new Date(activeItem.claimedBy.claimedAt).toLocaleDateString()}:
                  </p>
                  <p className="italic text-amber-900/80 mt-1">"{activeItem.claimedBy.message}"</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>

              {activeItem.status !== 'Returned' && activeItem.type === 'found' && (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  File Ownership Claim
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && activeItem && (
        <div
          id="claim-item-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="claim-item-modal"
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Claim "{activeItem.itemName}"</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide unique identifying marks (e.g. serial number, lock screen photo, engravings) to prove you are the rightful owner.
            </p>

            <form onSubmit={handleClaim} className="space-y-3">
              <textarea
                required
                rows={4}
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Describe specific features or proofs only the true owner would know..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Lost/Found Item Modal */}
      {showPostModal && (
        <div
          id="post-lostfound-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="post-lostfound-modal"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 bg-gradient-to-r from-violet-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-violet-300" />
                <h3 className="font-bold text-base">Report Campus Item</h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostItem} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('lost')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 ${
                      formType === 'lost'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    I Lost an Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('found')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 ${
                      formType === 'found'
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    I Found an Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  placeholder="e.g. Casio fx-991EX Scientific Calculator"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location *</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Library 2nd Floor Reading Room / South Canteen"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Characteristics *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Color, brand, stickers, scratches, case color..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="+1 555-019-2831"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
