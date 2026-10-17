import React, { useState } from 'react';
import { FlatManagerData, RecurringMaint } from '../../types';
import { runAllSystemAutomations, getBengaliMonthName, getCurrentMonthStr, getTodayDateStr } from '../../lib/automationService';
import { toBn } from '../../lib/storage';

interface AutomationCenterProps {
  data: FlatManagerData;
  onUpdateData: (newData: FlatManagerData) => void;
  showAlert: (msg: string, opts?: { type?: 'info' | 'success' | 'error' | 'warning'; title?: string }) => void;
  showConfirm: (msg: string, opts?: { type?: 'danger' | 'warning' | 'info'; title?: string }) => Promise<boolean>;
}

export const AutomationCenter: React.FC<AutomationCenterProps> = ({
  data,
  onUpdateData,
  showAlert,
  showConfirm,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunResults, setLastRunResults] = useState<string[]>([]);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  // New Recurring Maintenance Form State
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    title: '',
    interval: 90,
    nextDate: getTodayDateStr()
  });

  const currentMonth = getCurrentMonthStr();
  const currentMonthName = getBengaliMonthName(currentMonth);

  // Check stats
  const occupiedRoomsCount = data.rooms.filter(r => r.status === 'occupied' || r.status === 'owner').length;
  const currentMonthInvoices = data.invoices.filter(i => i.month === currentMonth);
  const unpaidInvoices = data.invoices.filter(i => !i.isOwner && (i.status === 'due' || i.status === 'partial'));
  const pendingScheduledNotices = (data.scheduledNotices || []).filter(sn => sn.status === 'pending');
  const activeRecurring = data.recurringMaints || [];

  const handleRunAllAutomations = () => {
    setIsRunning(true);
    try {
      const result = runAllSystemAutomations(data);
      if (result.hasChanges) {
        onUpdateData(result.newData);
        setLastRunResults(result.messages);
        setLastRunTime(new Date().toLocaleTimeString('bn-BD'));
        showAlert(`🎉 সিস্টেম অটোমেশন সম্পন্ন!\n${result.messages.join('\n')}`, {
          type: 'success',
          title: '⚡ অটোমেশন সফল'
        });
      } else {
        setLastRunResults(['সবকিছু আপ-টু-ডেট আছে। নতুন কোনো স্বয়ংক্রিয় অ্যাকশন প্রয়োজন হয়নি।']);
        setLastRunTime(new Date().toLocaleTimeString('bn-BD'));
        showAlert('সবকিছু আপ-টু-ডেট আছে! ইনভয়েস, নোটিশ এবং রুম স্ট্যাটাস ইতোমধ্যে হালনাগাদ।', {
          type: 'info',
          title: '⚡ অটোমেশন স্ট্যাটাস'
        });
      }
    } catch (err: any) {
      showAlert('অটোমেশন প্রক্রিয়ায় সমস্যা হয়েছে: ' + (err?.message || err), { type: 'error' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleAutoInvoice = (enabled: boolean) => {
    onUpdateData({
      ...data,
      autoInvoiceSettings: {
        ...(data.autoInvoiceSettings || { day: 1 }),
        enabled
      }
    });
    showAlert(`অটো ইনভয়েস জেনারেশন ${enabled ? 'চালু' : 'বন্ধ'} করা হয়েছে।`, { type: 'success' });
  };

  const handleSetInvoiceDay = (day: number) => {
    onUpdateData({
      ...data,
      autoInvoiceSettings: {
        ...(data.autoInvoiceSettings || { enabled: true }),
        day
      }
    });
    showAlert(`প্রতি মাসের ${toBn(day)} তারিখে অটো-ইনভয়েস তৈরির জন্য নির্ধারণ করা হলো।`, { type: 'success' });
  };

  const handleToggleReminder = (enabled: boolean) => {
    onUpdateData({
      ...data,
      reminderSettings: {
        ...(data.reminderSettings || { days: 3 }),
        enabled
      }
    });
    showAlert(`বকেয়া ও শেষ তারিখের তাগাদা নোটিফিকেশন ${enabled ? 'চালু' : 'বন্ধ'} করা হয়েছে।`, { type: 'success' });
  };

  const handleSetReminderDays = (days: number) => {
    onUpdateData({
      ...data,
      reminderSettings: {
        ...(data.reminderSettings || { enabled: true }),
        days
      }
    });
    showAlert(`শেষ তারিখের ${toBn(days)} দিন আগে থেকে তাগাদা পাঠানোর সেটিং সংরক্ষিত হয়েছে।`, { type: 'success' });
  };

  const handleAddRecurringMaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecurring.title.trim()) {
      showAlert('মেইনটেন্যান্সের শিরোনাম লিখুন', { type: 'warning' });
      return;
    }

    const item: RecurringMaint = {
      id: 'REC-' + Date.now(),
      title: newRecurring.title.trim(),
      interval: Number(newRecurring.interval) || 30,
      nextDate: newRecurring.nextDate || getTodayDateStr(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    onUpdateData({
      ...data,
      recurringMaints: [...(data.recurringMaints || []), item]
    });

    setNewRecurring({
      title: '',
      interval: 90,
      nextDate: getTodayDateStr()
    });
    setShowAddRecurring(false);
    showAlert('নতুন নিয়মিত সার্ভিসিং সিডিউল সফলভাবে যোগ করা হয়েছে!', { type: 'success' });
  };

  const handleDeleteRecurring = async (id: string) => {
    const ok = await showConfirm('আপনি কি নিশ্চিত এই নিয়মিত রক্ষণাবেক্ষণ সিডিউলটি মুছে ফেলতে চান?', { type: 'danger' });
    if (!ok) return;

    onUpdateData({
      ...data,
      recurringMaints: (data.recurringMaints || []).filter(r => r.id !== id)
    });
    showAlert('সিডিউল মুছে ফেলা হয়েছে।', { type: 'info' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/80 via-indigo-950/70 to-purple-950/80 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              সিস্টেম অটোমেশন ইঞ্জিন সক্রিয় (System Automation Active)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ⚡ ফ্ল্যাট অটোমেশন কন্ট্রোল সেন্টার
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              মাসিক ইনভয়েস তৈরি, বকেয়া তাগাদা, শিডিউলড নোটিশ প্রকাশ, সার্ভিসিং অ্যালার্ট এবং রুম স্ট্যাটাস স্বয়ংক্রিয়ভাবে পরিচালিত হচ্ছে।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRunAllAutomations}
              disabled={isRunning}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isRunning ? 'অটোমেশন রান হচ্ছে...' : '১-ক্লিক সম্পূর্ণ অটোমেশন রান করুন'}</span>
            </button>
          </div>
        </div>

        {lastRunTime && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-cyan-300">
            <span>⏱️ সর্বশেষ অটোমেশন রান: <strong>{lastRunTime}</strong></span>
            {lastRunResults.length > 0 && <span>— {lastRunResults[0]}</span>}
          </div>
        )}
      </div>

      {/* Grid of Automation Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. AUTO INVOICING */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                🧾
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.autoInvoiceSettings?.enabled ?? true}
                  onChange={(e) => handleToggleAutoInvoice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">১. অটো মাসিক ইনভয়েস জেনারেটর</h3>
              <p className="text-xs text-gray-400 mt-1">
                মাসের নির্দিষ্ট তারিখে সকল ভাড়াটিয়া এবং অকুপাইড রুমের জন্য স্বয়ংক্রিয়ভাবে বিল ও ইনভয়েস তৈরি হবে।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">তৈরির নির্ধারিত দিন:</span>
                <select
                  value={data.autoInvoiceSettings?.day || 1}
                  onChange={(e) => handleSetInvoiceDay(Number(e.target.value))}
                  className="bg-gray-800 text-cyan-400 rounded-lg px-2 py-1 border border-white/10 text-xs font-semibold focus:outline-none"
                >
                  {[1, 2, 3, 5, 7, 10].map(d => (
                    <option key={d} value={d}>প্রতি মাসের {toBn(d)} তারিখ</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{currentMonthName}-এর ইনভয়েস:</span>
                <span className={`font-semibold ${currentMonthInvoices.length >= occupiedRoomsCount ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {toBn(currentMonthInvoices.length)} / {toBn(occupiedRoomsCount)} টি প্রস্তুত
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={handleRunAllAutomations}
              className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all text-center"
            >
              ⚡ ইনভয়েস অটোমেশন রান করুন
            </button>
          </div>
        </div>

        {/* 2. AUTO OVERDUE & DUE REMINDERS */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                ⏰
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.reminderSettings?.enabled ?? true}
                  onChange={(e) => handleToggleReminder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">২. বকেয়া ও শেষ তারিখের তাগাদা</h3>
              <p className="text-xs text-gray-400 mt-1">
                বিল পরিশোধের শেষ তারিখের পূর্বে এবং বকেয়া থাকলে ভাড়াটিয়াদের স্বয়ংক্রিয় রিমাইন্ডার পুশ অ্যালার্ট যাবে।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">তাগাদার সময়সীমা:</span>
                <select
                  value={data.reminderSettings?.days || 3}
                  onChange={(e) => handleSetReminderDays(Number(e.target.value))}
                  className="bg-gray-800 text-amber-400 rounded-lg px-2 py-1 border border-white/10 text-xs font-semibold focus:outline-none"
                >
                  <option value={1}>১ দিন পূর্বে ও বকেয়া হলে</option>
                  <option value={2}>২ দিন পূর্বে ও বকেয়া হলে</option>
                  <option value={3}>৩ দিন পূর্বে ও বকেয়া হলে</option>
                  <option value={5}>৫ দিন পূর্বে ও বকেয়া হলে</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">বর্তমান বকেয়া ইনভয়েস:</span>
                <span className="text-amber-400 font-bold">{toBn(unpaidInvoices.length)} টি</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={handleRunAllAutomations}
              className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all text-center"
            >
              🔔 বকেয়া তাগাদা অ্যালার্ট পাঠান
            </button>
          </div>
        </div>

        {/* 3. SCHEDULED NOTICES PUBLISHER */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                📢
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30">
                স্বয়ংক্রিয়
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">৩. শিডিউলড নোটিশ পাবলিশার</h3>
              <p className="text-xs text-gray-400 mt-1">
                ভবিষ্যতের নির্দিষ্ট তারিখ ও সময়ে নোটিশ প্রকাশের জন্য শিডিউল করে রাখলে সময়মতো তা স্বয়ংক্রিয়ভাবে লাইভ হবে।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">অপেক্ষমাণ শিডিউলড নোটিশ:</span>
                <span className="text-purple-400 font-bold">{toBn(pendingScheduledNotices.length)} টি</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">প্রকাশিত মোট নোটিশ:</span>
                <span className="text-gray-200 font-semibold">{toBn((data.notices || []).length)} টি</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={handleRunAllAutomations}
              className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all text-center"
            >
              📢 শিডিউলড নোটিশ সিঙ্ক করুন
            </button>
          </div>
        </div>

        {/* 4. RECURRING MAINTENANCE SCHEDULER */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                🔧
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                সাইকেল অটোমেশন
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">৪. নিয়মিত রক্ষণাবেক্ষণ ট্র্যাকার</h3>
              <p className="text-xs text-gray-400 mt-1">
                পানির ট্যাংক ওয়াশ, এসি সার্ভিসিং, পেস্ট কন্ট্রোল, লিফট ও ফিল্টার চেকের নির্ধারিত দিনে অটো টাস্ক তৈরি হয়।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">সক্রিয় নিয়মিত সাইকেল:</span>
                <span className="text-emerald-400 font-bold">{toBn(activeRecurring.length)} টি</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">সর্বমোট মেইনটেন্যান্স লগ:</span>
                <span className="text-gray-200 font-semibold">{toBn((data.maints || []).length)} টি</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <button
              onClick={() => setShowAddRecurring(true)}
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all text-center"
            >
              ➕ নতুন সাইকেল যোগ
            </button>
          </div>
        </div>

        {/* 5. AUTO ROOM STATUS & ADVANCE SYNC */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                🏠
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30">
                রিয়েল-টাইম সিঙ্ক
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">৫. রুম স্ট্যাটাস ও বুকিং সিঙ্ক</h3>
              <p className="text-xs text-gray-400 mt-1">
                অগ্রিম টাকা জমা দিলে রুম অটো `'বুকড'` হয়, ভাড়াটিয়া যোগ হলে `'ভাড়াকৃত'` এবং বাসা ছাড়ার পর অটো `'খালি'` হয়।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">খালি রুম:</span>
                <span className="text-emerald-400 font-semibold">{toBn(data.rooms.filter(r => r.status === 'empty').length)} টি</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">অগ্রিম বুকড রুম:</span>
                <span className="text-blue-400 font-semibold">{toBn(data.rooms.filter(r => r.status === 'booked').length)} টি</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ভাড়াকৃত রুম:</span>
                <span className="text-purple-400 font-semibold">{toBn(data.rooms.filter(r => r.status === 'occupied').length)} টি</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={handleRunAllAutomations}
              className="w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all text-center"
            >
              🔄 রুম ও বুকিং স্ট্যাটাস রিফ্রেশ
            </button>
          </div>
        </div>

        {/* 6. KITCHEN DUTY ROTATION & DAILY ALERTS */}
        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-orange-500/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg">
                🍳
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[11px] font-semibold border border-orange-500/30">
                ডেইলি অ্যালার্ট
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">৬. কিচেন ডিউটি ডেইলি রোটেশন</h3>
              <p className="text-xs text-gray-400 mt-1">
                প্রতিদিন সকালে নির্ধারিত দায়িত্বপ্রাপ্ত মেম্বারকে স্বয়ংক্রিয় পুশ অ্যালার্ট ও রিমাইন্ডার পাঠানো হয়।
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">কিচেন ডিউটি ফিচার:</span>
                <span className={`font-semibold ${data.kitchenDuty?.enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {data.kitchenDuty?.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">সাপ্তাহিক শিডিউল সদস্য:</span>
                <span className="text-orange-400 font-bold">{toBn((data.kitchenDuty?.schedule || []).length)} জন</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={handleRunAllAutomations}
              className="w-full py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-500/30 transition-all text-center"
            >
              🍳 কিচেন ডিউটি লগ সিঙ্ক করুন
            </button>
          </div>
        </div>

      </div>

      {/* Recurring Maintenance List & Management */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🔧 নিয়মিত সার্ভিসিং ও মেইনটেন্যান্স সিডিউল</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                {toBn(activeRecurring.length)} টি সিডিউল
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              নির্দিষ্ট দিন পরপর স্বয়ংক্রিয়ভাবে মেরামত বা পরিচ্ছন্নতার তালিকা তৈরি হবে।
            </p>
          </div>

          <button
            onClick={() => setShowAddRecurring(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <span>➕ নতুন নিয়মিত কাজ যুক্ত করুন</span>
          </button>
        </div>

        {activeRecurring.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
            <p className="text-gray-400 text-sm">কোনো নিয়মিত সার্ভিসিং সিডিউল যুক্ত করা হয়নি।</p>
            <p className="text-xs text-gray-500 mt-1">যেমন: পানির ট্যাংক পরিষ্কার (৯০ দিন পরপর), এসি সার্ভিসিং (১৮০ দিন পরপর)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRecurring.map(rm => (
              <div key={rm.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{rm.title}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-semibold">
                      প্রতি {toBn(rm.interval)} দিন
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    পরবর্তী নির্ধারিত তারিখ: <strong className="text-amber-300">{rm.nextDate}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleDeleteRecurring(rm.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-all"
                    title="মুছে ফেলুন"
                  >
                    🗑️ মুছুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Recurring Maintenance Modal */}
      {showAddRecurring && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔧 নতুন নিয়মিত মেইনটেন্যান্স সিডিউল</span>
              </h3>
              <button
                onClick={() => setShowAddRecurring(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecurringMaint} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 font-semibold mb-1">কাজের নাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পানির ট্যাংক ওয়াশ, এসি ফিল্টার ক্লিন..."
                  value={newRecurring.title}
                  onChange={(e) => setNewRecurring({ ...newRecurring, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">কত দিন পরপর (Interval)?</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRecurring.interval}
                    onChange={(e) => setNewRecurring({ ...newRecurring, interval: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-1">প্রথম/পরবর্তী তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newRecurring.nextDate}
                    onChange={(e) => setNewRecurring({ ...newRecurring, nextDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
