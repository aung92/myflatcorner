import React from 'react';
import { Tenant, Room, Invoice, FlatInfo, LegalDoc } from '../../types';
import { toBn } from '../../lib/storage';
import { printTenantProfile, getInvoiceStats } from '../../lib/printUtils';
import { uploadToCloudinary } from '../../lib/cloudinary';

export interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  room?: Room;
  roommates?: Tenant[];
  invoices?: Invoice[];
  legalDocs?: LegalDoc[];
  flatInfo: FlatInfo;
  onSelectTenant?: (tenant: Tenant) => void;
  onEditTenant?: (tenant: Tenant) => void;
  onOpenPoliceForm?: (tenant: Tenant) => void;
  onRentIncrease?: (tenant: Tenant) => void;
  onMoveOut?: (tenant: Tenant) => void;
  onUpdatePhoto?: (tenantName: string, room: string, photoUrl: string) => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  isOpen,
  onClose,
  tenant,
  room,
  roommates = [],
  invoices = [],
  legalDocs = [],
  flatInfo,
  onSelectTenant,
  onEditTenant,
  onOpenPoliceForm,
  onRentIncrease,
  onMoveOut,
  onUpdatePhoto
}) => {
  if (!isOpen || !tenant) return null;

  const roomRent = Number(room?.rent) || 0;
  const occupantsCount = Math.max(1, roommates.length);
  const autoSplitRent = Math.round(roomRent / occupantsCount);
  const personRent = tenant.rent ? Number(tenant.rent) : autoSplitRent;
  const otherRoommates = roommates.filter(r => r.name !== tenant.name);

  // Check police verification status
  const policeDoc = legalDocs.find(d => 
    d.type === 'policeVerification' && 
    (d.room === tenant.room || d.data?.tenantName === tenant.name || d.name?.includes(tenant.name))
  );
  const isPoliceVerified = policeDoc?.status === 'verified';
  const isPolicePending = policeDoc?.status === 'pending';

  // Invoices for this room
  const tenantInvoices = invoices.filter(i => i.room === tenant.room);
  const latestInvoice = tenantInvoices[0];
  const latestStats = latestInvoice ? getInvoiceStats(latestInvoice) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop overflow-y-auto animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-2xl p-5 sm:p-7 animate-pop my-6 border border-white/15 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
        
        {/* Top Header with Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="relative group w-14 h-14 rounded-2xl overflow-hidden bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg border border-white/20 flex-shrink-0">
              {tenant.photo ? (
                <img 
                  src={tenant.photo} 
                  alt={tenant.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{tenant.initials || tenant.name.slice(0, 2)}</span>
              )}
              {onUpdatePhoto && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[9px] text-white font-semibold">
                  <span>📷 আপলোড</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে');
                          return;
                        }
                        try {
                          const url = await uploadToCloudinary(file);
                          onUpdatePhoto(tenant.name, tenant.room, url);
                        } catch (err: any) {
                          alert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err));
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">{tenant.name}</h3>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  {tenant.room}
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  সক্রিয় ভাড়াটিয়া
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>📱 {tenant.phone}</span>
                {tenant.occupation && <span>• 💼 {tenant.occupation}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => printTenantProfile(tenant, room, flatInfo, roommates)}
              className="glass hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
              title="প্রোফাইল বিবরণী প্রিন্ট করুন"
            >
              <span>🖨️</span> প্রিন্ট
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Contact Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a
            href={`tel:${tenant.phone}`}
            className="flex-1 min-w-[120px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-medium transition"
          >
            <span>📞</span> সরাসরি কল
          </a>
          <a
            href={`https://wa.me/88${tenant.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[120px] bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-medium transition"
          >
            <span>💬</span> হোয়াটসঅ্যাপ
          </a>
          {tenant.emergency && (
            <div className="w-full sm:w-auto bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[11px] text-amber-300 flex items-center gap-1.5">
              <span>🚨 জরুরি:</span>
              <span className="font-semibold">{tenant.emergency}</span>
            </div>
          )}
        </div>

        {/* Room Rent & Person-wise Auto-Split Highlight Card */}
        <div className="p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-indigo-200 flex items-center gap-1.5">
              <span>🏠</span> রুম ভাড়া ও ব্যক্তি-ভিত্তিক অটো-স্প্লিট বিবরণ
            </h4>
            <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30">
              {occupantsCount > 1 ? `রুম শেয়ারিং (${toBn(occupantsCount)} জন)` : 'সিঙ্গেল রুম'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <p className="text-[11px] text-gray-400">রুমের মোট ভাড়া</p>
              <p className="text-base font-bold text-cyan-300 mt-0.5">৳ {toBn(roomRent)}</p>
              <p className="text-[10px] text-gray-500">{room?.name || tenant.room}</p>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <p className="text-[11px] text-gray-400">রুমমেট সংখ্যা</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">{toBn(occupantsCount)} জন</p>
              <p className="text-[10px] text-gray-500">বসবাসরত সদস্য</p>
            </div>

            <div className="bg-pink-500/20 p-2.5 rounded-xl border border-pink-500/30">
              <p className="text-[11px] text-pink-300 font-medium">ব্যক্তি প্রতি ভাড়া (স্প্লিট)</p>
              <p className="text-lg font-bold text-pink-400 mt-0.5">৳ {toBn(personRent)}</p>
              <p className="text-[10px] text-pink-300/80">
                {occupantsCount > 1 ? `১/${toBn(occupantsCount)} আনুপাতিক শেয়ার` : 'পূর্ণ ভাড়া'}
              </p>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <p className="text-[11px] text-gray-400">সিকিউরিটি ডিপোজিট</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">৳ {toBn(Number(tenant.deposit) || 0)}</p>
              <p className="text-[10px] text-gray-500">অগ্রিম জমা</p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="text-[11px] text-indigo-200/90 bg-black/20 p-2.5 rounded-xl flex items-center gap-2 border border-white/5">
            <span className="text-base">💡</span>
            <span>
              <strong>স্বয়ংক্রিয় স্প্লিট নিয়ম:</strong> এই রুমের মাসিক মোট ভাড়া ৳ {toBn(roomRent)}। রুমে {toBn(occupantsCount)} জন সদস্য থাকায় প্রত্যেকের মাসিক ভাড়া স্বয়ংক্রিয়ভাবে ৳ {toBn(personRent)} নির্ধারণ করা হয়েছে।
            </span>
          </div>
        </div>

        {/* Roommates in the Same Room */}
        {otherRoommates.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-gray-300 flex items-center gap-1.5">
                <span>👥</span> একই রুমের অন্যান্য রুমমেট ({toBn(otherRoommates.length)} জন)
              </h4>
              <span className="text-[10px] text-gray-400">ক্লিক করে প্রোফাইল দেখুন</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherRoommates.map(r => (
                <div
                  key={r.name}
                  onClick={() => onSelectTenant && onSelectTenant(r)}
                  className="p-2.5 bg-black/30 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border border-white/10">
                      {r.photo ? (
                        <img 
                          src={r.photo} 
                          alt={r.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{r.initials || r.name[0]}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-400">{r.phone}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-bold text-pink-400">৳ {toBn(r.rent || autoSplitRent)}</p>
                    <span className="text-[10px] text-cyan-400 hover:underline">প্রোফাইল →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal & Identification Details Grid */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <h4 className="font-bold text-xs text-gray-300 flex items-center gap-1.5 pb-1 border-b border-white/5">
            <span>📋</span> ব্যক্তিগত ও সনাক্তকরণ তথ্য
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">পিতার নাম:</span>
              <span className="font-medium text-gray-200">{tenant.fatherName || 'তথ্য নেই'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">মাতার নাম:</span>
              <span className="font-medium text-gray-200">{tenant.motherName || 'তথ্য নেই'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">জাতীয় পরিচয়পত্র (NID):</span>
              <span className="font-medium text-cyan-300">{tenant.nid || 'তথ্য নেই'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">পেশা ও কর্মস্থল:</span>
              <span className="font-medium text-gray-200 truncate ml-2">
                {tenant.occupation || 'তথ্য নেই'} {tenant.workplace ? `(${tenant.workplace})` : ''}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">বাসা শুরুর তারিখ:</span>
              <span className="font-medium text-gray-200">{tenant.moveIn || 'তথ্য নেই'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-black/20">
              <span className="text-gray-400">রুমের ধরন:</span>
              <span className="font-medium text-indigo-300">
                {room?.type === 'master' ? 'মাস্টার বেড' : room?.type === 'double' ? 'ডাবল বেড' : 'সিঙ্গেল বেড'}
              </span>
            </div>
          </div>
        </div>

        {/* Police Verification (CIMS) Status Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-lg flex-shrink-0">
              👮‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">বাংলাদেশ পুলিশ ভাড়াটিয়া নিবন্ধন (CIMS)</p>
                {isPoliceVerified ? (
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30">
                    ✓ যাচাইকৃত
                  </span>
                ) : isPolicePending ? (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">
                    ⏳ অপেক্ষমান
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                    অসম্পূর্ণ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isPoliceVerified
                  ? 'পুলিশ ভেরিফিকেশন তথ্য ও ফরম নিরাপদে সংরক্ষিত রয়েছে'
                  : 'আইনানুযায়ী সকল ভাড়াটিয়ার CIMS ফরম পূরণ ও বিট পুলিশে নিবন্ধন বাধ্যতামূলক'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenPoliceForm && onOpenPoliceForm(tenant)}
            className="w-full sm:w-auto bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>📄</span> পুলিশ ফরম দেখুন / পূরণ
          </button>
        </div>

        {/* Latest Invoice & Billing History */}
        {latestInvoice && latestStats && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-gray-300 flex items-center gap-1.5">
                <span>🧾</span> সর্বশেষ ইনভয়েস ({latestInvoice.month})
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                latestStats.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                latestStats.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {latestStats.status === 'paid' ? '✓ পরিশোধিত' : latestStats.status === 'partial' ? '◐ আংশিক পরিশোধিত' : '● বাকি আছে'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-black/20 p-2 rounded-lg">
                <span className="text-gray-400 text-[10px]">রুমের সর্বমোট বিল:</span>
                <p className="font-bold text-white mt-0.5">৳ {toBn(latestStats.total)}</p>
              </div>
              <div className="bg-black/20 p-2 rounded-lg">
                <span className="text-gray-400 text-[10px]">এই ব্যক্তির অংশ (স্প্লিট):</span>
                <p className="font-bold text-cyan-300 mt-0.5">
                  ৳ {toBn(Math.round(latestStats.total / occupantsCount))}
                </p>
              </div>
              <div className="bg-black/20 p-2 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-gray-400 text-[10px]">পরিশোধের শেষ তারিখ:</span>
                <p className="font-medium text-amber-300 mt-0.5">{latestInvoice.dueDate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          {onEditTenant && (
            <button
              onClick={() => {
                onClose();
                onEditTenant(tenant);
              }}
              className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-indigo-300 transition"
            >
              ✏️ সম্পাদনা
            </button>
          )}

          {onRentIncrease && (
            <button
              onClick={() => {
                onClose();
                onRentIncrease(tenant);
              }}
              className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-pink-300 transition"
            >
              💰 ভাড়া বৃদ্ধি
            </button>
          )}

          {onMoveOut && (
            <button
              onClick={() => {
                onClose();
                onMoveOut(tenant);
              }}
              className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-orange-300 transition"
            >
              🚪 Move-out
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
