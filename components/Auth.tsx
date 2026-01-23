
import React, { useState, useEffect } from 'react';
import { AuthStep, UserRole, SportType } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onComplete: () => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (step === 'SIGNUP') {
        await dataService.signUp(email, password, username || 'Grappler');
        setStep('VERIFY');
      } else if (step === 'LOGIN') {
        const { user } = await dataService.signIn(email, password);
        if (user) {
          onComplete();
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await dataService.verifyEmail(email, verificationCode);
      onComplete();
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dataService.resendVerification(email);
      alert("Verification code resent to your email.");
    } catch (err: any) {
      alert(err.message || "Resend failed.");
    } finally {
      setResending(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'LOGIN':
      case 'SIGNUP':
        return (
          <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white italic uppercase leading-none">
                {step === 'LOGIN' ? 'Welcome Back' : 'Join the Mat'}
              </h1>
              {error && <p className="text-red-400 text-[10px] font-black bg-red-500/10 p-2 rounded-lg uppercase tracking-widest">{error}</p>}
            </div>

            <div className="space-y-4">
              {step === 'SIGNUP' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="jiujitsu_joe" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="grappler@email.com" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white" />
              </div>
            </div>

            <button onClick={handleAuth} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-5 rounded-[24px] shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[11px]">
              {loading ? 'Processing...' : step === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>

            <button onClick={() => setStep(step === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="w-full text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
              {step === 'LOGIN' ? 'No account? Create profile' : 'Already on MatTrack? Log In'}
            </button>
          </div>
        );

      case 'VERIFY':
        return (
          <div className="w-full max-w-sm space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
               <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-500 shadow-inner">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
               </div>
               <div className="space-y-1">
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Check Inbox</h1>
                <p className="text-slate-500 text-xs">Enter the 6-digit code sent to <span className="text-indigo-400 font-bold">{email}</span></p>
               </div>
               {error && <p className="text-red-400 text-[10px] font-black bg-red-500/10 p-2 rounded-lg uppercase tracking-widest text-center">{error}</p>}
            </div>

            <div className="space-y-6 text-center">
              <input 
                type="text" 
                maxLength={6}
                value={verificationCode} 
                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="000000" 
                className="w-full bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-center text-5xl font-black tracking-[0.2em] text-white outline-none focus:ring-4 focus:ring-indigo-600/50 transition-all shadow-2xl" 
              />
              
              <button onClick={handleVerify} disabled={loading || verificationCode.length < 6} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-5 rounded-[24px] shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[11px]">
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="space-y-2">
                <button onClick={handleResend} disabled={resending} className="w-full text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
                  {resending ? 'Resending Code...' : "Didn't get a code? Resend"}
                </button>
                <button onClick={() => setStep('SIGNUP')} className="w-full text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
                  Back to Signup
                </button>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px]"></div>
      <div className="mb-12 flex flex-col items-center relative z-10">
        <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center mb-4 shadow-2xl rotate-3">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
        </div>
        <span className="text-3xl font-black tracking-tighter text-white italic uppercase">MATTRACK</span>
      </div>
      <div className="relative z-10 w-full flex justify-center">{renderStep()}</div>
    </div>
  );
};

export default Auth;
