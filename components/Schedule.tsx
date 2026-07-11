import React, { useState, useEffect } from 'react';
import { ClassRecap, UserRole, Class, Member, SportType } from '../types';
import { dataService } from '../services/dataService';

const Schedule: React.FC<{ role: UserRole, clubId: string, userId: string, sport: SportType }> = ({ role, clubId, userId, sport }) => {
  const [view, setView] = useState<'upcoming' | 'recaps'>('upcoming');
  const [classes, setClasses] = useState<Class[]>([]);
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddingClass, setIsAddingClass] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState<{ class: Class, attendees: Member[] } | null>(null);
  const [isAddingRecap, setIsAddingRecap] = useState<Class | null>(null);

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

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

  const getTodayName = () => {
    const jsDay = new Date().getDay();
    const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    return map[jsDay] as typeof DAYS[number];
  };

  const nextDateForDay = (dayName: typeof DAYS[number]) => {
    const now = new Date();
    const todayJs = now.getDay();
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

  const handleBook = async (c: Class) => {
    const owner = role?.toString().toUpperCase() === 'OWNER';

    const dayDate = nextDateForDay(c.day as any);
    const dateISO = toISODate(dayDate);

    const now = new Date();
    const start = buildDateTime(dayDate, c.start_time);

    if (!owner) {
      const count = bookingCounts[c.id] ?? 0;
      const capacity = c.capacity ?? null;
      if (capacity && count >= capacity) {
        alert("Class is full, check in with your coach");
        return;
      }

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

  const filteredAttendees = selectedClassAttendance?.attendees.filter(a =>
    a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) &&
    (attendeeRankFilter === 'All' || baseBelt(a.rank) === attendeeRankFilter)
  ) || [];

  const visibleClasses = classes.filter(c => c.day === selectedDay);
  const selectedDayDate = nextDateForDay(selectedDay);

  return (
    <>
      <div className="row sb">
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.3px' }}>
            {view === 'upcoming' ? 'Academy Schedule' : 'Technique Log'}
          </h2>
          <p className="section-lbl" style={{ padding: 0, marginTop: 2 }}>
            {view === 'upcoming' ? `${classes.length} sessions` : 'Knowledge base'}
          </p>
        </div>
        <div className="seg" style={{ width: 'auto' }}>
          <button onClick={() => setView('upcoming')} className={`seg-btn ${view === 'upcoming' ? 'active' : 'inactive'}`}>Timetable</button>
          <button onClick={() => setView('recaps')} className={`seg-btn ${view === 'recaps' ? 'active' : 'inactive'}`}>Recaps</button>
        </div>
      </div>

      {view === 'upcoming' && (
        <div className="col gap-3">
          <div className="day-scroll">
            {DAYS.map(d => {
              const active = selectedDay === d;
              return (
                <button key={d} onClick={() => setSelectedDay(d)} className={`day-chip ${active ? 'active' : 'inactive'}`}>
                  <span className="day-chip-name">{d.slice(0, 3)}</span>
                  <span className="day-chip-num">{nextDateForDay(d).getDate()}</span>
                </button>
              );
            })}
            {countsLoading && <span className="section-lbl" style={{ alignSelf: 'center', padding: 0 }}>Updating…</span>}
          </div>

          {isOwner && (
            <button
              onClick={() => setIsAddingClass(true)}
              className="btn btn-full"
              style={{ background: 'var(--sand-100)', border: '2px dashed rgba(0,0,0,0.12)', color: 'var(--ink-400)', height: 56 }}
            >
              + Create New Class
            </button>
          )}

          {visibleClasses.length === 0 ? (
            <div className="empty-state">No classes scheduled for {selectedDay}</div>
          ) : (
            visibleClasses.map((c) => {
              const count = bookingCounts[c.id] ?? 0;
              const capacity = c.capacity ?? null;
              const capacityLabel = capacity ? `${count}/${capacity}` : `${count}`;
              const isFull = !!capacity && count >= capacity;

              const started = new Date() >= buildDateTime(selectedDayDate, c.start_time);
              const disableReserve = !isOwner && (isFull || started);

              return (
                <div key={c.id} className="class-card">
                  <div className={`class-accent ${c.type === 'No-Gi' ? 'nogi' : ''}`} />
                  <div className="class-body">
                    <div className="row sb">
                      <div className="row gap-3">
                        <div className="card-inset col" style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--blue-vivid)', lineHeight: 1.4 }}>{c.start_time}</span>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--ink-300)' }}>{c.end_time}</span>
                        </div>
                        <div>
                          <h3 className="class-name">{c.name}</h3>
                          <p className="class-meta">{c.day} • Coach {c.instructor} • {c.type}</p>
                        </div>
                      </div>
                      <div className="col gap-2" style={{ alignItems: 'flex-end' }}>
                        <span className="badge">{capacityLabel}</span>
                        <button onClick={() => showAttendance(c)} className="link-btn">Who's Training?</button>
                        {isOwner && <button onClick={() => handleDeleteClass(c.id)} className="link-btn danger">Delete</button>}
                      </div>
                    </div>
                  </div>
                  <div className="class-footer">
                    <button
                      disabled={disableReserve}
                      onClick={() => handleBook(c)}
                      className="btn btn-primary flex-1"
                      title={!isOwner && isFull ? 'Class is full' : (!isOwner && started ? 'Class has started/ended' : '')}
                    >
                      Reserve Spot
                    </button>
                    {isOwner && (
                      <button onClick={() => setIsAddingRecap(c)} className="btn btn-ghost">Log Recap</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'recaps' && (
        <div className="col gap-3">
          {recaps.length === 0 ? (
            <div className="empty-state">No training notes found yet</div>
          ) : (
            recaps.map(r => (
              <div key={r.id} className="card card-p col gap-3">
                <div>
                  <p className="section-lbl" style={{ padding: 0, color: 'var(--blue-vivid)' }}>{r.date} • {r.type}</p>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--ink-900)', marginTop: 2 }}>{r.className}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: 2 }}>Instructor: {r.instructor}</p>
                </div>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {r.techniques.map((t, i) => (
                    <span key={i} className="badge">{t}</span>
                  ))}
                </div>
                {r.notes && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-500)', fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                    "{r.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedClassAttendance && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20, maxHeight: '80vh' }}>
              <div className="row sb">
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ink-900)' }}>{selectedClassAttendance.class.name}</h3>
                  <p className="section-lbl" style={{ padding: 0, marginTop: 2 }}>{selectedClassAttendance.attendees.length} grapplers</p>
                </div>
                <button onClick={() => setSelectedClassAttendance(null)} className="btn-icon" style={{ background: 'none', border: 'none', boxShadow: 'none' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="col gap-3">
                <div className="search-wrap">
                  <span className="search-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </span>
                  <input
                    placeholder="Search roster..."
                    className="field"
                    value={attendeeSearch}
                    onChange={e => setAttendeeSearch(e.target.value)}
                  />
                </div>

                <div className="scroll-x">
                  <button onClick={() => setAttendeeRankFilter('All')} className={`chip ${attendeeRankFilter === 'All' ? 'active' : ''}`}>All</button>
                  {['White', 'Blue', 'Purple', 'Brown', 'Black'].map(r => (
                    <button key={r} onClick={() => setAttendeeRankFilter(r)} className={`chip ${attendeeRankFilter === r ? 'active' : ''}`}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="col" style={{ overflowY: 'auto', gap: 0 }}>
                {filteredAttendees.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>No matching grapplers</div>
                ) : (
                  <div className="card">
                    {filteredAttendees.map(m => (
                      <div key={m.id} className="member-row">
                        <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="avatar" style={{ width: 40, height: 40 }} alt="" />
                        <div>
                          <h4 className="member-name">{m.name}</h4>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--blue-vivid)', marginTop: 1, textTransform: 'uppercase' }}>{m.rank}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingClass && (
        <div className="overlay">
          <form onSubmit={handleCreateClass} className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <h3 className="modal-title" style={{ textAlign: 'center', fontSize: '1.0625rem' }}>Setup New Session</h3>
              <div className="col gap-3">
                <div>
                  <label className="field-label">Class Name</label>
                  <input required placeholder="e.g. Fundamental Gi" className="field" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Instructor</label>
                  <input required placeholder="Coach Name" className="field" value={newClass.instructor} onChange={e => setNewClass({ ...newClass, instructor: e.target.value })} />
                </div>
                <div className="g2">
                  <div>
                    <label className="field-label">Day</label>
                    <select className="field" value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Type</label>
                    <select className="field" value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value as any })}>
                      <option value="Gi">Gi</option>
                      <option value="No-Gi">No-Gi</option>
                    </select>
                  </div>
                </div>
                <div className="g2">
                  <div>
                    <label className="field-label">Start Time</label>
                    <input type="time" className="field" value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">End Time</label>
                    <input type="time" className="field" value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="row gap-2">
                <button type="button" onClick={() => setIsAddingClass(false)} className="btn btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Launch Class</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isAddingRecap && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <h3 className="modal-title" style={{ textAlign: 'center', fontSize: '1.0625rem' }}>Log Today's Lesson</h3>
              <div className="col gap-3">
                <div>
                  <label className="field-label">Techniques (Comma Separated)</label>
                  <input placeholder="e.g. Scissor Sweep, Cross Choke" className="field" value={newRecap.techniques} onChange={e => setNewRecap({ ...newRecap, techniques: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Notes / Key Details</label>
                  <textarea placeholder="Don't forget the underhook..." className="field" style={{ height: 100, paddingTop: 12, resize: 'none' }} value={newRecap.notes} onChange={e => setNewRecap({ ...newRecap, notes: e.target.value })} />
                </div>
              </div>
              <div className="row gap-2">
                <button onClick={() => setIsAddingRecap(null)} className="btn btn-ghost flex-1">Discard</button>
                <button onClick={handleSaveRecap} className="btn btn-primary flex-1">Post Knowledge</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Schedule;
