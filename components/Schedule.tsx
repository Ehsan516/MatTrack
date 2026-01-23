
import React, { useState, useEffect } from 'react';
import { ClassRecap } from '../types';
import { dataService } from '../services/dataService';

const Schedule: React.FC<{ role: string }> = ({ role }) => {
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [isAddingRecap, setIsAddingRecap] = useState(false);
  
  // Form State for New Recap
  const [newRecap, setNewRecap] = useState({
    className: '',
    instructor: 'Coach Marcus',
    type: 'Gi' as 'Gi' | 'No-Gi',
    techniques: '',
    notes: ''
  });

  useEffect(() => {
    loadRecaps();
  }, []);

  const loadRecaps = async () => {
    const data = await dataService.getRecaps();
    setRecaps(data);
  };

  const handleSaveRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataService.saveRecap({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      className: newRecap.className,
      instructor: newRecap.instructor,
      type: newRecap.type,
      techniques: newRecap.techniques.split(',').map(t => t.trim()),
      notes: newRecap.notes
    });
    setNewRecap({ className: '', instructor: 'Coach Marcus', type: 'Gi', techniques: '', notes: '' });
    setIsAddingRecap(false);
    loadRecaps();
  };

  const classes = [
    { time: '07:00 AM', name: 'Early Bird BJJ', instructor: 'Dave S.', type: 'Gi', intensity: 'High' },
    { time: '12:00 PM', name: 'Lunchtime No-Gi', instructor: 'Sarah M.', type: 'No-Gi', intensity: 'Medium' },
    { time: '06:45 PM', name: 'Advanced Sparring', instructor: 'Marcus A.', type: 'Gi', intensity: 'Extreme' },
  ];

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase leading-none">
            {view === 'upcoming' ? "Schedule" : "Technique Log"}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
            {view === 'upcoming' ? 'Oct 24 • 3 Classes Today' : 'Academy Knowledge Base'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1">
          <button onClick={() => setView('upcoming')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Upcoming</button>
          <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Recaps</button>
        </div>
      </div>

      {view === 'upcoming' ? (
        <div className="space-y-4">
          {classes.map((c, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex gap-4 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm">
              <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-800 pr-4">
                <span className="text-lg font-black text-white italic tracking-tighter">{c.time.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{c.time.split(' ')[1]}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic text-sm tracking-tight">{c.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase ${c.type === 'Gi' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>{c.type}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Instructor: {c.instructor}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">8 / 20 booked</span>
                  </div>
                </div>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black py-2.5 px-6 rounded-xl transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-indigo-600/10 self-center">Book</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          {role === 'OWNER' && !isAddingRecap && (
            <button 
              onClick={() => setIsAddingRecap(true)}
              className="w-full bg-indigo-600/10 border border-indigo-500/30 border-dashed py-4 rounded-3xl text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600/20 transition-all"
            >
              + Log Today's Techniques
            </button>
          )}

          {isAddingRecap && (
            <form onSubmit={handleSaveRecap} className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 space-y-4 shadow-xl shadow-indigo-500/5">
              <h3 className="text-white font-black italic uppercase text-sm tracking-widest">Add Class Recap</h3>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Class Name (e.g. Fundamentals)" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={newRecap.className} onChange={e => setNewRecap({...newRecap, className: e.target.value})} />
                <select className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newRecap.type} onChange={e => setNewRecap({...newRecap, type: e.target.value as any})}>
                  <option value="Gi">Gi</option>
                  <option value="No-Gi">No-Gi</option>
                </select>
              </div>
              <input required placeholder="Techniques (comma separated: Armbar, Triangle...)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={newRecap.techniques} onChange={e => setNewRecap({...newRecap, techniques: e.target.value})} />
              <textarea placeholder="Instructor notes or specific details..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 h-24" value={newRecap.notes} onChange={e => setNewRecap({...newRecap, notes: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingRecap(false)} className="flex-1 bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-600/20">Save to History</button>
              </div>
            </form>
          )}

          {recaps.map((recap) => (
            <div key={recap.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">{recap.type}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase">{recap.date}</span>
                  </div>
                  <h3 className="text-white font-black italic text-lg uppercase tracking-tight">{recap.className}</h3>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {recap.techniques.map((tech, idx) => (
                  <span key={idx} className="bg-slate-800 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight">{tech}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
