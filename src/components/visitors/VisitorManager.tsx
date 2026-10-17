import React, { useState, useMemo } from 'react';
import { Visitor, FlatInfo, Room, Tenant } from '../../types';
import { toBn } from '../../lib/storage';
import { printVisitorPass } from '../../lib/printUtils';
import { VisitorProfileModal } from './VisitorProfileModal';
import { VisitorFormModal } from './VisitorFormModal';

interface VisitorManagerProps {
  visitors: Visitor[];
  flatInfo: FlatInfo;
  rooms: Room[];
  tenants: Tenant[];
  currentUserRole: 'owner' | 'tenant';
  currentUserRoom?: string;
  onUpdateVisitors: (
    newVisitors: Visitor[],
    notificationInfo?: { title: string; message: string; forRole: 'owner' | 'tenant'; room?: string }
  ) => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
  showConfirm: (msg: string, opts?: { title?: string; okText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }) => Promise<boolean>;
}

export const VisitorManager: React.FC<VisitorManagerProps> = ({
  visitors = [],
  flatInfo,
  rooms,
  tenants,
  currentUserRole,
  currentUserRoom,
  onUpdateVisitors,
  showAlert,
  showConfirm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'inside' | 'exited'>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    isEditing: boolean;
    visitorData: Visitor | null;
  }>({
    isOpen: false,
    isEditing: false,
    visitorData: null
  });

  // Filter visitors by user scope
  const scopedVisitors = useMemo(() => {
    if (currentUserRole === 'tenant' && currentUserRoom) {
      return visitors.filter(v => v.room === currentUserRoom);
    }
    return visitors;
  }, [visitors, currentUserRole, currentUserRoom]);

  // Filter and search
  const filteredVisitors = useMemo(() => {
    return scopedVisitors.filter(v => {
      // Room filter for owner
      if (currentUserRole === 'owner' && filterRoom !== 'all' && v.room !== filterRoom) {
        return false;
      }

      // Status filter
      const isInside = !v.exitTime;
      if (filterStatus === 'inside' && !isInside) return false;
      if (filterStatus === 'exited' && isInside) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.name?.toLowerCase().includes(q);
        const matchPhone = v.phone?.toLowerCase().includes(q);
        const matchRoom = v.room?.toLowerCase().includes(q);
        const matchPurpose = v.purpose?.toLowerCase().includes(q);
        const matchHost = v.hostTenantName?.toLowerCase().includes(q);
        const matchNid = v.nidOrId?.toLowerCase().includes(q);
        const matchRelation = v.relation?.toLowerCase().includes(q);
        return matchName || matchPhone || matchRoom || matchPurpose || matchHost || matchNid || matchRelation;
      }

      return true;
    });
  }, [scopedVisitors, currentUserRole, filterRoom, filterStatus, searchQuery]);

  // Statistics
  const totalCount = scopedVisitors.length;
  const insideCount = scopedVisitors.filter(v => !v.exitTime).length;
  const exitedCount = scopedVisitors.filter(v => !!v.exitTime).length;

  // Handlers
  const handleOpenProfile = (v: Visitor) => {
    setSelectedVisitor(v);
    setIsProfileOpen(true);
  };

  const handleOpenAdd = () => {
    setFormState({
      isOpen: true,
      isEditing: false,
      visitorData: null
    });
  };

  const handleOpenEdit = (v: Visitor) => {
    setFormState({
      isOpen: true,
      isEditing: true,
      visitorData: v
    });
  };

  const handleSaveVisitor = (savedVisitor: Visitor) => {
    let updated: Visitor[];
    const isNew = !formState.isEditing || !visitors.some(v => v.id === savedVisitor.id);

    if (isNew) {
      updated = [savedVisitor, ...visitors];
    } else {
      updated = visitors.map(v => v.id === savedVisitor.id ? savedVisitor : v);
    }

    // Prepare notification
    const notifInfo = currentUserRole === 'tenant' ? {
      title: isNew ? 'নতুন ভিজিটর প্রবেশ 🚪' : 'ভিজিটর তথ্য আপডেট',
      message: `${savedVisitor.room}-এ ${savedVisitor.name} (${savedVisitor.relation || 'মেহমান'}) এসেছেন। উদ্দেশ্য: ${savedVisitor.purpose || 'ভিজিট'}`,
      forRole: 'owner' as const,
      room: savedVisitor.room
    } : {
      title: isNew ? 'ভিজিটর এন্ট্রি সম্পন্ন 🪪' : 'ভিজিটর তথ্য আপডেট',
      message: `রুম ${savedVisitor.room}-এর জন্য ${savedVisitor.name}-এর ভিজিটর এন্ট্রি রেকর্ড করা হয়েছে।`,
      forRole: 'tenant' as const,
      room: savedVisitor.room
    };

    onUpdateVisitors(updated, notifInfo);
    setFormState({ isOpen: false, isEditing: false, visitorData: null });

    // Update selected visitor if profile was opened
    if (selectedVisitor?.id === savedVisitor.id) {
      setSelectedVisitor(savedVisitor);
    }

    showAlert(
      isNew ? 'নতুন ভিজিটর প্রোফাইল সফলভাবে যোগ করা হয়েছে!' : 'ভিজিটর প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',
      { type: 'success' }
    );
  };

  const handleDeleteVisitor = async (v: Visitor) => {
    const ok = await showConfirm(
      `আপনি কি নিশ্চিত যে ${v.name} (${v.room})-এর ভিজিটর প্রোফাইল ও লগ মুছে ফেলতে চান?`,
      {
        title: 'ভিজিটর প্রোফাইল মুছে ফেলুন',
        okText: 'হ্যাঁ, মুছুন',
        cancelText: 'বাতিল',
        type: 'danger'
      }
    );

    if (!ok) return;

    const updated = visitors.filter(item => item.id !== v.id);
    onUpdateVisitors(updated);

    if (selectedVisitor?.id === v.id) {
      setIsProfileOpen(false);
      setSelectedVisitor(null);
    }

    showAlert(`"${v.name}"-এর ভিজিটর লগ মুছে ফেলা হয়েছে!`, { type: 'info' });
  };

  const handleToggleExit = async (v: Visitor) => {
    const isCurrentlyInside = !v.exitTime;
    
    if (isCurrentlyInside) {
      const nowTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const updated = visitors.map(item => item.id === v.id ? {
        ...item,
        exitTime: nowTime,
        exitTimestamp: new Date().toISOString()
      } : item);

      onUpdateVisitors(updated, {
        title: 'ভিজিটর প্রস্থান সম্পন্ন 🚪',
        message: `${v.room}-এর মেহমান ${v.name} সময়: ${nowTime}-এ প্রস্থান করেছেন।`,
        forRole: currentUserRole === 'owner' ? 'tenant' : 'owner',
        room: v.room
      });

      const updatedVisitor = { ...v, exitTime: nowTime, exitTimestamp: new Date().toISOString() };
      if (selectedVisitor?.id === v.id) {
        setSelectedVisitor(updatedVisitor);
      }
      showAlert(`"${v.name}"-এর প্রস্থান সম্পন্ন হিসেবে আপডেট করা হয়েছে (${nowTime})!`, { type: 'success' });
    } else {
      // Re-enter / clear exit
      const updated = visitors.map(item => item.id === v.id ? {
        ...item,
        exitTime: null,
        exitTimestamp: undefined
      } : item);

      onUpdateVisitors(updated);
      const updatedVisitor = { ...v, exitTime: null, exitTimestamp: undefined };
      if (selectedVisitor?.id === v.id) {
        setSelectedVisitor(updatedVisitor);
      }
      showAlert(`"${v.name}"-কে পুনরায় উপস্থিত হিসেবে সেট করা হয়েছে!`, { type: 'info' });
    }
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-600/30">
            🪪
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              ভিজিটর লগ ও মেহমান প্রোফাইল
            </h2>
            <p className="text-xs text-gray-400">
              {currentUserRole === 'owner' 
                ? 'সকল রুমের মেহমান, ডেলিভারি ও আগন্তুকদের বিস্তারিত প্রোফাইল ও নিরাপত্তা ট্র্যাকিং' 
                : `${currentUserRoom} এর মেহমান ও ভিজিটর ব্যবস্থাপনা`}
            </p>
          </div>
        </div>

        <button
          id="add-new-visitor-btn"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-95"
        >
          <span>+ নতুন ভিজিটর এন্ট্রি</span>
        </button>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">মোট ভিজিটর রেকর্ড</p>
            <h4 className="text-2xl font-bold text-white mt-1">{toBn(totalCount)} জন</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
            👥
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">বর্তমানে ফ্ল্যাটে উপস্থিত</p>
            <h4 className="text-2xl font-bold text-emerald-300 mt-1">{toBn(insideCount)} জন</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg animate-pulse">
            🟢
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">প্রস্থান সম্পন্ন</p>
            <h4 className="text-2xl font-bold text-gray-300 mt-1">{toBn(exitedCount)} জন</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-gray-400 flex items-center justify-center text-lg">
            🚪
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              id="visitor-search-input"
              type="text"
              placeholder="ভিজিটরের নাম, মোবাইল, রুম, সম্পর্ক বা উদ্দেশ্য দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition"
            />
            <span className="absolute left-3.5 top-3 text-gray-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Room selector for owner + Status Tabs + View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentUserRole === 'owner' && (
              <select
                id="visitor-room-filter"
                value={filterRoom}
                onChange={e => setFilterRoom(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="all">সব রুম</option>
                {rooms.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            )}

            {/* Status Pills */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
              {[
                { id: 'all', label: 'সবাই' },
                { id: 'inside', label: 'উপস্থিত 🟢' },
                { id: 'exited', label: 'প্রস্থানকৃত ⚪' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterStatus === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}
                title="গ্রিড ভিউ"
              >
                🔲
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}
                title="লিস্ট ভিউ"
              >
                📄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor List / Grid */}
      {filteredVisitors.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mx-auto text-gray-500">
            🪪
          </div>
          <h4 className="text-base font-bold text-white">কোনো ভিজিটর রেকর্ড পাওয়া যায়নি</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all' || filterRoom !== 'all'
              ? 'আপনার নির্বাচিত ফিল্টার অনুযায়ী কোনো ভিজিটর নেই। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
              : 'ফ্ল্যাটে আগত কোনো মেহমান বা ডেলিভারি কর্মীর তথ্য যুক্ত করতে ওপরের "+ নতুন ভিজিটর এন্ট্রি" বাটনে ক্লিক করুন।'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            + নতুন ভিজিটর যোগ করুন
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((v) => {
            const isInside = !v.exitTime;
            return (
              <div
                key={v.id}
                id={`visitor-card-${v.id}`}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-indigo-500/40 transition-all space-y-4 flex flex-col justify-between group shadow-md"
              >
                <div className="space-y-3">
                  {/* Card Top: Photo, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        onClick={() => handleOpenProfile(v)}
                        className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-base font-bold flex-shrink-0 cursor-pointer group-hover:scale-105 transition"
                      >
                        {v.photo ? (
                          <img 
                            src={v.photo} 
                            alt={v.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-indigo-300 font-bold">
                            {v.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 
                          onClick={() => handleOpenProfile(v)}
                          className="font-bold text-base text-white hover:text-indigo-300 cursor-pointer transition truncate"
                        >
                          {v.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                            {v.room}
                          </span>
                          {v.relation && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-medium">
                              {v.relation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 flex items-center gap-1 ${
                      isInside
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isInside ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></span>
                      {isInside ? 'উপস্থিত' : 'প্রস্থান'}
                    </span>
                  </div>

                  {/* Visit details */}
                  <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5 text-xs">
                    {v.purpose && (
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-500">উদ্দেশ্য:</span>
                        <span className="font-medium text-white truncate max-w-[65%]">{v.purpose}</span>
                      </div>
                    )}
                    {v.hostTenantName && (
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-500">হোস্ট মেম্বার:</span>
                        <span className="font-medium text-cyan-300 truncate max-w-[65%]">{v.hostTenantName}</span>
                      </div>
                    )}
                    {v.phone && (
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-500">মোবাইল:</span>
                        <a href={`tel:${v.phone}`} className="font-mono text-emerald-400 hover:underline">
                          {v.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-white/5 text-[11px]">
                      <span>প্রবেশ: {v.entryTime}</span>
                      <span>{v.exitTime ? `প্রস্থান: ${v.exitTime}` : 'অবস্থান করছেন'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenProfile(v)}
                    className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold transition border border-indigo-500/30 text-center"
                  >
                    🪪 প্রোফাইল
                  </button>

                  <button
                    onClick={() => handleToggleExit(v)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition border ${
                      isInside
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={isInside ? 'প্রস্থান সম্পন্ন করুন' : 'পুনরায় প্রবেশ করান'}
                  >
                    {isInside ? '🚪 প্রস্থান' : '🔄 এন্ট্রি'}
                  </button>

                  <button
                    onClick={() => printVisitorPass(v, flatInfo)}
                    className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-cyan-300 rounded-xl text-xs transition"
                    title="পাস প্রিন্ট"
                  >
                    🖨️
                  </button>

                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs transition"
                    title="এডিট"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDeleteVisitor(v)}
                    className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs transition"
                    title="মুছুন"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">ভিজিটর ও ছবি</th>
                  <th className="p-4">রুম ও হোস্ট</th>
                  <th className="p-4">সম্পর্ক ও উদ্দেশ্য</th>
                  <th className="p-4">প্রবেশ / প্রস্থান সময়</th>
                  <th className="p-4">অবস্থা</th>
                  <th className="p-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVisitors.map(v => {
                  const isInside = !v.exitTime;
                  return (
                    <tr key={v.id} className="hover:bg-white/5 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => handleOpenProfile(v)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer"
                          >
                            {v.photo ? (
                              <img src={v.photo} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-indigo-300">{v.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <button 
                              onClick={() => handleOpenProfile(v)}
                              className="font-bold text-white hover:text-indigo-300 text-left transition"
                            >
                              {v.name}
                            </button>
                            {v.phone && <p className="text-xs text-gray-400 font-mono">{v.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                          {v.room}
                        </span>
                        {v.hostTenantName && (
                          <p className="text-xs text-gray-400 mt-1">{v.hostTenantName}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-xs text-purple-300">{v.relation || '—'}</p>
                        <p className="text-xs text-gray-400">{v.purpose || 'সাধারণ ভিজিট'}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-emerald-400 font-medium">ইন: {v.entryTime}</p>
                        <p className="text-gray-400">আউট: {v.exitTime || 'উপস্থিত'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                          isInside ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/50 text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isInside ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                          {isInside ? 'উপস্থিত' : 'প্রস্থান'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProfile(v)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold transition"
                            title="প্রোফাইল দেখুন"
                          >
                            প্রোফাইল
                          </button>
                          <button
                            onClick={() => handleToggleExit(v)}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              isInside ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                            title={isInside ? 'প্রস্থান নিশ্চিত করুন' : 'পুনরায় প্রবেশ'}
                          >
                            {isInside ? '🚪' : '🔄'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-cyan-300 rounded-lg text-xs transition"
                            title="এডিট"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteVisitor(v)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition"
                            title="মুছুন"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visitor Profile Popup Modal */}
      <VisitorProfileModal
        isOpen={isProfileOpen}
        visitor={selectedVisitor}
        flatInfo={flatInfo}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedVisitor(null);
        }}
        onEdit={(v) => {
          handleOpenEdit(v);
        }}
        onDelete={(v) => {
          handleDeleteVisitor(v);
        }}
        onToggleExit={(v) => {
          handleToggleExit(v);
        }}
        showAlert={showAlert}
      />

      {/* Visitor Add / Edit Form Modal */}
      <VisitorFormModal
        isOpen={formState.isOpen}
        isEditing={formState.isEditing}
        initialData={formState.visitorData}
        currentUserRole={currentUserRole}
        currentUserRoom={currentUserRoom}
        rooms={rooms}
        tenants={tenants}
        onSave={handleSaveVisitor}
        onClose={() => setFormState({ isOpen: false, isEditing: false, visitorData: null })}
        showAlert={showAlert}
      />
    </div>
  );
};
