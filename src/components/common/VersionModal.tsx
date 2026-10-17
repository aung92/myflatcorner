import React from 'react';
import { CURRENT_VERSION, VERSION_HISTORY } from '../../config/version';
import { Sparkles, CheckCircle2, Calendar, GitBranch, Download, X, Layers, ArrowUpRight } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionModal: React.FC<VersionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Gradient Top Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {CURRENT_VERSION.updateNumberBn} আপডেট
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {CURRENT_VERSION.status}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                ভার্সন v{CURRENT_VERSION.versionBn}
              </h2>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>রিলিজের তারিখ: {CURRENT_VERSION.releaseDate}</span>
                <span>•</span>
                <span>{CURRENT_VERSION.codeName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition shrink-0"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200 text-sm">
          {/* Quick Highlight Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>বর্তমান {CURRENT_VERSION.updateNumberBn} আপডেটের প্রধান সুবিধাসমূহ:</span>
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-300">
              {VERSION_HISTORY[0].highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions (Download source & Git) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/project-source.zip"
              download="sajeda-garden-flat-management.zip"
              className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-white">সোর্স কোড ডাউনলোড</p>
                  <p className="text-[10px] text-gray-400">এই ভার্সনের কমপ্লিট জিপ ফাইল</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition" />
            </a>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-xs text-white">গিটহাবে আপডেট কমান্ড</p>
                <p className="text-[10px] font-mono text-cyan-300 truncate">git add . && git push</p>
              </div>
            </div>
          </div>

          {/* Release History Timeline */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>পূর্ববর্তী আপডেট ও রিলিজ হিস্ট্রি</span>
            </h4>
            <div className="space-y-3">
              {VERSION_HISTORY.slice(1).map((release, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        v{release.versionBn}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {release.updateNumberBn} আপডেট
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">{release.date}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-300 mt-1">{release.title}</p>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-400">
                    {release.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-center gap-1.5">
                        <span className="text-gray-600">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            বর্তমানে সক্রিয়: <span className="text-cyan-400 font-bold">v{CURRENT_VERSION.versionBn}</span> ({CURRENT_VERSION.updateNumberBn} আপডেট)
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
