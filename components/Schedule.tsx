
import React, { useState, useEffect } from 'react';
import { ClassRecap, UserRole, Class, Member, SportType } from '../types';
import { dataService } from '../services/dataService';
import { SPORT_RANKS } from '../constants';

const Schedule: React.FC<{ role: UserRole, clubId: string, userId: string, sport: SportType }> = ({ role, clubId, userId, sport }) => {
  const [view, setView] = useState<'upcoming' | 'history' | 'recaps'>('upcoming');
  const [classes, setClasses] = useState<Class[]>([]);
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [classBookingCounts, setClassBookingCounts] = useState<Record<string, number>>({});
  const [isAddingRecap, setIsAddingRecap] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState<Class | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [showFullClassPopup, setShowFullClassPopup] = useState(false);
  
  // Attendee Modal State
  const [attendeeModalData, setAttendeeModalData] = useState<{classObj: Class, date: string, members: Member[]} | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeRankFilter, setAttendeeRankFilter] = useState('All');

  // History State
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Robust Role Check (Handles case sensitivity from DB)
  const isOwner = role?.toString().toUpperCase() === 'OWNER';

  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    day: 'Monday',
    time: '18:00',
    type: 'Gi' as 'Gi' | 'No-Gi',
    capacity: 0
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
    try {
      const data = await dataService.getClasses(clubId);
      setClasses(data);
      
      const counts: Record<string, number> = {};
      const today = new Date().toISOString().split('T')[0];
      for (const c of data) {
        counts[c.id] = await dataService.getBookingCount(c.id, today);
      }
      setClassBookingCounts(counts);
    } catch (err) {
      console.error("Schedule load error", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecaps = async () => {
    const data = await dataService.getRecaps(clubId);
    setRecaps(data);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingClass) {
        await dataService.updateClass(isEditingClass.id, {
          name: newClass.name,
          instructor: newClass.instructor,
          day: newClass.day,
          time: newClass.time,
          type: newClass.type,
          capacity: newClass.capacity > 0 ? newClass.capacity : undefined
        });
        setIsEditingClass(null);
      } else {
        await dataService.createClass(clubId, {
          ...newClass,
          capacity: newClass.capacity > 0 ? newClass.capacity : undefined
        });
      }
      setIsAddingClass(false);
      setNewClass({ name: '', instructor: '', day: 'Monday', time: '18:00', type: 'Gi', capacity: 0 });
      await loadSchedule();
    } catch (err) {
      alert("Failed to save class. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const startEditClass = (c: Class) => {
    setNewClass({
      name: c.name,
      instructor: c.instructor,
      day: c.day,
      time: c.time,
      type: c.type,
      capacity: c.capacity || 0
    });
    setIsEditingClass(c);
    setIsAddingClass(true);
  };

  const handleBook = async (classObj: Class) => {
    if (!userId) return;
    setLoading(true);
    const dateStr = new Date().toISOString().split('T')[0];
    try {
      await dataService.bookClass(userId, classObj.id, dateStr);
      setBookingStatus("Class booked successfully!");
      await loadSchedule();
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err: any) {
      if (err.message === "FULL") {
        setShowFullClassPopup(true);
      } else {
        alert(err.message || "Booking failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const showAttendees = async (classObj: Class, date?: string) => {
    const d = date || new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      const attendees = await dataService.getClassAttendees(classObj.id, d);
      setAttendeeModalData({ classObj, date: d, members: attendees });
    } catch (err) {
      alert("Could not load attendees.");
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

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long' });
  };

  const getRankColor = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('white')) return 'bg-slate-100 text-slate-900';
    if (r.includes('yellow')) return 'bg-yellow-400 text-slate-900';
    if (r.includes('orange')) return 'bg-orange-500 text-white';
    if (r.includes('green')) return 'bg-emerald-600 text-white';
    if (r.includes('blue')) return 'bg-blue-600 text-white';
    if (r.includes('purple')) return 'bg-purple-600 text-white';
    if (r.includes('brown')) return 'bg-amber-900 text-white';
    if (r.includes('black')) return 'bg-slate-950 text-white border border-slate-800';
    return 'bg-indigo-600 text-white';
  };

  const filteredAttendees = attendeeModalData?.members.filter(m => 
    m.name.toLowerCase().includes(attendeeSearch.toLowerCase()) &&
    (attendeeRankFilter === 'All' || m.rank === attendeeRankFilter)
  ) || [];

  const currentRanks = SPORT_RANKS[sport]?.ranks || [];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header with quick creation button for owners */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase leading-none">
            {view === 'upcoming' ? "Academy Schedule" : view === 'history' ? "Past Week" : "Technique Log"}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
            {view === 'upcoming' ? `RECURRING: ${classes.length} MASTER SESSIONS` : view === 'history' ? 'SESSION HISTORY' : 'ACADEMY KNOWLEDGE BASE'}
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          {isOwner && view === 'upcoming' && classes.length > 0 && (
             <button 
              onClick={() => { setIsEditingClass(null); setIsAddingClass(true); }}
              className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all"
              title="Add New Session"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
            </button>
          )}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1 flex-1 sm:flex-none shadow-inner">
            <button onClick={() => setView('upcoming')} className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Weekly</button>
            <button onClick={() => setView('history')} className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>History</button>
            <button onClick={() => setView('recaps')} className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'recaps' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Recaps</button>
          </div>
        </div>
      </div>

      {bookingStatus && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-3xl text-xs font-black uppercase text-center animate-in zoom-in-95">
          {bookingStatus}
        </div>
      )}

      {view === 'upcoming' ? (
        <div className="space-y-4">
          {/* Create Class Form (Visible when owner clicks button) */}
          {isAddingClass && (
            <div className="animate-in slide-in-from-top-4 duration-300 z-50">
              <form onSubmit={handleCreateClass} className="bg-slate-900 border-2 border-indigo-500 rounded-[32px] p-8 space-y-5 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-2">
                  <h3 className="text-white font-black italic uppercase text-lg tracking-tight">{isEditingClass ? 'Edit Session' : 'Create New Master Session'}</h3>
                  <button type="button" onClick={() => setIsAddingClass(false)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Class Title</label>
                    <input required autoFocus placeholder="e.g. Fundamental Jiu-Jitsu" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-white font-bold" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Lead Instructor</label>
                    <input required placeholder="Coach Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-white font-bold" value={newClass.instructor} onChange={e => setNewClass({...newClass, instructor: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Day</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none font-black uppercase tracking-widest text-white appearance-none" value={newClass.day} onChange={e => setNewClass({...newClass, day: e.target.value})}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Start Time</label>
                      <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none text-white font-black" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Uniform</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none font-black text-indigo-400 uppercase tracking-widest appearance-none" value={newClass.type} onChange={e => setNewClass({...newClass, type: e.target.value as any})}>
                        <option value="Gi">Gi</option>
                        <option value="No-Gi">No-Gi</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Capacity (0=Inf)</label>
                      <input type="number" placeholder="20" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none text-white font-black" value={newClass.capacity || ''} onChange={e => setNewClass({...newClass, capacity: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => { setIsAddingClass(false); setIsEditingClass(null); }} className="flex-1 bg-slate-800 py-4 rounded-2xl text-[11px] font-black uppercase text-slate-400 tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 py-4 rounded-2xl text-[11px] font-black uppercase text-white shadow-xl shadow-indigo-600/20 active:scale-95 transition-transform tracking-widest">{isEditingClass ? 'Update' : 'Launch Session'}</button>
                </div>
              </form>
            </div>
          )}

          {classes.length === 0 && !isAddingClass ? (
            <div className="text-center py-20 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[48px] space-y-8 flex flex-col items-center justify-center px-10 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-700 shadow-inner">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-black italic uppercase text-xl tracking-tight">Master Timetable Empty</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] font-medium">You haven't added any recurring sessions to your weekly schedule yet.</p>
              </div>
              
              {/* This button is explicitly for the owner in the empty state */}
              {isOwner ? (
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={() => setIsAddingClass(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-10 rounded-3xl shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 uppercase tracking-[0.15em] text-[12px] flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
                    Create Your First Class
                  </button>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Owner Permissions Enabled</p>
                </div>
              ) : (
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Ask your coach to set up the timetable</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               {isOwner && !isAddingClass && (
                 <button 
                  onClick={() => { setIsEditingClass(null); setIsAddingClass(true); }}
                  className="w-full bg-slate-900 border border-indigo-500/20 border-dashed py-4 rounded-3xl text-indigo-400 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600/10 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
                  Add Another Session
                </button>
               )}
               
               {classes.map((c) => {
                const booked = classBookingCounts[c.id] || 0;
                const isFull = c.capacity && booked >= c.capacity;
                
                return (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col sm:flex-row gap-5 hover:border-indigo-500/50 transition-all group shadow-sm relative overflow-hidden">
                    {isFull && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/50"></div>}
                    
                    <div className="flex flex-row sm:flex-col items-center justify-center sm:min-w-[80px] sm:border-r border-slate-800 sm:pr-5 gap-2">
                      <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{c.time}</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] sm:mt-1">{c.day.substring(0,3)}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white uppercase italic text-lg tracking-tight leading-tight">{c.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 font-bold italic uppercase tracking-tight">Coach {c.instructor}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black uppercase tracking-widest ${c.type === 'Gi' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{c.type}</span>
                          {c.capacity ? (
                            <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-widest ${isFull ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              {booked}/{c.capacity} Booked
                            </span>
                          ) : (
                            <span className="text-[8px] bg-slate-800/50 text-slate-600 px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-widest">Unlimited</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-5 flex gap-4">
                        <button onClick={() => showAttendees(c)} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                          View Roll Call
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2.5 self-center w-full sm:w-auto mt-3 sm:mt-0">
                      <button 
                        onClick={() => handleBook(c)}
                        disabled={loading || isFull}
                        className={`flex-1 text-[11px] font-black py-3.5 px-8 rounded-2xl transition-all active:scale-95 uppercase tracking-widest shadow-lg ${isFull ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'}`}
                      >
                        {isFull ? 'Session Full' : 'Reserve Seat'}
                      </button>
                      {isOwner && (
                        <button 
                          onClick={() => startEditClass(c)}
                          className="flex-none bg-slate-800 hover:bg-slate-700 text-slate-400 p-3.5 rounded-2xl transition-all border border-slate-700"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : view === 'history' ? (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = selectedHistoryDate === dateStr;
              return (
                <button 
                  key={dateStr}
                  onClick={() => setSelectedHistoryDate(dateStr)}
                  className={`flex flex-col items-center min-w-[75px] p-4 rounded-2xl border-2 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className="text-lg font-black italic mt-0.5">{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
             {classes.filter(c => c.day === getDayName(selectedHistoryDate)).length === 0 ? (
               <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-[40px]">
                  <p className="text-slate-500 font-black italic uppercase text-xs tracking-widest">No grapplers logged today</p>
                </div>
             ) : (
               classes.filter(c => c.day === getDayName(selectedHistoryDate)).map(c => (
                 <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between group shadow-sm hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="text-center pr-5 border-r border-slate-800 min-w-[60px]">
                        <span className="text-lg font-black text-white italic">{c.time}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase italic text-sm tracking-tight">{c.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Coach {c.instructor}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => showAttendees(c, selectedHistoryDate)}
                      className="bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[10px] font-black py-2.5 px-6 rounded-2xl transition-all uppercase tracking-widest border border-slate-700 active:scale-95 shadow-sm"
                    >
                      History Roll
                    </button>
                 </div>
               ))
             )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          {isOwner && !isAddingRecap && (
            <button 
              onClick={() => setIsAddingRecap(true)}
              className="w-full bg-indigo-600/10 border border-indigo-500/30 border-dashed py-6 rounded-3xl text-indigo-400 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Technique Log Update
            </button>
          )}

          {isAddingRecap && (
            <form onSubmit={handleSaveRecap} className="bg-slate-900 border border-indigo-500/50 rounded-[32px] p-8 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-black italic uppercase text-lg tracking-tight">Post-Class Recap</h3>
                <button type="button" onClick={() => setIsAddingRecap(false)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <input required placeholder="Class Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newRecap.className} onChange={e => setNewRecap({...newRecap, className: e.target.value})} />
                <input required placeholder="Instructor" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newRecap.instructor} onChange={e => setNewRecap({...newRecap, instructor: e.target.value})} />
                <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-black uppercase text-indigo-400 appearance-none outline-none focus:ring-2 focus:ring-indigo-500" value={newRecap.type} onChange={e => setNewRecap({...newRecap, type: e.target.value as any})}>
                  <option value="Gi">Gi</option>
                  <option value="No-Gi">No-Gi</option>
                </select>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Key Techniques (Comma Separated)</label>
                  <input required placeholder="De La Riva Sweep, Ankle Lock Defense..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newRecap.techniques} onChange={e => setNewRecap({...newRecap, techniques: e.target.value})} />
                </div>
                <textarea placeholder="Coach's Notes..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none" value={newRecap.notes} onChange={e => setNewRecap({...newRecap, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingRecap(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl text-[11px] font-black uppercase text-slate-400 tracking-widest">Discard</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 py-4 rounded-2xl text-[11px] font-black uppercase text-white shadow-xl shadow-indigo-600/20 disabled:opacity-50 tracking-widest">
                  {loading ? 'Saving...' : 'Post Recap'}
                </button>
              </div>
            </form>
          )}

          {recaps.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/50 border border-dashed border-slate-800 rounded-[40px]">
              <p className="text-slate-500 font-black italic uppercase text-xs tracking-widest">Academy Library Empty</p>
            </div>
          ) : (
            recaps.map((recap) => (
              <div key={recap.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-5 shadow-sm group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest">{recap.type}</span>
                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tight">{recap.date}</span>
                    </div>
                    <h3 className="text-white font-black italic text-xl uppercase tracking-tight">{recap.className}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Instructor: {recap.instructor}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {recap.techniques.map((tech, idx) => (
                    <span key={idx} className="bg-slate-950 border border-slate-800 text-indigo-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tight shadow-sm">{tech}</span>
                  ))}
                </div>
                {recap.notes && <p className="text-xs text-slate-400 italic border-t border-slate-800 pt-5 leading-relaxed">"{recap.notes}"</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* FULL CLASS POPUP */}
      {showFullClassPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-sm p-10 rounded-[48px] shadow-2xl text-center space-y-8">
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Class Full!</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Mat capacity reached for this session. Contact your coach for priority booking or check-in on the day.</p>
              </div>
              <button 
                onClick={() => setShowFullClassPopup(false)}
                className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-3xl uppercase tracking-widest text-[12px] transition-all active:scale-95 shadow-xl shadow-amber-500/20"
              >
                OSS, COACH!
              </button>
           </div>
        </div>
      )}

      {/* ATTENDEE MODAL */}
      {attendeeModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md max-h-[90vh] flex flex-col rounded-[48px] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 bg-slate-900/50">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-white font-black italic uppercase text-2xl tracking-tight leading-none">{attendeeModalData.classObj.name}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">{attendeeModalData.date} • {attendeeModalData.members.length} Grapplers</p>
                </div>
                <button onClick={() => setAttendeeModalData(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="relative">
                   <svg className="absolute left-4 top-4 w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                   <input 
                    type="text" 
                    placeholder="Find team member..." 
                    value={attendeeSearch}
                    onChange={e => setAttendeeSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => setAttendeeRankFilter('All')} className={`whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${attendeeRankFilter === 'All' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-800'}`}>All Ranks</button>
                  {currentRanks.map(r => (
                    <button key={r} onClick={() => setAttendeeRankFilter(r)} className={`whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${attendeeRankFilter === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-800'}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {filteredAttendees.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-700 font-black italic uppercase text-[10px] tracking-[0.3em]">No matches found</p>
                </div>
              ) : (
                filteredAttendees.map(m => (
                  <div key={m.id} className="flex items-center gap-5 bg-slate-950/40 p-5 rounded-[24px] border border-slate-800/50 hover:border-slate-700 transition-colors shadow-sm">
                    <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-12 h-12 rounded-full border-2 border-slate-800 object-cover bg-slate-800 shadow-sm" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{m.name}</p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest mt-1.5 inline-block ${getRankColor(m.rank)}`}>{m.rank}</span>
                    </div>
                    {(m as any).role === 'OWNER' && <span className="text-[7px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/20 font-black uppercase tracking-widest">Coach</span>}
                  </div>
                ))
              )}
            </div>
            
            <div className="p-8 border-t border-slate-800 bg-slate-900/50">
               <button onClick={() => setAttendeeModalData(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-5 rounded-3xl uppercase tracking-[0.2em] text-[11px] transition-colors active:scale-[0.98]">Close Roll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
