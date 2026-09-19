import React, { useState, useEffect } from 'react';
import { FlatManagerData, CurrentUser } from '../../types';
import { getAllLoginUsers, setCurrentUser, toBn } from '../../lib/storage';
import { loginWithFirebaseAuth } from '../../lib/firebase';

interface LoginPageProps {
  data: FlatManagerData;
  onLogin?: (user: CurrentUser) => void;
  onLoginSuccess?: (user: CurrentUser) => void;
  onNavigatePublic?: () => void;
  onNavigateAvailableRooms?: () => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  data,
  onLogin,
  onLoginSuccess,
  onNavigatePublic,
  onNavigateAvailableRooms,
  showAlert
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Available rooms calculation for Ad Popup
  const availableRooms = (data?.rooms || []).filter(r => {
    if (r.status === 'empty') return true;
    const moveOutNotice = (data.moveOuts || []).find(m => m.room === r.name && m.status !== 'rejected');
    return !!moveOutNotice;
  });
  const hasAvailableRoom = availableRooms.length > 0;
  const [showAdPopup, setShowAdPopup] = useState(false);

  useEffect(() => {
    if (hasAvailableRoom) {
      setShowAdPopup(true);
    }
  }, [hasAvailableRoom]);

  useEffect(() => {
    const saved = localStorage.getItem('SAVED_LOGIN_CREDS');
    if (saved) {
      try {
        const { id, pass } = JSON.parse(saved);
        if (id && pass) {
          setUserId(id);
          setPassword(pass);
          setRememberMe(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSuccessfulAuth = (user: CurrentUser) => {
    if (onLoginSuccess) onLoginSuccess(user);
    if (onLogin) onLogin(user);
  };

  const handleNavigateRooms = () => {
    if (onNavigateAvailableRooms) onNavigateAvailableRooms();
    if (onNavigatePublic) onNavigatePublic();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);

    const input = userId.trim().toLowerCase();
    const pass = password.trim();

    setIsLoading(true);

    try {
      const allUsers = getAllLoginUsers(data);
      const matched = allUsers.find(u => {
        if (String(u.password).trim() !== pass) return false;
        const candidates = [u.email, u.login].filter(Boolean).map(x => String(x).toLowerCase().trim());
        return candidates.includes(input);
      });

      if (matched) {
        if (rememberMe) {
          localStorage.setItem('SAVED_LOGIN_CREDS', JSON.stringify({ id: input, pass: pass }));
        } else {
          localStorage.removeItem('SAVED_LOGIN_CREDS');
        }

        // Authenticate with Firebase Authentication in the background.
        // This ensures they are registered and active in the Firebase Auth console.
        const authId = matched.role === 'owner' ? 'owner' : (matched.login || '');
        if (authId && pass.length >= 6) {
          try {
            await loginWithFirebaseAuth(authId, pass);
          } catch (authErr) {
            console.warn('Firebase Auth synchronization deferred:', authErr);
          }
        } else if (pass.length < 6) {
          console.warn('Password must be at least 6 characters for Firebase Authentication synchronization');
        }

        setIsLoading(false);
        setIsSuccess(true);
        setCurrentUser(matched, rememberMe);
        setTimeout(() => {
          handleSuccessfulAuth(matched);
        }, 600);
      } else {
        setIsLoading(false);
        setHasError(true);
      }
    } catch (err) {
      console.error('Login process failure:', err);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const showHelp = () => {
    showAlert(
      'লগইনে সমস্যা হলে ফ্ল্যাট মালিকের সাথে যোগাযোগ করুন।',
      { type: 'info', title: 'সাহায্য ও লগইন তথ্য' }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-28 relative">
      {/* Background Subtle Gradient Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Title side by side */}
        <div className="flex flex-row items-center justify-center gap-4 mb-8 text-left">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shrink-0">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{data?.flatInfo?.name || 'আমার ফ্ল্যাট'}</h1>
            <p className="text-indigo-400 text-xs font-medium tracking-wider mt-0.5 uppercase">{data?.flatInfo?.tagline || 'FLAT MANAGEMENT PORTAL'}</p>
          </div>
        </div>

        {/* Login Box with Gradient Border */}
        <div className="gradient-border shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">লগইন করুন</h2>
              <p className="text-gray-400 text-sm mt-1">আপনার একাউন্টে প্রবেশ করুন</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">ইউজার আইডি / ইমেইল</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="আপনার আইডি লিখুন"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-indigo-500 focus:bg-white/10 transition placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">পাসওয়ার্ড</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm outline-none focus:border-indigo-500 focus:bg-white/10 transition placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {hasError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-shake">
                  ❌ ভুল আইডি বা পাসওয়ার্ড! অনুগ্রহ করে পুনরায় চেষ্টা করুন।
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span>মনে রাখুন</span>
                </label>
                <button
                  type="button"
                  onClick={showHelp}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  সাহায্য দরকার?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow ${
                  isSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.99]'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading && (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{isLoading ? 'যাচাই করা হচ্ছে...' : isSuccess ? 'সফল ✓' : 'লগইন করুন'}</span>
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          নতুন ভাড়াটিয়া?{' '}
          <button
            type="button"
            onClick={handleNavigateRooms}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition underline"
          >
            খালি রুম দেখুন →
          </button>
        </p>

        <p className="text-center text-xs text-gray-600 mt-4">
          © ২০২৪ আমার ফ্ল্যাট. All rights reserved.
        </p>
      </div>

      {/* Premium Ads Popup / Notice */}
      {showAdPopup && hasAvailableRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl text-center transform scale-100 transition-all">
            
            {/* Top decorative premium accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>

            {/* Close Button top right */}
            <button
              onClick={() => setShowAdPopup(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition p-1.5 hover:bg-zinc-900 rounded-lg"
              title="বন্ধ করুন"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Announcement Message with sleek premium text spacing */}
            <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight mt-3 mb-2">
              প্রিমিয়াম রুম খালি আছে!
            </h3>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-6 px-1">
              উন্নত জীবনযাত্রা ও আধুনিক সুযোগ-সুবিধা সম্বলিত আমাদের এই ফ্ল্যাটে সীমিত সময়ের জন্য নতুন আসন খালি হয়েছে।
            </p>

            {/* Redesigned Available Rooms Section */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 p-4 mb-6 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  খালি রুমের তালিকা
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/20">
                  {toBn(availableRooms.length)} টি রুম
                </span>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1">
                {availableRooms.map((room) => {
                  const isVacant = room.status === 'empty';
                  return (
                    <div 
                      key={room.name} 
                      onClick={() => {
                        setShowAdPopup(false);
                        handleNavigateRooms();
                      }}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-sm text-zinc-200 group-hover:text-indigo-400 transition truncate">
                          রুম {room.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {room.type === 'master' ? 'মাস্টার বেডরুম' : room.type === 'double' ? 'ডাবল বেড' : 'সিঙ্গেল রুম'} • {isVacant ? 'অবিলম্বে খালি' : 'পরবর্তী মাস থেকে'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-white group-hover:text-emerald-400 transition">৳ {toBn(room.rent)}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">প্রতি মাস</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Call to Action Button */}
            <button
              onClick={() => {
                setShowAdPopup(false);
                handleNavigateRooms();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-white text-black hover:bg-zinc-200 transition-all text-sm tracking-wide shadow-lg flex items-center justify-center gap-2"
            >
              <span>রুমের বিবরণ ও বুকিং পেজ</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Sleek inline Dismiss text */}
            <button
              onClick={() => setShowAdPopup(false)}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              পরে দেখবো
            </button>
          </div>
        </div>
      )}

      {/* Feedback elements */}
    </div>
  );
};
