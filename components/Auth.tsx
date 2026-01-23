
import React, { useState, useEffect } from 'react';
import { AuthStep, UserRole, SportType } from '../types';

interface AuthProps {
  onComplete: (userData: { role: UserRole | 'ADMIN'; clubId: string; isPremium: boolean }) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Owner specific
  const [clubName, setClubName] = useState('');
  const [customClubId, setCustomClubId] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('BJJ');

  // Member specific
  const [targetClubId, setTargetClubId] = useState('');

  // Auto-generate Club ID when name changes
  useEffect(() => {
    if (step === 'CLUB_SETUP' && clubName) {
      const generated = clubName.toUpperCase().replace(/\s+/g, '').substring(0, 10);
      setCustomClubId(generated);
    }
  }, [clubName, step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only numbers
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'LOGIN':
      case 'SIGNUP':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white italic">
                {step === 'LOGIN' ? 'WELCOME BACK' : 'GET ON THE MAT'}
              </h1>
              <p className="text-slate-400 text-sm">
                {step === 'LOGIN' ? 'Sign in to track your progress.' : 'Create your account to start training.'}
              </p>
            </div>

            <div className="space-y-4">
              {step === 'SIGNUP' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jiujitsu_joe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-700" 
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@academy.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-700" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-700" 
                />
              </div>
            </div>

            <button 
              onClick={() => setStep('VERIFY')}
              disabled={!email || !password || (step === 'SIGNUP' && !username)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest"
            >
              {step === 'LOGIN' ? 'Sign In' : 'Get Started'}
            </button>

            <div className="text-center pt-2">
              <button 
                onClick={() => setStep(step === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
              >
                {step === 'LOGIN' ? 'No account? Join free' : 'Already training? Log In'}
              </button>
            </div>
          </div>
        );

      case 'VERIFY':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-8 animate-in slide-in-from-right-8 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white italic">VERIFY EMAIL</h1>
              <p className="text-slate-400 text-sm px-4">We've sent a 6-digit code to <br/><span className="text-indigo-400 font-bold">{email || 'your email'}</span></p>
            </div>

            <div className="flex justify-between gap-1 sm:gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-10 h-14 sm:w-12 sm:h-16 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xl sm:text-2xl font-black text-indigo-400 focus:ring-2 focus:ring-indigo-600 outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                 <p className="text-[10px] text-center text-indigo-300 font-bold uppercase tracking-tighter">
                   Demo Mode: Enter any 6 digits to proceed
                 </p>
              </div>
              <button 
                onClick={() => setStep('ROLE_SELECT')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest"
              >
                Verify Code
              </button>
              <button className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest">
                Resend Code
              </button>
            </div>
          </div>
        );

      case 'ROLE_SELECT':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <h1 className="text-3xl font-black text-white italic">CHOOSE YOUR PATH</h1>
              <p className="text-slate-400 mt-2">How will you be using MatTrack?</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => { setRole(UserRole.OWNER); setStep('CLUB_SETUP'); }}
                className="w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl text-left hover:border-indigo-600 transition-all group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-white italic">CLUB OWNER</h3>
                  <p className="text-slate-500 text-sm mt-1">Manage classes, roster, and payouts.</p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
              </button>

              <button 
                onClick={() => { setRole(UserRole.MEMBER); setStep('JOIN_CLUB'); }}
                className="w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl text-left hover:border-indigo-600 transition-all group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-white italic">STUDENT</h3>
                  <p className="text-slate-500 text-sm mt-1">Join a club and track your rank.</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'CLUB_SETUP':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-6 animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white italic">SETUP ACADEMY</h1>
              <p className="text-slate-400 text-sm">Every champion needs a home.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academy Name</label>
                <input 
                  type="text" 
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Apex Grappling Academy"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Join Code (Club ID)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={customClubId}
                    onChange={(e) => setCustomClubId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-12 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-mono font-black tracking-widest text-indigo-400" 
                  />
                  <div className="absolute right-4 top-4 text-slate-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 ml-1">Members will type this exactly to join your club.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Sport</label>
                <select 
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value as SportType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none font-bold"
                >
                  <option value="BJJ">Brazilian Jiu-Jitsu</option>
                  <option value="Judo">Judo</option>
                  <option value="Wrestling">Wrestling</option>
                  <option value="No-Gi">Grappling / No-Gi</option>
                </select>
              </div>
            </div>

            <button 
              disabled={!clubName || !customClubId}
              onClick={() => onComplete({ role: UserRole.OWNER, clubId: customClubId, isPremium: false })}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest"
            >
              Finish Setup
            </button>
          </div>
        );

      case 'JOIN_CLUB':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-8 animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white italic">JOIN ACADEMY</h1>
              <p className="text-slate-400 text-sm">Enter the code provided by your academy.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <input 
                  type="text" 
                  value={targetClubId}
                  onChange={(e) => setTargetClubId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="CLUB-ID"
                  className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-4xl font-black tracking-[0.2em] outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-indigo-400 shadow-2xl" 
                />
              </div>
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                  MatTrack clubs are private. Contact your gym owner if you haven't received your code.
                </p>
              </div>
            </div>

            <button 
              disabled={!targetClubId}
              onClick={() => onComplete({ role: UserRole.MEMBER, clubId: targetClubId, isPremium: false })}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-5 rounded-3xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              Sign My Contract
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>

            <div className="text-center">
              <button onClick={() => setStep('ROLE_SELECT')} className="text-[10px] text-slate-600 font-black uppercase hover:text-white transition-colors tracking-widest">Wrong Role? Go Back</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 pb-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-50/5 rounded-full blur-[160px]"></div>

      <div className="mb-12 flex flex-col items-center relative z-10">
        <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center mb-4 shadow-2xl shadow-indigo-600/30 rotate-3 transition-transform hover:rotate-0 cursor-default">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
        </div>
        <span className="text-3xl font-black tracking-tighter text-white italic">MATTRACK</span>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {renderStep()}
      </div>
    </div>
  );
};

export default Auth;
