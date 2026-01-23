
import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member } from '../types';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface DashboardProps {
  role: UserRole;
  sport: SportType;
  members: Member[];
  isPremium: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ role, sport, members, isPremium }) => {
  // Weekly Target State
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => {
    const saved = localStorage.getItem('mt_weekly_target');
    return saved ? parseInt(saved, 10) : 3;
  });

  // Current Attendance State (Simulated for the week)
  const [attendanceCount, setAttendanceCount] = useState<number>(() => {
    const saved = localStorage.getItem('mt_current_attendance');
    // In a real app, logic would reset this if the week has changed
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget);

  const progressPercent = Math.min((attendanceCount / weeklyTarget) * 100, 100);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mt_weekly_target', weeklyTarget.toString());
  }, [weeklyTarget]);

  useEffect(() => {
    localStorage.setItem('mt_current_attendance', attendanceCount.toString());
  }, [attendanceCount]);

  const saveTarget = () => {
    setWeeklyTarget(tempTarget);
    setIsEditingTarget(false);
  };

  const handleCheckIn = () => {
    setAttendanceCount(prev => prev + 1);
  };

  const data = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 24 },
    { name: 'Fri', count: 11 },
    { name: 'Sat', count: 32 },
    { name: 'Sun', count: 8 },
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
              Check In
            </button>
            {role === UserRole.OWNER && (
              <button className="bg-indigo-500/30 backdrop-blur-md border border-white/20 text-white text-xs font-black py-3 px-8 rounded-2xl transition-all uppercase tracking-widest active:scale-95">
                New Class
              </button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M2 3h20v18H2V3z"/></svg>
        </div>
      </section>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Target Card */}
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
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Academy Rank</p>
            <div>
              <h3 className="text-2xl font-black text-white">#12</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Top 10% this month</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mat Hours</p>
            <div>
              <h3 className="text-2xl font-black text-white">{attendanceCount * 1.5}h</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total week time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <section className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest italic text-white">Academy Attendance</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Peak times at your club</p>
          </div>
          {!isPremium && (
             <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/></svg>
                <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Upgrade</span>
             </div>
          )}
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={10} />
              <Tooltip 
                cursor={{fill: '#1e293b', radius: 4}} 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontWeight: 800, fontSize: '12px'}}
              />
              <Bar dataKey="count" radius={[6, 6, 6, 6]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={isPremium ? '#6366f1' : '#1e293b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
