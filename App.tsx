import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member } from './types';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import Schedule from './components/Schedule';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Splash from './components/Splash';
import Avatar from './components/ui/Avatar';
import Icon, { IconName } from './components/ui/Icon';
import Modal from './components/ui/Modal';
import { LogoMark, Wordmark } from './components/ui/Logo';
import { useFeedback } from './components/ui/Feedback';
import { dataService } from './services/dataService';
import { IS_DEMO } from './services/config';

type Tab = 'dashboard' | 'members' | 'schedule' | 'profile';

const SPORT_LABELS: Record<SportType, string> = {
  'BJJ': 'Brazilian Jiu-Jitsu',
  'No-Gi': 'No-Gi Grappling',
  'Judo': 'Judo',
  'Wrestling': 'Wrestling',
  'Karate': 'Karate',
  'Taekwondo': 'Taekwondo',
};

const clubInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('');

const App: React.FC = () => {
  const { toast } = useFeedback();
  const [showSplash, setShowSplash] = useState(!IS_DEMO);
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeClub, setActiveClub] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sport, setSport] = useState<SportType>('BJJ');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const [joinStep, setJoinStep] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [joinClubId, setJoinClubId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [newClubCustomId, setNewClubCustomId] = useState('');
  const [newClubSport, setNewClubSport] = useState<SportType>('BJJ');

  useEffect(() => {
    const unsubscribe = dataService.onAuthStateChange((event, sessionUserId) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setRole(null);
        setActiveClub(null);
        setMemberships([]);
        setProfileData(null);
        setActiveTab('dashboard');
      } else if (sessionUserId) {
        setUserId(sessionUserId);
      }
    });

    checkUser();
    return unsubscribe;
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
    const sessionUserId = await dataService.getSessionUserId();
    if (sessionUserId) {
      setUserId(sessionUserId);
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

  const effectiveRoleFor = (membership: any) => {
    const dbRole = membership.role?.toString().toUpperCase();
    const isLiteralOwner = membership.clubs.owner_id === userId;
    return (dbRole === 'OWNER' || isLiteralOwner) ? UserRole.OWNER : UserRole.MEMBER;
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

        setRole(effectiveRoleFor(currentClubMembership));
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

  const handleSwitchClub = (membership: any) => {
    setActiveClub(membership.clubs);
    setRole(effectiveRoleFor(membership));
    setSport(membership.clubs.sport);
    setIsSwitcherOpen(false);
    toast(`Switched to ${membership.clubs.name}`, 'info');
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newName.trim()) return;
    setSaving(true);
    try {
      await dataService.updateProfile(userId, { username: newName.trim() });
      setShowSetupModal(false);
      await loadProfile();
      toast('Profile saved');
    } catch (err) {
      toast("Couldn't save your name. Please try again.", 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoinStep('SELECT');
    setJoinClubId('');
    setNewClubName('');
    setNewClubCustomId('');
    setNewClubSport('BJJ');
  };

  const handleJoinOrCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      if (joinStep === 'CREATE') {
        const club = await dataService.createClub(userId, newClubName.trim(), newClubCustomId.trim(), newClubSport);
        setActiveClub(club);
        setSport(newClubSport);
        setRole(UserRole.OWNER);
        toast(`${newClubName.trim()} is live`);
      } else {
        const club = await dataService.joinClub(userId, joinClubId.trim());
        setActiveClub(club);
        setRole(UserRole.MEMBER);
        toast('Joined academy');
      }

      await loadMemberships();
      closeJoinModal();
    } catch (err: any) {
      toast(err.message || "Something went wrong. Please try again.", 'error');
    } finally {
      setSaving(false);
    }
  };

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="shell centered gap-5">
        <LogoMark size={48} />
        <div className="spinner sm" aria-label="Loading" />
      </div>
    );
  }

  if (!userId) {
    return <Auth onComplete={checkUser} />;
  }

  const noClubJoined = !activeClub && memberships.length === 0;
  const isOwner = role === UserRole.OWNER;
  const username = profileData?.username || 'Grappler';

  const renderContent = () => {
    if (noClubJoined) {
      return (
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 20, padding: '56px 12px' }}>
          <div className="empty-state-icon" style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-light)', color: 'var(--blue-vivid)' }}>
            <Icon name="building" size={28} />
          </div>
          <div className="col gap-2" style={{ maxWidth: 300 }}>
            <h2 className="page-title" style={{ fontSize: '1.25rem' }}>You're not in an academy yet</h2>
            <p className="muted" style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Join your gym with its academy code, or set up your own to manage classes and members.
            </p>
          </div>
          <button onClick={() => setShowJoinModal(true)} className="btn btn-primary">
            Join or create an academy
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            userId={userId}
            role={role as UserRole}
            sport={sport}
            members={members}
            clubId={activeClub?.id}
            username={username}
            onNavigate={setActiveTab}
          />
        );
      case 'members':
        return <MemberList members={members} sport={sport} role={role as UserRole} clubId={activeClub?.id} currentUserId={userId} onRefresh={loadMembers} />;
      case 'schedule':
        return <Schedule userId={userId} role={role as UserRole} clubId={activeClub?.id || ''} sport={sport} />;
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

  return (
    <div className="shell">
      <header className="nav">
        <div className="relative" style={{ minWidth: 0 }}>
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="club-switch"
            aria-expanded={isSwitcherOpen}
            aria-haspopup="menu"
          >
            <LogoMark size={34} />
            <div className="col" style={{ minWidth: 0 }}>
              <Wordmark />
              {activeClub && (
                <span className="club-switch-name">
                  <span>{activeClub.name}</span>
                  <Icon name="chevronDown" size={14} />
                </span>
              )}
            </div>
          </button>

          {isSwitcherOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setIsSwitcherOpen(false)} />
              <div className="dropdown" role="menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 300, zIndex: 60 }}>
                <div className="dropdown-header">
                  <span>Your academies</span>
                  <span>{memberships.length}</span>
                </div>

                {memberships.map((m) => {
                  const isActive = activeClub?.id === m.club_id;
                  const memberRole = effectiveRoleFor(m);
                  return (
                    <button key={m.id} role="menuitem" onClick={() => handleSwitchClub(m)} className={`dropdown-item ${isActive ? 'active' : ''}`}>
                      <span className="club-tile">{clubInitials(m.clubs.name)}</span>
                      <div className="col flex-1">
                        <span className="truncate" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink-900)' }}>{m.clubs.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-500)', marginTop: 1 }}>
                          {SPORT_LABELS[m.clubs.sport as SportType] ?? m.clubs.sport} · {memberRole === UserRole.OWNER ? 'Owner' : 'Member'}
                        </span>
                      </div>
                      {isActive && <span style={{ color: 'var(--blue-vivid)', display: 'flex' }}><Icon name="check" size={18} /></span>}
                    </button>
                  );
                })}

                <div className="dropdown-divider">
                  <button
                    onClick={() => { setShowJoinModal(true); setIsSwitcherOpen(false); }}
                    className="dropdown-item"
                    style={{ color: 'var(--blue-vivid)', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    <span className="club-tile" style={{ background: 'var(--blue-light)', color: 'var(--blue-vivid)' }}><Icon name="plus" size={18} /></span>
                    Join or create an academy
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => setActiveTab('profile')} className="avatar-btn" aria-label="Open profile">
          <Avatar name={username} src={profileData?.avatar_url} size={36} />
        </button>
      </header>

      <main className="scroll-area">
        <div key={`${activeTab}-${activeClub?.id}`} className="col gap-4 screen-enter">
          {renderContent()}
        </div>
      </main>

      {!noClubJoined && (
        <nav className="tabbar" aria-label="Main">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="home" label="Home" />
          <NavItem active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon="users" label={isOwner ? 'Roster' : 'Team'} />
          <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon="calendar" label="Classes" />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="user" label="Profile" />
        </nav>
      )}

      {showSetupModal && (
        <Modal
          onClose={() => setShowSetupModal(false)}
          onSubmit={handleUpdateName}
          icon="user"
          title="What should we call you?"
          description="This is the name your coach and teammates will see."
        >
          <div>
            <label className="field-label" htmlFor="setup-name">Full name</label>
            <input
              id="setup-name"
              placeholder="e.g. Alex Morgan"
              className="field"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" disabled={!newName.trim() || saving} className="btn btn-primary btn-full">
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </Modal>
      )}

      {showJoinModal && (
        <Modal
          onClose={closeJoinModal}
          onSubmit={joinStep === 'SELECT' ? undefined : handleJoinOrCreate}
          title={joinStep === 'CREATE' ? 'Create an academy' : joinStep === 'JOIN' ? 'Join an academy' : 'Add an academy'}
          description={
            joinStep === 'JOIN' ? 'Ask your coach for the academy code.'
            : joinStep === 'CREATE' ? 'You can invite members once it is set up.'
            : 'Train at more than one gym? You can switch between them any time.'
          }
        >
          {joinStep === 'SELECT' && (
            <div className="col gap-2">
              <JoinOption icon="users" title="Join an existing academy" body="Connect to your gym using its academy code." onClick={() => setJoinStep('JOIN')} />
              <JoinOption icon="building" title="Create a new academy" body="Run your own timetable, roster and announcements." onClick={() => setJoinStep('CREATE')} />
            </div>
          )}

          {joinStep === 'JOIN' && (
            <>
              <div>
                <label className="field-label" htmlFor="join-code">Academy code</label>
                <input
                  id="join-code"
                  placeholder="NORTHSIDE-BJJ"
                  className="field mono"
                  style={{ textTransform: 'uppercase' }}
                  value={joinClubId}
                  onChange={e => setJoinClubId(e.target.value.toUpperCase())}
                  autoFocus
                />
                {IS_DEMO && <p className="field-hint">Demo: try RIVERSIDE-JUDO or create one instead.</p>}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setJoinStep('SELECT')} className="btn btn-ghost">Back</button>
                <button type="submit" disabled={saving || !joinClubId.trim()} className="btn btn-primary">{saving ? 'Joining…' : 'Join'}</button>
              </div>
            </>
          )}

          {joinStep === 'CREATE' && (
            <>
              <div>
                <label className="field-label" htmlFor="club-name">Academy name</label>
                <input id="club-name" placeholder="e.g. Northside Jiu-Jitsu" className="field" value={newClubName} onChange={e => setNewClubName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="field-label" htmlFor="club-code">Academy code</label>
                <input id="club-code" placeholder="NORTHSIDE-BJJ" className="field mono" value={newClubCustomId} onChange={e => setNewClubCustomId(e.target.value.toUpperCase().replace(/\s+/g, '-'))} />
                <p className="field-hint">Members use this code to join. Letters, numbers and dashes.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="club-sport">Discipline</label>
                <select id="club-sport" className="field" value={newClubSport} onChange={e => setNewClubSport(e.target.value as SportType)}>
                  {(Object.keys(SPORT_LABELS) as SportType[]).map(s => (
                    <option key={s} value={s}>{SPORT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setJoinStep('SELECT')} className="btn btn-ghost">Back</button>
                <button type="submit" disabled={saving || !newClubName.trim() || !newClubCustomId.trim()} className="btn btn-primary">{saving ? 'Creating…' : 'Create academy'}</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

const JoinOption: React.FC<{ icon: IconName; title: string; body: string; onClick: () => void }> = ({ icon, title, body, onClick }) => (
  <button type="button" onClick={onClick} className="card card-p row gap-3" style={{ alignItems: 'flex-start' }}>
    <span className="list-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue-vivid)' }}><Icon name={icon} size={18} /></span>
    <span className="col flex-1">
      <span className="card-title">{title}</span>
      <span className="muted" style={{ fontSize: '0.8125rem', marginTop: 2, lineHeight: 1.45 }}>{body}</span>
    </span>
    <span className="chevron" style={{ alignSelf: 'center' }}><Icon name="chevronRight" size={18} /></span>
  </button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: IconName; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`tab ${active ? 'active' : 'inactive'}`} aria-current={active ? 'page' : undefined}>
    <span className="tab-icon-wrap"><Icon name={icon} size={21} strokeWidth={active ? 2.2 : 1.8} /></span>
    <span className="tab-lbl">{label}</span>
  </button>
);

export default App;
