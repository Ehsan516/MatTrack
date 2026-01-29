
export type SportType = 'BJJ' | 'Judo' | 'Karate' | 'Taekwondo' | 'Wrestling' | 'No-Gi';

export enum UserRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER'
}

export type AuthStep = 'LOGIN' | 'SIGNUP' | 'VERIFY' | 'ROLE_SELECT' | 'CLUB_SETUP' | 'JOIN_CLUB' | 'AUTHENTICATED';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: UserRole | 'ADMIN';
  clubId?: string;
  is_premium_owner: boolean;
  is_premium_member: boolean;
}

export interface Member {
  id: string;
  name: string;
  rank: string;
  stripes: number;
  lastAttendance?: string;
  totalSessions: number;
  joinDate: string;
  is_premium_member: boolean;
  avatar_url?: string;
  role?: string;
}

export interface ClubAlert {
  id: string;
  club_id: string;
  message: string;
  type: 'urgent' | 'info' | 'delay';
  created_at: string;
}

export interface TrainingEvent {
  id: string;
  club_id: string;
  title: string;
  event_date: string;
  prep_start_date: string;
  target_sessions: number;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string;
  mood: 'focused' | 'tired' | 'beast' | 'injured';
}

export interface Class {
  id: string;
  club_id: string;
  name: string;
  instructor: string;
  day: string;
  start_time: string;
  end_time: string;
  type: 'Gi' | 'No-Gi';
  capacity?: number;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  date: string;
}

export interface RankDefinition {
  sport: SportType;
  ranks: string[];
  maxStripes: number;
  labelType: 'Belt' | 'Rank' | 'Dan';
}

export interface ClassRecap {
  id: string;
  club_id: string;
  className: string;
  instructor: string;
  type: 'Gi' | 'No-Gi';
  techniques: string[];
  notes?: string;
  date: string;
}

export interface Club {
  id: string;
  name: string;
  custom_id: string;
  sport: SportType;
  owner_id: string;
}
