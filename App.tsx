
import React, { useState } from 'react';
import { UserRole, SportType, Member } from './types';
import { MOCK_MEMBERS } from './constants';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import AICoach from './components/AICoach';
import Schedule from './components/Schedule';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | 'ADMIN' | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sport, setSport] = useState<SportType>('BJJ');
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [isPremium, setIsPremium] = useState(false);

  const handleAuthComplete = (data: { role: UserRole | 'ADMIN'; clubId: string; isPremium: boolean }) => {
    setRole(data.role);
    setClubId(data.clubId);
    setIsPremium(data.isPremium);
  };

  const handleUpgrade = () => {
    setIsPremium(true);
    setActiveTab('coach');
  };

  if (!role) {
    return <Auth onComplete={handleAuthComplete} />;
  }

  const renderContent = () => {
    if (role === 'ADMIN') return <AdminDashboard />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard role={role as UserRole} sport={sport} members={members} isPremium={isPremium || role === UserRole.OWNER} />;
      case 'members': return <MemberList members={members} sport={sport} role={role as UserRole} />;
      case 'coach': return <AICoach sport={sport} role={role as UserRole} isPremium={isPremium || role === UserRole.OWNER} onUpgrade={handleUpgrade} />;
      case 'schedule': return <Schedule role={role as string} />;
      case 'profile': return <Profile role={role as UserRole} isPremium={isPremium || role === UserRole.OWNER} onUpgrade={handleUpgrade} />;
      default: return <Dashboard role={role as UserRole} sport={sport} members={members} isPremium={isPremium || role === UserRole.OWNER} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-none">MatTrack</span>
            {clubId && role !== 'ADMIN' && <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{clubId}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role !== 'ADMIN' && (
            <select 
              value={sport} 
              onChange={(e) => setSport(e.target.value as SportType)}
              className="bg-slate-800 border-none rounded-lg text-xs font-medium py-1.5 px-3 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="BJJ">BJJ</option>
              <option value="Judo">Judo</option>
              <option value="Wrestling">Wrestling</option>
              <option value="No-Gi">No-Gi</option>
            </select>
          )}
          <button 
            onClick={() => setRole(null)}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role === 'ADMIN' ? 'Admin' : role === UserRole.OWNER ? 'Master' : 'Student'}`} alt="profile" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          <NavItem active={activeTab === 'dashboard' && role !== 'ADMIN'} onClick={() => { setActiveTab('dashboard'); if(role === 'ADMIN') setRole(UserRole.OWNER); }} icon="grid" label="Home" />
          <NavItem active={activeTab === 'members'} onClick={() => { setActiveTab('members'); if(role === 'ADMIN') setRole(UserRole.OWNER); }} icon="users" label={role === UserRole.OWNER ? 'Roster' : 'Team'} />
          <NavItem active={activeTab === 'schedule'} onClick={() => { setActiveTab('schedule'); if(role === 'ADMIN') setRole(UserRole.OWNER); }} icon="calendar" label="Classes" />
          <NavItem active={activeTab === 'coach'} onClick={() => { setActiveTab('coach'); if(role === 'ADMIN') setRole(UserRole.OWNER); }} icon="sparkles" label="AI Coach" isPremiumIndicator={!isPremium && role !== UserRole.OWNER && role !== 'ADMIN'} />
          <NavItem active={activeTab === 'profile' || role === 'ADMIN'} onClick={() => setActiveTab('profile')} icon="user" label={role === 'ADMIN' ? 'Admin' : 'Profile'} />
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
