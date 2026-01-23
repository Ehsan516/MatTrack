
import React, { useState, useEffect } from 'react';
import { ClassRecap, UserRole, Class } from '../types';
import { dataService } from '../services/dataService';

const Schedule: React.FC<{ role: UserRole, clubId: string, userId: string }> = ({ role, clubId, userId }) => {
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  const [classes, setClasses] = useState<Class[]>([]);
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [isAddingRecap, setIsAddingRecap] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  
  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    day: 'Monday',
    time: '18:00',
    type: 'Gi' as 'Gi' | 'No-Gi'
  });

  const [newRecap, setNewRecap] = useState({
    className: '',
    instructor: '',
    type: 'Gi' as 'Gi' | 'No-Gi',
    techniques: '',
    notes: ''
  });

  useEffect(() => {
    if (clubId) {
      loadSchedule();
      loadRecaps();
    }
  }, [clubId]);

  const loadSchedule = async () => {
    setLoading(true);
    const data = await dataService.getClasses(clubId);
    setClasses(data);
    setLoading(false);
  };

  const loadRecaps = async () => {
    const data = await dataService.getRecaps(clubId);
    setRecaps(data);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dataService.createClass(clubId, newClass);
      setIsAddingClass(false);
      setNewClass({ name: '', instructor: '', day: 'Monday', time: '18:00', type: 'Gi' });
      await loadSchedule();
    } catch (err) {
      alert("Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (classId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      await dataService.bookClass(userId, classId);
      setBookingStatus("Class booked successfully!");
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err) {
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dataService.saveRecap(clubId, {
        className: newRecap.className,
        instructor: newRecap.instructor,
        type: newRecap.type,
        techniques: newRecap.techniques.split(',').map(t => t.trim()),
        notes: newRecap.notes
      });
      setNewRecap({ className: '', instructor: '', type: 'Gi', techniques: '', notes: '' });
      setIsAddingRecap(false);
      await loadRecaps();
    } catch (err) {
      alert("Failed to save recap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase leading-none">
            {view === 'upcoming' ? "Schedule" : "Technique Log"}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
            {view === 'upcoming' ? `${classes.length} Classes Available` : 'Academy Knowledge Base'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1">
          <button onClick={() => setView('upcoming')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Upcoming</button>
          <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Recaps</button>
        </div>
      </div>

      {bookingStatus && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-2xl text-xs font-black uppercase text-center animate-in zoom-in-95">
          {bookingStatus}
        </div>
      )}

      {view === 'upcoming' ? (
        <div className="space-y-4">
          {role === UserRole.OWNER && !isAddingClass && (
            <button 
              onClick={() => setIsAddingClass(true)}
              className="w-full bg-indigo-600/10 border border-indigo-500/30 border-dashed py-4 rounded-3xl text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600/20 transition-all"
            >
              + Create New Class
            </button>
          )}

          {isAddingClass && (
            <form onSubmit={handleCreateClass} className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-white font-black italic uppercase text-sm tracking-widest">New Academy Class</h3>
              <div className="grid grid-cols-1 gap-4">
                <input required placeholder="Class Name (e.g. Fundamentals)" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                <input required placeholder="Instructor Name" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newClass.instructor} onChange={e => setNewClass({...newClass, instructor: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newClass.day} onChange={e => setNewClass({...newClass, day: e.target.value})}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} />
                </div>
                <select className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newClass.type} onChange={e => setNewClass({...newClass, type: e.target.value as any})}>
                  <option value="Gi">Gi</option>
                  <option value="No-Gi">No-Gi</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingClass(false)} className="flex-1 bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase text-white">Save Class</button>
              </div>
            </form>
          )}

          {classes.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-black italic uppercase text-xs">No classes scheduled</p>
            </div>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex gap-4 hover:border-indigo-500/50 transition-all group shadow-sm">
                <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-800 pr-4">
                  <span className="text-lg font-black text-white italic tracking-tighter leading-none">{c.time}</span>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{c.day.substring(0,3)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white uppercase italic text-sm tracking-tight">{c.name}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase ${c.type === 'Gi' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>{c.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-bold italic uppercase tracking-tighter">Instructor: {c.instructor}</p>
                </div>
                {role === UserRole.MEMBER && (
                  <button 
                    onClick={() => handleBook(c.id)}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black py-2.5 px-6 rounded-xl transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-indigo-600/10 self-center"
                  >
                    Book
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          {role === UserRole.OWNER && !isAddingRecap && (
            <button 
              onClick={() => setIsAddingRecap(true)}
              className="w-full bg-indigo-600/10 border border-indigo-500/30 border-dashed py-4 rounded-3xl text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600/20 transition-all"
            >
              + Log Today's Techniques
            </button>
          )}

          {isAddingRecap && (
            <form onSubmit={handleSaveRecap} className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-white font-black italic uppercase text-sm tracking-widest">Add Class Recap</h3>
              <div className="grid grid-cols-1 gap-4">
                <input required placeholder="Class Name" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newRecap.className} onChange={e => setNewRecap({...newRecap, className: e.target.value})} />
                <input required placeholder="Instructor Name" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newRecap.instructor} onChange={e => setNewRecap({...newRecap, instructor: e.target.value})} />
                <select className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newRecap.type} onChange={e => setNewRecap({...newRecap, type: e.target.value as any})}>
                  <option value="Gi">Gi</option>
                  <option value="No-Gi">No-Gi</option>
                </select>
              </div>
              <input required placeholder="Techniques (comma separated)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={newRecap.techniques} onChange={e => setNewRecap({...newRecap, techniques: e.target.value})} />
              <textarea placeholder="Notes..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none h-24" value={newRecap.notes} onChange={e => setNewRecap({...newRecap, notes: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingRecap(false)} className="flex-1 bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase text-white shadow-lg disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Recap'}
                </button>
              </div>
            </form>
          )}

          {recaps.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-black italic uppercase text-xs">No technique logs yet</p>
            </div>
          ) : (
            recaps.map((recap) => (
              <div key={recap.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">{recap.type}</span>
                      <span className="text-slate-500 text-[10px] font-bold uppercase">{recap.date}</span>
                    </div>
                    <h3 className="text-white font-black italic text-lg uppercase tracking-tight">{recap.className}</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recap.techniques.map((tech, idx) => (
                    <span key={idx} className="bg-slate-800 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight">{tech}</span>
                  ))}
                </div>
                {recap.notes && <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">"{recap.notes}"</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Schedule;
