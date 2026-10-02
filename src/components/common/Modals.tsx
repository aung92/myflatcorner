import React from 'react';

export interface AlertState {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onOk?: () => void;
}

export interface ConfirmState {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface AlertModalProps {
  isOpen?: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose?: () => void;
  onOk?: () => void;
  state?: AlertState;
}

export const AlertModal: React.FC<AlertModalProps> = (props) => {
  const isOpen = props.isOpen ?? props.state?.isOpen ?? false;
  if (!isOpen) return null;

  const title = props.title || props.state?.title || 'বার্তা';
  const message = props.message || props.state?.message || '';
  const type = props.type || props.state?.type || 'info';

  const typeMap = {
    info: {
      color: 'cyan',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      btn: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30',
      path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    success: {
      color: 'emerald',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30',
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      color: 'rose',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
      path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      color: 'amber',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      btn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-600/30',
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    }
  };
  const t = typeMap[type] || typeMap.info;

  const handleClose = () => {
    if (props.onOk) props.onOk();
    if (props.state?.onOk) props.state.onOk();
    if (props.onClose) props.onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade">
      <div className={`relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-sm p-6 sm:p-7 animate-pop border ${t.border} ${t.glow} text-center shadow-2xl overflow-hidden`}>
        {/* Ambient background glow top */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 ${t.bg}`} />
        <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 ${t.bg}`} />

        <div className="flex flex-col items-center relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${t.bg} border ${t.border} shadow-inner`}>
            <svg className={`w-8 h-8 ${t.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d={t.path} />
            </svg>
          </div>

          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full mb-2 uppercase tracking-wider ${t.badge}`}>
            {type === 'error' ? 'সতর্কতা / ত্রুটি' : type === 'warning' ? 'মনোযোগ দিন' : type === 'success' ? 'সফল হয়েছে' : 'তথ্য বার্তা'}
          </span>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 whitespace-pre-line max-w-xs">{message}</p>

          <button
            type="button"
            onClick={handleClose}
            className={`w-full ${t.btn} py-3 rounded-2xl font-bold transition shadow-lg text-sm active:scale-98`}
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ConfirmModalProps {
  isOpen?: boolean;
  title?: string;
  message?: string;
  type?: 'danger' | 'warning' | 'info';
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  state?: ConfirmState;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = (props) => {
  const isOpen = props.isOpen ?? props.state?.isOpen ?? false;
  if (!isOpen) return null;

  const title = props.title || props.state?.title || 'নিশ্চিত করুন';
  const message = props.message || props.state?.message || '';
  const type = props.type || props.state?.type || 'danger';
  const okText = props.okText || props.state?.okText || 'হ্যাঁ, নিশ্চিত';
  const cancelText = props.cancelText || props.state?.cancelText || 'বাতিল';

  const typeMap = {
    danger: {
      color: 'red',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    },
    warning: {
      color: 'yellow',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      btn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-600/30',
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      color: 'indigo',
      border: 'border-indigo-500/30',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.25)]',
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-400',
      badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      btn: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/30',
      path: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };
  const t = typeMap[type] || typeMap.danger;

  const handleConfirm = () => {
    if (props.onConfirm) props.onConfirm();
    if (props.state?.onConfirm) props.state.onConfirm();
    if (props.onClose) props.onClose();
  };

  const handleCancel = () => {
    if (props.onCancel) props.onCancel();
    if (props.state?.onCancel) props.state.onCancel();
    if (props.onClose) props.onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade">
      <div className={`relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-sm p-6 sm:p-7 animate-pop border ${t.border} ${t.glow} text-center shadow-2xl overflow-hidden`}>
        {/* Ambient background glow top */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 ${t.bg}`} />
        <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 ${t.bg}`} />

        <div className="flex flex-col items-center relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${t.bg} border ${t.border} shadow-inner`}>
            <svg className={`w-8 h-8 ${t.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d={t.path} />
            </svg>
          </div>

          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full mb-2 uppercase tracking-wider ${t.badge}`}>
            {type === 'danger' ? 'সতর্কতামূলক অনুমোদন' : type === 'warning' ? 'নিশ্চিতকরণ প্রয়োজন' : 'যাচাইকরণ'}
          </span>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 whitespace-pre-line max-w-xs">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl font-semibold border border-white/10 transition text-sm active:scale-98"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 ${t.btn} py-3 rounded-2xl font-bold transition shadow-lg text-sm active:scale-98`}
            >
              {okText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

