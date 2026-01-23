
import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member, AuthStep } from './types';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import AICoach from './components/AICoach';
import Schedule from './components/Schedule';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';
import { dataService } from './services/dataService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | 'ADMIN' | null>(null);
  const [activeClub, setActiveClub] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sport, setSport] = useState<SportType>('BJJ');
  const [members, setMembers] = useState<Member[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  
  // Modals
  const [profileData, setProfileData] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Join/Create Logic
  const [joinStep, setJoinStep] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [joinClubId, setJoinClubId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [newClubCustomId, setNewClubCustomId] = useState('');
  const [newClubSport, setNewClubSport] = useState<SportType>('BJJ');

  useEffect(() => {
    // Listen for auth changes globally to handle sign-out/sign-in reactively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setRole(null);
        setActiveClub(null);
        setMemberships([]);
        setProfileData(null);
        setActiveTab('dashboard');
      } else if (session?.user) {
        setUserId(session.user.id);
      }
    });

    checkUser();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMemberships();
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (activeClub) {
      loadMembers();
    }
  }, [activeClub]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setUserId(data.session.user.id);
    }
  };

  const loadMemberships = async () => {
    if (!userId) return;
    try {
      const data = await dataService.getUserMemberships(userId);
      setMemberships(data);
      
      // Handle scenario where user left the active club or has no clubs
      const isStillMember = data.some(m => m.club_id === activeClub?.id);
      
      if (data.length > 0) {
        if (!activeClub || !isStillMember) {
          setActiveClub(data[0].clubs);
          setRole(data[0].role as UserRole);
          setSport(data[0].clubs.sport);
        }
      } else {
        // Reset everything if no memberships exist
        setActiveClub(null);
        setRole(null);
        // Force them into the Join Academy screen if they have a profile but no clubs
        setShowJoinModal(true);
      }
    } catch (err: any) {
      console.error("Failed to load memberships", err);
    }
  };

  const loadMembers = async () => {
    if (!activeClub) return;
    setLoading(true);
    try {
      const data = await dataService.getMembers(activeClub.id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!userId) return;
    try {
      const profile = await dataService.getProfile(userId);
      setProfileData(profile);
      setIsPremium(profile?.is_premium || false);
      if (!profile?.username || profile.username === 'New Owner' || profile.username === 'New Member') {
        setShowSetupModal(true);
      }
    } catch (err) {
      console.error("Error loading profile", err);
    }
  };

  const handleAuthComplete = async () => {
    const { data: userData } = await (supabase.auth as any).getUser();
    if (userData?.user) {
      setUserId(userData.user.id);
    }
  };

  const handleSwitchClub = (membership: any) => {
    setActiveClub(membership.clubs);
    setRole(membership.role as UserRole);
    setSport(membership.clubs.sport);
    setIsSwitcherOpen(false);
  };

  const handleUpdateName = async () => {
    if (!userId || !newName.trim()) return;
    setLoading(true);
    try {
      await dataService.updateProfile(userId, { username: newName });
      setShowSetupModal(false);
      await loadProfile();
    } catch (err) {
      alert("Failed to update name.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrCreate = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (joinStep === 'CREATE') {
        const club = await dataService.createClub(userId, newClubName, newClubCustomId, newClubSport);
        setActiveClub(club);
        setRole(UserRole.OWNER);
      } else {
        const club = await dataService.joinClub(userId, joinClubId);
        setActiveClub(club);
        setRole(UserRole.MEMBER);
      }
      await loadMemberships();
      setShowJoinModal(false);
      setJoinStep('SELECT');
      // Reset inputs
      setJoinClubId('');
      setNewClubName('');
      setNewClubCustomId('');
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <Auth onComplete={handleAuthComplete} />;
  }

  // If authenticated but no club joined yet, force join/create view
  const noClubJoined = !activeClub && memberships.length === 0;

  const renderContent = () => {
    if (role === 'ADMIN') return <AdminDashboard />;
    if (noClubJoined) return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-500">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div className="max-w-xs space-y-2">
          <h2 className="text-3xl font-black italic uppercase text-white leading-none">Not in an Academy</h2>
          <p className="text-slate-400 text-sm">Join an existing club or create your own to start tracking your journey.</p>
        </div>
        <button 
          onClick={() => setShowJoinModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs"
        >
          Get Started
        </button>
      </div>
    );
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard userId={userId} role={role as UserRole} sport={sport} members={members} isPremium={isPremium || role === UserRole.OWNER} />;
      case 'members': return <MemberList members={members} sport={sport} role={role as UserRole} clubId={activeClub?.id} onRefresh={loadMembers} />;
      case 'coach': return <AICoach sport={sport} role={role as UserRole} isPremium={isPremium || role === UserRole.OWNER} onUpgrade={() => setIsPremium(true)} />;
      case 'schedule': return <Schedule userId={userId} role={role as UserRole} clubId={activeClub?.id || ''} sport={sport} />;
      case 'profile': return <Profile role={role as UserRole} isPremium={isPremium || role === UserRole.OWNER} onUpgrade={() => setIsPremium(true)} profileData={profileData} onRefreshProfile={loadProfile} members={members} club={activeClub} onClubAction={loadMemberships} />;
      default: return null;
    }
  };

  const headerAvatarSrc = profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.username || 'Grappler'}`;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">MatTrack</span>
              {activeClub && <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                {activeClub.custom_id}
                <svg className={`w-2 h-2 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7"/></svg>
              </span>}
            </div>
          </button>

          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 flex justify-between">
                <span>Your Academies</span>
                <span>{memberships.length} ACTIVE</span>
              </div>
              {memberships.map((m) => {
                const isActive = activeClub?.id === m.club_id;
                return (
                  <button 
                    key={m.id}
                    onClick={() => handleSwitchClub(m)}
                    className={`w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-l-4 ${isActive ? 'bg-indigo-600/10 border-indigo-500' : 'border-transparent'}`}
                  >
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isActive ? 'text-indigo-400' : 'text-white'}`}>{m.clubs.name}</span>
                        {isActive && <span className="text-[7px] bg-indigo-600 text-white px-1 py-0.5 rounded font-black uppercase">Current</span>}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{m.role} • {m.clubs.sport}</span>
                    </div>
                    {!isActive && <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>}
                  </button>
                );
              })}
              <div className="border-t border-slate-800 mt-2 pt-2">
                <button 
                  onClick={() => { setShowJoinModal(true); setIsSwitcherOpen(false); }}
                  className="w-full px-4 py-3 text-left text-[11px] font-black text-indigo-400 hover:bg-indigo-600/10 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <div className="w-5 h-5 bg-indigo-600/20 rounded flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4"/></svg>
                  </div>
                  Join Another Academy
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity shadow-sm"
        >
          <img src={headerAvatarSrc} alt="profile" className="object-cover w-full h-full" />
        </button>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
        {loading && activeTab === 'members' ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : renderContent()}
      </main>

      {showSetupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-500 mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">Claim Your Identity</h2>
              <p className="text-slate-400 text-sm">Enter your name as it appears in the academy roster.</p>
            </div>
            <input 
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Marcus Aurelius"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            />
            <button 
              onClick={handleUpdateName}
              disabled={loading || !newName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Set Profile Name'}
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6 relative">
            <button onClick={() => { setShowJoinModal(false); setJoinStep('SELECT'); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {joinStep === 'SELECT' ? (
              <>
                <h3 className="text-2xl font-black text-white italic uppercase text-center tracking-tight">Expand Your Training</h3>
                <div className="space-y-4">
                   <button onClick={() => setJoinStep('CREATE')} className="w-full p-6 bg-slate-950 border border-slate-800 rounded-2xl text-left hover:border-indigo-500 transition-all group flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4"/></svg>
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Academy Owner</p>
                       <h4 className="text-white font-bold text-sm">Setup a new club</h4>
                     </div>
                   </button>
                   <button onClick={() => setJoinStep('JOIN')} className="w-full p-6 bg-slate-950 border border-slate-800 rounded-2xl text-left hover:border-emerald-500 transition-all group flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Team Member</p>
                       <h4 className="text-white font-bold text-sm">Join an existing club via ID</h4>
                     </div>
                   </button>
                </div>
              </>
            ) : joinStep === 'JOIN' ? (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-black text-white italic uppercase">Enter Club ID</h3>
                <p className="text-slate-500 text-xs">Ask your coach for the academy code.</p>
                <input 
                  autoFocus
                  placeholder="CLUB-ID" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-3xl font-black text-indigo-400 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-600"
                  value={joinClubId}
                  onChange={e => setJoinClubId(e.target.value.toUpperCase())}
                />
                <div className="flex gap-3">
                   <button onClick={() => setJoinStep('SELECT')} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl uppercase font-black text-xs">Back</button>
                   <button onClick={handleJoinOrCreate} disabled={loading || !joinClubId} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl uppercase font-black text-xs shadow-lg">Join Team</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white italic uppercase text-center">New Academy</h3>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Gym Name</label>
                  <input placeholder="e.g. Apex Jiu Jitsu" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600" value={newClubName} onChange={e => setNewClubName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Unique Identifier</label>
                  {/* Fixed: changed setCustomClubId to setNewClubCustomId to match state definition */}
                  <input placeholder="e.g. APEX-LDN" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-indigo-400 uppercase outline-none focus:ring-2 focus:ring-indigo-600" value={newClubCustomId} onChange={e => setNewClubCustomId(e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Primary Sport</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm uppercase font-black outline-none focus:ring-2 focus:ring-indigo-600" value={newClubSport} onChange={e => setNewClubSport(e.target.value as any)}>
                    <option value="BJJ">Jiu-Jitsu</option>
                    <option value="Wrestling">Wrestling</option>
                    <option value="Judo">Judo</option>
                    <option value="No-Gi">No-Gi</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setJoinStep('SELECT')} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl uppercase font-black text-xs">Back</button>
                   <button onClick={handleJoinOrCreate} disabled={loading || !newClubName} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl uppercase font-black text-xs shadow-lg">Create</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="grid" label="Home" />
          <NavItem active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon="users" label={role === UserRole.OWNER ? 'Roster' : 'Team'} />
          <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon="calendar" label="Classes" />
          <NavItem active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} icon="sparkles" label="AI Coach" isPremiumIndicator={!isPremium && role !== UserRole.OWNER} />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="user" label="Profile" />
        </div>
      </nav>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  isPremiumIndicator?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label, isPremiumIndicator }) => {
  const icons: any = {
    grid: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    users: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    sparkles: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3l1.912 5.886L20 10l-5.088 1.114L13 17l-1.912-5.886L6 10l5.088-1.114L12 3z"/></svg>,
    user: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-indigo-400' : 'text-slate-500'}`}
    >
      <div className="relative">
        {icons[icon]}
        {isPremiumIndicator && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-sm shadow-amber-400/50"></div>
        )}
      </div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
};

export default App;
