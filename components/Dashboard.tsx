import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member, Class, Booking, ClubAlert } from '../types';
import { dataService } from '../services/dataService';
import { useFeedback } from './ui/Feedback';
import Icon from './ui/Icon';
import { todayName, shortTime, timeAgo, formatShortDate, nextDateForDay, buildDateTime } from '../lib/dates';

interface DashboardProps {
  userId: string;
  role: UserRole;
  sport: SportType;
  members: Member[];
  clubId?: string;
  username: string;
  onNavigate: (tab: 'dashboard' | 'members' | 'schedule' | 'profile') => void;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard: React.FC<DashboardProps> = ({ userId, role, members, clubId, username, onNavigate }) => {
  const { toast } = useFeedback();
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget);
  const [nextBooking, setNextBooking] = useState<(Booking & { classes: Class }) | null>(null);
  const [todaysClasses, setTodaysClasses] = useState<Class[] | null>(null);
  const [activeAlert, setActiveAlert] = useState<ClubAlert | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [posting, setPosting] = useState(false);

  const isOwner = role === UserRole.OWNER;
  const firstName = username.split(' ')[0];

  useEffect(() => {
    const savedTarget = localStorage.getItem('mt_weekly_target');
    if (savedTarget) setWeeklyTarget(parseInt(savedTarget, 10));

    const savedAttendance = localStorage.getItem('mt_current_attendance');
    if (savedAttendance) setAttendanceCount(parseInt(savedAttendance, 10));
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [userId, clubId]);

  const loadDashboardData = async () => {
    if (!userId || !clubId) return;
    const [booking, alerts, classes] = await Promise.all([
      dataService.getNextBooking(userId, clubId),
      dataService.getAlerts(clubId).catch(() => []),
      dataService.getClasses(clubId),
    ]);
    setNextBooking(booking);
    setActiveAlert(alerts[0] ?? null);
    setTodaysClasses(classes.filter(c => c.day === todayName()));
  };

  const handlePostAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !broadcastText.trim()) return;
    setPosting(true);
    try {
      await dataService.postAlert(clubId, userId, broadcastText.trim());
      setBroadcastText('');
      const alerts = await dataService.getAlerts(clubId);
      if (alerts.length > 0) setActiveAlert(alerts[0]);
      toast('Announcement sent to your members');
    } catch (err) {
      toast("Couldn't post the announcement.", 'error');
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
    toast(newCount === weeklyTarget ? 'Weekly goal reached. Nice work.' : 'Session logged');
  };

  const progressPercent = Math.min((attendanceCount / weeklyTarget) * 100, 100);
  const targetHit = attendanceCount >= weeklyTarget;
  const lifetimeSessions = (members.find(m => m.id === userId)?.totalSessions || 0) + attendanceCount;
  const remaining = Math.max(weeklyTarget - attendanceCount, 0);

  const now = new Date();
  const today = nextDateForDay(todayName());

  return (
    <>
      {activeAlert && (
        <div className="banner" role="status">
          <div className="banner-icon">
            <Icon name="megaphone" size={18} />
          </div>
          <div className="flex-1">
            <p className="banner-title">Announcement · {timeAgo(activeAlert.created_at)}</p>
            <p className="banner-body">{activeAlert.title}</p>
            {activeAlert.body && <p className="banner-note">{activeAlert.body}</p>}
          </div>
          <button onClick={() => setActiveAlert(null)} className="banner-close" aria-label="Dismiss announcement">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <section className="hero">
        <p className="hero-eyebrow">{greeting()}, {firstName}</p>
        <h2 className="hero-name">
          {targetHit ? "You've hit your goal this week" : `${remaining} more session${remaining === 1 ? '' : 's'} to hit your goal`}
        </h2>
        <p className="hero-sub">Consistency beats intensity. Log every session you train.</p>
        <button onClick={handleCheckIn} className="btn btn-on-dark" style={{ marginTop: 18 }}>
          <Icon name="check" size={18} strokeWidth={2.5} />
          Log a session
        </button>
        <div className="hero-stats">
          <div>
            <p className="hero-stat-val">{lifetimeSessions.toLocaleString()}</p>
            <p className="hero-stat-lbl">Lifetime sessions</p>
          </div>
          <div>
            <p className="hero-stat-val">{Math.round(lifetimeSessions * 1.5).toLocaleString()}h</p>
            <p className="hero-stat-lbl">Mat time</p>
          </div>
          {isOwner && (
            <div>
              <p className="hero-stat-val">{members.length}</p>
              <p className="hero-stat-lbl">Members</p>
            </div>
          )}
        </div>
      </section>

      {!isOwner && nextBooking && (
        <section className="card card-p">
          <div className="row sb" style={{ marginBottom: 14 }}>
            <h3 className="section-lbl">Your next class</h3>
            <span className="badge green"><Icon name="check" size={12} strokeWidth={3} /> Booked</span>
          </div>
          <div className="row gap-3">
            <div className="card-inset col" style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--blue-vivid)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{nextBooking.classes.day.substring(0, 3)}</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.1 }}>{new Date(nextBooking.booking_date + 'T00:00').getDate()}</span>
            </div>
            <div className="flex-1">
              <h4 className="card-title">{nextBooking.classes.name}</h4>
              <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                {formatShortDate(nextBooking.booking_date + 'T00:00')} · {shortTime(nextBooking.classes.start_time)}–{shortTime(nextBooking.classes.end_time)}
              </p>
              <p className="muted" style={{ fontSize: '0.8125rem' }}>Coach {nextBooking.classes.instructor} · {nextBooking.classes.type}</p>
            </div>
          </div>
        </section>
      )}

      <section className="card card-p relative">
        <div className="row sb" style={{ marginBottom: 14 }}>
          <div>
            <p className="section-lbl">This week</p>
            <h3 className="card-title" style={{ marginTop: 2 }}>Training goal</h3>
          </div>
          <button
            onClick={() => { setTempTarget(weeklyTarget); setIsEditingTarget(true); }}
            className="btn-icon"
            aria-label="Edit weekly goal"
          >
            <Icon name="edit" size={16} />
          </button>
        </div>

        <div className="row gap-2" style={{ alignItems: 'baseline', marginBottom: 14 }}>
          <span className="big-num" style={{ color: targetHit ? 'var(--green-vivid)' : undefined }}>{attendanceCount}</span>
          <span className="muted" style={{ fontSize: '0.9375rem', fontWeight: 500 }}>of {weeklyTarget} sessions</span>
          <span className={`badge ${targetHit ? 'green' : 'blue'}`} style={{ marginLeft: 'auto' }}>{Math.round(progressPercent)}%</span>
        </div>

        {weeklyTarget <= 10 ? (
          <div className="goal-pips" aria-hidden="true">
            {Array.from({ length: weeklyTarget }, (_, i) => (
              <span key={i} className={`goal-pip ${i < attendanceCount ? 'on' : ''} ${targetHit ? 'done' : ''}`} />
            ))}
          </div>
        ) : (
          <div className="progress-track">
            <div className={`progress-fill ${targetHit ? 'done' : ''}`} style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        {isEditingTarget && (
          <div className="col" style={{ position: 'absolute', inset: 0, background: 'var(--sand-50)', padding: 16, zIndex: 5, gap: 12 }}>
            <div>
              <h4 className="card-title">Weekly goal</h4>
              <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>How many sessions a week are you aiming for?</p>
            </div>
            <div className="row gap-4" style={{ justifyContent: 'center', flex: 1 }}>
              <button onClick={() => setTempTarget(Math.max(1, tempTarget - 1))} className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.25rem' }} aria-label="Decrease">−</button>
              <span className="big-num" style={{ minWidth: 56, textAlign: 'center' }}>{tempTarget}</span>
              <button onClick={() => setTempTarget(Math.min(14, tempTarget + 1))} className="btn-icon" style={{ width: 44, height: 44, fontSize: '1.25rem' }} aria-label="Increase">+</button>
            </div>
            <div className="row gap-2">
              <button onClick={() => setIsEditingTarget(false)} className="btn btn-ghost btn-sm flex-1">Cancel</button>
              <button onClick={saveTarget} className="btn btn-primary btn-sm flex-1">Save goal</button>
            </div>
          </div>
        )}
      </section>

      <section className="col gap-2">
        <div className="section-head">
          <h3 className="section-lbl">Today's classes</h3>
          <button onClick={() => onNavigate('schedule')} className="link-btn accent">Full timetable <Icon name="chevronRight" size={14} /></button>
        </div>
        {todaysClasses === null ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : todaysClasses.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 16px' }}>No classes on the timetable today. Rest up.</div>
        ) : (
          <div className="card">
            {todaysClasses.map(c => {
              const finished = now >= buildDateTime(today, c.end_time);
              const live = !finished && now >= buildDateTime(today, c.start_time);
              return (
                <button key={c.id} onClick={() => onNavigate('schedule')} className="list-row" style={{ opacity: finished ? 0.55 : 1 }}>
                  <div className="row gap-3 flex-1">
                    <div className="class-time" style={{ minWidth: 44 }}>
                      <span className="class-time-start" style={{ fontSize: '0.875rem' }}>{shortTime(c.start_time)}</span>
                      <span className="class-time-end">{shortTime(c.end_time)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="list-label truncate">{c.name}</p>
                      <p className="list-detail">Coach {c.instructor} · {c.type}</p>
                    </div>
                  </div>
                  {live ? <span className="badge green">In progress</span> : finished ? <span className="badge">Done</span> : <span className="chevron"><Icon name="chevronRight" size={18} /></span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {isOwner && (
        <form className="card card-p col gap-3" onSubmit={handlePostAlert}>
          <div>
            <h3 className="card-title">Post an announcement</h3>
            <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>Shows at the top of every member's home screen.</p>
          </div>
          <div className="row gap-2">
            <input
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="e.g. Running 10 minutes late tonight"
              className="field flex-1"
              aria-label="Announcement text"
            />
            <button type="submit" disabled={posting || !broadcastText.trim()} className="btn btn-primary">
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default Dashboard;
