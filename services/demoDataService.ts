import type { DataService, AuthEvent } from './dataService';
import type { Class, ClassRecap, ClubAlert, Member, SportType } from '../types';
import { nextDateForDay, toLocalISODate } from '../lib/dates';

/**
 * In-memory stand-in for Supabase, used when IS_DEMO is on. Seeded with a
 * realistic academy so every screen has something to show. State resets on reload.
 */

const DEMO_USER = 'demo-user';

interface Profile {
  id: string;
  username: string;
  rank: string;
  stripes: number;
  total_sessions: number;
  avatar_url?: string | null;
  created_at: string;
}

interface Club { id: string; name: string; custom_id: string; sport: SportType; owner_id: string }
interface Membership { id: string; user_id: string; club_id: string; role: 'OWNER' | 'MEMBER'; created_at: string }
interface BookingRow { id: string; user_id: string; class_id: string; booking_date: string; created_at: string }

let seq = 0;
const uid = (prefix: string) => `${prefix}-${++seq}`;
const daysAgo = (n: number, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();
const wait = (ms = 120) => new Promise(r => setTimeout(r, ms));

const profiles: Profile[] = [
  { id: DEMO_USER, username: 'Alex Morgan', rank: 'Brown', stripes: 2, total_sessions: 412, created_at: daysAgo(900) },
  ['Maya Chen', 'Purple', 3, 268],
  ['Diego Santos', 'Blue', 2, 174],
  ['Priya Patel', 'White', 4, 96],
  ['Sam Okafor', 'Blue', 0, 121],
  ['Lena Fischer', 'Brown', 1, 356],
  ['Tom Reilly', 'White', 1, 38],
  ['Aisha Khan', 'Blue', 3, 203],
  ['Marcus Webb', 'Purple', 1, 241],
  ['Hana Sato', 'White', 2, 64],
  ['Chris Doyle', 'Black Belt 1st Degree', 0, 890],
  ['Ella Novak', 'White', 0, 12],
  ['Jonah Price', 'Blue', 1, 142],
  ['Kenji Watanabe', 'Black (3rd Dan)', 0, 1120],
  ['Sofia Russo', 'Green', 0, 88],
  ['Omar Haddad', 'Orange', 0, 45],
].map((p, i) =>
  Array.isArray(p)
    ? { id: `m${i}`, username: p[0] as string, rank: p[1] as string, stripes: p[2] as number, total_sessions: p[3] as number, created_at: daysAgo(30 + i * 23) }
    : p
);

const clubs: Club[] = [
  { id: 'club-northside', name: 'Northside Jiu-Jitsu', custom_id: 'NORTHSIDE-BJJ', sport: 'BJJ', owner_id: DEMO_USER },
  { id: 'club-riverside', name: 'Riverside Judo Club', custom_id: 'RIVERSIDE-JUDO', sport: 'Judo', owner_id: 'm13' },
];

const memberships: Membership[] = [
  { id: uid('ms'), user_id: DEMO_USER, club_id: 'club-northside', role: 'OWNER', created_at: daysAgo(900) },
  ...['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'].map((id, i) => ({
    id: uid('ms'), user_id: id, club_id: 'club-northside', role: 'MEMBER' as const, created_at: daysAgo(20 + i * 31),
  })),
  { id: uid('ms'), user_id: 'm13', club_id: 'club-riverside', role: 'OWNER', created_at: daysAgo(1400) },
  { id: uid('ms'), user_id: DEMO_USER, club_id: 'club-riverside', role: 'MEMBER', created_at: daysAgo(120) },
  { id: uid('ms'), user_id: 'm14', club_id: 'club-riverside', role: 'MEMBER', created_at: daysAgo(200) },
  { id: uid('ms'), user_id: 'm15', club_id: 'club-riverside', role: 'MEMBER', created_at: daysAgo(60) },
];

type Seed = [day: string, start: string, end: string, name: string, instructor: string, type: 'Gi' | 'No-Gi', capacity: number, booked: number];

const northsideSeed: Seed[] = [
  ['Monday', '06:30', '07:30', 'Morning Fundamentals', 'Alex Morgan', 'Gi', 16, 7],
  ['Monday', '18:00', '19:30', 'All Levels Gi', 'Chris Doyle', 'Gi', 24, 12],
  ['Monday', '19:30', '20:30', 'Advanced No-Gi', 'Alex Morgan', 'No-Gi', 18, 9],
  ['Tuesday', '12:00', '13:00', 'Lunchtime No-Gi', 'Lena Fischer', 'No-Gi', 14, 6],
  ['Tuesday', '18:30', '20:00', 'Competition Team', 'Alex Morgan', 'Gi', 10, 10],
  ['Wednesday', '06:30', '07:30', 'Morning Fundamentals', 'Alex Morgan', 'Gi', 16, 5],
  ['Wednesday', '18:00', '19:30', 'Fundamentals Gi', 'Chris Doyle', 'Gi', 24, 11],
  ['Thursday', '18:00', '19:30', 'Leg Lock Lab', 'Lena Fischer', 'No-Gi', 18, 8],
  ['Thursday', '19:30', '20:30', 'Positional Sparring', 'Alex Morgan', 'Gi', 20, 12],
  ['Friday', '18:00', '19:00', 'All Levels Gi', 'Chris Doyle', 'Gi', 24, 9],
  ['Saturday', '10:00', '11:00', 'Fundamentals Gi', 'Alex Morgan', 'Gi', 24, 10],
  ['Saturday', '11:00', '12:30', 'Open Mat', 'Alex Morgan', 'Gi', 30, 12],
];

const riversideSeed: Seed[] = [
  ['Tuesday', '19:00', '20:30', 'Randori Night', 'Kenji Watanabe', 'Gi', 20, 3],
  ['Thursday', '19:00', '20:30', 'Throws & Transitions', 'Kenji Watanabe', 'Gi', 20, 3],
  ['Saturday', '09:00', '10:30', 'Kata & Technique', 'Kenji Watanabe', 'Gi', 16, 2],
];

const classes: Class[] = [];
const bookings: BookingRow[] = [];

const seedClasses = (clubId: string, seed: Seed[]) => {
  const roster = memberships.filter(m => m.club_id === clubId && m.role === 'MEMBER' && m.user_id !== DEMO_USER).map(m => m.user_id);
  seed.forEach(([day, start_time, end_time, name, instructor, type, capacity, booked], i) => {
    const cls: Class = { id: uid('class'), club_id: clubId, name, instructor, day, start_time, end_time, type, capacity };
    classes.push(cls);
    const date = toLocalISODate(nextDateForDay(day));
    for (let n = 0; n < Math.min(booked, roster.length); n++) {
      const user = roster[(n + i * 3) % roster.length];
      bookings.push({ id: uid('bk'), user_id: user, class_id: cls.id, booking_date: date, created_at: hoursAgo(n + 1) });
    }
  });
};
seedClasses('club-northside', northsideSeed);
seedClasses('club-riverside', riversideSeed);

const recaps: ClassRecap[] = [
  {
    id: uid('recap'), club_id: 'club-northside', className: 'All Levels Gi', instructor: 'Chris Doyle', type: 'Gi', date: daysAgo(1, 20),
    techniques: ['Collar sleeve guard', 'Balloon sweep', 'Triangle from sleeve control'],
    notes: 'Keep the collar grip tight and your foot on the bicep. Most sweeps failed because the grip was released too early.',
  },
  {
    id: uid('recap'), club_id: 'club-northside', className: 'Leg Lock Lab', instructor: 'Lena Fischer', type: 'No-Gi', date: daysAgo(3, 20),
    techniques: ['Inside heel hook', 'Saddle entry from SLX', 'Heel exposure drills'],
    notes: 'Control the knee line before you look for the heel. Spin with your partner, not against them.',
  },
  {
    id: uid('recap'), club_id: 'club-northside', className: 'Morning Fundamentals', instructor: 'Alex Morgan', type: 'Gi', date: daysAgo(5, 8),
    techniques: ['Scissor sweep', 'Cross collar choke', 'Hip escape to guard recovery'],
  },
  {
    id: uid('recap'), club_id: 'club-riverside', className: 'Throws & Transitions', instructor: 'Kenji Watanabe', type: 'Gi', date: daysAgo(2, 20),
    techniques: ['Osoto gari', 'Kuzushi drills', 'Transition to kesa gatame'],
  },
];

const alerts: ClubAlert[] = [
  { id: uid('alert'), club_id: 'club-northside', created_by: DEMO_USER, title: 'Open mat moves to 11:00 this Saturday', body: 'Fundamentals still starts at 10:00. Bring water, it will be a long one.', created_at: hoursAgo(3) },
  { id: uid('alert'), club_id: 'club-riverside', created_by: 'm13', title: 'Grading on the 14th', body: 'Speak to Kenji if you want to be considered.', created_at: hoursAgo(20) },
];

// The demo member has a Riverside class booked so the "Next class" card has something to show.
{
  const thursday = classes.find(c => c.club_id === 'club-riverside' && c.day === 'Thursday')!;
  bookings.push({ id: uid('bk'), user_id: DEMO_USER, class_id: thursday.id, booking_date: toLocalISODate(nextDateForDay('Thursday')), created_at: hoursAgo(5) });
}

let signedIn = true;
const listeners = new Set<(event: AuthEvent, userId: string | null) => void>();
const emit = (event: AuthEvent) => listeners.forEach(cb => cb(event, signedIn ? DEMO_USER : null));

const toMember = (userId: string, extra: Partial<Member> = {}): Member => {
  const p = profiles.find(x => x.id === userId);
  return {
    id: userId,
    name: p?.username || 'Grappler',
    rank: p?.rank || 'White',
    stripes: p?.stripes || 0,
    totalSessions: p?.total_sessions || 0,
    joinDate: p?.created_at || '',
    avatar_url: p?.avatar_url || undefined,
    ...extra,
  };
};

const withClub = (m: Membership) => ({ ...m, clubs: clubs.find(c => c.id === m.club_id)! });

export const demoDataService: DataService = {
  async signUp() { await wait(); return {} as any; },
  async verifyEmail() { await wait(); signedIn = true; emit('SIGNED_IN'); return {} as any; },
  async resendVerification() { await wait(); },
  async signIn() {
    await wait(300);
    signedIn = true;
    emit('SIGNED_IN');
    return { user: { id: DEMO_USER } } as any;
  },
  async signOut() { await wait(); signedIn = false; emit('SIGNED_OUT'); },
  async getSessionUserId() { return signedIn ? DEMO_USER : null; },
  onAuthStateChange(callback) {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  },
  async sendPasswordReset() { await wait(); },
  async getSessionEmail() { return 'alex@northside-bjj.com'; },
  async uploadAvatar(_userId, file) { await wait(); return URL.createObjectURL(file); },

  async getProfile(userId) { await wait(); return profiles.find(p => p.id === userId) ?? null; },
  async updateProfile(userId, updates) {
    await wait(60);
    const p = profiles.find(x => x.id === userId);
    if (p) Object.assign(p, updates);
    else profiles.push({ id: userId, username: 'Grappler', rank: 'White', stripes: 0, total_sessions: 0, created_at: new Date().toISOString(), ...updates });
  },

  async getUserMemberships(userId) {
    await wait();
    return memberships.filter(m => m.user_id === userId).map(withClub);
  },

  async createClub(ownerId, name, customId, sport) {
    await wait();
    if (clubs.some(c => c.custom_id === customId)) throw new Error('That academy code is already taken.');
    const club: Club = { id: uid('club'), name, custom_id: customId || name.toUpperCase().replace(/\W+/g, '-'), sport, owner_id: ownerId };
    clubs.push(club);
    memberships.push({ id: uid('ms'), user_id: ownerId, club_id: club.id, role: 'OWNER', created_at: new Date().toISOString() });
    return club;
  },
  async updateClub(clubId, updates) { const c = clubs.find(x => x.id === clubId); if (c) Object.assign(c, updates); },
  async updateMembershipRole(clubId, userId, role) {
    const m = memberships.find(x => x.club_id === clubId && x.user_id === userId);
    if (m) m.role = role as Membership['role'];
  },
  async transferClubOwnership(clubId, newOwnerId) {
    await wait();
    const club = clubs.find(c => c.id === clubId)!;
    memberships.forEach(m => {
      if (m.club_id !== clubId) return;
      if (m.user_id === club.owner_id) m.role = 'MEMBER';
      if (m.user_id === newOwnerId) m.role = 'OWNER';
    });
    club.owner_id = newOwnerId;
  },
  async deleteClub(clubId) {
    await wait();
    const drop = <T,>(arr: T[], pred: (x: T) => boolean) => { for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) arr.splice(i, 1); };
    drop(clubs, c => c.id === clubId);
    drop(memberships, m => m.club_id === clubId);
    drop(classes, c => c.club_id === clubId);
  },
  async deleteAccount() { await wait(); throw new Error('Account deletion is disabled in the demo.'); },

  async joinClub(userId, customClubId) {
    await wait();
    const club = clubs.find(c => c.custom_id === customClubId);
    if (!club) throw new Error('No academy found with that code.');
    if (memberships.some(m => m.user_id === userId && m.club_id === club.id)) throw new Error('You are already a member of this academy.');
    memberships.push({ id: uid('ms'), user_id: userId, club_id: club.id, role: 'MEMBER', created_at: new Date().toISOString() });
    return club;
  },

  async getMembers(clubId) {
    await wait();
    return memberships
      .filter(m => m.club_id === clubId)
      .map(m => toMember(m.user_id, { role: m.role, joinDate: m.created_at }));
  },
  async removeMember(clubId, userId) {
    await wait();
    const i = memberships.findIndex(m => m.club_id === clubId && m.user_id === userId);
    if (i >= 0) memberships.splice(i, 1);
  },

  async getClasses(clubId) {
    await wait();
    return classes.filter(c => c.club_id === clubId).sort((a, b) => a.start_time.localeCompare(b.start_time));
  },
  async createClass(clubId, data) { await wait(); classes.push({ id: uid('class'), club_id: clubId, ...data }); },
  async deleteClass(classId) {
    await wait();
    const i = classes.findIndex(c => c.id === classId);
    if (i >= 0) classes.splice(i, 1);
  },
  async updateClass(classId, updates) { const c = classes.find(x => x.id === classId); if (c) Object.assign(c, updates); },

  async getBookingCount(classId, date) {
    return bookings.filter(b => b.class_id === classId && b.booking_date === date).length;
  },
  async getClassAttendees(classId, date) {
    await wait();
    return bookings.filter(b => b.class_id === classId && b.booking_date === date).map(b => toMember(b.user_id));
  },
  async bookClass(userId, classId, date) {
    await wait();
    if (bookings.some(b => b.user_id === userId && b.class_id === classId && b.booking_date === date)) {
      throw new Error("You're already booked into this class.");
    }
    bookings.push({ id: uid('bk'), user_id: userId, class_id: classId, booking_date: date, created_at: new Date().toISOString() });
  },
  async getNextBooking(userId, clubId) {
    await wait();
    const today = toLocalISODate(new Date());
    const next = bookings
      .filter(b => b.user_id === userId && b.booking_date >= today)
      .map(b => ({ ...b, classes: classes.find(c => c.id === b.class_id)! }))
      .filter(b => b.classes?.club_id === clubId)
      .sort((a, b) => (a.booking_date + a.classes.start_time).localeCompare(b.booking_date + b.classes.start_time))[0];
    return next ?? null;
  },

  async postAlert(clubId, userId, title, body) {
    await wait();
    alerts.unshift({ id: uid('alert'), club_id: clubId, created_by: userId, title, body: body ?? null, created_at: new Date().toISOString() });
  },
  async getAlerts(clubId) { await wait(); return alerts.filter(a => a.club_id === clubId); },

  async saveRecap(clubId, recap) {
    await wait();
    recaps.unshift({ id: uid('recap'), club_id: clubId, date: new Date().toISOString(), ...recap });
  },
  async getRecaps(clubId) { await wait(); return recaps.filter(r => r.club_id === clubId); },
};
