
import React, { useState, useEffect } from 'react';
import { AuthStep, UserRole, SportType } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onComplete: (userData: { role: UserRole | 'ADMIN'; clubId: string; isPremium: boolean }) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clubName, setClubName] = useState('');
  const [customClubId, setCustomClubId] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('BJJ');
  const [targetClubId, setTargetClubId] = useState('');

  useEffect(() => {
    if (step === 'CLUB_SETUP' && clubName && !customClubId) {
      const generated = clubName.toUpperCase().replace(/\s+/g, '').substring(0, 10);
      setCustomClubId(generated);
    }
  }, [clubName, step]);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (step === 'SIGNUP') {
        await dataService.signUp(email, password, username);
        setStep('ROLE_SELECT');
      } else {
        const { user } = (await dataService.signIn(email, password));
        if (user) {
          const profile = await dataService.getProfile(user.id);
          if (profile && profile.role) {
            onComplete({ 
              role: profile.role, 
              clubId: profile.club_id, 
              isPremium: profile.is_premium 
            });
          } else {
            setStep('ROLE_SELECT');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClubAction = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await (supabase.auth as any).getUser();
      const user = data?.user;
      
      if (!user) throw new Error("User session not found.");

      if (clubName) { 
        const club = await dataService.createClub(user.id, clubName, customClubId, selectedSport);
        onComplete({ role: UserRole.OWNER, clubId: club.id, isPremium: false });
      } else { 
        const club = await dataService.joinClub(user.id, targetClubId);
        onComplete({ role: UserRole.MEMBER, clubId: club.id, isPremium: false });
      }
    } catch (err: any) {
      setError(err.message || "Failed to process club request.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'LOGIN':
      case 'SIGNUP':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white italic uppercase leading-none">
                {step === 'LOGIN' ? 'Welcome Back' : 'Join the Mat'}
              </h1>
              {error && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
            </div>

            <div className="space-y-4">
              {step === 'SIGNUP' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="jiujitsu_joe" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white placeholder:text-slate-700" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="grappler@email.com" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white placeholder:text-slate-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-white placeholder:text-slate-700" />
              </div>
            </div>

            <button onClick={handleAuth} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">
              {loading ? 'Processing...' : step === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>

            <button onClick={() => setStep(step === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="w-full text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
              {step === 'LOGIN' ? 'No account? Create profile' : 'Already on MatTrack? Log In'}
            </button>
          </div>
        );

      case 'ROLE_SELECT':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">MISSION SELECT</h1>
              <p className="text-slate-400 mt-2 text-sm">Define your path on the platform.</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => setStep('CLUB_SETUP')} className="w-full p-8 bg-slate-900 border border-slate-800 rounded-[32px] text-left hover:border-indigo-600 transition-all group active:scale-95 shadow-lg">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">ACADEMY OWNER</h3>
                <p className="text-slate-500 text-sm mt-1">Setup your club, staff, and roster.</p>
              </button>
              <button onClick={() => setStep('JOIN_CLUB')} className="w-full p-8 bg-slate-900 border border-slate-800 rounded-[32px] text-left hover:border-indigo-600 transition-all group active:scale-95 shadow-lg">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">TEAM MEMBER</h3>
                <p className="text-slate-500 text-sm mt-1">Connect to your gym and track progress.</p>
              </button>
            </div>
          </div>
        );

      case 'CLUB_SETUP':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-6 animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white italic uppercase leading-none">ACADEMY SETUP</h1>
              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            </div>
            <div className="space-y-4">
              <input placeholder="Academy Name" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white" value={clubName} onChange={e => setClubName(e.target.value)} />
              <input placeholder="Custom Club ID (e.g. GRACIE-LDN)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-indigo-400" value={customClubId} onChange={e => setCustomClubId(e.target.value.toUpperCase())} />
              <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-black text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-600 appearance-none" value={selectedSport} onChange={e => setSelectedSport(e.target.value as SportType)}>
                <option value="BJJ">Brazilian Jiu-Jitsu</option>
                <option value="Judo">Judo</option>
                <option value="Karate">Karate</option>
                <option value="Taekwondo">Taekwondo</option>
                <option value="Wrestling">Wrestling</option>
                <option value="No-Gi">Grappling / No-Gi</option>
              </select>
            </div>
            <button onClick={handleClubAction} disabled={loading || !clubName} className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'Creating Academy...' : 'Launch Academy'}
            </button>
          </div>
        );

      case 'JOIN_CLUB':
        return (
          <div className="w-full max-sm:max-w-[320px] max-w-sm space-y-8 animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white italic uppercase">JOIN TEAM</h1>
              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            </div>
            <input placeholder="ENTER CLUB ID" className="w-full bg-slate-900 border border-slate-800 rounded-[32px] p-8 text-center text-3xl font-black tracking-widest text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-600 shadow-xl" value={targetClubId} onChange={e => setTargetClubId(e.target.value.toUpperCase())} />
            <button onClick={handleClubAction} disabled={loading || !targetClubId} className="w-full bg-indigo-600 py-5 rounded-[32px] text-white font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'Searching...' : 'Connect to Club'}
            </button>
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
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
        </div>
        <span className="text-3xl font-black tracking-tighter text-white italic">MATTRACK</span>
      </div>
      <div className="relative z-10 w-full flex justify-center">{renderStep()}</div>
    </div>
  );
};

export default Auth;
