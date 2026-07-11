import React, { useState, useEffect } from 'react';
import { UserRole, SportType, Member, Class, Booking, ClubAlert } from '../types';
import { dataService } from '../services/dataService';

interface DashboardProps {
  userId: string;
  role: UserRole;
  sport: SportType;
  members: Member[];
}

const Dashboard: React.FC<DashboardProps> = ({ userId, role, sport, members}) => {
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklyTarget);
  const [nextBooking, setNextBooking] = useState<(Booking & { classes: Class }) | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<ClubAlert | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [posting, setPosting] = useState(false);

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

      const memberships = await dataService.getUserMemberships(userId);
      if (memberships.length > 0) {
        const club = memberships[0].club_id;
        setClubId(club);
        const alerts = await dataService.getAlerts(club);
        if (alerts.length > 0) setActiveAlert(alerts[0]);
      }
    }
  };

  const handlePostAlert = async () => {
    if (!clubId || !broadcastText.trim()) return;
    setPosting(true);
    try {
      await dataService.postAlert(clubId, userId, broadcastText.trim());
      setBroadcastText('');
      const alerts = await dataService.getAlerts(clubId);
      if (alerts.length > 0) setActiveAlert(alerts[0]);
    } catch (err) {
      alert('Failed to post alert.');
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
  };

  const progressPercent = Math.min((attendanceCount / weeklyTarget) * 100, 100);
  const targetHit = attendanceCount >= weeklyTarget;
  const lifetimeSessions = (members.find(m => m.id === userId)?.totalSessions || 0) + attendanceCount;

  return (
    <>
      {/* High Priority Alert Banner */}
      {activeAlert && (
        <div className="banner">
          <div className="banner-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <div className="flex-1">
            <p className="banner-title">Coach Broadcast</p>
            <p className="banner-body">{activeAlert.title}</p>
            {activeAlert.body && <p style={{ fontSize: '0.75rem', color: 'var(--ink-500)', marginTop: 4 }}>{activeAlert.body}</p>}
          </div>
          <button onClick={() => setActiveAlert(null)} className="banner-close" aria-label="Dismiss">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Hero Welcome */}
      <section className="hero">
        <div className="relative">
          <p className="hero-eyebrow">Oss, {role === UserRole.OWNER ? 'Coach' : 'Champ'}</p>
          <h2 className="hero-name">Consistency beats intensity</h2>
          <p className="hero-sub">Every session counts.</p>
          <button onClick={handleCheckIn} className="btn" style={{ marginTop: 20, background: '#fff', color: 'var(--blue-vivid)', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
            Check-in Session
          </button>
        </div>
      </section>

      {/* Owner broadcast composer */}
      {role === UserRole.OWNER && (
        <section className="card card-p col gap-3">
          <h3 className="section-lbl" style={{ padding: 0, color: 'var(--blue-vivid)' }}>Broadcast to Team</h3>
          <div className="row gap-2">
            <input
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePostAlert(); }}
              placeholder="e.g. Coach running 10 mins late, sorry!"
              className="field flex-1"
            />
            <button onClick={handlePostAlert} disabled={posting || !broadcastText.trim()} className="btn btn-primary">
              {posting ? '...' : 'Post'}
            </button>
          </div>
        </section>
      )}

      {/* Your Next Class */}
      {role === UserRole.MEMBER && nextBooking && (
        <section className="card card-p">
          <div className="row sb mt-1" style={{ marginBottom: 16 }}>
            <h3 className="section-lbl" style={{ padding: 0, color: 'var(--blue-vivid)' }}>Upcoming Appointment</h3>
            <span className="badge green">Confirmed</span>
          </div>
          <div className="row gap-3">
            <div className="card-inset col" style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--blue-vivid)', lineHeight: 1 }}>{nextBooking.classes.start_time.split(':')[0]}</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase' }}>{nextBooking.classes.day.substring(0,3)}</span>
            </div>
            <div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--ink-900)' }}>{nextBooking.classes.name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: 2 }}>with Coach {nextBooking.classes.instructor} • {nextBooking.classes.type}</p>
            </div>
          </div>
        </section>
      )}

      {/* Main Stats Row */}
      <div className="g2">
        <div className="card card-p relative" style={{ gridColumn: '1 / -1' }}>
          <div className="row sb" style={{ marginBottom: 20 }}>
            <div>
              <p className="section-lbl" style={{ padding: 0 }}>Training Target</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ink-900)' }}>Weekly Goal</h3>
            </div>
            <button
              onClick={() => { setTempTarget(weeklyTarget); setIsEditingTarget(true); }}
              className="btn-icon"
              aria-label="Edit weekly goal"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          </div>

          <div className="row gap-2" style={{ alignItems: 'flex-end', marginBottom: 20 }}>
            <h3 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: targetHit ? 'var(--green-vivid)' : 'var(--ink-900)' }}>
              {attendanceCount}
            </h3>
            <span className="section-lbl" style={{ padding: 0, paddingBottom: 8 }}>/ {weeklyTarget} SESSIONS</span>
          </div>

          <div className="col gap-3">
            <div className="progress-track">
              <div className={`progress-fill ${targetHit ? 'done' : ''}`} style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="row sb">
              <p className="section-lbl" style={{ padding: 0 }}>
                {targetHit ? 'Target Achieved! 🔥' : 'Consistency is key'}
              </p>
              <span className="badge blue">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Goal Edit Overlay */}
          {isEditingTarget && (
            <div className="col" style={{ position: 'absolute', inset: 0, background: 'var(--sand-50)', borderRadius: 'var(--radius-lg)', padding: 24, zIndex: 5 }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink-900)' }}>Adjust Goal</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: 6 }}>How many sessions a week do you want to hit? Set a realistic pace.</p>

              <div className="row gap-3" style={{ justifyContent: 'center', alignItems: 'center', margin: 'auto 0' }}>
                <button onClick={() => setTempTarget(Math.max(1, tempTarget - 1))} className="btn-icon" style={{ width: 52, height: 52, fontSize: '1.5rem' }}>−</button>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ink-900)', minWidth: 64, textAlign: 'center' }}>{tempTarget}</span>
                <button onClick={() => setTempTarget(tempTarget + 1)} className="btn-icon" style={{ width: 52, height: 52, fontSize: '1.5rem' }}>+</button>
              </div>

              <div className="row gap-2">
                <button onClick={() => setIsEditingTarget(false)} className="btn btn-ghost flex-1">Cancel</button>
                <button onClick={saveTarget} className="btn btn-primary flex-1">Update Goal</button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="stat">
          <p className="stat-val">{lifetimeSessions}</p>
          <p className="stat-lbl">Lifetime Mats</p>
        </div>
        <div className="stat">
          <p className="stat-val">{(lifetimeSessions * 1.5).toFixed(0)}h</p>
          <p className="stat-lbl">Mat Hours</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
