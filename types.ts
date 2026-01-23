
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
  isPremium: boolean;
}

export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  sortCode: string;
  bankName: string;
  isConnected: boolean;
}

export interface Club {
  id: string;
  customId: string;
  name: string;
  sport: SportType;
  ownerId: string;
  bankDetails?: BankDetails;
}

export interface Member {
  id: string;
  name: string;
  rank: string;
  stripes: number;
  lastAttendance?: string;
  totalSessions: number;
  joinDate: string;
  isPremium: boolean;
  // Added optional avatar_url to the Member interface
  avatar_url?: string;
}

export interface Class {
  id: string;
  club_id: string;
  name: string;
  instructor: string;
  day: string;
  time: string;
  type: 'Gi' | 'No-Gi';
  capacity?: number;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  date: string;
}

export interface ClassRecap {
  id: string;
  date: string;
  className: string;
  instructor: string;
  type: 'Gi' | 'No-Gi';
  techniques: string[];
  notes?: string;
}

export interface RankDefinition {
  sport: SportType;
  ranks: string[];
  maxStripes: number;
  labelType: 'Belt' | 'Rank' | 'Dan';
}