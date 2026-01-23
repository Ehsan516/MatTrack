
import React, { useState, useRef } from 'react';
import { UserRole, SportType, Member } from '../types';
import { SPORT_RANKS } from '../constants';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
  role: UserRole;
  isPremium: boolean;
  onUpgrade: () => void;
  profileData: any;
  onRefreshProfile: () => void;
  members: Member[];
  club?: any;
  onClubAction: () => void;
}

const Profile: React.FC<ProfileProps> = ({ role, isPremium, onUpgrade, profileData, onRefreshProfile, members, club, onClubAction }) => {
  const [isEditingRank, setIsEditingRank] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'security' | 'notifications' | 'delete_club' | 'delete_account' | 'transfer' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const clubName = club?.name || 'Academy';
  const username = profileData?.username || 'Grappler';
  const sport: SportType = (club?.sport as SportType) || 'BJJ';
  const rankDef = SPORT_RANKS[sport];
  const otherMembers = members.filter(m => m.id !== profileData?.id);

  const displayName = role === UserRole.OWNER ? `Coach ${username}` : username;
  const subTitle = role === UserRole.OWNER 
    ? `Founder — ${clubName}` 
    : `${profileData?.rank || 'White'} ${rankDef.labelType} • Student`;

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await dataService.signOut();
      // App.tsx handles the state change via onAuthStateChange listener
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!club?.id || !profileData?.id) return;
    if (!confirm(`Are you sure you want to leave ${clubName}?`)) return;
    setLoading(true);
    try {
      await dataService.leaveClub(profileData.id, club.id);
      // App handles switching clubs or showing the join screen reactively
      onClubAction();
    } catch (err) {
      console.error("Leave club error", err);
      alert("Failed to leave academy.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1MB.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await dataService.updateProfile(profileData.id, { avatar_url: base64String });
        onRefreshProfile();
      } catch (err) {
        alert("Failed to upload image.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setLoading(true);
    try {
      await dataService.updatePassword(newPassword);
      alert("Password updated successfully.");
      setActiveModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = async (newRank: string) => {
    if (!profileData?.id) return;
    setLoading(true);
    try {
      await dataService.updateProfile(profileData.id, { rank: newRank });
      setIsEditingRank(false);
      onRefreshProfile();
    } catch (err) {
      alert("Failed to update rank.");
    } finally {
      setLoading(false);
    }
  };

  const handleStripeChange = async (stripes: number) => {
    if (!profileData?.id) return;
    setLoading(true);
    try {
      await dataService.updateProfile(profileData.id, { stripes });
      onRefreshProfile();
    } catch (err) {
      alert("Failed to update stripes.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;
    setLoading(true);
    try {
      await dataService.transferOwnership(club.id, profileData.id, selectedNewOwner);
      onClubAction(); // Refresh state
      setActiveModal(null);
    } catch (err) {
      alert("Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!passwordInput) return;
    setLoading(true);
    const isVerified = await dataService.verifyPassword(profileData.email, passwordInput);
    if (!isVerified) {
      alert("Incorrect password.");
      setLoading(false);
      return;
    }
    try {
      await dataService.deleteClub(club.id);
      onClubAction();
      setActiveModal(null);
    } catch (err) {
      alert("Failed to delete club.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!passwordInput) return;
    setLoading(true);
    const isVerified = await dataService.verifyPassword(profileData.email, passwordInput);
    if (!isVerified) {
      alert("Incorrect password.");
      setLoading(false);
      return;
    }
    try {
      if (role === UserRole.OWNER && otherMembers.length === 0 && club?.id) {
        await dataService.deleteClub(club.id);
      }
      await dataService.deleteAccount(profileData.id);
      // Auth state listener handles the rest
    } catch (err) {
      alert("Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('white')) return 'bg-slate-100 text-slate-900';
    if (r.includes('blue')) return 'bg-blue-600 text-white';
    if (r.includes('purple')) return 'bg-purple-600 text-white';
    if (r.includes('brown')) return 'bg-amber-900 text-white';
    if (r.includes('black')) return 'bg-slate-950 text-white border border-slate-800';
    return 'bg-indigo-600 text-white';
  };

  const avatarSrc = profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <img src={avatarSrc} className="w-28 h-28 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-indigo-600 p-2.5 rounded-full border-2 border-slate-950 shadow-lg hover:bg-indigo-500 transition-all hover:scale-110 active:scale-90">
             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <h2 className="text-xl font-black italic tracking-tight mt-4 uppercase text-white">{displayName}</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 text-center px-4">{subTitle}</p>
        
        <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs">
          <button onClick={() => setIsEditingRank(true)} className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${getRankColor(profileData?.rank || 'White')}`}>
            {profileData?.rank || 'White'} {rankDef.labelType}
          </button>

          {sport === 'BJJ' && !profileData?.rank?.toLowerCase().includes('degree') && !profileData?.rank?.toLowerCase().includes('coral') && (
            <div className="flex flex-col items-center gap-3 w-full bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Stripe Progress</span>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((s) => (
                  <button key={s} onClick={() => handleStripeChange(s)} className={`w-10 h-5 rounded-sm border transition-all ${profileData?.stripes >= s && s > 0 ? 'bg-white border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]' : s === 0 && (profileData?.stripes === 0 || !profileData.stripes) ? 'bg-slate-700 border-slate-600' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Account & Academy</h3>
        </div>
        <div className="divide-y divide-slate-800">
          <SettingItem onClick={() => setActiveModal('notifications')} icon="bell" label="Mat Notifications" detail={notifEnabled ? "Enabled" : "Muted"} />
          <SettingItem onClick={() => setActiveModal('security')} icon="shield" label="Academy Security" detail="Password & Re-auth" />
        </div>
      </div>

      <div className="space-y-3">
        {role === UserRole.MEMBER && club && (
          <button 
            onClick={handleLeaveClub}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-red-500/10 text-red-500/80 font-black py-5 rounded-[32px] transition-all border border-slate-800 uppercase tracking-widest text-[11px] disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Leave Academy'}
          </button>
        )}
        <button onClick={handleSignOut} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-slate-500 font-black py-5 rounded-[32px] transition-all border border-slate-800 uppercase tracking-widest text-[11px] disabled:opacity-50">
          {loading ? 'Processing...' : 'Sign Out'}
        </button>
      </div>

      <div className="pt-12 mt-12 border-t border-slate-900/50">
        <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h3 className="text-red-500/50 font-black uppercase text-[10px] tracking-widest">Danger Zone</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {role === UserRole.OWNER && (
               <>
                 <button onClick={() => setActiveModal('transfer')} className="w-full bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition-all opacity-80">
                   <span className="text-[10px] font-black uppercase text-slate-400">Transfer Ownership</span>
                   <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                 </button>
                 <button onClick={() => setActiveModal('delete_club')} className="w-full bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all opacity-80">
                   <span className="text-[10px] font-black uppercase text-red-400/70">Delete Academy</span>
                   <svg className="w-3.5 h-3.5 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                 </button>
               </>
             )}
             <button onClick={() => setActiveModal('delete_account')} className="w-full bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all opacity-80">
                <span className="text-[10px] font-black uppercase text-red-400/70">Terminate Account</span>
                <svg className="w-3.5 h-3.5 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </button>
          </div>
        </div>
      </div>

      {isEditingRank && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-6 rounded-[32px] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-white font-black italic uppercase text-sm tracking-widest text-center mb-2">Promote Your {rankDef.labelType}</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {rankDef.ranks.map(r => (
                <button key={r} onClick={() => handleRankChange(r)} className={`w-full py-4 px-5 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center justify-between hover:scale-[1.01] active:scale-95 ${profileData?.rank === r ? 'ring-2 ring-indigo-500' : ''} ${getRankColor(r)}`}>
                  <span>{r} {rankDef.labelType}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsEditingRank(false)} className="w-full bg-slate-800 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-2">Cancel</button>
          </div>
        </div>
      )}

      {activeModal === 'transfer' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
              <div className="text-center">
                <h3 className="text-white font-black uppercase text-sm tracking-widest">Hand Over Reins</h3>
                <p className="text-slate-500 text-[10px] font-medium mt-1">Select a member to become the new Academy Owner.</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {otherMembers.length > 0 ? otherMembers.map(m => (
                  <button key={m.id} onClick={() => setSelectedNewOwner(m.id)} className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedNewOwner === m.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                    <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-8 h-8 rounded-full bg-slate-800 object-cover" alt={m.name} />
                    <span className="text-xs font-black uppercase text-white">{m.name}</span>
                  </button>
                )) : <p className="text-center text-slate-600 italic text-[10px] py-8">No other members available.</p>}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActiveModal(null)} className="flex-1 bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Cancel</button>
                 <button disabled={!selectedNewOwner || loading} onClick={handleTransferOwnership} className="flex-1 bg-amber-500 text-slate-950 font-black py-4 rounded-2xl uppercase text-[10px] disabled:opacity-50">Transfer</button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'delete_club' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-sm p-8 rounded-[40px] shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-white font-black uppercase text-sm tracking-widest">Delete Academy?</h3>
                <p className="text-slate-500 text-[10px] font-medium leading-relaxed">Permanently removes {clubName}.</p>
              </div>
              <div className="space-y-4">
                <input type="password" placeholder="Verify Password" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-center text-sm" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              </div>
              <div className="flex gap-3">
                 <button onClick={() => { setActiveModal(null); setPasswordInput(''); }} className="flex-1 bg-slate-800 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Cancel</button>
                 <button disabled={!passwordInput || loading} onClick={handleDeleteClub} className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-lg shadow-red-600/20">Delete</button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'security' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-8 rounded-[40px] shadow-2xl space-y-6">
              <h3 className="text-white font-black uppercase text-center text-sm tracking-widest">Update Security</h3>
              <div className="space-y-4">
                <input type="password" placeholder="New Password" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActiveModal(null)} className="flex-1 bg-slate-800 text-white font-black py-3 rounded-2xl uppercase text-[10px]">Cancel</button>
                 <button onClick={handleChangePassword} className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-2xl uppercase text-[10px]">Update</button>
              </div>
           </div>
        </div>
      )}
      
      <div className="text-center py-4">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">MatTrack Platform v1.6.2</p>
      </div>
    </div>
  );
};

const SettingItem: React.FC<{ icon: string; label: string; detail?: string; onClick?: () => void }> = ({ icon, label, detail, onClick }) => {
  const icons: any = {
    bell: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return (
    <div onClick={onClick} className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors cursor-pointer group active:scale-[0.98]">
      <div className="flex items-center gap-4">
        <div className="text-slate-500 group-hover:text-indigo-400 transition-colors">{icons[icon]}</div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-tight text-slate-200">{label}</p>
          {detail && <p className="text-[9px] text-indigo-400 font-bold uppercase mt-0.5">{detail}</p>}
        </div>
      </div>
      <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
    </div>
  );
};

export default Profile;
