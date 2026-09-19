import React, { useState } from 'react';
import { Invoice, FlatInfo } from '../../types';
import { toBn } from '../../lib/storage';
import { getInvoiceStats, printUtilitySlip, printInvoice, printReceipt } from '../../lib/printUtils';

interface UtilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  flatInfo: FlatInfo;
  currentUserRole?: 'owner' | 'tenant';
  onPayClick?: (invoice: Invoice) => void;
}

export const UtilityDetailModal: React.FC<UtilityDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  flatInfo,
  currentUserRole = 'tenant',
  onPayClick
}) => {
  const [activeView, setActiveView] = useState<'items' | 'chart' | 'formula' | 'payments'>('items');

  if (!isOpen || !invoice) return null;

  const stats = getInvoiceStats(invoice);
  const bd = invoice.breakdown || {
    electricity: 0,
    water: 0,
    gas: 0,
    wifi: 0,
    garbage: 0,
    utility: 0,
    service: 0
  };

  const meter = bd.electricityMeter || invoice.utilityDetails?.electricityMeter;
  const occupiedCount = invoice.utilityDetails?.occupiedRoomCount || 4;
  const shareRatio = invoice.utilityDetails?.roomShareRatio || `১/${occupiedCount}`;

  const utilitySum = (bd.electricity || 0) + (bd.water || 0) + (bd.gas || 0) + (bd.wifi || 0) + (bd.garbage || 0) + (bd.service || 0);
  const paymentsList = invoice.payments || [];

  // Calculate percentages for utility distribution
  const utilityItems = [
    {
      id: 'electricity',
      title: 'বিদ্যুৎ বিল',
      enTitle: 'Electricity Bill',
      icon: '⚡',
      amount: bd.electricity || 0,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      desc: meter && meter.consumedUnits
        ? `সাবমিটার রিডিং: ${toBn(meter.consumedUnits)} ইউনিট × ৳${toBn(meter.unitRate || 9.5)} ${meter.meterNo ? `(মিটার: ${meter.meterNo})` : ''}`
        : `ফ্ল্যাট বিদ্যুৎ বিলের ${shareRatio} সমবণ্টন`,
      meter
    },
    {
      id: 'water',
      title: 'পানি বিল',
      enTitle: 'WASA Water Bill',
      icon: '💧',
      amount: bd.water || 0,
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      desc: 'ওয়াসা পানির বিল ও পাম্প পরিচালনা খরচ সমবণ্টন'
    },
    {
      id: 'gas',
      title: 'গ্যাস বিল',
      enTitle: 'Gas Line / Cylinder',
      icon: '🔥',
      amount: bd.gas || 0,
      color: 'from-red-500 to-orange-600',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      desc: 'অনুমোদিত আবাসিক গ্যাস লাইন বিল সমবণ্টন'
    },
    {
      id: 'wifi',
      title: 'ওয়াইফাই ও ইন্টারনেট',
      enTitle: 'WiFi & Internet',
      icon: '📶',
      amount: bd.wifi || 0,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      desc: 'হাইস্পিড ব্রডব্যান্ড আনলিমিটেড ফাইবার কানেকশন'
    },
    {
      id: 'garbage',
      title: 'ময়লা বিল ও ক্লিনার',
      enTitle: 'Waste Management',
      icon: '🗑️',
      amount: bd.garbage || 0,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      desc: 'সিটি কর্পোরেশন বর্জ্য অপসারণ ও পরিচ্ছন্নতাকর্মীর বেতন'
    },
    {
      id: 'service',
      title: 'সার্ভিস চার্জ ও কমন এরিয়া',
      enTitle: 'Service Charge',
      icon: '🛠️',
      amount: bd.service || 0,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      desc: 'লিফট, গার্ডের ভাতা, পানির পাম্প ও কমন স্পেস লাইটিং'
    }
  ];

  const totalCalculatedUtility = utilityItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-3xl p-6 md:p-8 animate-pop my-6 border border-white/15 shadow-2xl space-y-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg border border-cyan-400/30 flex-shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white">ইনভয়েস ও ইউটিলিটি বিস্তারিত বিবরণী</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                  stats.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  stats.status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {stats.status === 'paid' ? '✓ সম্পূর্ণ পরিশোধিত' : stats.status === 'partial' ? '◐ আংশিক পরিশোধিত' : '● বাকি আছে'}
                </span>
                {currentUserRole === 'tenant' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono">
                    🔒 রিড-অনলি ভিউ
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {invoice.room} • {invoice.tenantName} • মাস: <strong className="text-cyan-300">{invoice.month}</strong> (Due: {invoice.dueDate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => printUtilitySlip(invoice, flatInfo)}
              className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="অফিসিয়াল ইউটিলিটি স্লিপ ডাউনলোড বা প্রিন্ট করুন"
            >
              <span>🖨️</span> ইউটিলিটি স্লিপ
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-gray-400">🏠 রুম ভাড়া</p>
            <p className="text-lg font-bold text-pink-400 mt-0.5">৳ {toBn(invoice.rent)}</p>
            <p className="text-[10px] text-gray-500">মূল মাসিক ভাড়া</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-[11px] text-cyan-300">⚡ মোট ইউটিলিটি</p>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">৳ {toBn(totalCalculatedUtility)}</p>
            <p className="text-[10px] text-cyan-400/70">{toBn(utilityItems.filter(i => i.amount > 0).length)} টি সেবা অন্তর্ভুক্ত</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30">
            <p className="text-[11px] text-indigo-300">💰 সর্বমোট প্রদেয়</p>
            <p className="text-lg font-bold text-white mt-0.5">৳ {toBn(stats.total)}</p>
            <p className="text-[10px] text-indigo-300/70">ভাড়া + সকল ইউটিলিটি</p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            stats.remaining > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <p className="text-[11px] text-gray-300">{stats.remaining > 0 ? '● বাকি পরিমাণ' : '✓ পরিশোধের অবস্থা'}</p>
            <p className={`text-lg font-bold mt-0.5 ${stats.remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.remaining > 0 ? `৳ ${toBn(stats.remaining)}` : 'পরিশোধিত'}
            </p>
            <p className="text-[10px] text-gray-400">
              {stats.totalPaid > 0 ? `জমা ৳ ${toBn(stats.totalPaid)}` : (stats.remaining > 0 ? `তারিখ: ${invoice.dueDate}` : 'সম্পূর্ণ ক্লিয়ার')}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-black/30 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveView('items')}
            className={`py-2 text-xs font-semibold rounded-xl transition text-center ${
              activeView === 'items'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 প্রতিটি খাতের বিবরণ
          </button>
          <button
            onClick={() => setActiveView('payments')}
            className={`py-2 text-xs font-semibold rounded-xl transition text-center flex items-center justify-center gap-1 ${
              activeView === 'payments'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💳 পেমেন্ট ও রিসিট ({toBn(paymentsList.length)})
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`py-2 text-xs font-semibold rounded-xl transition text-center ${
              activeView === 'chart'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 খরচের অনুপাত
          </button>
          <button
            onClick={() => setActiveView('formula')}
            className={`py-2 text-xs font-semibold rounded-xl transition text-center ${
              activeView === 'formula'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📐 গণনার সূত্র
          </button>
        </div>

        {/* TAB 1: ITEM LIST */}
        {activeView === 'items' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {utilityItems.map((item) => {
                const percentOfUtility = totalCalculatedUtility > 0 ? Math.round((item.amount / totalCalculatedUtility) * 100) : 0;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${item.bgColor} ${item.borderColor}`}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{item.title}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">({item.enTitle})</span>
                            {percentOfUtility > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                {toBn(percentOfUtility)}% অংশ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-base font-bold ${item.textColor}`}>৳ {toBn(item.amount)}</p>
                        <p className="text-[10px] text-gray-400">এই রুমের অংশ</p>
                      </div>
                    </div>

                    {/* Meter detail callout if electricity has sub-meter */}
                    {item.id === 'electricity' && item.meter && (
                      <div className="mt-3 pt-3 border-t border-white/10 bg-black/20 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] block">পূর্ববর্তী রিডিং</span>
                          <strong className="text-gray-200">{toBn(item.meter.prevUnit || 0)} kWh</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">বর্তমান রিডিং</span>
                          <strong className="text-cyan-300">{toBn(item.meter.currentUnit || 0)} kWh</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">ব্যবহৃত ইউনিট</span>
                          <strong className="text-amber-400 font-bold">{toBn(item.meter.consumedUnits || 0)} ইউনিট</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">প্রতি ইউনিট রেট</span>
                          <strong className="text-emerald-400">৳ {toBn(item.meter.unitRate || 9.5)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Roommates Auto-Split (if multi-person room) */}
            {invoice.persons && invoice.persons.length > 1 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    <span>👥</span> রুমমেটদের মাথাপিছু অংশ বণ্টন ({toBn(invoice.persons.length)} জন)
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">মাথাপিছু সমবণ্টন</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {invoice.persons.map((p, pIdx) => (
                    <div key={pIdx} className="p-3 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.phone || 'ফোন নেই'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">৳ {toBn(p.totalShare || (p.rentShare || 0) + (p.utilityShare || 0))}</p>
                        <p className="text-[10px] text-gray-400">ভাড়া: ৳{toBn(p.rentShare || 0)} + ইউটিলিটি: ৳{toBn(p.utilityShare || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PAYMENTS & MONEY RECEIPTS */}
        {activeView === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-gray-200">এই ইনভয়েসের বিপরীতে পেমেন্ট ও মানি রিসিট তালিকা</h4>
              <span className="text-xs text-gray-400 font-mono">মোট জমা: ৳ {toBn(stats.totalPaid)}</span>
            </div>

            {paymentsList.length > 0 ? (
              <div className="space-y-3">
                {paymentsList.map((p, pIdx) => (
                  <div key={pIdx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-emerald-400">৳ {toBn(p.amount)}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                            {p.method}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          তারিখ: <strong>{p.date}</strong> {p.trxId && <>• TrxID: <span className="font-mono text-cyan-300">{p.trxId}</span></>}
                        </p>
                        {p.note && <p className="text-xs text-gray-300 mt-1 italic">নোট: "{p.note}"</p>}
                      </div>

                      <button
                        onClick={() => printReceipt(p, invoice, flatInfo)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
                      >
                        <span>🧾</span> মানি রিসিট প্রিন্ট / ডাউনলোড
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <p className="text-3xl">⏳</p>
                <p className="text-sm font-semibold text-gray-300">এখনো কোনো পেমেন্ট রেকর্ড নেই</p>
                <p className="text-xs text-gray-500">টাকা পরিশোধ করার পর মালিক অনুমোদন করলে এখানে মানি রিসিট দেখা যাবে।</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHART & PROPORTIONS */}
        {activeView === 'chart' && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-5">
            <h4 className="font-bold text-sm text-gray-200">ইউটিলিটি খরচের আপেক্ষিক অংশীদারিত্ব (Distribution)</h4>
            
            {/* Multi-segment stacked progress bar */}
            <div className="h-6 w-full rounded-full bg-black/40 overflow-hidden flex border border-white/10">
              {utilityItems
                .filter(i => i.amount > 0)
                .map((item, idx) => {
                  const pct = totalCalculatedUtility > 0 ? (item.amount / totalCalculatedUtility) * 100 : 0;
                  const colors = [
                    'bg-amber-500',
                    'bg-cyan-500',
                    'bg-orange-500',
                    'bg-indigo-500',
                    'bg-emerald-500',
                    'bg-purple-500'
                  ];
                  return (
                    <div
                      key={item.id}
                      style={{ width: `${pct}%` }}
                      className={`${colors[idx % colors.length]} h-full transition-all relative group flex items-center justify-center text-[10px] font-bold text-white`}
                      title={`${item.title}: ৳${toBn(item.amount)} (${Math.round(pct)}%)`}
                    >
                      {pct >= 10 ? `${Math.round(pct)}%` : ''}
                    </div>
                  );
                })}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {utilityItems
                .filter(i => i.amount > 0)
                .map((item, idx) => {
                  const pct = totalCalculatedUtility > 0 ? Math.round((item.amount / totalCalculatedUtility) * 100) : 0;
                  const dots = [
                    'bg-amber-500',
                    'bg-cyan-500',
                    'bg-orange-500',
                    'bg-indigo-500',
                    'bg-emerald-500',
                    'bg-purple-500'
                  ];
                  return (
                    <div key={item.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${dots[idx % dots.length]} flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200 truncate">{item.title}</p>
                        <p className="text-[11px] text-gray-400">
                          ৳ {toBn(item.amount)} <span className="text-cyan-400">({toBn(pct)}%)</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              💡 <strong>পর্যবেক্ষণ:</strong> মোট ইউটিলিটি খরচের সিংহভাগ বিদ্যুৎ বিল ও কমন এরিয়া সার্ভিস চার্জে ব্যবহৃত হয়। বিদ্যুৎ ব্যবহারে মিতব্যয়ী হলে মোট বিল উল্লেখযোগ্য হারে কমানো সম্ভব।
            </div>
          </div>
        )}

        {/* TAB 3: FORMULA & EQUAL SPLIT BREAKDOWN */}
        {activeView === 'formula' && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-xs leading-relaxed text-gray-300">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <span>📐</span> ইউটিলিটি নির্ধারণের পদ্ধতি ও গাণিতিক নিয়ম
            </h4>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
              <p className="font-semibold text-cyan-300">১. সমবণ্টন সূত্র (Equal Split Formula):</p>
              <div className="font-mono bg-white/5 p-3 rounded-lg text-emerald-400 border border-white/5">
                প্রতি রুমের ইউটিলিটি = (ফ্ল্যাটের মোট গ্যাস + পানি + বিদ্যুৎ + ওয়াইফাই + ময়লা) ÷ মোট অকুপাইড রুমের সংখ্যা ({toBn(occupiedCount)} টি)
              </div>
              <p className="text-gray-400 text-[11px]">
                ফ্ল্যাটের বর্তমান মোট অকুপাইড রুম সংখ্যা: <strong>{toBn(occupiedCount)} টি</strong>। সুতরাং প্রতিটি রুমের উপর উক্ত খরচের <strong>{shareRatio}</strong> অংশ প্রযোজ্য।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
              <p className="font-semibold text-purple-300">২. সর্বমোট বিলের সমীকরণ (Total Invoice Equation):</p>
              <div className="font-mono bg-white/5 p-3 rounded-lg text-indigo-300 border border-white/5">
                সর্বমোট বিল = মূল রুম ভাড়া (৳ {toBn(invoice.rent)}) + মোট ইউটিলিটি (৳ {toBn(totalCalculatedUtility)}) = ৳ {toBn(stats.total)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-bold text-white">বিল সংক্রান্ত আপত্তি বা সমন্বয়</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  যদি কোনো মাসে আপনি দীর্ঘদিন উপস্থিত না থাকেন অথবা কোনো ইউটিলিটি সেবায় ত্রুটি থাকে, তবে মালিকের সাথে যোগাযোগ করে সমন্বয় করতে পারবেন।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center sm:text-left">
            বিল আইডি: <span className="font-mono text-cyan-300">{invoice.id}</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              onClick={() => printUtilitySlip(invoice, flatInfo)}
              className="flex-1 sm:flex-initial glass px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center gap-1.5 transition"
            >
              <span>🖨️</span> ইউটিলিটি স্লিপ প্রিন্ট
            </button>
            <button
              onClick={() => printInvoice(invoice, flatInfo)}
              className="flex-1 sm:flex-initial glass px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 flex items-center justify-center gap-1.5 transition"
            >
              <span>📄</span> মূল ইনভয়েস
            </button>
            {currentUserRole === 'tenant' && stats.remaining > 0 && onPayClick && (
              <button
                onClick={() => {
                  onClose();
                  onPayClick(invoice);
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center justify-center gap-1.5"
              >
                <span>💳</span> টাকা পরিশোধ করুন
              </button>
            )}
            <button
              onClick={onClose}
              className="glass px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

