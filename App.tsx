import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member } from './types';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'schedule' | 'profile'>('dashboard');
  const [sport, setSport] = useState<SportType>('BJJ');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newName, setNewName] = useState('');

  const [joinStep, setJoinStep] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [joinClubId, setJoinClubId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [newClubCustomId, setNewClubCustomId] = useState('');
  const [newClubSport, setNewClubSport] = useState<SportType>('BJJ');

  useEffect(() => {
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
      initializeApp();
    } else {
      setLoading(false);
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
    } else {
      setLoading(false);
    }
  };

  const initializeApp = async () => {
    setLoading(true);
    try {
      await loadProfile();       // Profile first (name setup UX)
      await loadMemberships();   // Then membership/club role
    } catch (err) {
      console.error("Initialization error", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberships = async () => {
    if (!userId) return;
    try {
      const data = await dataService.getUserMemberships(userId);
      setMemberships(data);

      if (data.length > 0) {
        let currentClubMembership = data.find(m => m.club_id === activeClub?.id);

        if (!activeClub || !currentClubMembership) {
          const directOwnerClub = data.find(m => m.clubs.owner_id === userId);
          const roleOwnerClub = data.find(m => m.role?.toString().toUpperCase() === 'OWNER');
          currentClubMembership = directOwnerClub || roleOwnerClub || data[0];
          setActiveClub(currentClubMembership.clubs);
          setSport(currentClubMembership.clubs.sport);
        }

        const dbRole = currentClubMembership.role?.toString().toUpperCase();
        const isLiteralOwner = currentClubMembership.clubs.owner_id === userId;
        const effectiveRole = (dbRole === 'OWNER' || isLiteralOwner) ? UserRole.OWNER : UserRole.MEMBER;
        setRole(effectiveRole);
      } else {
        setActiveClub(null);
        setRole(null);
      }
    } catch (err: any) {
      console.error("Failed to load memberships", err);
    }
  };

  const loadMembers = async () => {
    if (!activeClub) return;
    try {
      const data = await dataService.getMembers(activeClub.id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

const loadProfile = async () => {
  if (!userId) return;

  try {
    let profile = await dataService.getProfile(userId);

    if (!profile) {
      await dataService.updateProfile(userId, {
        username: 'Grappler',
        rank: 'White',
        stripes: 0,
        role: 'MEMBER'
      });

      profile = await dataService.getProfile(userId);
    }

    setProfileData(profile);

    const isNew =
      !profile?.username ||
      profile.username === 'New Owner' ||
      profile.username === 'New Member' ||
      profile.username === 'Grappler';

    setShowSetupModal(!!isNew);
  } catch (err) {
    console.error("Error loading profile", err);
  }
};

  const handleAuthComplete = () => {
    checkUser();
  };

  const handleSwitchClub = (membership: any) => {
    setActiveClub(membership.clubs);
    const dbRole = membership.role?.toString().toUpperCase();
    const isLiteralOwner = membership.clubs.owner_id === userId;
    const effectiveRole = (dbRole === 'OWNER' || isLiteralOwner) ? UserRole.OWNER : UserRole.MEMBER;
    setRole(effectiveRole);
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
      setJoinClubId('');
      setNewClubName('');
      setNewClubCustomId('');
      setNewClubSport('BJJ');
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Entering Dojo...</p>
      </div>
    );
  }

  if (!userId) {
    return <Auth onComplete={handleAuthComplete} />;
  }

  const noClubJoined = !activeClub && memberships.length === 0;

  const renderContent = () => {
    if (role === 'ADMIN') return <AdminDashboard />;

    if (noClubJoined) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-indigo-600/10 rounded-[40px] flex items-center justify-center text-indigo-500 shadow-xl border border-indigo-500/20">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div className="max-w-xs space-y-2">
            <h2 className="text-3xl font-black italic uppercase text-white leading-none tracking-tight">No Academy Joined</h2>
            <p className="text-slate-500 text-sm">Join an existing team or launch your own academy to start tracking your progress.</p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-12 rounded-[24px] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 uppercase tracking-widest text-[11px]"
          >
            Join or Create Academy
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userId={userId} role={role as UserRole} sport={sport} members={members} />;
      case 'members':
        return <MemberList members={members} sport={sport} role={role as UserRole} clubId={activeClub?.id} onRefresh={loadMembers} />;
      case 'schedule':
        return <Schedule userId={userId} role={role as UserRole} clubId={activeClub?.id || ''} sport={sport} />
      case 'profile':
        return (
        <Profile
          userId={userId}
          role={role as UserRole}
          profileData={profileData}
          onRefreshProfile={loadProfile}
          members={members}
          club={activeClub}
          onClubAction={loadMemberships}
        />
        );
      default:
        return null;
    }
  };

  const headerAvatarSrc =
    profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.username || 'Grappler'}`;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 3h20" />
                <path d="M5 3v16a2 2 0 0 0 2 2h10" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none uppercase italic">MatTrack</span>
              {activeClub && (
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  {activeClub.custom_id}
                  <svg className={`w-2 h-2 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              )}
            </div>
          </button>

          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 flex justify-between">
                <span>Academies</span>
                <span>{memberships.length} ACTIVE</span>
              </div>

              {memberships.map((m) => {
                const isActive = activeClub?.id === m.club_id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSwitchClub(m)}
                    className={`w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-l-4 ${
                      isActive ? 'bg-indigo-600/10 border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isActive ? 'text-indigo-400' : 'text-white'}`}>{m.clubs.name}</span>
                        {isActive && <span className="text-[7px] bg-indigo-600 text-white px-1 py-0.5 rounded font-black uppercase">Active</span>}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{m.clubs.sport}</span>
                    </div>
                  </button>
                );
              })}

              <div className="border-t border-slate-800 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowJoinModal(true);
                    setIsSwitcherOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[11px] font-black text-indigo-400 hover:bg-indigo-600/10 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <div className="w-5 h-5 bg-indigo-600/20 rounded flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Join/Create Academy
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
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="grid" label="Home" />
          <NavItem
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
            icon="users"
            label={role?.toString().toUpperCase() === 'OWNER' ? 'Roster' : 'Team'}
          />
          <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon="calendar" label="Classes" />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="user" label="Profile" />
        </div>
      </nav>

      {/* SETUP MODAL: Name entry */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-10 rounded-[48px] shadow-2xl space-y-8 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/20 rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Identity Setup</h3>
              <p className="text-slate-500 text-xs font-medium">How should the academy recognize you?</p>
            </div>
            <input
              placeholder="Full Name (e.g. Joe Rogan)"
              className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl text-white font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-600 text-center"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              onClick={handleUpdateName}
              disabled={!newName.trim() || loading}
              className="w-full bg-indigo-600 py-5 rounded-3xl text-white font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
            >
              {loading ? 'Saving...' : 'Set Identity'}
            </button>
          </div>
        </div>
      )}

      {/* JOIN/CREATE MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Academy Hub</h3>
              <button onClick={() => setShowJoinModal(false)} className="p-2 text-slate-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {joinStep === 'SELECT' && (
              <div className="grid grid-cols-1 gap-4 py-4">
                <button onClick={() => setJoinStep('JOIN')} className="p-8 bg-slate-950 border border-slate-800 rounded-[32px] text-left hover:border-indigo-600 transition-all group shadow-inner">
                  <h4 className="text-lg font-black text-white italic uppercase">Join a Team</h4>
                  <p className="text-slate-500 text-xs mt-1">Connect to your existing club using their ID.</p>
                </button>
                <button onClick={() => setJoinStep('CREATE')} className="p-8 bg-slate-950 border border-slate-800 rounded-[32px] text-left hover:border-indigo-600 transition-all group shadow-inner">
                  <h4 className="text-lg font-black text-white italic uppercase">Launch Academy</h4>
                  <p className="text-slate-500 text-xs mt-1">Start your own academy and manage your roster.</p>
                </button>
              </div>
            )}

            {joinStep === 'JOIN' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academy ID</label>
                  <input
                    placeholder="e.g. GRACIE-LDN"
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-3xl text-center text-3xl font-black tracking-widest text-indigo-400 uppercase outline-none"
                    value={joinClubId}
                    onChange={e => setJoinClubId(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setJoinStep('SELECT')} className="flex-1 py-4 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs">
                    Back
                  </button>
                  <button onClick={handleJoinOrCreate} disabled={loading || !joinClubId} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">
                    Connect
                  </button>
                </div>
              </div>
            )}

            {joinStep === 'CREATE' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academy Name</label>
                  <input
                    placeholder="Gracie Jiu-Jitsu London"
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold"
                    value={newClubName}
                    onChange={e => setNewClubName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academy Custom ID</label>
                  <input
                    placeholder="GRACIE-LDN"
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-indigo-400 font-mono text-sm"
                    value={newClubCustomId}
                    onChange={e => setNewClubCustomId(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Sport</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs"
                    value={newClubSport}
                    onChange={e => setNewClubSport(e.target.value as SportType)}
                  >
                    <option value="BJJ">Brazilian Jiu-Jitsu</option>
                    <option value="No-Gi">No-Gi / Grappling</option>
                    <option value="Judo">Judo</option>
                    <option value="Wrestling">Wrestling</option>
                    <option value="Karate">Karate</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setJoinStep('SELECT')} className="flex-1 py-4 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs">
                    Back
                  </button>
                  <button onClick={handleJoinOrCreate} disabled={loading || !newClubName} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">
                    Launch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => {
  const icons: any = {
    grid: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    users: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    calendar: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    user: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
      {icons[icon]}
      <span className="text-[10px] mt-1 font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};

export default App;
