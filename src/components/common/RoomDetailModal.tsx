import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Room, Tenant, PhotoItem, FlatInfo, Invoice } from '../../types';
import { toBn } from '../../lib/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';

export interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  occupants: Tenant[];
  photos: PhotoItem[];
  flatInfo: FlatInfo;
  invoices?: Invoice[];
  isOwner?: boolean;
  onUpdatePhotos?: (photos: PhotoItem[]) => void;
  onEditRoom?: (room: Room) => void;
  onSelectTenant?: (tenant: Tenant) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  isOpen,
  onClose,
  room,
  occupants,
  photos,
  flatInfo,
  invoices = [],
  isOwner = true,
  onUpdatePhotos,
  onEditRoom,
  onSelectTenant
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'videos' | 'utility'>('info');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'condition' | 'furniture' | 'meter' | 'other'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'condition' | 'furniture' | 'meter' | 'other'>('condition');
  const [newPhotoData, setNewPhotoData] = useState('');
  const [isSharedWithTenant, setIsSharedWithTenant] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);
  const [copied, setCopied] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  // Format month to Bengali display
  const formatMonthBn = React.useCallback((monthStr?: string): string => {
    if (!monthStr) return 'চলতি মাস';
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const monthsBn = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${monthsBn[monthNum - 1]} ${toBn(year)}`;
      }
    }
    return monthStr;
  }, []);

  const roomUtilityHistory = React.useMemo(() => {
    if (!room) return [];
    const list = invoices.filter(inv => inv.room === room.name);
    
    // For vacant/empty rooms, if there are no bills, return empty array (do not show dummy/fallback data)
    if (room.status === 'empty' && list.length === 0) {
      return [];
    }

    if (list.length > 0) {
      return list.slice(0, 3).map(inv => ({
        month: formatMonthBn(inv.month),
        electricity: inv.breakdown?.electricity || 0,
        consumedUnits: inv.breakdown?.electricityMeter?.consumedUnits || 0,
        gas: inv.breakdown?.gas || 0,
        water: inv.breakdown?.water || 0,
        wifi: inv.breakdown?.wifi || 0,
        other: (inv.breakdown?.garbage || 0) + (inv.breakdown?.service || 0),
        total: (inv.breakdown?.utility || 0) + (inv.breakdown?.service || 0) || inv.totalAmount || 0
      }));
    }

    if (room.status === 'empty') return [];

    const now = new Date();
    return [0, 1, 2].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const match = list.find(i => i.month === mStr) || invoices.find(i => i.month === mStr);
      return {
        month: formatMonthBn(mStr),
        electricity: match?.breakdown?.electricity || 1140,
        consumedUnits: match?.breakdown?.electricityMeter?.consumedUnits || 120,
        gas: match?.breakdown?.gas || 270,
        water: match?.breakdown?.water || 300,
        wifi: match?.breakdown?.wifi || 200,
        other: (match?.breakdown?.garbage || 100) + (match?.breakdown?.service || 375),
        total: (match?.breakdown?.utility || 0) + (match?.breakdown?.service || 0) || 2385
      };
    });
  }, [invoices, room, formatMonthBn]);

  if (!isOpen || !room) return null;

  // Filter photos for this specific room + flat shared photos
  const roomPhotos = photos.filter(p => p.room === room.name || (!p.room && p.shared));

  const filteredPhotos = roomPhotos.filter(p => {
    if (photoFilter === 'all') return true;
    const titleLower = p.title.toLowerCase();
    if (photoFilter === 'condition') return titleLower.includes('কন্ডিশন') || titleLower.includes('condition') || titleLower.includes('ইনস্পেকশন');
    if (photoFilter === 'furniture') return titleLower.includes('ফার্নিচার') || titleLower.includes('furniture') || titleLower.includes('খাট') || titleLower.includes('আলমারি');
    if (photoFilter === 'meter') return titleLower.includes('মিটার') || titleLower.includes('meter') || titleLower.includes('বিল');
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('ছবির সাইজ সর্বোচ্চ 10MB হতে হবে');
        return;
      }
      setIsUploading(true);
      try {
        const url = await uploadToCloudinary(file);
        setNewPhotoData(url);
        if (!newPhotoTitle) {
          const categoryLabels = {
            condition: 'রুম কন্ডিশন ও ইনস্পেকশন',
            furniture: 'রুম ফার্নিচার ও আসবাবপত্র',
            meter: 'সাব-মিটার ও রিডিং',
            other: `${room.name} ছবি`
          };
          setNewPhotoTitle(categoryLabels[newPhotoCategory]);
        }
      } catch (err: any) {
        setUploadError(err?.message || 'আপলোড ব্যর্থ হয়েছে');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSavePhoto = () => {
    if (!newPhotoData) return;
    const categoryTag = newPhotoCategory === 'condition' ? '[কন্ডিশন]' : newPhotoCategory === 'furniture' ? '[ফার্নিচার]' : newPhotoCategory === 'meter' ? '[মিটার]' : '';
    const fullTitle = `${categoryTag} ${newPhotoTitle.trim() || `${room.name} ছবি`}`.trim();

    const newPhoto: PhotoItem = {
      id: 'PH-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: fullTitle,
      room: room.name,
      shared: isSharedWithTenant,
      data: newPhotoData,
      uploadedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('bn-BD')
    };

    if (onUpdatePhotos) {
      onUpdatePhotos([newPhoto, ...photos]);
    }

    // Reset upload state
    setNewPhotoData('');
    setNewPhotoTitle('');
    setIsUploading(false);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (onUpdatePhotos) {
      onUpdatePhotos(photos.filter(p => p.id !== photoId));
    }
    if (previewPhoto?.id === photoId) {
      setPreviewPhoto(null);
    }
    setPhotoToDelete(null);
  };

  const roomRent = Number(room.rent) || 0;
  const occupantsCount = Math.max(1, occupants.length);
  const splitRent = Math.round(roomRent / occupantsCount);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-4 modal-backdrop overflow-y-auto animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-2xl p-5 sm:p-7 animate-pop my-6 border border-white/15 shadow-2xl space-y-5 text-white relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl shadow-lg border border-white/20 flex-shrink-0">
              🚪
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">{room.name}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  room.status === 'owner' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 
                  room.status === 'occupied' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                  'bg-gray-500/20 text-gray-300 border-gray-500/30'
                }`}>
                  {room.status === 'owner' ? '👑 মালিকের নিজস্ব' : room.status === 'occupied' ? '✓ ভাড়াটিয়া আছে' : 'খালি রুম'}
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  {room.type === 'master' ? 'মাস্টার বেড' : room.type === 'double' ? 'ডাবল রুম' : 'সিঙ্গেল রুম'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                📍 {flatInfo.name} • মাসিক ভাড়া: <strong className="text-pink-400 font-semibold">৳ {toBn(room.rent)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isOwner && onEditRoom && (
              <button
                onClick={() => onEditRoom(room)}
                className="glass hover:bg-white/10 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
              >
                ✏️ সম্পাদনা
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Toggle: Info vs Photos vs Utility */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 min-w-[100px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 flex-shrink-0 ${
              activeTab === 'info'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="whitespace-nowrap">📋 রুম বিবরণ</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full flex-shrink-0">{toBn(occupants.length)}</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 min-w-[75px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 flex-shrink-0 ${
              activeTab === 'photos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="whitespace-nowrap">📸 ফটো</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full flex-shrink-0">{toBn(roomPhotos.length + (room.photos?.length || 0))}</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 min-w-[80px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 flex-shrink-0 ${
              activeTab === 'videos'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="whitespace-nowrap">🎥 ভিডিও</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full flex-shrink-0">{toBn((room.videos?.length || 0) + (room.videoUrl ? 1 : 0))}</span>
          </button>
          <button
            onClick={() => setActiveTab('utility')}
            className={`flex-1 min-w-[90px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 flex-shrink-0 ${
              activeTab === 'utility'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="whitespace-nowrap">⚡ ইউটিলিটি</span>
          </button>
        </div>

        {/* TAB 1: INFO & OCCUPANTS */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-fade-in">
            {/* Rent & Split Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-gray-400 block">রুমের নির্ধারিত ভাড়া</span>
                <span className="text-lg font-bold text-pink-400">৳ {toBn(room.rent)}</span>
              </div>
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-gray-400 block">বর্তমান সদস্য সংখ্যা</span>
                <span className="text-lg font-bold text-cyan-300">{toBn(occupants.length)} জন</span>
              </div>
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-gray-400 block">অটো-স্প্লিট (প্রতি সদস্য)</span>
                <span className="text-lg font-bold text-emerald-400">৳ {toBn(splitRent)}</span>
              </div>
            </div>

            {/* Meter & Sub-meter info */}
            <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-cyan-300">
                    বিদ্যুৎ বিল: <span className="font-mono text-white">ফ্ল্যাটের সমান বন্টন</span>
                  </p>
                  <p className="text-[11px] text-gray-400">এই ফ্ল্যাটের একটি মাত্র মিটার, তাই বিল সমানভাগে ভাগ করা হয়</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('photos');
                  setPhotoFilter('meter');
                  setIsUploading(true);
                  setNewPhotoCategory('meter');
                  setNewPhotoTitle(`${room.name} বিদ্যুৎ মিটার রিডিং`);
                }}
                className="glass px-3 py-1.5 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 transition font-medium self-end sm:self-center flex items-center gap-1.5"
              >
                <span>📷</span> মিটার ফটো আপলোড
              </button>
            </div>

            {/* Login credentials if present */}
            {room.loginId && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>🔑</span>
                    <span>ভাড়াটিয়া লগইন তথ্য (Room Portal Login)</span>
                  </p>
                  <p className="text-xs text-gray-300 font-mono mt-1">
                    ইউজারনেম: <strong className="text-white">{room.loginId}</strong> | পাসওয়ার্ড: <strong className="text-white">{room.loginPassword || '••••••••'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`ইউজারনেম: ${room.loginId}\nপাসওয়ার্ড: ${room.loginPassword || ''}\nফ্ল্যাট: ${flatInfo.name}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="glass px-3 py-1.5 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 transition font-medium self-end sm:self-center"
                >
                  {copied ? '✓ কপি হয়েছে!' : '📋 কপি করুন'}
                </button>
              </div>
            )}

            {/* Occupants list */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>রুমের সদস্যবৃন্দ ({toBn(occupants.length)})</span>
                {occupants.length > 0 && <span className="text-[10px] text-cyan-400 font-normal">প্রোফাইল দেখতে ক্লিক করুন</span>}
              </h4>
              
              {occupants.map((t, idx) => (
                <div
                  key={`${t.name}-${t.phone || idx}`}
                  onClick={() => onSelectTenant && onSelectTenant(t)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow border border-white/10 flex-shrink-0">
                      {t.photo ? (
                        <img 
                          src={t.photo} 
                          alt={t.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{t.initials || t.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          🔍 বিস্তারিত
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">📱 {t.phone} {t.nid ? `• NID: ${t.nid}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-400">৳ {toBn(t.rent ? Number(t.rent) : splitRent)}</p>
                    <span className="text-[10px] text-gray-400">মাসিক অংশ</span>
                  </div>
                </div>
              ))}

              {occupants.length === 0 && (
                <div className="p-6 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs">
                  {room.status === 'owner' ? '👑 আপনি এই রুমে অবস্থান করছেন।' : 'এই রুমে বর্তমানে কোনো ভাড়াটিয়া নিবন্ধিত নেই।'}
                </div>
              )}
            </div>

            {/* Quick Photo Strip inside info tab */}
            {roomPhotos.length > 0 && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-300">📸 সাম্প্রতিক ছবিসমূহ ({toBn(roomPhotos.length)}টি)</span>
                  <button onClick={() => setActiveTab('photos')} className="text-xs text-cyan-400 hover:underline">
                    সব ছবি দেখুন →
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {roomPhotos.slice(0, 5).map(p => (
                    <img
                      key={p.id}
                      src={p.data}
                      alt={p.title}
                      onClick={() => setPreviewPhoto(p)}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 hover:border-cyan-400 cursor-pointer transition flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTEGRATED PHOTO GALLERY */}
        {activeTab === 'photos' && (
          <div className="space-y-4 animate-fade-in">
            {/* Room Specific Photos (Added from Room object) */}
            {room.photos && room.photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span>✨</span> রুম-স্পেসিফিক ফটো গ্যালারি
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.photos.map((p, idx) => (
                    <div
                      key={`room-p-${idx}`}
                      onClick={() => setPreviewPhoto({ id: `rp-${idx}`, title: `${room.name} ছবি`, data: p, uploadedAt: '', date: '', room: room.name, shared: true })}
                      className="glass rounded-2xl overflow-hidden aspect-video relative border border-white/10 hover:border-cyan-400/40 transition bg-black/20 group cursor-pointer"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2.5">
              {/* Category Filter Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'সব ছবি' },
                  { id: 'condition', label: 'ইনস্পেকশন ও কন্ডিশন' },
                  { id: 'furniture', label: 'ফার্নিচার' },
                  { id: 'meter', label: 'মিটার' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPhotoFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      photoFilter === tab.id
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-xs'
                        : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsUploading(!isUploading)}
                className="bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5"
              >
                <span>{isUploading ? '✕ বাতিল' : '+ ছবি যোগ করুন'}</span>
              </button>
            </div>

            {/* Upload Box */}
            {isUploading && (
              <div className="p-4 bg-white/5 border border-cyan-500/30 rounded-2xl space-y-3 animate-pop">
                <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>📸</span>
                  <span>{room.name}-এর নতুন ছবি আপলোড করুন</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">ক্যাটাগরি / ধরন</label>
                    <select
                      value={newPhotoCategory}
                      onChange={e => setNewPhotoCategory(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="condition">রুম কন্ডিশন / মুভ-ইন ইনস্পেকশন</option>
                      <option value="furniture">ফার্নিচার ও আসবাবপত্র</option>
                      <option value="meter">সাব-মিটার ও রিডিং</option>
                      <option value="other">অন্যান্য</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">ছবির ক্যাপশন / বিবরণ</label>
                    <input
                      type="text"
                      placeholder="যেমন: ওয়াশরুম কন্ডিশন / নতুন খাট"
                      value={newPhotoTitle}
                      onChange={e => setNewPhotoTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* File picker */}
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">ছবি নির্বাচন করুন (সর্বোচ্চ 5MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
                  />
                </div>

                {/* Preview if chosen */}
                {newPhotoData && (
                  <div className="flex items-center gap-3 p-2 bg-black/30 rounded-xl border border-white/10">
                    <img src={newPhotoData} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/20" />
                    <div className="text-xs flex-1">
                      <p className="font-semibold text-white truncate">{newPhotoTitle || `${room.name} ছবি`}</p>
                      <p className="text-[10px] text-cyan-400">আপলোডের জন্য প্রস্তুত</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSharedWithTenant}
                      onChange={e => setIsSharedWithTenant(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                    <span>ভাড়াটিয়া পোর্টালেও দৃশ্যমান থাকবে</span>
                  </label>

                  <button
                    onClick={handleSavePhoto}
                    disabled={!newPhotoData}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow ${
                      newPhotoData
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            )}

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="glass rounded-2xl overflow-hidden group relative border border-white/10 hover:border-cyan-400/40 transition bg-black/20 flex flex-col"
                >
                  <div 
                    onClick={() => setPreviewPhoto(photo)}
                    className="h-32 w-full overflow-hidden cursor-pointer relative bg-black/40"
                  >
                    <img
                      src={photo.data}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs">🔍 বড় করে দেখুন</span>
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-white truncate" title={photo.title}>{photo.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{photo.date}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-white/5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                        {photo.shared ? '🔗 শেয়ারড' : '🔒 প্রাইভেট'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition text-xs"
                        title="ছবি মুছুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPhotos.length === 0 && (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs col-span-full space-y-2">
                  <span className="text-2xl block">📸</span>
                  <p>এই রুমে এখনো কোনো ছবি আপলোড করা হয়নি।</p>
                  <p className="text-[11px] text-gray-500">মুভ-ইন কন্ডিশন, ফার্নিচার বা মিটার রিডিংয়ের ছবি সংরক্ষণ করতে উপরের বাটনে ক্লিক করুন।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VIDEO TOUR */}
        {activeTab === 'videos' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <span>🎥</span> ভিডিও ট্যুর ও ইনস্পেকশন
                </h4>
                <p className="text-xs text-gray-300 mt-0.5">রুমের অভ্যন্তরীণ বাস্তব ভিডিও চিত্র</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Prioritize room.videos */}
              {room.videos && room.videos.length > 0 ? (
                room.videos.map((v, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                      <video src={v} controls className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-center text-gray-400">ভিডিও {toBn(idx + 1)}</p>
                  </div>
                ))
              ) : room.videoUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                   {room.videoUrl.includes('youtube.com') || room.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={room.videoUrl.replace('watch?v=', 'embed/')}
                      title="Video Tour"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={room.videoUrl} controls className="w-full h-full object-contain" />
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs">
                  <span className="text-2xl block mb-2">🎥</span>
                  <p>এই রুমে কোনো ভিডিও ট্যুর নেই।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LAST 3 MONTHS UTILITY BILLS */}
        {activeTab === 'utility' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span>⚡</span> বিগত ৩ মাসের ইউটিলিটি বিলের বিবরণ
                </h4>
                <p className="text-xs text-gray-300 mt-0.5">
                  {room.name} এর বিগত ৩ মাসের বিদ্যুৎ, গ্যাস, পানি ও ওয়াইফাই বিলের রিপোর্ট
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                গড় ইউটিলিটি: ~৳ {toBn(Math.round(roomUtilityHistory.reduce((s, r) => s + r.total, 0) / Math.max(1, roomUtilityHistory.length)))} / মাস
              </div>
            </div>

            <div className="space-y-3">
              {roomUtilityHistory.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      {rec.month}
                    </span>
                    <span className="font-extrabold text-pink-400 text-sm">
                      মোট বিল: ৳ {toBn(rec.total)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">বিদ্যুৎ বিল:</span>
                      <span className="font-bold text-white mt-0.5 block">৳ {toBn(rec.electricity)}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">গ্যাস বিল:</span>
                      <span className="font-bold text-white mt-0.5 block">৳ {toBn(rec.gas)}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">পানি বিল:</span>
                      <span className="font-bold text-white mt-0.5 block">৳ {toBn(rec.water)}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">ওয়াইফাই বিল:</span>
                      <span className="font-bold text-white mt-0.5 block">৳ {toBn(rec.wifi)}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-gray-400 block">সার্ভিস ও ময়লা:</span>
                      <span className="font-bold text-white mt-0.5 block">৳ {toBn(rec.other)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {roomUtilityHistory.length === 0 && (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs space-y-2">
                  <span className="text-2xl block">⚡</span>
                  <p>এই {room.status === 'empty' ? 'খালি' : ''} রুমে কোনো ইউটিলিটি বিলের বিবরণ নেই।</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-300 leading-relaxed">
              💡 <strong>বিল নীতি:</strong> ফ্ল্যাটে একটিমাত্র প্রধান মিটার থাকায়, বিদ্যুৎ বিল সহ গ্যাস, পানি ও ইন্টারনেট বিল ফ্ল্যাটের সব সদস্যদের মাঝে সমান হারে (বা মেম্বার অনুযায়ী) বণ্টিত হয়।
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 glass hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="max-w-3xl w-full max-h-[90vh] glass rounded-3xl p-4 sm:p-6 border border-white/20 flex flex-col space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div>
                <h4 className="font-bold text-white text-base">{previewPhoto.title}</h4>
                <p className="text-xs text-gray-400">{previewPhoto.room || room.name} • {previewPhoto.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeletePhoto(previewPhoto.id)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition"
                >
                  🗑️ ছবি মুছুন
                </button>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 p-2">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
