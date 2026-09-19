import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FlatManagerData, KitchenDutyItem, Tenant } from '../../types';
import { toBn } from '../../lib/storage';

interface KitchenDutyCardProps {
  data: FlatManagerData;
  onUpdateData: (newData: FlatManagerData) => void;
  currentUserRole: 'owner' | 'tenant';
  currentUserName?: string;
  currentUserRoom?: string;
  showAlert?: (msg: string, opts?: { type?: 'success' | 'warning' | 'error' }) => void;
}

export const KitchenDutyCard: React.FC<KitchenDutyCardProps> = ({
  data,
  onUpdateData,
  currentUserRole,
  currentUserName,
  currentUserRoom,
  showAlert
}) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [tempSchedule, setTempSchedule] = useState<KitchenDutyItem[]>([]);

  const kitchenDuty = data.kitchenDuty || {
    enabled: true,
    timeSlot: 'রাত ১০:০০ – ১১:০০ টা',
    rules: [
      'খাওয়ার পর নিজের ব্যবহৃত থালা-বাসন ও রান্নার হাড়ি তাৎক্ষণিক ধুয়ে রাখতে হবে।',
      'ডিউটিপ্রাপ্ত ব্যক্তি চুলার চারপাশ, কিচেন স্ল্যাব ও সিঙ্ক পরিষ্কার ও শুকনা রাখবেন।',
      'প্রতিদিনের ময়লা ডাস্টবিনে ফেলে ডাস্টবিনটি পরিষ্কার রাখবেন।',
      'পরিষ্কার সম্পন্ন হলে নিচে "✓ কাজ সম্পন্ন করেছি" বাটনে ক্লিক করে নিশ্চিত করবেন।'
    ],
    schedule: [],
    logs: []
  };

  const today = new Date();
  const dayIndex = today.getDay(); // 0: রবি, 1: সোম, ... 6: শনি
  const dateStr = today.toISOString().split('T')[0];

  // Map dayIndex to Bangla day names
  const dayNamesBangla: { [key: number]: string } = {
    6: 'শনিবার',
    0: 'রবিবার',
    1: 'সোমবার',
    2: 'মঙ্গলবার',
    3: 'বুধবার',
    4: 'বৃহস্পতিবার',
    5: 'শুক্রবার'
  };

  const todayBangla = dayNamesBangla[dayIndex] || 'আজ';
  const tomorrowIndex = (dayIndex + 1) % 7;
  const tomorrowBangla = dayNamesBangla[tomorrowIndex];

  // Find today's and tomorrow's duty
  const todayDuty = kitchenDuty.schedule.find(s => s.dayIndex === dayIndex) || {
    id: `kd-${dayIndex}`,
    dayIndex,
    dayName: todayBangla,
    assignedTo: 'নির্ধারিত হয়নি',
    room: 'রুম ২',
    timeSlot: kitchenDuty.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'
  };

  const tomorrowDuty = kitchenDuty.schedule.find(s => s.dayIndex === tomorrowIndex);

  // Check today's completion status from logs
  const todayLog = (kitchenDuty.logs || []).find(l => l.date === dateStr);
  const isCompletedToday = todayLog?.status === 'completed';

  // Find assigned tenant photo and details
  const getTenantDetails = (nameOrRoom: string): { tenant?: Tenant; photo?: string; initials: string } => {
    const tenant = data.tenants.find(t => 
      t.name.trim().toLowerCase() === nameOrRoom.trim().toLowerCase() ||
      (t.room && nameOrRoom.includes(t.room))
    );
    if (tenant) {
      return {
        tenant,
        photo: tenant.photo,
        initials: tenant.initials || tenant.name[0]
      };
    }
    return {
      initials: nameOrRoom.length > 0 ? nameOrRoom[0] : '🍳'
    };
  };

  const assignedDetails = getTenantDetails(todayDuty.assignedTo);

  // Check if active user is assigned today
  const isUserAssignedToday = 
    (currentUserName && todayDuty.assignedTo.includes(currentUserName)) ||
    (currentUserRoom && todayDuty.room.includes(currentUserRoom)) ||
    todayDuty.assignedTo.includes('সকল সদস্য');

  // Toggle duty completion
  const handleToggleComplete = () => {
    const newStatus = isCompletedToday ? 'pending' : 'completed';
    const currentTimeBangla = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const actorName = currentUserName || (currentUserRole === 'owner' ? 'ফ্ল্যাট মালিক' : 'ভাড়াটিয়া');

    let updatedLogs = [...(kitchenDuty.logs || [])];
    const existingIdx = updatedLogs.findIndex(l => l.date === dateStr);

    if (existingIdx >= 0) {
      if (newStatus === 'pending') {
        updatedLogs.splice(existingIdx, 1);
      } else {
        updatedLogs[existingIdx] = {
          ...updatedLogs[existingIdx],
          status: 'completed',
          completedAt: currentTimeBangla,
          completedBy: actorName
        };
      }
    } else if (newStatus === 'completed') {
      updatedLogs.push({
        id: `log-${Date.now()}`,
        date: dateStr,
        dayName: todayBangla,
        assignedTo: todayDuty.assignedTo,
        room: todayDuty.room,
        status: 'completed',
        completedAt: currentTimeBangla,
        completedBy: actorName
      });
    }

    const updatedData: FlatManagerData = {
      ...data,
      kitchenDuty: {
        ...kitchenDuty,
        logs: updatedLogs
      }
    };

    onUpdateData(updatedData);

    if (newStatus === 'completed') {
      showAlert?.('আজকের কিচেন ক্লিন ডিউটি সম্পন্ন হিসেবে মার্ক করা হয়েছে! ধন্যবাদ। 🌟', { type: 'success' });
    } else {
      showAlert?.('ডিউটি স্ট্যাটাস অমীমাংসিত হিসেবে পুনরায় সেট করা হয়েছে।', { type: 'warning' });
    }
  };

  // Auto-distribute duty among active tenants
  const handleAutoRotate = () => {
    if (!data.tenants || data.tenants.length === 0) {
      showAlert?.('ফ্ল্যাটে কোনো সক্রিয় ভাড়াটিয়া পাওয়া যায়নি।', { type: 'warning' });
      return;
    }
    const order = [6, 0, 1, 2, 3, 4, 5];
    const rotated = order.map((dayIdx, i) => {
      const assignedTenant = data.tenants[i % data.tenants.length];
      return {
        id: `kd-${dayIdx}`,
        dayIndex: dayIdx,
        dayName: dayNamesBangla[dayIdx],
        assignedTo: assignedTenant.name,
        room: assignedTenant.room || 'রুম ২',
        timeSlot: kitchenDuty.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'
      };
    });
    setTempSchedule(rotated);
    showAlert?.('সদস্যদের মাঝে পালাক্রমে রুটিন বণ্টন করা হয়েছে। সংরক্ষণ করতে "রুটিন সংরক্ষণ করুন" বাটনে ক্লিক করুন।', { type: 'info' });
  };

  const handleSetAllJoint = () => {
    const order = [6, 0, 1, 2, 3, 4, 5];
    const joint = order.map((dayIdx) => ({
      id: `kd-${dayIdx}`,
      dayIndex: dayIdx,
      dayName: dayNamesBangla[dayIdx],
      assignedTo: 'সকল সদস্য (যৌথ)',
      room: 'যৌথ ডিউটি',
      timeSlot: kitchenDuty.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'
    }));
    setTempSchedule(joint);
    showAlert?.('সব দিনে যৌথ দায়িত্ব সেট করা হয়েছে। সংরক্ষণ করতে বাটনে ক্লিক করুন।', { type: 'info' });
  };

  // 1-Click Auto Schedule (Owner only)
  const handleOneClickAutoSchedule = () => {
    if (!data.tenants || data.tenants.length === 0) {
      showAlert?.('ফ্ল্যাটে কোনো সক্রিয় ভাড়াটিয়া পাওয়া যায়নি। অনুগ্রহ করে আগে ভাড়াটিয়া যুক্ত করুন।', { type: 'warning' });
      return;
    }
    const order = [6, 0, 1, 2, 3, 4, 5];
    const rotated = order.map((dayIdx, i) => {
      const assignedTenant = data.tenants[i % data.tenants.length];
      return {
        id: `kd-${dayIdx}`,
        dayIndex: dayIdx,
        dayName: dayNamesBangla[dayIdx],
        assignedTo: assignedTenant.name,
        room: assignedTenant.room || 'রুম ২',
        timeSlot: kitchenDuty.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'
      };
    });

    const updatedData: FlatManagerData = {
      ...data,
      kitchenDuty: {
        ...kitchenDuty,
        schedule: rotated
      }
    };
    onUpdateData(updatedData);
    showAlert?.('⚡ ১ ক্লিকে সফলভাবে সাপ্তাহিক কিচেন ডিউটি রুটিন অটো-শিডিউল ও সংরক্ষণ করা হয়েছে! 🌟', { type: 'success' });
  };

  // Start schedule editing (owner only)
  const handleOpenEdit = () => {
    // Sort schedule starting from Saturday to Friday
    const order = [6, 0, 1, 2, 3, 4, 5];
    const fullWeek = order.map(idx => {
      const existing = kitchenDuty.schedule.find(s => s.dayIndex === idx);
      return existing || {
        id: `kd-${idx}`,
        dayIndex: idx,
        dayName: dayNamesBangla[idx],
        assignedTo: data.tenants[0]?.name || 'রুম ২',
        room: data.tenants[0]?.room || 'রুম ২',
        timeSlot: kitchenDuty.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'
      };
    });
    setTempSchedule(fullWeek);
    setIsEditingSchedule(true);
  };

  // Save schedule (owner only)
  const handleSaveSchedule = () => {
    const updatedData: FlatManagerData = {
      ...data,
      kitchenDuty: {
        ...kitchenDuty,
        schedule: tempSchedule
      }
    };
    onUpdateData(updatedData);
    setIsEditingSchedule(false);
    showAlert?.('সাপ্তাহিক কিচেন ডিউটি রুটিন সফলভাবে সংরক্ষিত হয়েছে!', { type: 'success' });
  };

  // List of unique room names for options
  const roomOptions = Array.from(new Set(data.rooms.map(r => r.name)));

  return (
    <div className="glass rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden shadow-xl">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
            🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                রান্নাঘর ক্লিন ডিউটি
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {todayBangla}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              দৈনিক কিচেন পরিচ্ছন্নতা রুটিন ও দায়িত্ব বণ্টন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-1.5 mt-2 sm:mt-0">
          {currentUserRole === 'owner' && (
            <button
              onClick={handleOneClickAutoSchedule}
              className="px-2 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1 transition shadow whitespace-nowrap"
              title="১ ক্লিকে সব সদস্যের মাঝে অটো রুটিন তৈরি ও সংরক্ষণ করুন"
            >
              <span>⚡</span> ১-ক্লিক অটো রুটিন
            </button>
          )}
          <button
            onClick={() => setShowRules(!showRules)}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center justify-center gap-1 transition whitespace-nowrap"
            title="কিচেন ব্যবহারের নিয়মাবলী"
          >
            <span>📜</span> নিয়মাবলী
          </button>
          <button
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1 transition whitespace-nowrap"
          >
            <span>📅</span> {showFullSchedule ? 'রুটিন বন্ধ' : 'সাপ্তাহিক'}
          </button>
          {currentUserRole === 'owner' && (
            <button
              onClick={handleOpenEdit}
              className="px-2 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1 transition whitespace-nowrap"
              title="রুটিন এডিট করুন"
            >
              <span>✏️</span> এডিট
            </button>
          )}
        </div>
      </div>

      {/* Today's Duty Highlight Banner */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-white/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Member Photo Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-amber-400/40">
              {assignedDetails.photo ? (
                <img
                  src={assignedDetails.photo}
                  alt={todayDuty.assignedTo}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-base">{assignedDetails.initials}</span>
              )}
            </div>
            {isCompletedToday ? (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow font-bold" title="সম্পন্ন">
                ✓
              </span>
            ) : (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] shadow font-bold" title="ডিউটি বাকি">
                🧹
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                আজকের দায়িত্বপ্রাপ্ত সদস্য:
              </span>
              {isUserAssignedToday && (
                <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                  আপনার ডিউটি!
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white truncate mt-0.5 flex items-center gap-2">
              <span>{todayDuty.assignedTo}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-normal">
                {todayDuty.room}
              </span>
            </h4>
            <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
              <span>⏰ সময়সূচি: <strong>{todayDuty.timeSlot || kitchenDuty.timeSlot}</strong></span>
              {todayDuty.note && <span className="text-amber-300 italic">({todayDuty.note})</span>}
            </p>
          </div>
        </div>

        {/* Action Button & Status Pill */}
        <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
          <div className="text-center sm:text-right">
            {isCompletedToday ? (
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ✓ আজকের কাজ সম্পন্ন
                </span>
                {todayLog?.completedAt && (
                  <p className="text-[10px] text-gray-400">
                    সময়: {todayLog.completedAt} ({todayLog.completedBy})
                  </p>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ⏳ দায়িত্ব বাকি আছে
              </span>
            )}
          </div>

          <div className="flex items-center w-full sm:w-auto">
            <button
              onClick={handleToggleComplete}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5 ${
                isCompletedToday
                  ? 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isCompletedToday ? (
                <>
                  <span>↩</span> আবার অমীমাংসিত করুন
                </>
              ) : (
                <>
                  <span>✓</span> কাজ সম্পন্ন করেছি
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tomorrow Preview Pill */}
      {tomorrowDuty && (
        <div className="mt-3 px-3.5 py-2 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold">⏳ আগামীকাল ({tomorrowBangla}):</span>
            <span className="font-bold text-white">{tomorrowDuty.assignedTo} ({tomorrowDuty.room})</span>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            সাপ্তাহিক রোটেশন অনুযায়ী
          </span>
        </div>
      )}

      {/* Expandable Kitchen Rules */}
      {showRules && (
        <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/10 animate-fade-in space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🧹</span> কিচেন পরিচ্ছন্নতার আবশ্যক ৪টি নিয়ম
            </h5>
            <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-white text-xs">✕ বন্ধ</button>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-300 leading-relaxed">
            {kitchenDuty.rules.map((rule, idx) => (
              <li key={idx} className="pl-1">
                <span className="text-white">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Expandable Full 7-Day Schedule */}
      {showFullSchedule && (
        <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/10 animate-fade-in space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>📅</span> সাপ্তাহিক কিচেন ক্লিন রুটিন
              </h5>
              <p className="text-[11px] text-gray-400">প্রতি সপ্তাহের শনিবার থেকে শুক্রবারের দায়িত্ব তালিকা</p>
            </div>
            {currentUserRole === 'owner' && (
              <button
                onClick={handleOpenEdit}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>✏️</span> রুটিন পরিবর্তন করুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {[6, 0, 1, 2, 3, 4, 5].map(idx => {
              const item = kitchenDuty.schedule.find(s => s.dayIndex === idx);
              const isTodayItem = idx === dayIndex;
              const dayName = dayNamesBangla[idx];
              const details = getTenantDetails(item?.assignedTo || '');

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                    isTodayItem
                      ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border border-white/10">
                    {details.photo ? (
                      <img src={details.photo} alt={item?.assignedTo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{details.initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isTodayItem ? 'text-amber-400' : 'text-gray-300'}`}>
                        {dayName} {isTodayItem && '★'}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate ml-1">{item?.room || ''}</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate mt-0.5">
                      {item?.assignedTo || 'নির্ধারিত হয়নি'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {item?.note || item?.timeSlot || kitchenDuty.timeSlot}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Schedule Modal (Owner Only) - Teleported to document.body via Portal */}
      {isEditingSchedule && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative w-full max-w-2xl rounded-2xl p-5 sm:p-6 bg-[#0f1222] border-2 border-amber-500/60 shadow-2xl shadow-black my-auto text-white space-y-4 max-h-[92vh] overflow-y-auto animate-pop">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10 sticky top-0 bg-[#0f1222]/95 backdrop-blur z-10">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400">🍳</span> কিচেন ডিউটি রুটিন পরিবর্তন করুন
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  শনিবার থেকে শুক্রবার পর্যন্ত প্রতিটি বারে কোন সদস্য ও কোন রুম দায়িত্ব পালন করবে তা ঠিক করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSchedule(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick Automation Tools */}
            <div className="p-3 rounded-xl bg-[#171b33] border border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                <span>⚡</span> কুইক অ্যাকশন:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoRotate}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center gap-1 shadow"
                >
                  <span>🔄</span> সব সদস্যে সমান বণ্টন
                </button>
                <button
                  type="button"
                  onClick={handleSetAllJoint}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition flex items-center gap-1 shadow"
                >
                  <span>👥</span> যৌথ দায়িত্ব সেট করুন
                </button>
              </div>
            </div>

            {/* 7 Days Schedule List */}
            <div className="space-y-2.5">
              {tempSchedule.map((item, idx) => (
                <div
                  key={item.dayIndex}
                  className="p-3 bg-[#161a2e] rounded-xl border border-white/10 hover:border-amber-500/40 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                        {item.dayName}
                      </span>
                      <span className="text-[11px] text-gray-400">সাপ্তাহিক রুটিন</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span>সময়সূচি:</span>
                      <span className="text-white font-medium bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {item.timeSlot || 'রাত ১০:০০ – ১১:০০ টা'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-gray-300 font-semibold block mb-1">
                        দায়িত্বপ্রাপ্ত সদস্য:
                      </label>
                      <select
                        value={
                          data.tenants.some(t => t.name === item.assignedTo)
                            ? item.assignedTo
                            : item.assignedTo === 'সকল সদস্য (যৌথ)'
                            ? 'সকল সদস্য (যৌথ)'
                            : '__custom__'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...tempSchedule];
                          if (val === '__custom__') {
                            next[idx].assignedTo = '';
                          } else if (val === 'সকল সদস্য (যৌথ)') {
                            next[idx].assignedTo = 'সকল সদস্য (যৌথ)';
                            next[idx].room = 'যৌথ ডিউটি';
                          } else {
                            const matchedTenant = data.tenants.find(t => t.name === val);
                            next[idx].assignedTo = val;
                            if (matchedTenant?.room) {
                              next[idx].room = matchedTenant.room;
                            }
                          }
                          setTempSchedule(next);
                        }}
                        className="w-full bg-[#0a0d18] border border-gray-600 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none mb-1"
                      >
                        <option value="" disabled>সদস্য নির্বাচন করুন</option>
                        {data.tenants.map(t => (
                          <option key={t.name} value={t.name}>
                            👤 {t.name} ({t.room || 'রুম'})
                          </option>
                        ))}
                        <option value="সকল সদস্য (যৌথ)">👥 সকল সদস্য (যৌথ ডিউটি)</option>
                        <option value="__custom__">✏️ অন্য নাম লিখুন...</option>
                      </select>

                      {(!data.tenants.some(t => t.name === item.assignedTo) && item.assignedTo !== 'সকল সদস্য (যৌথ)') && (
                        <input
                          type="text"
                          value={item.assignedTo}
                          onChange={(e) => {
                            const next = [...tempSchedule];
                            next[idx].assignedTo = e.target.value;
                            setTempSchedule(next);
                          }}
                          placeholder="সদস্যের নাম লিখুন"
                          className="w-full bg-[#0a0d18] border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-300 font-semibold block mb-1">
                        সংশ্লিষ্ট রুম:
                      </label>
                      <select
                        value={item.room}
                        onChange={(e) => {
                          const next = [...tempSchedule];
                          next[idx].room = e.target.value;
                          setTempSchedule(next);
                        }}
                        className="w-full bg-[#0a0d18] border border-gray-600 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="যৌথ ডিউটি">যৌথ ডিউটি (সকল রুম)</option>
                        {roomOptions.map(r => (
                          <option key={r} value={r}>🚪 {r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10 sticky bottom-0 bg-[#0f1222]/95 backdrop-blur z-10">
              <button
                type="button"
                onClick={() => setIsEditingSchedule(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10 transition"
              >
                ✕ বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5"
              >
                <span>✓</span> রুটিন সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
