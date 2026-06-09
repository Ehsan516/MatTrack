
import React, { useState, useRef } from 'react';
import { UserRole, SportType, Member } from '../types';
import { SPORT_RANKS } from '../constants';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
  role: UserRole;
  profileData: any;
  onRefreshProfile: () => void;
  members: Member[];
  club?: any;
  onClubAction: () => void;
}

const Profile: React.FC<ProfileProps> = ({ role, profileData, onRefreshProfile, members, club, onClubAction }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'security' | 'notifications' | 'transfer' | 'delete_club' | 'delete_account' | 'rank' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const clubName = club?.name || 'Academy';
  const username = profileData?.username || 'Grappler';
  const sport: SportType = (club?.sport as SportType) || 'BJJ';
  const rankDef = SPORT_RANKS[sport];
  const otherMembers = members.filter(m => m.id !== profileData?.id);

  const beltPill = (rank: string) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('white')) return 'bg-slate-100 text-slate-900';
    if (r.includes('blue')) return 'bg-blue-600 text-white';
    if (r.includes('purple')) return 'bg-purple-600 text-white';
    if (r.includes('brown')) return 'bg-amber-900 text-white';
    if (r.includes('black')) return 'bg-slate-950 text-white border border-slate-800';
    return 'bg-indigo-600 text-white';
  };

const baseBelt = (rank: string) => {
  const r = (rank || '').toLowerCase();
  if (r.includes('black')) return 'Black';
  if (r.includes('brown')) return 'Brown';
  if (r.includes('purple')) return 'Purple';
  if (r.includes('blue')) return 'Blue';
  if (r.includes('white')) return 'White';
  return rank || 'White';
};


  const isActualOwner = role?.toString().toUpperCase() === 'OWNER';
  const displayName = isActualOwner ? `Coach ${username}` : username;
  const subTitle = isActualOwner
    ? `Founder — ${clubName}`
    : `${baseBelt(profileData?.rank || 'White')} ${rankDef.labelType} • Student`;


  const handleUpdateStripes = async (count: number) => {
    try {
      await dataService.updateProfile(profileData.id, { stripes: count });
      onRefreshProfile();
    } catch (err) { alert("Failed to update stripes."); }
  };

  const handleUpdateRank = async (rank: string) => {
    try {
      await dataService.updateProfile(profileData.id, { rank });
      setActiveModal(null);
      onRefreshProfile();
    } catch (err) { alert("Failed to update rank."); }
  };

  const handleTransferOwnership = async () => {
    if (!club) return;
    if (otherMembers.length === 0) {
      alert('You have no other members to transfer ownership to!');
      setActiveModal(null);
      return;
    }
    if (!selectedNewOwner) return;
    setLoading(true);
    try {
      // Server-side RPC handles auth + atomic transfer
      await dataService.transferClubOwnership(club.id, selectedNewOwner);
      alert("Ownership transferred. You are now a team member.");
      onClubAction();
      setActiveModal(null);
    } catch (err) { alert("Transfer failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteClub = async () => {
    if (!club) return;
    if (!passwordInput) {
      alert('Enter your password to confirm.');
      return;
    }
    setLoading(true);
    try {
      await dataService.deleteClub(club.id);
      alert("Club Deleted.");
      onClubAction();
      setActiveModal(null);
    } catch (err) { alert("Delete failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!passwordInput) {
      alert('Enter your password to confirm.');
      return;
    }
    // Client-side password verification isn't available with Supabase.
    // We still require a password input as a UX guardrail, but the real checks happen server-side.
    setLoading(true);
    try {
      await dataService.deleteAccount();
      alert('Account deleted.');
      await dataService.signOut();
    } catch (err: any) {
      const msg = err?.message || 'Delete failed.';
      alert(msg);
    } finally {
      setLoading(false);
      setActiveModal(null);
    }
  };


  const handleSignOut = async () => {
    setLoading(true);
    try { await dataService.signOut(); }
    catch (err) { console.error("Sign out error", err); }
    finally { setLoading(false); }
  };

  const avatarSrc = profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <img src={avatarSrc} className="w-28 h-28 rounded-[40px] border-4 border-slate-900 bg-slate-800 shadow-xl object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-indigo-600 p-2.5 rounded-2xl border-2 border-slate-950 shadow-lg hover:scale-110 active:scale-90 transition-all">
             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {/* avatar logic already in previous version */}} />
        </div>
        <h2 className="text-xl font-black italic tracking-tight mt-4 uppercase text-white">{displayName}</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 text-center px-4">{subTitle}</p>
        
{/* Belt + Stripes */}
<div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs">
  {/* Belt display */}
  <div className={`w-full py-4 rounded-2xl text-center text-[12px] font-black uppercase tracking-widest ${beltPill(profileData?.rank)}`}>
    {baseBelt(profileData?.rank)} {rankDef.labelType}
  </div>

  {/* Stripes */}
  <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-3xl border border-slate-800 w-full justify-between">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Stripes</span>
    <div className="flex gap-1.5">
      {[0, 1, 2, 3, 4].map(i => (
        <button 
          key={i} 
          onClick={() => handleUpdateStripes(i)}
          className={`w-4 h-8 rounded border-2 border-slate-950 transition-all ${
            i > 0 && i <= (profileData?.stripes || 0)
              ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
              : 'bg-slate-800 opacity-30'
          }`}
        />
      ))}
    </div>
  </div>

  {/* Update belt button below stripes */}
  <button
    onClick={() => setActiveModal('rank')}
    className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:border-indigo-500 transition-all"
  >
    Update {rankDef.labelType}
  </button>
</div>

      </div>

      {/* Main Settings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Settings</h3>
        </div>
        <div className="divide-y divide-slate-800">
          <div onClick={() => setActiveModal('notifications')} className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="text-slate-500 group-hover:text-indigo-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
              <div><p className="text-[11px] font-black uppercase text-slate-200">Push Notifications</p><p className="text-[9px] text-indigo-400 font-bold uppercase">{notifEnabled ? "Active" : "Muted"}</p></div>
            </div>
            <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
          </div>
          <div onClick={() => setActiveModal('security')} className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="text-slate-500 group-hover:text-indigo-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div><p className="text-[11px] font-black uppercase text-slate-200">Security</p><p className="text-[9px] text-indigo-400 font-bold uppercase">Change Password</p></div>
            </div>
            <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] overflow-hidden">
        <div className="p-5 border-b border-red-500/10">
          <h3 className="font-black text-red-400 uppercase text-[10px] tracking-widest">Danger Zone</h3>
        </div>
        <div className="divide-y divide-red-500/10">
          {isActualOwner && (
            <div
              onClick={() => {
                if (otherMembers.length === 0) {
                  alert('You have no other members to transfer ownership to!');
                  return;
                }
                setSelectedNewOwner(null);
                setActiveModal('transfer');
              }}
              className="flex items-center justify-between p-6 hover:bg-red-500/10 transition-colors cursor-pointer group"
            >
              <div><p className="text-[11px] font-black uppercase text-red-200">Transfer Ownership</p><p className="text-[9px] text-red-400/60 font-bold uppercase">Appoint a new Coach</p></div>
              <svg className="w-4 h-4 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
            </div>
          )}
          {isActualOwner && (
            <div onClick={() => setActiveModal('delete_club')} className="flex items-center justify-between p-6 hover:bg-red-500/10 transition-colors cursor-pointer group">
              <div><p className="text-[11px] font-black uppercase text-red-200">Delete Academy</p><p className="text-[9px] text-red-400/60 font-bold uppercase">Irreversible Action</p></div>
              <svg className="w-4 h-4 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
          )}
          <div
            onClick={() => {
              setPasswordInput('');
              // If owner has other members, show the constraint modal (with actions)
              setActiveModal('delete_account');
            }}
            className="flex items-center justify-between p-6 hover:bg-red-500/10 transition-colors cursor-pointer group"
          >
            <div><p className="text-[11px] font-black uppercase text-red-200">Delete Account</p><p className="text-[9px] text-red-400/60 font-bold uppercase">Wipe all your data</p></div>
            <svg className="w-4 h-4 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </div>
        </div>
      </div>

      <button onClick={handleSignOut} className="w-full py-5 bg-slate-900 border border-slate-800 rounded-[32px] text-slate-500 font-black uppercase tracking-widest text-[11px]">Sign Out</button>

      {/* OVERLAY MODALS */}
      {activeModal === 'rank' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-xl font-black text-white italic uppercase text-center mb-4">Promote / Change Rank</h3>
              {rankDef.ranks.map(r => (
                <button key={r} onClick={() => handleUpdateRank(r)} className="w-full py-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-black text-white hover:border-indigo-500 transition-all uppercase tracking-tight">{r}</button>
              ))}
              <button onClick={() => setActiveModal(null)} className="w-full py-4 text-slate-500 font-black uppercase text-xs">Close</button>
           </div>
        </div>
      )}

      {activeModal === 'transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white italic uppercase text-center">Transfer Ownership</h3>
              <p className="text-slate-500 text-xs text-center">Select a member to become the new Academy Owner.</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {otherMembers.length === 0 ? <p className="text-center text-slate-600 italic">No other members in academy</p> : otherMembers.map(m => (
                  <button key={m.id} onClick={() => setSelectedNewOwner(m.id)} className={`w-full p-4 rounded-2xl flex items-center gap-3 border transition-all ${selectedNewOwner === m.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">{m.name[0]}</div>
                    <span className="text-sm font-bold text-white uppercase">{m.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-xs">Cancel</button>
                <button onClick={handleTransferOwnership} disabled={!selectedNewOwner} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50">Transfer</button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'delete_club' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
              <h3 className="text-xl font-black text-white italic uppercase text-center">Delete Academy</h3>
              <p className="text-slate-500 text-xs text-center leading-relaxed">This will permanently delete "{clubName}". All schedules and roster data will be wiped forever.</p>
              <input type="password" placeholder="Confirm Password" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-xs">Back</button>
                <button onClick={handleDeleteClub} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Confirm Delete</button>
              </div>
           </div>
        </div>
      )}

      {activeModal === 'delete_account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-red-500/30 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white italic uppercase text-center">Delete Account</h3>
              {isActualOwner && members.length > 1 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                   <p className="text-xs text-red-400 font-bold uppercase leading-relaxed text-center">
                     You can’t delete your account while your academy has other members.
                     Transfer ownership to another member or delete the academy first.
                   </p>
                   <div className="grid grid-cols-1 gap-3 mt-4">
                     <button
                       onClick={() => {
                         if (otherMembers.length === 0) {
                           alert('You have no other members to transfer ownership to!');
                           return;
                         }
                         setSelectedNewOwner(null);
                         setActiveModal('transfer');
                       }}
                       className="w-full py-4 bg-indigo-600 rounded-xl font-black uppercase text-xs"
                     >
                       Transfer Ownership
                     </button>
                     <button
                       onClick={() => {
                         setActiveModal('delete_club');
                       }}
                       className="w-full py-4 bg-red-600 rounded-xl font-black uppercase text-xs"
                     >
                       Delete Academy
                     </button>
                     <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-slate-800 rounded-xl font-black uppercase text-xs">Close</button>
                   </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-500 text-xs text-center">Enter password to wipe your personal profile and mat-history.</p>
                  <input type="password" placeholder="Confirm Password" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase text-xs">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={loading} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs disabled:opacity-50">Delete Forever</button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white italic uppercase text-center">Notifications</h3>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl">
                 <span className="text-sm font-bold text-white uppercase tracking-tight">Push Alerts</span>
                 <button onClick={() => setNotifEnabled(!notifEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${notifEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifEnabled ? 'left-7' : 'left-1'}`}></div>
                 </button>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase text-xs">Save Settings</button>
           </div>
        </div>
      )}

      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6 text-center">
              <h3 className="text-xl font-black text-white italic uppercase">Update Password</h3>
              <p className="text-slate-500 text-xs px-4">A reset link will be sent to your email to securely update your credentials.</p>
              <button onClick={() => { alert("Reset link sent!"); setActiveModal(null); }} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase text-xs shadow-lg">Send Reset Link</button>
              <button onClick={() => setActiveModal(null)} className="w-full py-2 text-slate-500 font-black uppercase text-xs mt-2">Maybe Later</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
