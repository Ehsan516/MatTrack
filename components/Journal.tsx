
import React, { useState, useEffect } from 'react';
import { UserRole, Member, TrainingEvent } from '../types';
import { dataService } from '../services/dataService';

interface JournalProps {
  userId: string;
  role: UserRole;
  isPremium: boolean;
  members: Member[];
  onUpgrade: () => void;
}

const Journal: React.FC<JournalProps> = ({ role, isPremium, members, userId, onUpgrade }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: 'focused' });
  const [events, setEvents] = useState<TrainingEvent[]>([]);

  useEffect(() => {
    if (isPremium) {
      loadProData();
    }
  }, [isPremium]);

  const loadProData = async () => {
    const memberships = await dataService.getUserMemberships(userId);
    if (memberships.length > 0) {
      const evs = await dataService.getEvents(memberships[0].club_id);
      setEvents(evs);
    }
  };

  // Filter members who haven't trained in 2 weeks for Owner Insights
  const atRiskMembers = members.filter(m => {
    if (!m.lastAttendance) return true;
    const last = new Date(m.lastAttendance);
    const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 14;
  });

  const totalAcademySessions = members.reduce((acc, curr) => acc + curr.totalSessions, 0);

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-indigo-600/10 rounded-[40px] flex items-center justify-center text-indigo-500 shadow-xl border border-indigo-500/20 rotate-3">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div className="max-w-xs space-y-3">
          <h2 className="text-3xl font-black italic uppercase text-white tracking-tight leading-none">Enter Pro Mode</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {role === UserRole.OWNER 
              ? "Broadcast live alerts, track academy retention trends, and manage competition prep cycles for your team."
              : "Track prep for upcoming tournaments, maintain a private technical journal, and see lifetime performance stats."}
          </p>
        </div>
        <button 
          onClick={onUpgrade}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 px-14 rounded-[32px] shadow-2xl shadow-indigo-600/40 transition-all active:scale-95 uppercase tracking-[0.2em] text-[11px]"
        >
          Upgrade for £{role === UserRole.OWNER ? '4.99' : '1.99'}/mo
        </button>
      </div>
    );
  }

  if (role === UserRole.OWNER) {
    return (
      <div className="space-y-6 pb-24">
        <header>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">Command Center</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">PRO OWNER SUITE</p>
        </header>

        {/* Pro Feature: Quick Broadcast */}
        <section className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-600/20">
           <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>
              <h3 className="text-sm font-black italic uppercase tracking-widest">Post Live Alert</h3>
           </div>
           <div className="space-y-4">
              <input 
                placeholder="e.g. Coach running 10 mins late, sorry!" 
                className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white placeholder:text-indigo-200 outline-none focus:ring-2 focus:ring-white/50 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    dataService.postAlert(members[0]?.id || '', (e.target as HTMLInputElement).value, 'delay');
                    (e.target as HTMLInputElement).value = '';
                    alert("Alert Broadcasted!");
                  }
                }}
              />
              <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">Press Enter to Broadcast to all members</p>
           </div>
        </section>

        {/* Pro Feature: Retention Heatmap */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-red-400 font-black italic uppercase text-sm tracking-tight leading-none">Mat Attendance Flag</h3>
              <p className="text-slate-500 text-[9px] font-bold uppercase mt-1 tracking-widest">14d+ INACTIVITY</p>
            </div>
            <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">{atRiskMembers.length} Members</span>
          </div>
          <div className="space-y-3">
            {atRiskMembers.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">Everyone is training consistently! 🔥</p>
            ) : (
              atRiskMembers.slice(0, 4).map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-black uppercase text-slate-400 shadow-inner">{m.name[0]}</div>
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{m.name}</span>
                  </div>
                  <button className="text-[10px] text-red-400 font-black uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-all">Reach Out</button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Academy-Wide Stats */}
        <section className="grid grid-cols-1 gap-4">
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-sm">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Academy Mat Hours</p>
              <h4 className="text-4xl font-black text-white italic mt-2 tracking-tighter">{totalAcademySessions * 1.5}h</h4>
              <p className="text-[10px] text-indigo-400 font-bold uppercase mt-2 tracking-widest">Aggregate training time across roster</p>
           </div>
        </section>
      </div>
    );
  }

  // Member Pro View
  const personalSessions = members.find(m => m.id === userId)?.totalSessions || 0;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">Pro Center</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">PERSONAL PERFORMANCE HUB</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all shadow-indigo-600/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
        </button>
      </header>

      {/* Pro: Prep Cycle Tracking */}
      {events.length > 0 && (
        <section className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[32px] p-8 space-y-6 shadow-xl relative overflow-hidden">
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none">Active Prep Cycle</p>
                <h3 className="text-2xl font-black text-white italic uppercase mt-2 tracking-tight">{events[0].title}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Sessions</span>
                <span className="text-xl font-black text-white italic">{events[0].target_sessions}</span>
              </div>
           </div>

           <div className="relative z-10 space-y-3">
              <div className="h-6 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-1">
                 <div 
                   className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                   style={{ width: `${Math.min((personalSessions / events[0].target_sessions) * 100, 100)}%` }}
                 ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {personalSessions >= events[0].target_sessions ? "BATTLE READY! 🔥" : "KEEP GRINDING"}
                </p>
                <p className="text-[10px] font-black uppercase text-indigo-400">
                  {personalSessions} / {events[0].target_sessions} DONE
                </p>
              </div>
           </div>
           <div className="absolute bottom-[-10%] right-[-5%] opacity-5 rotate-12 scale-150">
             <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l1.912 5.886L20 10l-5.088 1.114L13 17l-1.912-5.886L6 10l5.088-1.114L12 3z"/></svg>
           </div>
        </section>
      )}

      {/* Technical Journal Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest italic ml-1">Private Technique Diary</h3>
        {showAdd && (
          <div className="bg-slate-900 border-2 border-indigo-600 rounded-[32px] p-8 space-y-6 animate-in slide-in-from-top-6 shadow-2xl">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Focus</label>
                <input placeholder="e.g. Inverted Guard Defense" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-600" value={newEntry.title} onChange={e => setNewEntry({...newEntry, title: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Details</label>
                <textarea placeholder="Write down the steps and feeling..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white h-40 resize-none font-medium text-sm leading-relaxed" value={newEntry.content} onChange={e => setNewEntry({...newEntry, content: e.target.value})} />
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-slate-800 text-slate-500 py-4 rounded-2xl uppercase font-black text-[11px] tracking-widest transition-all hover:bg-slate-700">Cancel</button>
                <button onClick={() => { setEntries([newEntry, ...entries]); setShowAdd(false); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl uppercase font-black text-[11px] tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95">Save Entry</button>
             </div>
          </div>
        )}

        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-[40px]">
               <p className="text-slate-500 font-black italic uppercase text-[10px] tracking-widest leading-relaxed px-8">Journal is empty. Log your techniques to master them faster.</p>
            </div>
          ) : (
            entries.map((e, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-4 shadow-sm hover:border-slate-700 transition-all group">
                <div className="flex justify-between items-start">
                   <h4 className="text-white font-black uppercase italic tracking-tight text-lg">{e.title}</h4>
                   <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-600/10 px-2 py-1 rounded-lg">TECHNICAL LOG</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{e.content}</p>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Just Logged</span>
                  <button className="text-[9px] text-slate-500 hover:text-red-500 font-black uppercase tracking-widest">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Journal;
