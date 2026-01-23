
export type SportType = 'BJJ' | 'Judo' | 'Wrestling' | 'No-Gi';

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
  id: string; // Internal UUID
  customId: string; // The user-facing ID like 'GB-LDN'
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
}

export interface TrainingSession {
  id: string;
  date: string;
  type: string;
  attendees: string[]; // Member IDs
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
}
