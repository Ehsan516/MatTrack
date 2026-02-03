
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
}

export interface Member {
  id: string;
  name: string;
  rank: string;
  stripes: number;
  lastAttendance?: string;
  totalSessions: number;
  joinDate: string;
  avatar_url?: string;
  role?: string;
}

export interface ClubAlert {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  body?: string | null;
  created_at: string;
}

export interface TrainingEvent {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  start_at: string;
  end_at?: string | null;
  notes?: string | null;
  created_at: string;
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
  booking_date: string; // YYYY-MM-DD
  created_at: string;
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
