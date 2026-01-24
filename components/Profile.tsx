
import React, { useState, useRef, useEffect } from 'react';
import { UserRole, SportType, Member, MembershipTier } from '../types';
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
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'security' | 'notifications' | 'transfer' | 'delete_club' | 'delete_account' | 'rank' | 'tiers' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  // Membership Tiers State
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [newTier, setNewTier] = useState({ name: '', price: 0, description: '' });

  const clubName = club?.name || 'Academy';
  const username = profileData?.username || 'Grappler';
  const sport: SportType = (club?.sport as SportType) || 'BJJ';
  const rankDef = SPORT_RANKS[sport];
  const otherMembers = members.filter(m => m.id !== profileData?.id);

  const isActualOwner = role?.toString().toUpperCase() === 'OWNER';
  const displayName = isActualOwner ? `Coach ${username}` : username;
  const subTitle = isActualOwner 
    ? `Founder — ${clubName}` 
    : `${profileData?.rank || 'White'} ${rankDef.labelType} • Student`;

  useEffect(() => {
    if (club?.id) {
      loadTiers();
    }
  }, [club?.id]);

  const loadTiers = async () => {
    const data = await dataService.getMembershipTiers(club.id);
    setTiers(data);
  };

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

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dataService.createMembershipTier(club.id, newTier);
      setIsAddingTier(false);
      setNewTier({ name: '', price: 0, description: '' });
      loadTiers();
    } catch (err) { alert("Failed to create tier."); }
    finally { setLoading(false); }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm("Delete this plan? Members currently on this plan will be unassigned.")) return;
    try {
      await dataService.deleteMembershipTier(id);
      loadTiers();
    } catch (err) { alert("Delete failed."); }
  };

  const handleSelectPlan = async (tierId: string) => {
    setLoading(true);
    try {
      await dataService.updateMemberTier(club.id, profileData.id, tierId);
      alert("Membership Plan Updated!");
      onRefreshProfile();
      onClubAction();
      setActiveModal(null);
    } catch (err) { alert("Plan selection failed."); }
    finally { setLoading(false); }
  };

  const avatarSrc = profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const currentMemberRecord = members.find(m => m.id === profileData?.id);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <img src={avatarSrc} className="w-28 h-28 rounded-[40px] border-4 border-slate-900 bg-slate-800 shadow-xl object-cover" alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-indigo-600 p-2.5 rounded-2xl border-2 border-slate-950 shadow-lg hover:scale-110 active:scale-90 transition-all">
             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
        </div>
        <h2 className="text-xl font-black italic tracking-tight mt-4 uppercase text-white">{displayName}</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 text-center px-4">{subTitle}</p>
        
        {/* Stripes Selector */}
        <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs">
          <button onClick={() => setActiveModal('rank')} className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:border-indigo-500 transition-all">
            Update {rankDef.labelType}
          </button>
          
          <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-3xl border border-slate-800 w-full justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Stripes</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <button 
                  key={i} 
                  onClick={() => handleUpdateStripes(i)}
                  className={`w-4 h-8 rounded border-2 border-slate-950 transition-all ${i > 0 && i <= (profileData?.stripes || 0) ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-slate-800 opacity-30'}`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Membership Plan Card */}
      <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] p-6 relative overflow-hidden group">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Plan</h3>
             <h4 className="text-xl font-black text-white italic uppercase tracking-tight">
               {currentMemberRecord?.tier_name || 'No Active Plan'}
             </h4>
           </div>
           <button onClick={() => setActiveModal('tiers')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             {isActualOwner ? "Manage Pricing" : "Manage Plan"}
           </button>
         </div>
         {!currentMemberRecord?.tier_name && !isActualOwner && (
           <p className="text-[10px] text-slate-500 font-medium">You haven't selected a membership tier yet. Tap manage to view academy plans.</p>
         )}
      </section>

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

      <button onClick={() => dataService.signOut()} className="w-full py-5 bg-slate-900 border border-slate-800 rounded-[32px] text-slate-500 font-black uppercase tracking-widest text-[11px]">Sign Out</button>

      {/* OVERLAY MODALS */}
      {activeModal === 'tiers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase">{isActualOwner ? "Membership Management" : "Academy Plans"}</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>

              {isActualOwner && !isAddingTier && (
                <button 
                  onClick={() => setIsAddingTier(true)}
                  className="w-full bg-slate-950 border border-dashed border-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase text-indigo-400 tracking-widest hover:border-indigo-600"
                >
                  + Add New Membership Tier
                </button>
              )}

              {isAddingTier && (
                <form onSubmit={handleCreateTier} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Plan Name</label>
                    <input required placeholder="e.g. Unlimited Training" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-bold" value={newTier.name} onChange={e => setNewTier({...newTier, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Price (£)</label>
                    <input type="number" required placeholder="50.00" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-bold" value={newTier.price} onChange={e => setNewTier({...newTier, price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingTier(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-600/20">Add Plan</button>
                  </div>
                </form>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {tiers.length === 0 ? (
                  <div className="py-20 text-center text-slate-600 italic text-sm">No tiers created yet</div>
                ) : (
                  tiers.map(t => (
                    <div key={t.id} className={`p-6 rounded-[32px] border transition-all flex justify-between items-center group ${currentMemberRecord?.tier_id === t.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-white italic uppercase">{t.name}</h4>
                          {currentMemberRecord?.tier_id === t.id && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase font-black">Active</span>}
                        </div>
                        <p className="text-2xl font-black text-indigo-400 mt-1">£{t.price}<span className="text-[10px] text-slate-600 uppercase tracking-widest ml-1">/mo</span></p>
                      </div>
                      
                      {isActualOwner ? (
                        <button onClick={() => handleDeleteTier(t.id)} className="p-3 text-red-500/30 hover:text-red-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSelectPlan(t.id)}
                          disabled={currentMemberRecord?.tier_id === t.id}
                          className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMemberRecord?.tier_id === t.id ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white shadow-lg active:scale-95'}`}
                        >
                          {currentMemberRecord?.tier_id === t.id ? 'Subscribed' : 'Select Plan'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}

      {/* Other Modals (rank, etc) - Keep existing logic */}
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
    </div>
  );
};

export default Profile;
