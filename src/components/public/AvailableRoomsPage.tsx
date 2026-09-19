import React, { useState, useMemo } from 'react';
import { FlatManagerData, Room, CurrentUser, Invoice } from '../../types';
import { toBn } from '../../lib/storage';
import { AvailableRoomDetailModal } from '../common/AvailableRoomDetailModal';

// Helper for formatting month
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

// Helper for calculating utility for a room
const getRoomLast3MonthsUtility = (room: Room, invoices: Invoice[]) => {
  const thisRoomInvoices = invoices
    .filter(inv => inv.room === room.name)
    .sort((a, b) => (b.month || b.createdAt || '').localeCompare(a.month || a.createdAt || ''));

  const records = [];

  for (const inv of thisRoomInvoices) {
    if (records.length >= 3) break;
    const b = inv.breakdown;
    const totalUtil = (b?.utility || 0) + (b?.service || 0);
    records.push({
      month: formatMonthBn(inv.month),
      totalUtility: totalUtil > 0 ? totalUtil : 2385,
    });
  }

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
      const avgWater = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.water || 0), 0) / count) || 300;
      const avgGas = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.gas || 0), 0) / count) || 270;
      const avgWifi = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.wifi || 0), 0) / count) || 200;
      const avgGarbage = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.garbage || 0), 0) / count) || 100;
      const avgService = Math.round(sameMonthInvoices.reduce((s, i) => s + (i.breakdown?.service || 0), 0) / count) || 375;
      const total = avgElec + avgWater + avgGas + avgWifi + avgGarbage + avgService;

      records.push({
        month: mBn,
        totalUtility: total,
      });
    } else {
      records.push({
        month: mBn,
        totalUtility: 2385,
      });
    }
  }

  return records.slice(0, 3);
};

interface AvailableRoomsPageProps {
  data: FlatManagerData;
  currentUser?: CurrentUser | null;
  onNavigateLogin?: () => void;
  onNavigateBack?: () => void;
  showAlert?: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
  onUpdateData?: (newData: FlatManagerData) => void;
}

export const AvailableRoomsPage: React.FC<AvailableRoomsPageProps> = ({
  data,
  onNavigateLogin,
  onNavigateBack,
  showAlert,
  onUpdateData
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleBackToLogin = () => {
    if (onNavigateLogin) onNavigateLogin();
    if (onNavigateBack) onNavigateBack();
  };

  const flatInfo = data.flatInfo || {
    name: 'গ্রীন ভিলা',
    address: 'মিরপুর-১০, ঢাকা',
    phone: '',
    ownerName: 'মালিক',
    totalRooms: 5,
    paymentMethods: { cash: { enabled: true } }
  };

  const availableRooms = useMemo(() => {
    return data.rooms.filter(r => {
      if (r.status === 'empty') return true;
      const moveOutNotice = (data.moveOuts || []).find(m => m.room === r.name && m.status !== 'rejected');
      return !!moveOutNotice;
    });
  }, [data.rooms, data.moveOuts]);

  const occupiedCount = useMemo(() => {
    return data.rooms.filter(r => r.status === 'occupied').length;
  }, [data.rooms]);

  const filteredRooms = useMemo(() => {
    let list = availableRooms;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(r => r.name.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      list = list.filter(r => r.type === typeFilter);
    }
    return list;
  }, [availableRooms, search, typeFilter]);

  const typeBn = (type: string) => {
    if (type === 'master') return 'মাস্টার';
    if (type === 'double') return 'ডাবল';
    return 'সিঙ্গেল';
  };

  const cleanPhone = flatInfo.phone ? flatInfo.phone.replace(/[^0-9]/g, '') : '';
  const cleanWhatsApp = flatInfo.whatsapp 
    ? flatInfo.whatsapp.replace(/[^0-9]/g, '') 
    : cleanPhone;

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white pb-28">
      {/* Background Animated Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-40 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-30 px-4 py-4 border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">{flatInfo.name || 'আমার ফ্ল্যাট'}</h1>
              <p className="text-[10px] text-cyan-400 tracking-wider font-semibold">AVAILABLE ROOMS PORTAL</p>
            </div>
          </div>
          <button
            onClick={handleBackToLogin}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            লগইন
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Flat Overview Banner */}
        <section className="glass border border-white/10 rounded-2xl mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">আমাদের ফ্ল্যাট</p>
                <h2 className="text-xl md:text-2xl font-bold mt-1 truncate">{flatInfo.name}</h2>
                <p className="text-gray-400 text-sm mt-1">📍 {flatInfo.address || 'মিরপুর-১০, ঢাকা'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass border border-white/10 rounded-2xl">
            <div className="p-4 text-center">
              <div className="w-9 h-9 mx-auto rounded-lg bg-blue-600 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400">খালি রুম</p>
              <h3 className="text-2xl font-bold text-cyan-400 mt-1">{toBn(availableRooms.length)}</h3>
            </div>
          </div>
          <div className="glass border border-white/10 rounded-2xl">
            <div className="p-4 text-center">
              <div className="w-9 h-9 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400">মোট রুম</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{toBn(data.rooms.length)}</h3>
            </div>
          </div>
          <div className="glass border border-white/10 rounded-2xl">
            <div className="p-4 text-center">
              <div className="w-9 h-9 mx-auto rounded-lg bg-emerald-600 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400">ভাড়া আছে</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">{toBn(occupiedCount)}</h3>
            </div>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="রুম খুঁজুন..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="all">সব ধরন</option>
            <option value="master">মাস্টার</option>
            <option value="double">ডাবল</option>
            <option value="single">সিঙ্গেল</option>
          </select>
        </section>

        {/* Rooms Grid */}
        <section id="roomsSection">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              খালি রুম সমূহ
            </h3>
            <span className="text-xs text-gray-400">{toBn(filteredRooms.length)} টি রুম</span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="p-10 text-center glass rounded-2xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-500/20 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="font-semibold text-gray-300">কোনো খালি রুম পাওয়া যায়নি</p>
              <p className="text-xs text-gray-500 mt-1">সব রুম বর্তমানে ভাড়া দেওয়া হয়েছে অথবা অন্য ফিল্টার চেষ্টা করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => {
                const moveOutNotice = (data.moveOuts || []).find(m => m.room === room.name && m.status !== 'rejected');
                const isVacant = room.status === 'empty';

                return (
                  <div
                    key={room.name}
                    onClick={() => setSelectedRoom(room)}
                    className={`glass rounded-2xl p-5 hover:bg-white/10 transition cursor-pointer border ${isVacant ? 'border-green-500/20' : 'border-amber-500/30'} group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition ${isVacant ? 'bg-emerald-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'}`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                        </svg>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border ${
                        isVacant 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                      }`}>
                        {isVacant ? '✓ খালি' : `⏳ ${moveOutNotice?.moveOutDate || 'আগামী মাসে'} খালি হবে`}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-1 group-hover:text-cyan-400 transition">{room.name}</h4>
                    <p className="text-xs text-gray-400 mb-2">{typeBn(room.type)} রুম</p>
                    {!isVacant && moveOutNotice && (
                      <p className="text-[11px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-xl mb-3 border border-amber-500/20">
                        🚪 ১ মাস পূর্বের নোটিশ প্রাপ্ত। আগামী {moveOutNotice.moveOutDate || 'মাসে'} বুকিং উপযোগী।
                      </p>
                    )}
                  
                  {/* Rent Section */}
                  {room.rent > 0 ? (
                    <div className="flex items-baseline gap-1 mb-4">
                      <p className="text-2xl font-bold text-pink-400">৳ {toBn(room.rent)}</p>
                      <span className="text-xs text-gray-500">/ মাস</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mb-4">ভাড়া যোগাযোগ করুন</p>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoom(room);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-semibold transition shadow-md"
                  >
                    বিস্তারিত দেখুন
                  </button>
                </div>
              );
            })}
            </div>
          )}
        </section>

        {/* Contact Owner Section */}
        {flatInfo.phone && (
          <section className="mt-8">
            <div className="glass rounded-2xl p-6 border border-emerald-500/20">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">রুম দেখতে চান?</h4>
                  <p className="text-sm text-gray-400 mt-1">মালিকের সাথে সরাসরি যোগাযোগ করে রুম বুকিং বা পরিদর্শন করুন ({flatInfo.phone})</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${flatInfo.phone}`}
                    className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl font-semibold transition flex items-center gap-2 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    কল করুন
                  </a>
                  {cleanWhatsApp && (
                    <a
                      href={`https://wa.me/${cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass px-5 py-3 rounded-xl font-semibold hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Room Detail Modal with Image/Video, Specs & Last 3 Months Utility Bills */}
      {selectedRoom && (
        <AvailableRoomDetailModal
          room={selectedRoom}
          data={data}
          onClose={() => setSelectedRoom(null)}
          showAlert={showAlert}
          onUpdateData={onUpdateData}
        />
      )}
    </div>
  );
};
