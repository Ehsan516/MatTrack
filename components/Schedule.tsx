import React, { useState, useEffect } from 'react';
import { ClassRecap, UserRole, Class, Member, SportType } from '../types';
import { dataService } from '../services/dataService';

const Schedule: React.FC<{ role: UserRole, clubId: string, userId: string, sport: SportType }> = ({ role, clubId, userId, sport }) => {
  const [view, setView] = useState<'upcoming' | 'recaps'>('upcoming');
  const [classes, setClasses] = useState<Class[]>([]);
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals/Forms
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState<{ class: Class, attendees: Member[] } | null>(null);
  const [isAddingRecap, setIsAddingRecap] = useState<Class | null>(null);

  // Attendance Filter
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeRankFilter, setAttendeeRankFilter] = useState('All');

  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    day: 'Monday',
    start_time: '18:00',
    end_time: '19:30',
    type: 'Gi' as 'Gi' | 'No-Gi',
    capacity: 20
  });

  const [newRecap, setNewRecap] = useState({
    techniques: '',
    notes: ''
  });

  // =========================
  // Day filter + booking logic
  // =========================
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

  const getTodayName = () => {
    // JS: Sunday=0 ... Saturday=6
    const jsDay = new Date().getDay();
    const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    return map[jsDay] as typeof DAYS[number];
  };

  const nextDateForDay = (dayName: typeof DAYS[number]) => {
    const now = new Date();
    const todayJs = now.getDay(); // 0..6
    const week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const targetJs = week.indexOf(dayName as any);

    let diff = targetJs - todayJs;
    if (diff < 0) diff += 7;

    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  };

  const toISODate = (d: Date) => d.toISOString().split('T')[0];

  const parseHHMM = (hhmm: string) => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return { h: h || 0, m: m || 0 };
  };

  const buildDateTime = (baseDate: Date, hhmm: string) => {
    const { h, m } = parseHHMM(hhmm);
    const dt = new Date(baseDate);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  // Normalize degrees etc. -> base belt for filtering (Black 2nd degree still counts as Black)
  const baseBelt = (rank: string) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('black')) return 'Black';
    if (r.includes('brown')) return 'Brown';
    if (r.includes('purple')) return 'Purple';
    if (r.includes('blue')) return 'Blue';
    if (r.includes('white')) return 'White';
    return rank || 'White';
  };

  const isOwner = role?.toString().toUpperCase() === 'OWNER';

  const [selectedDay, setSelectedDay] = useState<typeof DAYS[number]>(() => {
    const today = getTodayName();
    return today as any;
  });

  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    if (clubId) {
      loadSchedule();
      loadRecaps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClasses(clubId);
      setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecaps = async () => {
    const data = await dataService.getRecaps(clubId);
    setRecaps(data);
  };

  // Refresh booking counts whenever selected day or class list changes
  useEffect(() => {
    if (!clubId) return;
    refreshCountsForSelectedDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, classes.length, clubId]);

  const refreshCountsForSelectedDay = async () => {
    const dayDate = nextDateForDay(selectedDay);
    const dateISO = toISODate(dayDate);

    const dayClasses = classes.filter(c => c.day === selectedDay);
    if (dayClasses.length === 0) {
      setBookingCounts({});
      return;
    }

    setCountsLoading(true);
    try {
      const entries = await Promise.all(
        dayClasses.map(async (c) => {
          const count = await dataService.getBookingCount(c.id, dateISO);
          return [c.id, count] as const;
        })
      );

      const map: Record<string, number> = {};
      for (const [id, count] of entries) map[id] = count;
      setBookingCounts(map);
    } catch (e) {
      console.error(e);
      // Don't block UI if counts fail
    } finally {
      setCountsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.createClass(clubId, newClass);
      setIsAddingClass(false);
      await loadSchedule();
      setNewClass({
        name: '',
        instructor: '',
        day: 'Monday',
        start_time: '18:00',
        end_time: '19:30',
        type: 'Gi',
        capacity: 20
      });
    } catch (err: any) {
      alert("Failed to create class: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this session? This will remove all bookings for it.")) return;
    try {
      await dataService.deleteClass(classId);
      await loadSchedule();
    } catch (err) {
      alert("Failed to delete class. Ensure you have ownership permissions.");
    }
  };

  // ✅ Updated booking behaviour:
  // - defaults to booking the next occurrence of the class day
  // - members can't book after class start time
  // - members can't book if full (owner not blocked by capacity)
  const handleBook = async (c: Class) => {
    const owner = role?.toString().toUpperCase() === 'OWNER';

    const dayDate = nextDateForDay(c.day as any);
    const dateISO = toISODate(dayDate);

    const now = new Date();
    const start = buildDateTime(dayDate, c.start_time);

    if (!owner) {
      // capacity check
      const count = bookingCounts[c.id] ?? 0;
      const capacity = c.capacity ?? null;
      if (capacity && count >= capacity) {
        alert("Class is full, check in with your coach");
        return;
      }

      // prevent booking if class has started/ended
      if (now >= start) {
        alert("This class has already started/ended — you can’t book it.");
        return;
      }
    }

    try {
      await dataService.bookClass(userId, c.id, dateISO);
      alert("Spot Reserved!");
      await refreshCountsForSelectedDay();
    } catch (err) {
      alert("Booking failed.");
    }
  };

  const showAttendance = async (c: Class) => {
    // show roster for the next occurrence of that class (same day logic)
    const dayDate = nextDateForDay(c.day as any);
    const dateISO = toISODate(dayDate);

    const attendees = await dataService.getClassAttendees(c.id, dateISO);
    setSelectedClassAttendance({ class: c, attendees });
  };

  const handleSaveRecap = async () => {
    if (!isAddingRecap) return;
    try {
      await dataService.saveRecap(clubId, {
        className: isAddingRecap.name,
        instructor: isAddingRecap.instructor,
        type: isAddingRecap.type,
        techniques: newRecap.techniques.split(',').map(t => t.trim()),
        notes: newRecap.notes
      });
      setIsAddingRecap(null);
      setNewRecap({ techniques: '', notes: '' });
      await loadRecaps();
      setView('recaps');
    } catch (err) {
      alert("Failed to save recap.");
    }
  };

  // Filter: only show up to Black in UI, and normalize degrees -> Black
  const filteredAttendees = selectedClassAttendance?.attendees.filter(a =>
    a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) &&
    (attendeeRankFilter === 'All' || baseBelt(a.rank) === attendeeRankFilter)
  ) || [];

  // Day-filtered view
  const visibleClasses = classes.filter(c => c.day === selectedDay);
  const selectedDayDate = nextDateForDay(selectedDay);
  const selectedDayISO = toISODate(selectedDayDate);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase leading-none">
            {view === 'upcoming' ? "Academy Schedule" : "Technique Log"}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
            {view === 'upcoming' ? `MASTER SESSIONS: ${classes.length}` : 'ACADEMY KNOWLEDGE BASE'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex gap-1 shadow-inner w-full sm:w-auto">
          <button
            onClick={() => setView('upcoming')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Timetable
          </button>
          <button
            onClick={() => setView('recaps')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'recaps' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Recaps
          </button>
        </div>
      </div>

      {view === 'upcoming' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* ✅ Day filter bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                  ${selectedDay === d ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
            {countsLoading && (
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2 self-center">
                Updating…
              </span>
            )}
          </div>

          {isOwner && (
            <button
              onClick={() => setIsAddingClass(true)}
              className="w-full bg-slate-900 border-2 border-dashed border-slate-800 py-6 rounded-3xl text-slate-500 font-black uppercase tracking-widest text-xs hover:border-indigo-500 hover:text-indigo-400 transition-all shadow-inner"
            >
              + Create New Class
            </button>
          )}

          {visibleClasses.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-[40px]">
              <p className="text-slate-600 font-black italic uppercase text-xs tracking-widest">
                No classes scheduled for {selectedDay}
              </p>
            </div>
          ) : (
            visibleClasses.map((c) => {
              const count = bookingCounts[c.id] ?? 0;
              const capacity = c.capacity ?? null;
              const capacityLabel = capacity ? `${count}/${capacity}` : `${count}`;
              const isFull = !!capacity && count >= capacity;

              const started = new Date() >= buildDateTime(selectedDayDate, c.start_time);
              const disableReserve = !isOwner && (isFull || started);

              return (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col gap-6 shadow-sm group relative">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-800 shadow-inner">
                        <span className="text-[10px] font-black text-indigo-400 leading-none mb-1">{c.start_time}</span>
                        <div className="w-1 h-2 bg-slate-800 rounded-full my-0.5"></div>
                        <span className="text-[10px] font-black text-slate-500 leading-none">{c.end_time}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{c.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          {c.day} • Coach {c.instructor} • {c.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* ✅ Count / capacity indicator */}
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                        {capacityLabel}
                      </div>

                      <button
                        onClick={() => showAttendance(c)}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                      >
                        Who's Training?
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => handleDeleteClass(c.id)}
                          className="text-[9px] font-black text-red-500/60 uppercase hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      disabled={disableReserve}
                      onClick={() => handleBook(c)}
                      className={`flex-1 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all
                        ${disableReserve ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}
                      title={!isOwner && isFull ? 'Class is full' : (!isOwner && started ? 'Class has started/ended' : '')}
                    >
                      Reserve Spot
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => setIsAddingRecap(c)}
                        className="bg-slate-800 text-slate-300 font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors"
                      >
                        Log Recap
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'recaps' && (
        <div className="space-y-4 animate-in fade-in">
          {recaps.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-[40px]">
              <p className="text-slate-600 font-black italic uppercase text-xs tracking-widest">No training notes found yet</p>
            </div>
          ) : (
            recaps.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-4">
                <div>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{r.date} • {r.type}</p>
                  <h3 className="text-xl font-black italic text-white uppercase tracking-tight">{r.className}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Instructor: {r.instructor}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.techniques.map((t, i) => (
                    <span key={i} className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{t}</span>
                  ))}
                </div>
                {r.notes && <p className="text-sm text-slate-400 italic border-t border-slate-800 pt-4 leading-relaxed font-medium">"{r.notes}"</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Class Attendance */}
      {selectedClassAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6 relative max-h-[80vh] overflow-hidden flex flex-col">
            <button onClick={() => setSelectedClassAttendance(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white italic uppercase">{selectedClassAttendance.class.name}</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Session Roster • {selectedClassAttendance.attendees.length} Grapplers
              </p>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Search roster..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-600"
                value={attendeeSearch}
                onChange={e => setAttendeeSearch(e.target.value)}
              />

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button onClick={() => setAttendeeRankFilter('All')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${attendeeRankFilter === 'All' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>All</button>
                {['White', 'Blue', 'Purple', 'Brown', 'Black'].map(r => (
                  <button
                    key={r}
                    onClick={() => setAttendeeRankFilter(r)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${attendeeRankFilter === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredAttendees.length === 0 ? (
                <div className="py-12 text-center text-slate-600 font-black italic uppercase text-[10px] tracking-widest">No matching grapplers</div>
              ) : (
                filteredAttendees.map(m => (
                  <div key={m.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                    <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-10 h-10 rounded-full bg-slate-800" alt="" />
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase italic">{m.name}</h4>
                      <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">{m.rank}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Class */}
      {isAddingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <form onSubmit={handleCreateClass} className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white italic uppercase text-center">Setup New Session</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Name</label>
                <input required placeholder="e.g. Fundamental Gi" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instructor</label>
                <input required placeholder="Coach Name" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={newClass.instructor} onChange={e => setNewClass({ ...newClass, instructor: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Day</label>
                  <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-600" value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                  <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-600" value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value as any })}>
                    <option value="Gi">Gi</option>
                    <option value="No-Gi">No-Gi</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                  <input type="time" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                  <input type="time" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setIsAddingClass(false)} className="flex-1 py-4 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Launch Class</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Recap */}
      {isAddingRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white italic uppercase text-center">Log Today's Lesson</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Techniques (Comma Separated)</label>
                <input placeholder="e.g. Scissor Sweep, Cross Choke" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold" value={newRecap.techniques} onChange={e => setNewRecap({ ...newRecap, techniques: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes / Key Details</label>
                <textarea placeholder="Don't forget the underhook..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white h-32" value={newRecap.notes} onChange={e => setNewRecap({ ...newRecap, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsAddingRecap(null)} className="flex-1 py-4 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs">Discard</button>
              <button onClick={handleSaveRecap} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs">Post Knowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
