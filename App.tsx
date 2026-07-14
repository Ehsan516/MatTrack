import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member } from './types';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import Schedule from './components/Schedule';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';
import Splash from './components/Splash';
import { dataService } from './services/dataService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
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
      await loadProfile();
      await loadMemberships();
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

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="shell" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="spinner" />
        <p className="section-lbl">Entering Dojo…</p>
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
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 24, padding: '64px 8px' }}>
          <div className="modal-icon blue" style={{ width: 88, height: 88, borderRadius: 28 }}>
            <svg className="w-10 h-10" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div className="col gap-2" style={{ maxWidth: 260 }}>
            <h2 className="modal-title">No Academy Joined</h2>
            <p className="modal-desc" style={{ marginBottom: 0 }}>Join an existing team or launch your own academy to start tracking your progress.</p>
          </div>
          <button onClick={() => setShowJoinModal(true)} className="btn btn-primary">
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
    <div className="shell">
      <header className="nav">
        <div className="relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="row gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-vivid)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--btn-shadow)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M2 3h20" />
                <path d="M5 3v16a2 2 0 0 0 2 2h10" />
              </svg>
            </div>
            <div className="col">
              <span className="nav-wordmark">Mat<span>Track</span></span>
              {activeClub && (
                <span className="row gap-1" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--blue-vivid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeClub.custom_id}
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ transition: 'transform 0.15s ease', transform: isSwitcherOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              )}
            </div>
          </button>

          {isSwitcherOpen && (
            <div className="dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 288, zIndex: 60 }}>
              <div className="dropdown-header">
                <span>Academies</span>
                <span>{memberships.length} ACTIVE</span>
              </div>

              {memberships.map((m) => {
                const isActive = activeClub?.id === m.club_id;
                return (
                  <button key={m.id} onClick={() => handleSwitchClub(m)} className={`dropdown-item ${isActive ? 'active' : ''}`}>
                    <div className="col">
                      <span className="row gap-2">
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: isActive ? 'var(--blue-vivid)' : 'var(--ink-900)' }}>{m.clubs.name}</span>
                        {isActive && <span className="badge blue">Active</span>}
                      </span>
                      <span className="member-sub">{m.clubs.sport}</span>
                    </div>
                  </button>
                );
              })}

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => { setShowJoinModal(true); setIsSwitcherOpen(false); }}
                  className="dropdown-item"
                  style={{ color: 'var(--blue-vivid)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  + Join/Create Academy
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setActiveTab('profile')} className="avatar-btn">
          <img src={headerAvatarSrc} alt="profile" />
        </button>
      </header>

      <main className="scroll-area">
        {renderContent()}
      </main>

      <nav className="tabbar">
        <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="grid" label="Home" />
        <NavItem
          active={activeTab === 'members'}
          onClick={() => setActiveTab('members')}
          icon="users"
          label={role?.toString().toUpperCase() === 'OWNER' ? 'Roster' : 'Team'}
        />
        <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon="calendar" label="Classes" />
        <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="user" label="Profile" />
      </nav>

      {showSetupModal && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-top">
              <div className="modal-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="modal-title">Identity Setup</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-500)', marginTop: 4 }}>How should the academy recognize you?</p>
            </div>
            <div className="modal-body col gap-3">
              <input
                placeholder="Full Name (e.g. Joe Rogan)"
                className="field"
                style={{ textAlign: 'center' }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <button
                onClick={handleUpdateName}
                disabled={!newName.trim() || loading}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Saving...' : 'Set Identity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <div className="row sb">
                <h3 className="modal-title" style={{ fontSize: '1.0625rem' }}>Academy Hub</h3>
                <button onClick={() => setShowJoinModal(false)} className="btn-icon" style={{ background: 'none', border: 'none', boxShadow: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {joinStep === 'SELECT' && (
                <div className="col gap-3">
                  <button onClick={() => setJoinStep('JOIN')} className="card card-p" style={{ textAlign: 'left', cursor: 'pointer', border: 'none' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink-900)' }}>Join a Team</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: 4 }}>Connect to your existing club using their ID.</p>
                  </button>
                  <button onClick={() => setJoinStep('CREATE')} className="card card-p" style={{ textAlign: 'left', cursor: 'pointer', border: 'none' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink-900)' }}>Launch Academy</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: 4 }}>Start your own academy and manage your roster.</p>
                  </button>
                </div>
              )}

              {joinStep === 'JOIN' && (
                <div className="col gap-4">
                  <div>
                    <label className="field-label">Academy ID</label>
                    <input
                      placeholder="e.g. GRACIE-LDN"
                      className="field"
                      style={{ textAlign: 'center', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--blue-vivid)', textTransform: 'uppercase', height: 60 }}
                      value={joinClubId}
                      onChange={e => setJoinClubId(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="row gap-2">
                    <button onClick={() => setJoinStep('SELECT')} className="btn btn-ghost flex-1">Back</button>
                    <button onClick={handleJoinOrCreate} disabled={loading || !joinClubId} className="btn btn-primary flex-1">Connect</button>
                  </div>
                </div>
              )}

              {joinStep === 'CREATE' && (
                <div className="col gap-3">
                  <div>
                    <label className="field-label">Academy Name</label>
                    <input placeholder="Gracie Jiu-Jitsu London" className="field" value={newClubName} onChange={e => setNewClubName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Academy Custom ID</label>
                    <input placeholder="GRACIE-LDN" className="field" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--blue-vivid)' }} value={newClubCustomId} onChange={e => setNewClubCustomId(e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="field-label">Primary Sport</label>
                    <select className="field" value={newClubSport} onChange={e => setNewClubSport(e.target.value as SportType)}>
                      <option value="BJJ">Brazilian Jiu-Jitsu</option>
                      <option value="No-Gi">No-Gi / Grappling</option>
                      <option value="Judo">Judo</option>
                      <option value="Wrestling">Wrestling</option>
                      <option value="Karate">Karate</option>
                    </select>
                  </div>
                  <div className="row gap-2" style={{ paddingTop: 8 }}>
                    <button onClick={() => setJoinStep('SELECT')} className="btn btn-ghost flex-1">Back</button>
                    <button onClick={handleJoinOrCreate} disabled={loading || !newClubName} className="btn btn-primary flex-1">Launch</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => {
  const icons: any = {
    grid: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    users: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    calendar: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    user: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return (
    <button onClick={onClick} className={`tab ${active ? 'active' : 'inactive'}`}>
      <div className="tab-icon-wrap">{icons[icon]}</div>
      <span className="tab-lbl">{label}</span>
    </button>
  );
};

export default App;
