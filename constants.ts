
import { SportType, RankDefinition, ClassRecap } from './types';

export const SPORT_RANKS: Record<SportType, RankDefinition> = {
  'BJJ': {
    sport: 'BJJ',
    ranks: ['White', 'Blue', 'Purple', 'Brown', 'Black'],
    maxStripes: 4
  },
  'Judo': {
    sport: 'Judo',
    ranks: ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'],
    maxStripes: 0
  },
  'Wrestling': {
    sport: 'Wrestling',
    ranks: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
    maxStripes: 0
  },
  'No-Gi': {
    sport: 'No-Gi',
    ranks: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    maxStripes: 0
  }
};

export const MOCK_MEMBERS = [
  { id: '1', name: 'Alex Johnson', rank: 'Blue', stripes: 2, totalSessions: 45, joinDate: '2023-01-15', isPremium: true },
  { id: '2', name: 'Sarah Miller', rank: 'White', stripes: 3, totalSessions: 12, joinDate: '2023-11-02', isPremium: false },
  { id: '3', name: 'Marcus Aurelius', rank: 'Brown', stripes: 1, totalSessions: 230, joinDate: '2021-06-20', isPremium: true },
  { id: '4', name: 'Li Wei', rank: 'Purple', stripes: 0, totalSessions: 112, joinDate: '2022-03-10', isPremium: false },
  { id: '5', name: 'Chris Evans', rank: 'White', stripes: 0, totalSessions: 3, joinDate: '2024-02-01', isPremium: false },
];

export const MOCK_RECAPS: ClassRecap[] = [
  {
    id: 'r1',
    date: 'Yesterday, 18:45',
    className: 'Advanced Sparring',
    instructor: 'Marcus A.',
    type: 'Gi',
    techniques: ['De La Riva Entry', 'Berimbolo Basics', 'Back Take from DLR'],
    notes: 'Focused on hip mobility and weight distribution during the spin.'
  },
  {
    id: 'r2',
    date: 'Oct 22, 12:00',
    className: 'Lunchtime No-Gi',
    instructor: 'Sarah M.',
    type: 'No-Gi',
    techniques: ['Single Leg X Entry', 'Straight Ankle Lock Finish', 'SLX Sweep'],
    notes: 'Emphasis on keeping the elbow tight during the ankle lock tension.'
  },
  {
    id: 'r3',
    date: 'Oct 21, 17:30',
    className: 'Fundamentals',
    instructor: 'Alex J.',
    type: 'Gi',
    techniques: ['Closed Guard Retention', 'Scissor Sweep', 'Cross Collar Choke'],
    notes: 'Good attendance. Remember to keep the knee shield active!'
  }
];
