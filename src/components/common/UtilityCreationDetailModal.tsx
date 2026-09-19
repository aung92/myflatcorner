import React, { useState } from 'react';
import { Room, Tenant, FlatInfo, MeterReadingInfo } from '../../types';
import { toBn } from '../../lib/storage';
import { openPrintDocument } from '../../lib/printUtils';

export interface UtilityInputData {
  electric: number;
  water: number;
  gas: number;
  wifi: number;
  garbage: number;
  service: number;
  month: string;
  dueDate: string;
}

export interface UtilityCreationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  utilityInput: UtilityInputData;
  meterInput: {
    prevUnit: number;
    currentUnit: number;
    unitRate: number;
    meterNo: string;
  };
  meterMode: boolean;
  allRooms?: Room[];
  occupiedRooms: Room[];
  tenants: Tenant[];
  flatInfo: FlatInfo;
  onConfirmGenerate: () => void;
}

export const UtilityCreationDetailModal: React.FC<UtilityCreationDetailModalProps> = ({
  isOpen,
  onClose,
  utilityInput,
  meterInput,
  meterMode,
  allRooms = [],
  occupiedRooms,
  tenants,
  flatInfo,
  onConfirmGenerate
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'persons' | 'summary'>('rooms');

  if (!isOpen) return null;

  const totalRoomsCount = allRooms.length > 0 ? allRooms.length : (flatInfo.totalRooms || occupiedRooms.length || 1);
  const occupiedRoomCount = occupiedRooms.length;
  const utilityRatio = occupiedRoomCount > 0 ? 1 / occupiedRoomCount : 0;
  const serviceRatio = totalRoomsCount > 0 ? 1 / totalRoomsCount : 0;

  const utilityTotal = 
    Number(utilityInput.electric || 0) + 
    Number(utilityInput.water || 0) + 
    Number(utilityInput.gas || 0) + 
    Number(utilityInput.wifi || 0) + 
    Number(utilityInput.garbage || 0);

  const perRoomUtility = Math.round(utilityTotal * utilityRatio);
  const perRoomService = Math.round(Number(utilityInput.service || 0) * serviceRatio);
  const totalPerRoomUtility = perRoomUtility + perRoomService;
  const grandFlatUtility = utilityTotal + Number(utilityInput.service || 0);

  const consumedUnits = meterMode ? Math.max(0, meterInput.currentUnit - meterInput.prevUnit) : 0;

  // Build room-wise and person-wise calculation rows
  const roomCalculations = occupiedRooms.map(room => {
    const isOwner = room.status === 'owner';
    const roomPersons = tenants.filter(t => t.room === room.name);
    const occupantsCount = Math.max(1, roomPersons.length);
    const primary = roomPersons[0];
    const roomRent = isOwner ? 0 : (Number(room.rent) || (primary?.rent ? Number(primary.rent) * occupantsCount : 0));
    const roomTotal = roomRent + totalPerRoomUtility;

    // Person-wise auto split
    const personSplitRent = Math.round(roomRent / occupantsCount);
    const personSplitUtility = Math.round(totalPerRoomUtility / occupantsCount);
    const personSplitTotal = personSplitRent + personSplitUtility;

    const personDetails = roomPersons.map(p => {
      // If person has customized rent or default to split rent
      const rentShare = p.rent ? Number(p.rent) : personSplitRent;
      const utilityShare = personSplitUtility;
      const totalShare = rentShare + utilityShare;
      return {
        tenant: p,
        rentShare,
        utilityShare,
        totalShare,
        electricShare: Math.round(Number(utilityInput.electric || 0) * utilityRatio / occupantsCount),
        waterShare: Math.round(Number(utilityInput.water || 0) * utilityRatio / occupantsCount),
        gasShare: Math.round(Number(utilityInput.gas || 0) * utilityRatio / occupantsCount),
        wifiShare: Math.round(Number(utilityInput.wifi || 0) * utilityRatio / occupantsCount),
        garbageShare: Math.round(Number(utilityInput.garbage || 0) * utilityRatio / occupantsCount),
        serviceShare: Math.round(Number(utilityInput.service || 0) * serviceRatio / occupantsCount)
      };
    });

    return {
      room,
      isOwner,
      roomPersons,
      occupantsCount,
      roomRent,
      roomUtility: totalPerRoomUtility,
      roomTotal,
      personSplitRent,
      personSplitUtility,
      personSplitTotal,
      personDetails
    };
  });

  const totalAllPersons = roomCalculations.reduce((sum, r) => sum + r.occupantsCount, 0);
  const totalRentAllRooms = roomCalculations.reduce((sum, r) => sum + r.roomRent, 0);
  const grandTotalAllRooms = totalRentAllRooms + (grandFlatUtility);

  const handlePrintDraft = () => {
    const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>ইউটিলিটি ও রুম ভাড়া হিসাব বিবরণী — ${utilityInput.month}</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Hind Siliguri', sans-serif; padding: 25px; color: #1e293b; background: white; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
      th { background: #f1f5f9; font-weight: 700; color: #0f172a; }
      .text-right { text-align: right; }
      .header { border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 15px; }
      .total-row { background: #fef08a; font-weight: bold; }
    </style></head><body>
      <div class="header">
        <h2 style="margin:0; color:#4338ca;">🏠 ${flatInfo.name} — মাসিক ইউটিলিটি ও অটো-স্প্লিট বিল বিবরণী</h2>
        <p style="margin:4px 0 0; color:#64748b;">মাস: <strong>${utilityInput.month}</strong> • বিল পরিশোধের শেষ তারিখ: <strong>${utilityInput.dueDate}</strong></p>
      </div>
      <h3>১. রুম ও ব্যক্তি-ভিত্তিক অটো-স্প্লিট হিসাব</h3>
      <table>
        <thead>
          <tr>
            <th>রুম নং</th>
            <th>ভাড়াটিয়াগণ (সদস্য)</th>
            <th class="text-right">রুম ভাড়া (মোট)</th>
            <th class="text-right">ব্যক্তি প্রতি ভাড়া (স্প্লিট)</th>
            <th class="text-right">রুমের ইউটিলিটি</th>
            <th class="text-right">ব্যক্তি প্রতি ইউটিলিটি</th>
            <th class="text-right">রুম সর্বমোট</th>
          </tr>
        </thead>
        <tbody>
          ${roomCalculations.map(r => `
            <tr>
              <td><strong>${r.room.name}</strong> ${r.isOwner ? '(মালিক)' : ''}</td>
              <td>${r.roomPersons.map(p => p.name).join(', ') || '—'} (${toBn(r.occupantsCount)} জন)</td>
              <td class="text-right">৳ ${toBn(r.roomRent)}</td>
              <td class="text-right" style="color:#db2777; font-weight:600;">৳ ${toBn(r.personSplitRent)}</td>
              <td class="text-right">৳ ${toBn(r.roomUtility)}</td>
              <td class="text-right" style="color:#0284c7; font-weight:600;">৳ ${toBn(r.personSplitUtility)}</td>
              <td class="text-right" style="font-weight:700;">৳ ${toBn(r.roomTotal)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2">সর্বমোট ফ্ল্যাট হিসাব (${toBn(occupiedRoomCount)} টি অকুপাইড রুম / ${toBn(totalRoomsCount)} টি মোট রুম, ${toBn(totalAllPersons)} জন)</td>
            <td class="text-right">৳ ${toBn(totalRentAllRooms)}</td>
            <td class="text-right">—</td>
            <td class="text-right">৳ ${toBn(grandFlatUtility)}</td>
            <td class="text-right">—</td>
            <td class="text-right">৳ ${toBn(grandTotalAllRooms)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:30px; text-align:center;">
        <button onclick="window.print()" style="padding:8px 20px; font-weight:bold; cursor:pointer;">প্রিন্ট করুন</button>
      </div>
    </body></html>`;

    openPrintDocument(html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop overflow-y-auto animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-4xl p-5 sm:p-7 animate-pop my-6 border border-white/15 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl shadow-lg border border-emerald-400/30 flex-shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white">ইউটিলিটি বিল তৈরি ও ব্যক্তি-ভিত্তিক অটো-স্প্লিট বিবরণী</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  মাস: {utilityInput.month}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                বিল তৈরির পূর্বে প্রতিটি খাতের বিস্তারিত হিসাব ও রুমমেটদের আনুপাতিক অটো-স্প্লিট যাচাই করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrintDraft}
              className="glass hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
              title="বিস্তারিত হিসাব শিট প্রিন্ট করুন"
            >
              <span>🖨️</span> ড্রাফট প্রিন্ট
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Top Flat Totals KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-gray-400">⚡ ফ্ল্যাটের মোট ইউটিলিটি</p>
            <p className="text-lg font-bold text-amber-400 mt-0.5">৳ {toBn(grandFlatUtility)}</p>
            <p className="text-[10px] text-gray-500">ইউটিলিটি + সার্ভিস চার্জ</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-[11px] text-cyan-300">🏠 রুম প্রতি ইউটিলিটি ভাগ</p>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">৳ {toBn(totalPerRoomUtility)}</p>
            <p className="text-[10px] text-cyan-400/70">{toBn(occupiedRoomCount)} টি রুমে ইউটিলিটি + {toBn(totalRoomsCount)} টি রুমে সার্ভিস</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20">
            <p className="text-[11px] text-pink-300">👥 মোট সদস্য ও রুম ভাড়া</p>
            <p className="text-lg font-bold text-pink-400 mt-0.5">৳ {toBn(totalRentAllRooms)}</p>
            <p className="text-[10px] text-pink-400/70">{toBn(totalAllPersons)} জন বসবাসরত</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <p className="text-[11px] text-indigo-300">💰 সর্বমোট প্রদেয় ফ্ল্যাট বিল</p>
            <p className="text-lg font-bold text-white mt-0.5">৳ {toBn(grandTotalAllRooms)}</p>
            <p className="text-[10px] text-indigo-300/80">ভাড়া + সকল ইউটিলিটি</p>
          </div>
        </div>

        {/* Itemized Utility Heads Pill Breakdown */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-300">📋 এই মাসের ইউটিলিটি খাতসমূহের ইনপুট বিস্তারিত:</span>
            {meterMode && (
              <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                সাবমিটার: {toBn(consumedUnits)} ইউনিট × ৳{toBn(meterInput.unitRate)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-amber-300/90 text-[11px]">⚡ বিদ্যুৎ (অকুপাইড ১/{toBn(occupiedRoomCount)}):</span>
              <p className="font-bold text-white mt-0.5">৳ {toBn(utilityInput.electric)}</p>
              <p className="text-[10px] text-gray-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.electric * utilityRatio))}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-cyan-300/90 text-[11px]">💧 পানি (অকুপাইড ১/{toBn(occupiedRoomCount)}):</span>
              <p className="font-bold text-white mt-0.5">৳ {toBn(utilityInput.water)}</p>
              <p className="text-[10px] text-gray-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.water * utilityRatio))}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-orange-300/90 text-[11px]">🔥 গ্যাস (অকুপাইড ১/{toBn(occupiedRoomCount)}):</span>
              <p className="font-bold text-white mt-0.5">৳ {toBn(utilityInput.gas)}</p>
              <p className="text-[10px] text-gray-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.gas * utilityRatio))}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-indigo-300/90 text-[11px]">📶 ওয়াইফাই (অকুপাইড ১/{toBn(occupiedRoomCount)}):</span>
              <p className="font-bold text-white mt-0.5">৳ {toBn(utilityInput.wifi)}</p>
              <p className="text-[10px] text-gray-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.wifi * utilityRatio))}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-emerald-300/90 text-[11px]">🗑️ ময়লা (অকুপাইড ১/{toBn(occupiedRoomCount)}):</span>
              <p className="font-bold text-white mt-0.5">৳ {toBn(utilityInput.garbage)}</p>
              <p className="text-[10px] text-gray-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.garbage * utilityRatio))}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-purple-300/90 text-[11px] font-semibold">🛠️ সার্ভিস চার্জ (মোট রুম ১/{toBn(totalRoomsCount)}):</span>
              <p className="font-bold text-purple-300 mt-0.5">৳ {toBn(utilityInput.service)}</p>
              <p className="text-[10px] text-purple-200/70">রুম প্রতি ৳ {toBn(perRoomService)}</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 font-semibold rounded-xl transition ${
              activeTab === 'rooms'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏠 রুম-ভিত্তিক হিসাব ও অটো-স্প্লিট সামারি
          </button>
          <button
            onClick={() => setActiveTab('persons')}
            className={`flex-1 py-2 font-semibold rounded-xl transition ${
              activeTab === 'persons'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 ব্যক্তি-ভিত্তিক পুঙ্খানুপুঙ্খ অটো-স্প্লিট তালিকা
          </button>
        </div>

        {/* TAB 1: Room-wise breakdown with Person auto-split summary */}
        {activeTab === 'rooms' && (
          <div className="space-y-3">
            {roomCalculations.map(r => (
              <div
                key={r.room.name}
                className={`p-4 rounded-2xl border transition ${
                  r.isOwner
                    ? 'bg-purple-900/20 border-purple-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-white">{r.room.name}</span>
                    {r.isOwner ? (
                      <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-semibold">
                        👑 আপনি (মালিক)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">
                        {r.roomPersons.map(p => p.name).join(', ') || 'ভাড়াটিয়া নির্ধারিত হয়নি'}
                      </span>
                    )}
                    <span className="text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                      {toBn(r.occupantsCount)} জন সদস্য
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-gray-400">এই রুমের মোট প্রদেয়: </span>
                    <strong className="text-emerald-400 text-sm">৳ {toBn(r.roomTotal)}</strong>
                  </div>
                </div>

                {/* Split Calculation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                  {/* Left: Room Total */}
                  <div className="bg-black/30 p-3 rounded-xl space-y-1.5">
                    <p className="text-[11px] text-gray-400 font-semibold mb-1">🏠 রুমের মোট খরচ:</p>
                    <div className="flex justify-between">
                      <span className="text-gray-300">মূল রুম ভাড়া:</span>
                      <span className="font-semibold text-pink-400">৳ {toBn(r.roomRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">ইউটিলিটি ও সার্ভিস চার্জ:</span>
                      <span className="font-semibold text-cyan-400">৳ {toBn(r.roomUtility)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-white/10 font-bold">
                      <span className="text-white">রুম সর্বমোট:</span>
                      <span className="text-green-400">৳ {toBn(r.roomTotal)}</span>
                    </div>
                  </div>

                  {/* Right: Person-wise Auto Split Result */}
                  <div className="bg-indigo-950/40 border border-indigo-500/20 p-3 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[11px] text-indigo-300 font-bold flex items-center gap-1">
                        <span>👥</span> ব্যক্তি-প্রতি স্বয়ংক্রিয় অটো-স্প্লিট (১/{toBn(r.occupantsCount)}):
                      </p>
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.2 rounded font-semibold">
                        অটো ক্যালকুলেটেড
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>ব্যক্তি প্রতি রুম ভাড়া:</span>
                      <span className="font-bold text-pink-400">৳ {toBn(r.personSplitRent)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>ব্যক্তি প্রতি ইউটিলিটি ভাগ:</span>
                      <span className="font-bold text-cyan-300">৳ {toBn(r.personSplitUtility)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-indigo-500/30 font-bold">
                      <span className="text-indigo-200">ব্যক্তি প্রতি সর্বমোট বিল:</span>
                      <span className="text-amber-400 text-sm">৳ {toBn(r.personSplitTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Individual Persons in this room */}
                {r.roomPersons.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <p className="text-[11px] text-gray-400 mb-1.5">সদস্য তালিকা ও পৃথক বিল স্লিপ:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.personDetails.map(pd => (
                        <div key={pd.tenant.name} className="p-2 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">{pd.tenant.name}</p>
                            <p className="text-[10px] text-gray-400">{pd.tenant.phone}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400">ভাড়া ৳{toBn(pd.rentShare)} + ইউটিলিটি ৳{toBn(pd.utilityShare)}</span>
                            <p className="font-bold text-emerald-400 text-xs">মোট: ৳ {toBn(pd.totalShare)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Person-wise All Occupants Detailed Line Items */}
        {activeTab === 'persons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-left border-b border-white/10 bg-white/5">
                  <th className="p-2.5 font-semibold">ভাড়াটিয়ার নাম</th>
                  <th className="p-2.5 font-semibold">রুম</th>
                  <th className="p-2.5 font-semibold text-right">রুম ভাড়া শেয়ার</th>
                  <th className="p-2.5 font-semibold text-right">⚡ বিদ্যুৎ</th>
                  <th className="p-2.5 font-semibold text-right">💧 পানি</th>
                  <th className="p-2.5 font-semibold text-right">🔥 গ্যাস</th>
                  <th className="p-2.5 font-semibold text-right">📶 ওয়াইফাই</th>
                  <th className="p-2.5 font-semibold text-right">🛠️ সার্ভিস+ময়লা</th>
                  <th className="p-2.5 font-semibold text-right text-emerald-400">সর্বমোট প্রদেয়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roomCalculations.flatMap(r => r.personDetails).map((pd, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="p-2.5">
                      <p className="font-semibold text-white">{pd.tenant.name}</p>
                      <p className="text-[10px] text-gray-400">{pd.tenant.phone}</p>
                    </td>
                    <td className="p-2.5 text-cyan-400 font-semibold">{pd.tenant.room}</td>
                    <td className="p-2.5 text-right font-bold text-pink-400">৳ {toBn(pd.rentShare)}</td>
                    <td className="p-2.5 text-right text-gray-300">৳ {toBn(pd.electricShare)}</td>
                    <td className="p-2.5 text-right text-gray-300">৳ {toBn(pd.waterShare)}</td>
                    <td className="p-2.5 text-right text-gray-300">৳ {toBn(pd.gasShare)}</td>
                    <td className="p-2.5 text-right text-gray-300">৳ {toBn(pd.wifiShare)}</td>
                    <td className="p-2.5 text-right text-gray-300">৳ {toBn(pd.serviceShare + pd.garbageShare)}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400 text-sm">৳ {toBn(pd.totalShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center sm:text-left">
            <span>হিসাব মাস: <strong className="text-cyan-300">{utilityInput.month}</strong></span> • 
            <span> পরিশোধের শেষ তারিখ: <strong className="text-amber-300">{utilityInput.dueDate}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-gray-300 transition"
            >
              বাতিল / পরিবর্তন
            </button>
            <button
              onClick={() => {
                onClose();
                onConfirmGenerate();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <span>⚡</span> হ্যাঁ, এই হিসাবে ইনভয়েস তৈরি করুন
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
