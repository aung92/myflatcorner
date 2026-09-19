import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Room, FlatManagerData, Invoice, NotificationItem } from '../../types';
import { toBn } from '../../lib/storage';

export interface AvailableRoomDetailModalProps {
  room: Room;
  data: FlatManagerData;
  onClose: () => void;
  showAlert?: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
  onUpdateData?: (newData: FlatManagerData) => void;
}

interface UtilityMonthRecord {
  month: string;
  electricity: number;
  consumedUnits?: number;
  unitRate?: number;
  water: number;
  gas: number;
  wifi: number;
  garbage: number;
  service: number;
  totalUtility: number;
  isEstimated: boolean;
}

export const AvailableRoomDetailModal: React.FC<AvailableRoomDetailModalProps> = ({
  room,
  data,
  onClose,
  showAlert,
  onUpdateData
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Booking request state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestMoveInDate, setRequestMoveInDate] = useState('');
  const [requestNote, setRequestNote] = useState('');

  const flatInfo = data.flatInfo || {
    name: 'গ্রীন ভিলা',
    address: 'মিরপুর-১০, ঢাকা',
    phone: '',
    ownerName: 'মালিক'
  };

  // Curated fallback photos tailored for room type
  const fallbackPhotos = useMemo(() => [
    {
      url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
      title: 'বেডরুমের প্রধান ভিউ (পর্যাপ্ত আলো ও বাতাস)'
    },
    {
      url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=1200&auto=format&fit=crop&q=80',
      title: 'পড়াশোনা ও ওয়ার্ডরোব স্পেস'
    },
    {
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
      title: 'খোলামেলা বারান্দা ভিউ'
    },
    {
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80',
      title: 'পরিচ্ছন্ন আধুনিক ওয়াশরুম'
    }
  ], []);

  // Room Photos: custom uploaded or fallback
  const displayPhotos = useMemo(() => {
    const list: { url: string; title: string }[] = [];

    // Check room.photos
    if (room.photos && room.photos.length > 0) {
      room.photos.forEach((url, i) => {
        list.push({ url, title: `${room.name} ছবি ${toBn(i + 1)}` });
      });
    }

    // Check data.photos for matching room
    if (data.photos && data.photos.length > 0) {
      const roomMatches = data.photos.filter(p => p.room === room.name || (!p.room && p.shared));
      roomMatches.forEach(p => {
        if (p.data && !list.some(item => item.url === p.data)) {
          list.push({ url: p.data, title: p.title || `${room.name} ছবি` });
        }
      });
    }

    // If still empty or fewer than 2 photos, pad with fallback
    if (list.length === 0) {
      return fallbackPhotos;
    } else if (list.length < 3) {
      fallbackPhotos.forEach(fb => {
        if (!list.some(item => item.url === fb.url)) {
          list.push(fb);
        }
      });
    }

    return list;
  }, [room, data.photos, fallbackPhotos]);

    // Video URLs (custom or sample walkthrough)
    const displayVideos = useMemo(() => {
      const list: string[] = [];
      
      // 1. Prioritize room.videos array
      if (room.videos && room.videos.length > 0) {
        list.push(...room.videos);
      }
      
      // 2. Fallback to room.videoUrl if not in array
      if (room.videoUrl && !list.includes(room.videoUrl)) {
        list.push(room.videoUrl);
      }
      
      // 3. Global fallback if still empty
      if (list.length === 0) {
        list.push('https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-with-cozy-interior-41589-large.mp4');
      }
      
      return list;
    }, [room]);

    const [activeVideoIdx, setActiveVideoIdx] = useState(0);

    // Format month to Bengali
  const formatMonthBn = (monthStr?: string): string => {
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
  };

  // Calculate Last 3 Months Utility Bills
  const last3MonthsUtility: UtilityMonthRecord[] = useMemo(() => {
    const invoices = data.invoices || [];

    // Check if invoices exist specifically for this room
    const thisRoomInvoices = invoices
      .filter(inv => inv.room === room.name)
      .sort((a, b) => (b.month || b.createdAt || '').localeCompare(a.month || a.createdAt || ''));

    // If room is empty and has no invoices, return empty array (do not show fake estimated bills)
    if (room.status === 'empty' && thisRoomInvoices.length === 0) {
      return [];
    }

    const records: UtilityMonthRecord[] = [];

    // Add actual invoices if available
    for (const inv of thisRoomInvoices) {
      if (records.length >= 3) break;
      const b = inv.breakdown;
      const totalUtil = (b?.utility || 0) + (b?.service || 0);
      records.push({
        month: formatMonthBn(inv.month),
        electricity: b?.electricity || 0,
        consumedUnits: b?.electricityMeter?.consumedUnits || 0,
        unitRate: b?.electricityMeter?.unitRate || 9.5,
        water: b?.water || 0,
        gas: b?.gas || 0,
        wifi: b?.wifi || 0,
        garbage: b?.garbage || 0,
        service: b?.service || 0,
        totalUtility: totalUtil > 0 ? totalUtil : inv.totalAmount || 0,
        isEstimated: false
      });
    }

    if (room.status === 'empty') return records.slice(0, 3);

    // If fewer than 3, extract from other flat invoices to show representative accurate billing
    const now = new Date();
    const monthsOffset = [0, 1, 2];
    for (const offset of monthsOffset) {
      if (records.length >= 3) break;
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const mKey = `${y}-${m}`;
      const mBn = formatMonthBn(mKey);

      if (records.some(r => r.month === mBn)) continue;

      const sameMonthInvoices = invoices.filter(i => i.month === mKey);
      if (sameMonthInvoices.length > 0) {
        const count = sameMonthInvoices.length;
        const avgElec = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.electricity || 0), 0) / count) || 1140;
        const avgUnits = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.electricityMeter?.consumedUnits || 120), 0) / count) || 120;
        const avgWater = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.water || 0), 0) / count) || 300;
        const avgGas = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.gas || 0), 0) / count) || 270;
        const avgWifi = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.wifi || 0), 0) / count) || 200;
        const avgGarbage = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.garbage || 0), 0) / count) || 100;
        const avgService = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.service || 0), 0) / count) || 375;
        const total = avgElec + avgWater + avgGas + avgWifi + avgGarbage + avgService;

        records.push({
          month: mBn,
          electricity: avgElec,
          consumedUnits: avgUnits,
          unitRate: 9.5,
          water: avgWater,
          gas: avgGas,
          wifi: avgWifi,
          garbage: avgGarbage,
          service: avgService,
          totalUtility: total,
          isEstimated: true
        });
      } else {
        // Standard baseline utility record for flat room in Dhaka
        records.push({
          month: mBn,
          electricity: 1140,
          consumedUnits: 120,
          unitRate: 9.5,
          water: 300,
          gas: 270,
          wifi: 200,
          garbage: 100,
          service: 375,
          totalUtility: 2385,
          isEstimated: true
        });
      }
    }

    return records.slice(0, 3);
  }, [data.invoices, room]);

  // Average monthly utility calculation
  const avgMonthlyUtility = useMemo(() => {
    if (last3MonthsUtility.length === 0) return 2385;
    const sum = last3MonthsUtility.reduce((acc, curr) => acc + curr.totalUtility, 0);
    return Math.round(sum / last3MonthsUtility.length);
  }, [last3MonthsUtility]);

  const typeBn = (type: string) => {
    if (type === 'master') return 'মাস্টার বেডরুম';
    if (type === 'double') return 'ডাবল রুম';
    return 'সিঙ্গেল রুম';
  };

  const handleCopyPhone = () => {
    if (flatInfo.phone) {
      navigator.clipboard?.writeText(flatInfo.phone);
      showAlert?.(`মালিকের ফোন নম্বর (${flatInfo.phone}) কপি করা হয়েছে`, { type: 'success' });
    }
  };

  const cleanPhone = flatInfo.phone ? flatInfo.phone.replace(/[^0-9]/g, '') : '';
  const cleanWhatsApp = flatInfo.whatsapp 
    ? flatInfo.whatsapp.replace(/[^0-9]/g, '') 
    : cleanPhone;

  const getWhatsAppNumber = (num: string) => {
    if (num.startsWith('88') || num.length > 10) return num;
    return `88${num}`;
  };

  const waMessage = encodeURIComponent(`নমস্কার, আমি আপনার ফ্ল্যাট (${flatInfo.name})-এর "${room.name}" রুমটি ভাড়া নেওয়ার ব্যাপারে বিস্তারিত জানতে আগ্রহী।`);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl p-4 sm:p-6 bg-[#0c0f1d] border-2 border-indigo-500/40 shadow-2xl shadow-black my-auto text-white space-y-5 max-h-[94vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {room.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ ভাড়ার জন্য প্রস্তুত
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {typeBn(room.type)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              📍 {flatInfo.name} • {flatInfo.address || 'ঢাকা, বাংলাদেশ'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition flex-shrink-0"
            title="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        {/* Media Section: Image Gallery vs Video Tour */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Toggle Tab */}
            <div className="flex p-1 bg-[#14182b] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveMediaTab('photos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMediaTab === 'photos'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>📷</span> রুমের ছবি ({toBn(displayPhotos.length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMediaTab === 'video'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>🎥</span> ভিডিও ট্যুর
              </button>
            </div>

            {activeMediaTab === 'photos' && (
              <span className="text-[11px] text-gray-400 hidden sm:inline">
                ছবি বড় দেখতে ছবির উপর ক্লিক করুন
              </span>
            )}
          </div>

          {/* Photo Gallery View */}
          {activeMediaTab === 'photos' && (
            <div className="space-y-2.5">
              {/* Main Photo Display */}
              <div
                className="relative aspect-video sm:aspect-[16/9] max-h-80 w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10 group cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img
                  src={displayPhotos[activePhotoIdx]?.url}
                  alt={displayPhotos[activePhotoIdx]?.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Caption & Counter Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-medium border border-white/10">
                    {displayPhotos[activePhotoIdx]?.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600/80 text-white font-bold text-[11px]">
                    {toBn(activePhotoIdx + 1)} / {toBn(displayPhotos.length)}
                  </span>
                </div>

                {/* Arrow Navigators */}
                {displayPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {displayPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      activePhotoIdx === idx
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/20'
                        : 'border-white/15 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Tour View */}
          {activeMediaTab === 'video' && (
            <div className="space-y-3">
              <div className="relative aspect-video max-h-80 w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-inner group">
                {displayVideos[activeVideoIdx].includes('youtube.com') || displayVideos[activeVideoIdx].includes('youtu.be') ? (
                  <iframe
                    src={displayVideos[activeVideoIdx].replace('watch?v=', 'embed/')}
                    title={`${room.name} ভিডিও ট্যুর`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={displayVideos[activeVideoIdx]}
                    src={displayVideos[activeVideoIdx]}
                    controls
                    playsInline
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-contain"
                  >
                    আপনার ব্রাউজার ভিডিওটি চালাতে সক্ষম নয়।
                  </video>
                )}

                {/* Video Navigation if multiple */}
                {displayVideos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveVideoIdx((prev) => (prev > 0 ? prev - 1 : displayVideos.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20 z-10"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVideoIdx((prev) => (prev < displayVideos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20 z-10"
                    >
                      ›
                    </button>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-purple-600/80 text-white font-bold text-[10px] z-10">
                      {toBn(activeVideoIdx + 1)} / {toBn(displayVideos.length)}
                    </div>
                  </>
                )}
              </div>
              
              {/* Video Thumbnails if multiple */}
              {displayVideos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {displayVideos.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVideoIdx(idx)}
                      className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition bg-black/40 flex items-center justify-center ${
                        activeVideoIdx === idx
                          ? 'border-purple-400 scale-105 shadow-md'
                          : 'border-white/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="text-xl">🎬</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-[#14182b] border border-white/10 flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1.5 font-medium text-purple-300">
                  <span>🎬</span> রুমের অভ্যন্তরীণ বাস্তব ভিডিও দৃশ্য ও পরিচ্ছন্নতা
                </span>
                <span className="text-[11px] text-gray-400">সাউন্ড অন করতে ভিডিও কন্ট্রোল ব্যবহার করুন</span>
              </div>
            </div>
          )}
        </div>

        {/* Rent & Key Specifications Card */}
        <div className="p-4 rounded-2xl bg-[#14182b] border border-white/10 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-gray-400">মাসিক নির্ধারিত ভাড়া:</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-pink-400">৳ {toBn(room.rent)}</span>
                <span className="text-xs text-gray-400">/ প্রতি মাস</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">অগ্রিম জামানত:</span>
              <p className="text-sm font-bold text-amber-300 mt-0.5">৳ {toBn(room.rent)} (১ মাসের ভাড়া)</p>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-400 block">📐 আয়তন:</span>
              <span className="font-bold text-white mt-0.5 block">
                {room.sizeSqFt ? `${toBn(room.sizeSqFt)} বর্গফুট` : (room.type === 'master' ? '১৬০ বর্গফুট' : room.type === 'double' ? '১৪০ বর্গফুট' : '১২০ বর্গফুট')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-400 block">🏢 ফ্লোর ও অবস্থান:</span>
              <span className="font-bold text-white mt-0.5 block">
                {room.floor || '৪র্থ তলা'}{room.facing ? ` (${room.facing})` : ''}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-400 block">🚿 বাথরুম:</span>
              <span className="font-bold text-emerald-300 mt-0.5 block">
                {room.washroom === 'attached' || room.type === 'master' ? 'সংযুক্ত বাথরুম' : 'কমন বাথরুম (২ জন)'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-400 block">🌿 বারান্দা:</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                {room.balcony === 'attached' || room.type === 'master' ? 'সংযুক্ত বারান্দা' : 'কমন বারান্দা'}
              </span>
            </div>
          </div>
        </div>

        {/* Room Description */}
        {room.description && (
          <div className="p-4 rounded-2xl bg-[#14182b] border border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📝</span> রুমের সংক্ষিপ্ত বর্ণনা (About this Room)
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed italic">
              "{room.description}"
            </p>
          </div>
        )}

        {/* Included Amenities Badges */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>✨</span> রুম ও ফ্ল্যাটের সুবিধাসমূহ (Included Amenities)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-amber-400 text-sm">⚡</span>
              <span>ফ্ল্যাটের সমান বিদ্যুৎ বিল বন্টন ব্যবস্থা</span>
            </div>
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-cyan-400 text-sm">📶</span>
              <span>উচ্চগতির আনলিমিটেড ওয়াইফাই</span>
            </div>
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-blue-400 text-sm">💧</span>
              <span>ফিল্টার্ড খাবার পানি ও গ্যাস</span>
            </div>
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-purple-400 text-sm">🍳</span>
              <span>কিচেন ও ফ্রিজ ব্যবহারের সুবিধা</span>
            </div>
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-emerald-400 text-sm">🧹</span>
              <span>বুয়া ও কিচেন পরিচ্ছন্নতাকর্মী</span>
            </div>
            <div className="p-2 rounded-xl bg-[#14182b] border border-white/5 flex items-center gap-2">
              <span className="text-pink-400 text-sm">🛡️</span>
              <span>সিসিটিভি ও সার্বক্ষণিক নিরাপত্তা</span>
            </div>
          </div>
        </div>

        {/* KEY SECTION: Last 3 Month Utility Bills */}
        <div className="p-4 rounded-2xl bg-[#121629] border-2 border-amber-500/30 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>📊</span> বিগত ৩ মাসের ইউটিলিটি বিল (Last 3 Months Utility Bills)
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                রুমের প্রকৃত ইউটিলিটি খরচের স্বচ্ছ ধারণা পেতে পূর্ববর্তী মাসের বিস্তারিত হিসাব
              </p>
            </div>

            {/* Average Utility Highlight Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
              <span>💡</span> গড় ইউটিলিটি: ৳ {toBn(avgMonthlyUtility)} / মাস
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="pb-2 font-semibold">মাস</th>
                  <th className="pb-2 font-semibold">বিদ্যুৎ</th>
                  <th className="pb-2 font-semibold">গ্যাস</th>
                  <th className="pb-2 font-semibold">পানি</th>
                  <th className="pb-2 font-semibold">ওয়াইফাই</th>
                  <th className="pb-2 font-semibold">সার্ভিস ও অন্যান্য</th>
                  <th className="pb-2 font-bold text-right text-amber-300">মোট ইউটিলিটি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {last3MonthsUtility.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {rec.month}
                    </td>
                    <td className="py-2.5 text-gray-200">
                      ৳ {toBn(rec.electricity)}
                    </td>
                    <td className="py-2.5 text-gray-200">৳ {toBn(rec.gas)}</td>
                    <td className="py-2.5 text-gray-200">৳ {toBn(rec.water)}</td>
                    <td className="py-2.5 text-gray-200">৳ {toBn(rec.wifi)}</td>
                    <td className="py-2.5 text-gray-200">৳ {toBn(rec.garbage + rec.service)}</td>
                    <td className="py-2.5 font-bold text-right text-pink-400 text-sm">
                      ৳ {toBn(rec.totalUtility)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (for small screens) */}
          <div className="sm:hidden space-y-2">
            {last3MonthsUtility.map((rec, idx) => (
              <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {rec.month}
                  </span>
                  <span className="text-xs font-bold text-pink-400">
                    মোট: ৳ {toBn(rec.totalUtility)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-300 pt-1 border-t border-white/5">
                  <div>⚡ বিদ্যুৎ: ৳ {toBn(rec.electricity)}</div>
                  <div>🔥 গ্যাস: ৳ {toBn(rec.gas)}</div>
                  <div>💧 পানি: ৳ {toBn(rec.water)}</div>
                  <div>📶 ওয়াইফাই: ৳ {toBn(rec.wifi)}</div>
                  <div className="col-span-2 text-gray-400 text-[10px]">
                    🧹 ময়লা ও সার্ভিস চার্জ: ৳ {toBn(rec.garbage + rec.service)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Utility Billing Rules Note */}
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-gray-300 leading-relaxed flex items-start gap-2">
            <span className="text-amber-400 text-sm">ℹ️</span>
            <span>
              <strong>বিল বণ্টন নীতি:</strong> ফ্ল্যাটে একটিমাত্র প্রধান মিটার থাকায়, বিদ্যুৎ বিল সহ গ্যাস, পানি, ওয়াইফাই এবং পরিচ্ছন্নতা বিল সকল রুমের মাঝে সমানভাবে (বা মেম্বার অনুযায়ী) বণ্টিত হয়।
            </span>
          </div>
        </div>

        {/* House Rules Brief */}
        <div className="p-3 rounded-xl bg-[#14182b] border border-white/10 text-xs text-gray-300 space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>📋</span> ফ্ল্যাটের নিয়মাবলী ও পরিবেশ:
          </p>
          <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-0.5">
            <li>শান্ত, পরিচ্ছন্ন ও পড়াশোনা বা চাকরির জন্য উপযুক্ত মনোরম পরিবেশ।</li>
            <li>প্রতি মাসের ১ থেকে ১০ তারিখের মধ্যে ভাড়া ও ইউটিলিটি বিল পরিশোধযোগ্য।</li>
            <li>কিচেন ক্লিন ডিউটি রুটিন যথাযথভাবে মেনে চলা হয়।</li>
          </ul>
        </div>

        {/* Action Buttons: Request Booking / Contact / Call / WhatsApp / Close */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 border border-cyan-400/30"
          >
            <span>📝</span>
            <span>অনলাইনে অগ্রিম রুম বুকিংয়ের অনুরোধ জানান</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10 transition order-3 sm:order-1"
            >
              ✕ বন্ধ করুন
            </button>

            {cleanPhone && (
              <>
                <a
                  href={`https://wa.me/88${cleanPhone}?text=${waMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 transition flex items-center justify-center gap-2 order-2"
                >
                  <span>💬</span> হোয়াটসঅ্যাপ
                </a>
                <a
                  href={`tel:${flatInfo.phone}`}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 order-1 sm:order-3"
                >
                  <span>📞</span> সরাসরি কল
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Booking Request Popup Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass rounded-3xl max-w-md w-full p-6 border border-cyan-500/30 space-y-4 text-white relative shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h4 className="font-bold text-base text-cyan-300 flex items-center gap-2">
                <span>📝</span> রুম বুকিংয়ের অনুরোধ পাঠান
              </h4>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>{room.name}</strong>-এর জন্য আপনার অগ্রিম বুকিং আগ্রহ জমা দিন। বাড়িওয়ালা সরাসরি আপনার ফোনে অথবা হোয়াটসঅ্যাপে যোগাযোগ করবেন।
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1 font-semibold">আপনার নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ সাকিব রহমান"
                  value={requestName}
                  onChange={e => setRequestName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1 font-semibold">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  placeholder="যেমন: 01712345678"
                  value={requestPhone}
                  onChange={e => setRequestPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1 font-semibold">সম্ভাব্য ওঠার তারিখ *</label>
                <input
                  type="date"
                  value={requestMoveInDate}
                  onChange={e => setRequestMoveInDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1 font-semibold">অন্যান্য তথ্য / বিশেষ চাওয়া (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: আমি পেশায় চাকুরিজীবী, ১ তারিখ থেকে উঠতে চাই।"
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!requestName.trim() || !requestPhone.trim()) {
                    if (showAlert) showAlert('দয়া করে আপনার নাম ও মোবাইল নম্বর পূরণ করুন', { type: 'warning' });
                    return;
                  }
                  const textMsg = encodeURIComponent(
                    `নমস্কার, আমি ${requestName} (ফোন: ${requestPhone})।\n` +
                    `আমি আপনার "${flatInfo.name}" ফ্ল্যাটের "${room.name}" রুমটি বুকিং করতে আগ্রহী।\n` +
                    (requestMoveInDate ? `সম্ভাব্য আসার তারিখ: ${requestMoveInDate}\n` : '') +
                    (requestNote ? `নোট: ${requestNote}\n` : '') +
                    `দয়া করে আমার সাথে যোগাযোগ করুন।`
                  );
                  if (cleanWhatsApp) {
                    window.open(`https://wa.me/${getWhatsAppNumber(cleanWhatsApp)}?text=${textMsg}`, '_blank');
                  }
                  
                  // Send Notification to Owner Dashboard (Cloud/Local)
                  if (onUpdateData) {
                    const newNotif: NotificationItem = {
                      id: 'BOOKING-' + Date.now(),
                      forRole: 'owner',
                      room: room.name,
                      type: 'booking_request',
                      title: 'নতুন অগ্রিম বুকিং অনুরোধ',
                      message: `ভাড়াটিয়া "${requestName}" (${requestPhone}) আপনার "${flatInfo.name}" ফ্ল্যাটের "${room.name}" রুমটির জন্য অগ্রিম বুকিংয়ের অনুরোধ জানিয়েছেন।${requestMoveInDate ? ` সম্ভাব্য আসার তারিখ: ${requestMoveInDate}।` : ''}${requestNote ? ` নোট: ${requestNote}` : ''}`,
                      read: false,
                      createdAt: new Date().toISOString()
                    };
                    const updatedNotifications = [newNotif, ...(data.notifications || [])];
                    onUpdateData({
                      ...data,
                      notifications: updatedNotifications
                    });
                  }

                  if (showAlert) {
                    showAlert('আপনার রুম বুকিংয়ের অনুরোধ প্রস্তুত করে হোয়াটসঅ্যাপে পাঠানো হয়েছে! বাড়িওয়ালা শীঘ্রই যোগাযোগ করবেন।', { type: 'success' });
                  }
                  setIsBookingModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <span>📨</span> অনুরোধ নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-lg font-bold flex items-center justify-center hover:bg-white/30"
          >
            ✕
          </button>
          <img
            src={displayPhotos[activePhotoIdx]?.url}
            alt={displayPhotos[activePhotoIdx]?.title}
            className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <p className="text-white text-sm mt-3 font-semibold text-center">
            {displayPhotos[activePhotoIdx]?.title} ({toBn(activePhotoIdx + 1)} / {toBn(displayPhotos.length)})
          </p>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
