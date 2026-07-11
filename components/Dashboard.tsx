
import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member, Class, Booking, ClubAlert } from '../types';
import { dataService } from '../services/dataService';

interface DashboardProps {
  userId: string;
  role: UserRole;
  sport: SportType;
  members: Member[];
}

const Dashboard: React.FC<DashboardProps> = ({ userId, role, sport, members}) => {
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget);
  const [nextBooking, setNextBooking] = useState<(Booking & { classes: Class }) | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<ClubAlert | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const savedTarget = localStorage.getItem('mt_weekly_target');
    if (savedTarget) setWeeklyTarget(parseInt(savedTarget, 10));

    const savedAttendance = localStorage.getItem('mt_current_attendance');
    if (savedAttendance) setAttendanceCount(parseInt(savedAttendance, 10));

    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    if (userId) {
      const booking = await dataService.getNextBooking(userId);
      setNextBooking(booking);

      const memberships = await dataService.getUserMemberships(userId);
      if (memberships.length > 0) {
        const club = memberships[0].club_id;
        setClubId(club);
        const alerts = await dataService.getAlerts(club);
        if (alerts.length > 0) setActiveAlert(alerts[0]);
      }
    }
  };

  const handlePostAlert = async () => {
    if (!clubId || !broadcastText.trim()) return;
    setPosting(true);
    try {
      await dataService.postAlert(clubId, userId, broadcastText.trim());
      setBroadcastText('');
      const alerts = await dataService.getAlerts(clubId);
      if (alerts.length > 0) setActiveAlert(alerts[0]);
    } catch (err) {
      alert('Failed to post alert.');
    } finally {
      setPosting(false);
    }
  };

  const saveTarget = () => {
    setWeeklyTarget(tempTarget);
    localStorage.setItem('mt_weekly_target', tempTarget.toString());
    setIsEditingTarget(false);
  };

  const handleCheckIn = () => {
    const newCount = attendanceCount + 1;
    setAttendanceCount(newCount);
    localStorage.setItem('mt_current_attendance', newCount.toString());
  };

  const progressPercent = Math.min((attendanceCount / weeklyTarget) * 100, 100);

  return (
    <div className="space-y-6 pb-24">
      {/* High Priority Alert Banner */}
      {activeAlert && (
        <div className="p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg bg-indigo-500/10 border border-indigo-500/30">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 animate-pulse bg-indigo-600 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Coach Broadcast</p>
             <p className="text-sm font-bold text-white leading-tight">{activeAlert.title}</p>
             {activeAlert.body && <p className="text-xs text-slate-400 mt-1">{activeAlert.body}</p>}
          </div>
          <button onClick={() => setActiveAlert(null)} className="p-2 opacity-40 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Hero Welcome */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
        <div className="relative z-10">
          <h2 className="text-3xl font-black italic tracking-tight uppercase leading-none">OSS, {role === UserRole.OWNER ? 'COACH' : 'CHAMP'}!</h2>
          <p className="opacity-80 mt-2 text-sm font-medium">Consistency beats intensity. Every session counts.</p>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleCheckIn}
              className="bg-white text-indigo-600 hover:bg-indigo-50 text-[11px] font-black py-4 px-10 rounded-2xl transition-all uppercase tracking-[0.15em] active:scale-95 shadow-xl shadow-black/10"
            >
              Check-in Session
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
           <svg className="w-32 h-32 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M2 3h20v18H2V3z"/></svg>
        </div>
      </section>

      {/* Owner broadcast composer */}
      {role === UserRole.OWNER && (
        <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-sm space-y-3">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Broadcast to Team</h3>
          <div className="flex gap-2">
            <input
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePostAlert(); }}
              placeholder="e.g. Coach running 10 mins late, sorry!"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            />
            <button
              onClick={handlePostAlert}
              disabled={posting || !broadcastText.trim()}
              className="bg-indigo-600 text-white font-black px-6 rounded-2xl text-[10px] uppercase tracking-widest disabled:opacity-50 shrink-0"
            >
              {posting ? '...' : 'Post'}
            </button>
          </div>
        </section>
      )}

      {/* Your Next Class */}
      {role === UserRole.MEMBER && nextBooking && (
        <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Upcoming Appointment</h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">Confirmed</span>
          </div>
          <div className="flex gap-5">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20 shadow-inner">
              <span className="text-lg font-black text-indigo-400 leading-none">{nextBooking.classes.start_time.split(':')[0]}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{nextBooking.classes.day.substring(0,3)}</span>
            </div>
            <div>
              <h4 className="text-white font-black italic uppercase tracking-tight text-lg">{nextBooking.classes.name}</h4>
              <p className="text-slate-500 text-xs font-medium">with Coach {nextBooking.classes.instructor} • {nextBooking.classes.type}</p>
            </div>
          </div>
        </section>
      )}

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Training Target</p>
              <h3 className="text-white text-xl font-black italic uppercase">Weekly Goal</h3>
            </div>
            <button 
              onClick={() => { setTempTarget(weeklyTarget); setIsEditingTarget(true); }}
              className="bg-slate-800 p-2.5 rounded-2xl text-indigo-400 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          </div>
          
          <div className="flex items-end gap-3 mb-6">
            <h3 className={`text-6xl font-black tracking-tighter leading-none ${attendanceCount >= weeklyTarget ? 'text-emerald-400' : 'text-white'}`}>
              {attendanceCount}
            </h3>
            <div className="pb-2">
              <span className="text-slate-500 font-black text-xs uppercase tracking-widest">/ {weeklyTarget} SESSIONS</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${attendanceCount >= weeklyTarget ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-indigo-600'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                {attendanceCount >= weeklyTarget ? 'Target Achieved! 🔥' : 'Consistency is key'}
              </p>
              <span className="text-[10px] font-black text-indigo-400 px-3 py-1 bg-indigo-600/10 rounded-xl">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          {/* Goal Edit Overlay */}
          {isEditingTarget && (
            <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md z-20 flex flex-col p-8 animate-in fade-in slide-in-from-bottom-8 duration-300">
              <h4 className="text-sm font-black text-white italic uppercase tracking-widest mb-2">Adjust Goal</h4>
              <p className="text-slate-500 text-xs mb-10 leading-relaxed">How many sessions a week do you want to hit? Set a realistic pace.</p>
              
              <div className="flex items-center justify-center gap-10 my-auto">
                <button 
                  onClick={() => setTempTarget(Math.max(1, tempTarget - 1))}
                  className="w-16 h-16 rounded-[24px] bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-3xl text-white hover:bg-slate-700 active:scale-90 transition-all"
                >
                  -
                </button>
                <span className="text-7xl font-black text-white italic tracking-tighter">{tempTarget}</span>
                <button 
                  onClick={() => setTempTarget(tempTarget + 1)}
                  className="w-16 h-16 rounded-[24px] bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-3xl text-white hover:bg-slate-700 active:scale-90 transition-all"
                >
                  +
                </button>
              </div>

              <div className="mt-auto flex gap-3">
                <button 
                  onClick={() => setIsEditingTarget(false)}
                  className="flex-1 bg-slate-800 text-slate-400 font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTarget}
                  className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30"
                >
                  Update Goal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col justify-between shadow-sm">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Lifetime Mats</p>
            <div>
              <h3 className="text-3xl font-black text-white italic">{(members.find(m => m.id === userId)?.totalSessions || 0) + attendanceCount}</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Total Classes</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col justify-between shadow-sm">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Mat Hours</p>
            <div>
              <h3 className="text-3xl font-black text-white italic">{((members.find(m => m.id === userId)?.totalSessions || 0) + attendanceCount) * 1.5}h</h3>
              <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Est. Training</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
