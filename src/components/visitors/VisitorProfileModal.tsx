import React, { useState } from 'react';
import { Visitor, FlatInfo } from '../../types';
import { toBn } from '../../lib/storage';
import { printVisitorPass } from '../../lib/printUtils';

interface VisitorProfileModalProps {
  isOpen: boolean;
  visitor: Visitor | null;
  flatInfo: FlatInfo;
  onClose: () => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (visitor: Visitor) => void;
  onToggleExit: (visitor: Visitor) => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
}

export const VisitorProfileModal: React.FC<VisitorProfileModalProps> = ({
  isOpen,
  visitor,
  flatInfo,
  onClose,
  onEdit,
  onDelete,
  onToggleExit,
  showAlert
}) => {
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);

  if (!isOpen || !visitor) return null;

  const isInside = !visitor.exitTime;

  // Calculate duration of visit
  const calculateDuration = () => {
    try {
      const entryDate = visitor.entryTimestamp ? new Date(visitor.entryTimestamp) : new Date();
      const exitDate = visitor.exitTimestamp
        ? new Date(visitor.exitTimestamp)
        : (visitor.exitTime ? new Date() : new Date());
      
      const diffMs = exitDate.getTime() - entryDate.getTime();
      if (isNaN(diffMs) || diffMs < 0) return null;
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      if (hours > 0) {
        return `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট`;
      }
      return `${toBn(Math.max(1, mins))} মিনিট`;
    } catch {
      return null;
    }
  };

  const durationStr = calculateDuration();

  return (
    <>
      <div 
        id="visitor-profile-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade"
      >
        <div 
          id="visitor-profile-dialog"
          className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-lg p-6 sm:p-7 border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] my-8 animate-pop overflow-hidden"
        >
          {/* Top banner / Status */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg">
                🪪
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ভিজিটর প্রোফাইল</h3>
                <p className="text-xs text-gray-400">আইডি: #{visitor.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isInside 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                  : 'bg-slate-700/50 text-gray-300 border border-slate-600/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isInside ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                {isInside ? 'বর্তমানে উপস্থিত' : 'প্রস্থান সম্পন্ন'}
              </span>
              <button
                id="close-visitor-profile-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-5 pt-4">
            {/* Header Identity Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative group cursor-pointer" onClick={() => visitor.photo && setPhotoZoom(visitor.photo)}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-600/30 border-2 border-indigo-500/40 flex items-center justify-center text-2xl font-bold shadow-md">
                  {visitor.photo ? (
                    <img 
                      src={visitor.photo} 
                      alt={visitor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-indigo-300 font-bold">
                      {visitor.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                {visitor.photo && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-[10px] text-white transition font-medium">
                    🔍 জুম
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-bold text-white tracking-wide truncate">{visitor.name}</h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    🏠 {visitor.room}
                  </span>
                  {visitor.relation && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      👥 {visitor.relation}
                    </span>
                  )}
                  {visitor.purpose && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                      🎯 {visitor.purpose}
                    </span>
                  )}
                </div>

                {visitor.phone && (
                  <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                    <a 
                      href={`tel:${visitor.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
                    >
                      <span>📞 {visitor.phone}</span>
                      <span className="text-[10px] bg-emerald-500/30 px-1 rounded">কল করুন</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[11px] font-semibold text-gray-400">🕒 প্রবেশের সময়</p>
                <p className="text-sm font-bold text-emerald-400">
                  {visitor.entryDate ? `${visitor.entryDate} • ` : ''}{visitor.entryTime}
                </p>
              </div>

              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[11px] font-semibold text-gray-400">🚪 প্রস্থানের সময়</p>
                <p className="text-sm font-bold text-gray-200">
                  {visitor.exitTime || (visitor.expectedExitTime ? `(সম্ভাব্য: ${visitor.expectedExitTime})` : 'উপস্থিত আছেন')}
                </p>
              </div>

              {durationStr && (
                <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1 sm:col-span-2">
                  <p className="text-[11px] font-semibold text-gray-400">⏱️ মোট অবস্থান সময়</p>
                  <p className="text-sm font-bold text-cyan-300">{durationStr}</p>
                </div>
              )}

              {visitor.hostTenantName && (
                <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[11px] font-semibold text-gray-400">👤 মেহমানদারী সদস্য (Host)</p>
                  <p className="text-sm font-semibold text-white">{visitor.hostTenantName}</p>
                </div>
              )}

              {visitor.emergencyPhone && (
                <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[11px] font-semibold text-gray-400">🚨 জরুরি বিকল্প নম্বর</p>
                  <p className="text-sm font-semibold text-white">{visitor.emergencyPhone}</p>
                </div>
              )}
            </div>

            {/* Identity / NID / Address Section */}
            {(visitor.nidOrId || visitor.address || visitor.notes || visitor.idCardPhoto) && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>📄</span> পরিচিতি ও সনাক্তকরণ বিবরণ
                </h5>

                {visitor.nidOrId && (
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-gray-400">জাতীয় পরিচয়পত্র / আইডি:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{visitor.nidOrId}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(visitor.nidOrId || '');
                          showAlert('আইডি নম্বর কপি করা হয়েছে!', { type: 'success' });
                        }}
                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-cyan-300 transition"
                      >
                        কপি
                      </button>
                    </div>
                  </div>
                )}

                {visitor.address && (
                  <div className="flex items-start justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-gray-400">ঠিকানা / এলাকা:</span>
                    <span className="font-medium text-white text-right max-w-[60%]">{visitor.address}</span>
                  </div>
                )}

                {visitor.notes && (
                  <div className="text-xs py-1">
                    <span className="text-gray-400 block mb-1">মন্তব্য / নোট:</span>
                    <p className="p-2.5 bg-black/30 rounded-xl text-gray-300 leading-relaxed italic border border-white/5">
                      "{visitor.notes}"
                    </p>
                  </div>
                )}

                {visitor.idCardPhoto && (
                  <div className="pt-2">
                    <span className="text-[11px] text-gray-400 block mb-1.5 font-semibold">পরিচয়পত্রের কপি (ID Card Photo):</span>
                    <div 
                      className="w-full h-32 rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer relative group"
                      onClick={() => setPhotoZoom(visitor.idCardPhoto || null)}
                    >
                      <img 
                        src={visitor.idCardPhoto} 
                        alt="ID Card" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition">
                        🔍 বড় করে দেখুন
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <button
                id="toggle-exit-btn"
                onClick={() => onToggleExit(visitor)}
                className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                  isInside
                    ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 border border-amber-500/40'
                    : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40'
                }`}
              >
                <span>{isInside ? '🚪 প্রস্থান নিশ্চিত করুন' : '🔄 পুনরায় প্রবেশ করান'}</span>
              </button>

              <button
                id="print-visitor-pass-btn"
                onClick={() => printVisitorPass(visitor, flatInfo)}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 transition flex items-center gap-1"
              >
                <span>🖨️ গেস্ট পাস</span>
              </button>

              <button
                id="edit-visitor-profile-btn"
                onClick={() => {
                  onClose();
                  onEdit(visitor);
                }}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-cyan-300 transition flex items-center gap-1"
              >
                <span>✏️ এডিট</span>
              </button>

              <button
                id="delete-visitor-btn"
                onClick={() => onDelete(visitor)}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition flex items-center gap-1"
              >
                <span>🗑️ মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {photoZoom && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade"
          onClick={() => setPhotoZoom(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] p-2 bg-[#16162a] rounded-3xl border border-white/20 shadow-2xl">
            <img 
              src={photoZoom} 
              alt="Zoomed" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPhotoZoom(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
