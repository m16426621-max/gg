import React from 'react';
import {
  Shield,
  BookOpen,
  Trophy,
  PlusCircle,
  Sparkles,
  Camera,
  LogIn,
  LogOut,
  User as UserIcon,
  Crown,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentView: 'home' | 'exam' | 'result' | 'manage' | 'leaderboard';
  onNavigate: (view: 'home' | 'manage' | 'leaderboard') => void;
  onOpenAiGenerator: () => void;
  onOpenScanModal: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  examActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAiGenerator,
  onOpenScanModal,
  currentUser,
  isAdmin,
  onLogin,
  onLogout,
  examActive,
}) => {
  const handleManageClick = () => {
    if (examActive && !window.confirm('การออกจากหน้าสอบจะสิ้นสุดการสอบปัจจุบัน ต้องการดำเนินต่อหรือไม่?')) {
      return;
    }
    if (!isAdmin) {
      alert(
        '🔒 สิทธิ์เข้าถึงจำกัด:\n\nระบบจัดการคลังข้อสอบสงวนสิทธิ์สำหรับบัญชีเจ้าของระบบหลัก (m16426621@gmail.com) เท่านั้น\n\nบัญชีของคุณสามารถเข้าสอบ จับเวลา และดูผลวิเคราะห์จุดอ่อนได้ตามปกติครับ'
      );
      return;
    }
    onNavigate('manage');
  };

  const handleAiClick = () => {
    if (!isAdmin) {
      alert(
        '🔒 สิทธิ์สร้างข้อสอบ:\n\nเฉพาะบัญชีเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถใช้ AI สร้างข้อสอบเข้าคลังหลักได้\n\nผู้สอบทุกคนสามารถใช้ AI วิเคราะห์เฉลยและเทคนิคจำลัดได้ฟรีในหน้าสรุปผลสอบทุกข้อครับ'
      );
      return;
    }
    onOpenAiGenerator();
  };

  const handleScanClick = () => {
    if (!isAdmin) {
      alert(
        '🔒 สิทธิ์สแกนข้อสอบ:\n\nเฉพาะบัญชีเจ้าของระบบ (m16426621@gmail.com) เท่านั้นที่สามารถสแกนข้อสอบเพิ่มเข้าคลังได้'
      );
      return;
    }
    onOpenScanModal();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div
            onClick={() => {
              if (examActive) {
                if (window.confirm('คุณกำลังอยู่ในระหว่างทำข้อสอบ การออกจากหน้านี้จะสิ้นสุดการสอบ ต้องการออกหรือไม่?')) {
                  onNavigate('home');
                }
              } else {
                onNavigate('home');
              }
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                  POLICE EXAM AI
                </span>
                {isAdmin ? (
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    OWNER
                  </span>
                ) : currentUser ? (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-1.5 py-0.2 rounded border border-sky-400/30">
                    CANDIDATE
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] text-slate-400 font-normal whitespace-nowrap hidden sm:inline">
                ระบบจำลองสอบนายสิบตำรวจ สตช.
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => {
                if (examActive && !window.confirm('การออกจากหน้าสอบจะสิ้นสุดการสอบปัจจุบัน ต้องการดำเนินต่อหรือไม่?')) return;
                onNavigate('home');
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 py-1 cursor-pointer ${
                currentView === 'home' || currentView === 'exam' || currentView === 'result'
                  ? 'text-amber-400 font-semibold'
                  : ''
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ห้องสอบจำลอง</span>
            </button>

            <button
              onClick={handleManageClick}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 cursor-pointer ${
                currentView === 'manage' ? 'text-amber-400 font-semibold' : ''
              } ${!isAdmin ? 'opacity-75' : ''}`}
              title={isAdmin ? 'จัดการคลังข้อสอบ' : 'เฉพาะเจ้าของระบบ (m16426621@gmail.com)'}
            >
              <PlusCircle className="w-4 h-4" />
              <span>จัดการคลังข้อสอบ</span>
              {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
            </button>

            <button
              onClick={() => {
                if (examActive && !window.confirm('การออกจากหน้าสอบจะสิ้นสุดการสอบปัจจุบัน ต้องการดำเนินต่อหรือไม่?')) return;
                onNavigate('leaderboard');
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 py-1 cursor-pointer ${
                currentView === 'leaderboard' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>อันดับคะแนนเรียลไทม์</span>
            </button>
          </nav>

          {/* Zone 3: Auth & Admin Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={handleScanClick}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  title="สแกนข้อสอบจากรูปถ่ายหรือเอกสาร"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">สแกนข้อสอบ</span>
                </button>

                <button
                  onClick={handleAiClick}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI คิดข้อสอบ</span>
                </button>
              </>
            )}

            {/* Google Authentication Section */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-slate-600 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-medium text-white truncate max-w-[120px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {isAdmin ? 'เจ้าของระบบ' : 'ผู้เข้าสอบ'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-900/50"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ออก</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="เข้าสู่ระบบด้วย Google เพื่อบันทึกประวัติการสอบ"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบ Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
