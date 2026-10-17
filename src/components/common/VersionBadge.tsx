import React from 'react';
import { CURRENT_VERSION } from '../../config/version';
import { Sparkles } from 'lucide-react';

interface VersionBadgeProps {
  onClick?: () => void;
  variant?: 'compact' | 'full' | 'sidebar' | 'footer';
  className?: string;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  onClick,
  variant = 'compact',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        type="button"
        title="অ্যাপের ভার্সন ও আপডেটের বিবরণ দেখুন"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer glass hover:bg-white/10 border border-cyan-500/30 text-cyan-300 hover:text-white shrink-0 group ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:animate-ping" />
        <span className="font-mono font-bold text-[11px]">v{CURRENT_VERSION.versionBn}</span>
        <span className="text-[10px] text-cyan-400/80 hidden sm:inline">({CURRENT_VERSION.updateNumberBn} আপডেট)</span>
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
        className={`p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition cursor-pointer text-left group ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-cyan-300 transition">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>অ্যাপ ভার্সন</span>
          </div>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            v{CURRENT_VERSION.versionBn}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
          <span>{CURRENT_VERSION.updateNumberBn} আপডেট রিলিজ</span>
          <span className="text-[10px] text-emerald-400 font-medium">✓ লেটেস্ট</span>
        </p>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition ${className}`}
      >
        <span>আমার ফ্ল্যাট</span>
        <span>•</span>
        <span className="text-cyan-400 hover:underline">ভার্সন v{CURRENT_VERSION.versionBn} ({CURRENT_VERSION.updateNumberBn} আপডেট)</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white transition ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span className="font-bold">ভার্সন v{CURRENT_VERSION.versionBn}</span>
      <span className="text-gray-400">({CURRENT_VERSION.updateNumberBn} আপডেট)</span>
    </button>
  );
};
