
import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member, Class, Booking } from '../types';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { dataService } from '../services/dataService';

interface DashboardProps {
  userId: string;
  role: UserRole;
  sport: SportType;
  members: Member[];
  isPremium: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, role, sport, members, isPremium }) => {
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget);
  const [nextBooking, setNextBooking] = useState<(Booking & { classes: Class }) | null>(null);

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

  const data = [
    { name: 'Mon', count: 0 },
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black italic tracking-tight">OSS, {role === UserRole.OWNER ? 'COACH' : 'CHAMP'}!</h2>
          <p className="opacity-80 mt-1 text-sm font-medium">Ready for another session?</p>
          <div className="mt-6 flex gap-3">
            <button 
              onClick={handleCheckIn}
              className="bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-black py-3 px-8 rounded-2xl transition-all uppercase tracking-widest active:scale-95 shadow-lg shadow-black/10"
            >
              Quick Check-in
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M2 3h20v18H2V3z"/></svg>
        </div>
      </section>

      {/* Your Next Class (Dynamic) */}
      {role === UserRole.MEMBER && nextBooking && (
        <section className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 shadow-lg shadow-indigo-500/5 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">Your Next Class</h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">Booked</span>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20">
              <span className="text-xs font-black text-indigo-400 leading-none">{nextBooking.classes.time.split(':')[0]}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase">{nextBooking.classes.day.substring(0,3)}</span>
            </div>
            <div>
              <h4 className="text-white font-black italic uppercase tracking-tight">{nextBooking.classes.name}</h4>
              <p className="text-slate-500 text-[11px] font-medium">with {nextBooking.classes.instructor} • {nextBooking.classes.type}</p>
            </div>
          </div>
        </section>
      )}

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Training Goal</p>
              <h3 className="text-white text-lg font-bold italic">Weekly Target</h3>
            </div>
            <button 
              onClick={() => { setTempTarget(weeklyTarget); setIsEditingTarget(true); }}
              className="bg-slate-800 p-2 rounded-xl text-indigo-400 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          </div>
          
          <div className="flex items-end gap-2 mb-4">
            <h3 className={`text-5xl font-black tracking-tighter ${attendanceCount >= weeklyTarget ? 'text-emerald-400' : 'text-white'}`}>
              {attendanceCount}
            </h3>
            <div className="pb-1.5">
              <span className="text-slate-500 font-black text-sm uppercase">/ {weeklyTarget} Sessions</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className={`h-full transition-all duration-700 ease-out rounded-full ${attendanceCount >= weeklyTarget ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-indigo-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                {attendanceCount >= weeklyTarget ? 'Target Achieved! 🔥' : 'Keep pushing'}
              </p>
              <span className="text-[10px] font-black text-white px-2 py-0.5 bg-slate-800 rounded-lg">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          {/* Goal Edit Overlay */}
          {isEditingTarget && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <h4 className="text-sm font-black text-white italic uppercase tracking-widest mb-2">Adjust Target</h4>
              <p className="text-slate-500 text-xs mb-8">How many classes per week is your goal?</p>
              
              <div className="flex items-center justify-center gap-8 my-auto">
                <button 
                  onClick={() => setTempTarget(Math.max(1, tempTarget - 1))}
                  className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-2xl text-white hover:bg-slate-700 active:scale-90"
                >
                  -
                </button>
                <span className="text-6xl font-black text-white italic">{tempTarget}</span>
                <button 
                  onClick={() => setTempTarget(tempTarget + 1)}
                  className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-2xl text-white hover:bg-slate-700 active:scale-90"
                >
                  +
                </button>
              </div>

              <div className="mt-auto flex gap-3">
                <button 
                  onClick={() => setIsEditingTarget(false)}
                  className="flex-1 bg-slate-800 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTarget}
                  className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20"
                >
                  Set as Default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Roster</p>
            <div>
              <h3 className="text-2xl font-black text-white">{members.length}</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Total Members</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Mat Time</p>
            <div>
              <h3 className="text-2xl font-black text-white">{attendanceCount * 1.5}h</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">This week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics (Locked if not premium) */}
      <section className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest italic text-white">Academy Activity</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Usage analytics across the gym</p>
          </div>
          {!isPremium && (
             <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/></svg>
                <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Premium Only</span>
             </div>
          )}
        </div>
        <div className="h-48 w-full opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={10} />
              <Bar dataKey="count" fill="#1e293b" radius={[6, 6, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
