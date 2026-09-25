import React, { useState, useEffect } from 'react';
import { ClassRecap, UserRole, Class, Member, SportType } from '../types';
import { dataService } from '../services/dataService';
import { DAYS, DayName, todayName, daysFromToday, nextDateForDay, toLocalISODate, buildDateTime, shortTime, formatShortDate } from '../lib/dates';
import { baseBelt, beltClass } from '../lib/rank';
import { useFeedback } from './ui/Feedback';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';
import Modal from './ui/Modal';

const EMPTY_CLASS = {
  name: '',
  instructor: '',
  day: 'Monday',
  start_time: '18:00',
  end_time: '19:30',
  type: 'Gi' as 'Gi' | 'No-Gi',
  capacity: 20
};

const Schedule: React.FC<{ role: UserRole, clubId: string, userId: string, sport: SportType }> = ({ role, clubId, userId }) => {
  const { toast, confirm } = useFeedback();
  const [view, setView] = useState<'upcoming' | 'recaps'>('upcoming');
  const [classes, setClasses] = useState<Class[]>([]);
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingClass, setIsAddingClass] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState<{ class: Class, attendees: Member[] } | null>(null);
  const [isAddingRecap, setIsAddingRecap] = useState<Class | null>(null);

  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeRankFilter, setAttendeeRankFilter] = useState('All');

  const [newClass, setNewClass] = useState(EMPTY_CLASS);
  const [newRecap, setNewRecap] = useState({ techniques: '', notes: '' });

  const [selectedDay, setSelectedDay] = useState<DayName>(todayName);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [bookedHere, setBookedHere] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = role?.toString().toUpperCase() === 'OWNER';

  useEffect(() => {
    if (clubId) {
      loadSchedule();
      loadRecaps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const loadSchedule = async () => {
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
  }, [selectedDay, classes, clubId]);

  const refreshCountsForSelectedDay = async () => {
    const dateISO = toLocalISODate(nextDateForDay(selectedDay));
    const dayClasses = classes.filter(c => c.day === selectedDay);
    if (dayClasses.length === 0) {
      setBookingCounts({});
      return;
    }

    try {
      const entries = await Promise.all(
        dayClasses.map(async (c) => [c.id, await dataService.getClassAttendees(c.id, dateISO)] as const)
      );
      setBookingCounts(Object.fromEntries(entries.map(([id, attendees]) => [id, attendees.length])));
      setBookedHere(new Set(entries.filter(([, attendees]) => attendees.some(a => a.id === userId)).map(([id]) => id)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.createClass(clubId, newClass);
      setIsAddingClass(false);
      setSelectedDay(newClass.day as DayName);
      await loadSchedule();
      toast(`${newClass.name} added to ${newClass.day}s`);
      setNewClass(EMPTY_CLASS);
    } catch (err: any) {
      toast("Couldn't create the class: " + (err.message || 'unknown error'), 'error');
    }
  };

  const handleDeleteClass = async (c: Class) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      message: `This removes the ${c.day} ${shortTime(c.start_time)} class from the timetable and cancels all of its bookings.`,
      confirmLabel: 'Delete class',
    });
    if (!ok) return;
    try {
      await dataService.deleteClass(c.id);
      await loadSchedule();
      toast('Class deleted');
    } catch (err) {
      toast("Couldn't delete the class. Check you're the academy owner.", 'error');
    }
  };

  const handleBook = async (c: Class) => {
    const dayDate = nextDateForDay(c.day);
    const dateISO = toLocalISODate(dayDate);
    const start = buildDateTime(dayDate, c.start_time);

    if (!isOwner) {
      const count = bookingCounts[c.id] ?? 0;
      if (c.capacity && count >= c.capacity) {
        toast('This class is full. Check in with your coach.', 'error');
        return;
      }
      if (new Date() >= start) {
        toast('This class has already started.', 'error');
        return;
      }
    }

    setBusyId(c.id);
    try {
      await dataService.bookClass(userId, c.id, dateISO);
      toast(`Booked: ${c.name}, ${formatShortDate(dayDate)} at ${shortTime(c.start_time)}`);
      await refreshCountsForSelectedDay();
    } catch (err: any) {
      toast(err?.message || "Couldn't book this class.", 'error');
    } finally {
      setBusyId(null);
    }
  };

  const showAttendance = async (c: Class) => {
    const attendees = await dataService.getClassAttendees(c.id, toLocalISODate(nextDateForDay(c.day)));
    setAttendeeSearch('');
    setAttendeeRankFilter('All');
    setSelectedClassAttendance({ class: c, attendees });
  };

  const handleSaveRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingRecap) return;
    try {
      await dataService.saveRecap(clubId, {
        className: isAddingRecap.name,
        instructor: isAddingRecap.instructor,
        type: isAddingRecap.type,
        techniques: newRecap.techniques.split(',').map(t => t.trim()).filter(Boolean),
        notes: newRecap.notes
      });
      setIsAddingRecap(null);
      setNewRecap({ techniques: '', notes: '' });
      await loadRecaps();
      setView('recaps');
      toast('Recap shared with the team');
    } catch (err) {
      toast("Couldn't save the recap.", 'error');
    }
  };

  const filteredAttendees = selectedClassAttendance?.attendees.filter(a =>
    a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) &&
    (attendeeRankFilter === 'All' || baseBelt(a.rank) === attendeeRankFilter)
  ) || [];
  const attendeeBelts = Array.from(new Set(selectedClassAttendance?.attendees.map(a => baseBelt(a.rank)) ?? []));

  const visibleClasses = classes.filter(c => c.day === selectedDay);
  const selectedDayDate = nextDateForDay(selectedDay);
  const daysWithClasses = new Set(classes.map(c => c.day));

  return (
    <>
      <div className="row sb gap-3">
        <div>
          <h2 className="page-title">{view === 'upcoming' ? 'Classes' : 'Recaps'}</h2>
          <p className="page-sub">
            {view === 'upcoming' ? `${classes.length} classes a week` : 'Technique notes'}
          </p>
        </div>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={view === 'upcoming'} onClick={() => setView('upcoming')} className={`seg-btn ${view === 'upcoming' ? 'active' : 'inactive'}`}>Timetable</button>
          <button role="tab" aria-selected={view === 'recaps'} onClick={() => setView('recaps')} className={`seg-btn ${view === 'recaps' ? 'active' : 'inactive'}`}>Recaps</button>
        </div>
      </div>

      {view === 'upcoming' && (
        <>
          <div className="day-scroll" role="tablist" aria-label="Day of week">
            {daysFromToday().map(d => {
              const active = selectedDay === d;
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={active}
                  aria-label={`${d} ${nextDateForDay(d).getDate()}`}
                  onClick={() => setSelectedDay(d)}
                  className={`day-chip ${active ? 'active' : 'inactive'}`}
                >
                  <span className="day-chip-name">{d === todayName() ? 'Today' : d.slice(0, 3)}</span>
                  <span className="day-chip-num">{nextDateForDay(d).getDate()}</span>
                  {daysWithClasses.has(d) && <span className="day-chip-dot" />}
                </button>
              );
            })}
          </div>

          <div className="section-head">
            <h3 className="section-lbl">{selectedDayDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            {isOwner && (
              <button onClick={() => { setNewClass({ ...EMPTY_CLASS, day: selectedDay }); setIsAddingClass(true); }} className="link-btn accent">
                <Icon name="plus" size={15} /> Add class
              </button>
            )}
          </div>

          {loading ? (
            <>
              <div className="skeleton" style={{ height: 124 }} />
              <div className="skeleton" style={{ height: 124 }} />
            </>
          ) : visibleClasses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="calendar" size={22} /></div>
              <p className="empty-state-title">No classes on {selectedDay}</p>
              <p>{isOwner ? 'Add a class to start taking bookings.' : 'Check another day for sessions.'}</p>
            </div>
          ) : (
            visibleClasses.map((c) => {
              const count = bookingCounts[c.id] ?? 0;
              const capacity = c.capacity ?? null;
              const isFull = !!capacity && count >= capacity;
              const started = new Date() >= buildDateTime(selectedDayDate, c.start_time);
              const booked = bookedHere.has(c.id);
              const disableReserve = booked || (!isOwner && (isFull || started));
              const reserveLabel = booked ? 'Booked' : !isOwner && started ? 'Started' : !isOwner && isFull ? 'Full' : 'Book';

              return (
                <article key={c.id} className="class-card">
                  <div className={`class-accent ${c.type === 'No-Gi' ? 'nogi' : ''}`} />
                  <div className="class-body">
                    <div className="class-time">
                      <span className="class-time-start">{shortTime(c.start_time)}</span>
                      <span className="class-time-end">{shortTime(c.end_time)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="row sb gap-2" style={{ alignItems: 'flex-start' }}>
                        <h3 className="class-name">{c.name}</h3>
                        <span className={`badge ${c.type === 'No-Gi' ? 'violet' : 'blue'}`}>{c.type}</span>
                      </div>
                      <p className="class-meta">Coach {c.instructor}</p>
                    </div>
                  </div>
                  <div className="class-footer">
                    <button onClick={() => showAttendance(c)} className={`capacity ${isFull ? 'full' : ''}`} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }} aria-label={`See who's booked into ${c.name}`}>
                      <span className="capacity-lbl"><strong>{count}</strong>{capacity ? ` / ${capacity}` : ''} booked · <span style={{ color: 'var(--blue-vivid)', fontWeight: 600 }}>See who</span></span>
                      {capacity && (
                        <span className="progress-track">
                          <span className="progress-fill" style={{ display: 'block', width: `${Math.min(100, (count / capacity) * 100)}%` }} />
                        </span>
                      )}
                    </button>
                    {isOwner && (
                      <>
                        <button onClick={() => setIsAddingRecap(c)} className="btn btn-ghost btn-sm">Recap</button>
                        <button onClick={() => handleDeleteClass(c)} className="btn-icon plain danger" style={{ width: 36, height: 36 }} aria-label={`Delete ${c.name}`}>
                          <Icon name="trash" size={16} />
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <button
                        disabled={disableReserve || busyId === c.id}
                        onClick={() => handleBook(c)}
                        className={`btn btn-sm ${booked ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ minWidth: 84 }}
                      >
                        {booked && <Icon name="check" size={15} strokeWidth={2.5} />}
                        {busyId === c.id ? 'Booking…' : reserveLabel}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </>
      )}

      {view === 'recaps' && (
        recaps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="book" size={22} /></div>
            <p className="empty-state-title">No recaps yet</p>
            <p>{isOwner ? 'After a class, tap Recap to log the techniques you covered.' : 'Your coach will post technique notes here after class.'}</p>
          </div>
        ) : (
          recaps.map(r => (
            <article key={r.id} className="card card-p col gap-3">
              <div className="row sb" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h3 className="card-title">{r.className}</h3>
                  <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>{formatShortDate(r.date)} · Coach {r.instructor}</p>
                </div>
                <span className={`badge ${r.type === 'No-Gi' ? 'violet' : 'blue'}`}>{r.type}</span>
              </div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {r.techniques.map((t, i) => (
                  <span key={i} className="tag">{t}</span>
                ))}
              </div>
              {r.notes && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-700)', lineHeight: 1.55, borderLeft: '2px solid var(--sand-300)', paddingLeft: 12 }}>
                  {r.notes}
                </p>
              )}
            </article>
          ))
        )
      )}

      {selectedClassAttendance && (
        <Modal
          onClose={() => setSelectedClassAttendance(null)}
          title={selectedClassAttendance.class.name}
          description={`${formatShortDate(nextDateForDay(selectedClassAttendance.class.day))} · ${shortTime(selectedClassAttendance.class.start_time)} · ${selectedClassAttendance.attendees.length} booked`}
        >
          {selectedClassAttendance.attendees.length > 5 && (
            <>
              <div className="search-wrap">
                <span className="search-icon"><Icon name="search" size={17} /></span>
                <input type="search" placeholder="Search" className="field" value={attendeeSearch} onChange={e => setAttendeeSearch(e.target.value)} aria-label="Search attendees" />
              </div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {['All', ...attendeeBelts].map(r => (
                  <button key={r} onClick={() => setAttendeeRankFilter(r)} className={`chip ${attendeeRankFilter === r ? 'active' : ''}`}>{r}</button>
                ))}
              </div>
            </>
          )}

          {filteredAttendees.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              {selectedClassAttendance.attendees.length === 0 ? 'Nobody has booked in yet.' : 'No one matches that search.'}
            </div>
          ) : (
            <div className="card">
              {filteredAttendees.map(m => (
                <div key={m.id} className="member-row" style={{ minHeight: 56, padding: '10px 14px' }}>
                  <Avatar name={m.name} src={m.avatar_url} size={36} />
                  <h4 className="member-name flex-1 truncate">{m.name}</h4>
                  <span className={`belt ${beltClass(m.rank)}`}>{baseBelt(m.rank)}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {isAddingClass && (
        <Modal onClose={() => setIsAddingClass(false)} onSubmit={handleCreateClass} icon="calendar" title="Add a class" description="It repeats every week on the day you choose.">
          <div>
            <label className="field-label" htmlFor="class-name">Class name</label>
            <input id="class-name" required placeholder="e.g. Fundamentals Gi" className="field" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="field-label" htmlFor="class-coach">Coach</label>
            <input id="class-coach" required placeholder="Who's teaching?" className="field" value={newClass.instructor} onChange={e => setNewClass({ ...newClass, instructor: e.target.value })} />
          </div>
          <div className="g2">
            <div>
              <label className="field-label" htmlFor="class-day">Day</label>
              <select id="class-day" className="field" value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="class-type">Type</label>
              <select id="class-type" className="field" value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value as 'Gi' | 'No-Gi' })}>
                <option value="Gi">Gi</option>
                <option value="No-Gi">No-Gi</option>
              </select>
            </div>
          </div>
          <div className="g3">
            <div>
              <label className="field-label" htmlFor="class-start">Starts</label>
              <input id="class-start" type="time" className="field" value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="class-end">Ends</label>
              <input id="class-end" type="time" className="field" value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="class-cap">Spaces</label>
              <input id="class-cap" type="number" min={1} max={200} className="field" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: Number(e.target.value) || 1 })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsAddingClass(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Add class</button>
          </div>
        </Modal>
      )}

      {isAddingRecap && (
        <Modal onClose={() => setIsAddingRecap(null)} onSubmit={handleSaveRecap} icon="book" title="Class recap" description={`${isAddingRecap.name} · ${formatShortDate(new Date())}`}>
          <div>
            <label className="field-label" htmlFor="recap-tech">Techniques covered</label>
            <input id="recap-tech" required placeholder="Scissor sweep, cross collar choke" className="field" value={newRecap.techniques} onChange={e => setNewRecap({ ...newRecap, techniques: e.target.value })} autoFocus />
            <p className="field-hint">Separate techniques with commas.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="recap-notes">Key details <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea id="recap-notes" placeholder="What should people remember?" className="field" rows={4} value={newRecap.notes} onChange={e => setNewRecap({ ...newRecap, notes: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsAddingRecap(null)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Share recap</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Schedule;
