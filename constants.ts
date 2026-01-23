
import { SportType, RankDefinition, ClassRecap, Member } from './types';

export const SPORT_RANKS: Record<SportType, RankDefinition> = {
  'BJJ': {
    sport: 'BJJ',
    ranks: [
      'White', 'Blue', 'Purple', 'Brown', 'Black', 
      'Black Belt 1st Degree', 'Black Belt 2nd Degree', 'Black Belt 3rd Degree',
      'Black Belt 4th Degree', 'Black Belt 5th Degree', 'Black Belt 6th Degree',
      'Coral Belt (7th Degree)', 'Coral Belt (8th Degree)', 'Red Belt (9th/10th Degree)'
    ],
    maxStripes: 4,
    labelType: 'Belt'
  },
  'Judo': {
    sport: 'Judo',
    ranks: [
      'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 
      'Black (1st Dan)', 'Black (2nd Dan)', 'Black (3rd Dan)', 'Black (4th Dan)', 'Black (5th Dan)',
      'Red-and-White (6th Dan)', 'Red-and-White (7th Dan)', 'Red-and-White (8th Dan)',
      'Red (9th Dan)', 'Red (10th Dan)'
    ],
    maxStripes: 0,
    labelType: 'Belt'
  },
  'Karate': {
    sport: 'Karate',
    ranks: [
      'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 
      'Black (1st Dan)', 'Black (2nd Dan)', 'Black (3rd Dan)', 'Black (4th Dan)', 'Black (5th Dan)',
      'Black (6th Dan)', 'Black (7th Dan)', 'Black (8th Dan)', 'Black (9th Dan)', 'Black (10th Dan)'
    ],
    maxStripes: 0,
    labelType: 'Belt'
  },
  'Taekwondo': {
    sport: 'Taekwondo',
    ranks: [
      'White', 'Yellow', 'Green', 'Blue', 'Red', 
      'Black (1st Dan)', 'Black (2nd Dan)', 'Black (3rd Dan)', 'Black (4th Dan)', 'Black (5th Dan)',
      'Black (6th Dan)', 'Black (7th Dan)', 'Black (8th Dan)', 'Black (9th Dan)'
    ],
    maxStripes: 0,
    labelType: 'Belt'
  },
  'Wrestling': {
    sport: 'Wrestling',
    ranks: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
    maxStripes: 0,
    labelType: 'Rank'
  },
  'No-Gi': {
    sport: 'No-Gi',
    ranks: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    maxStripes: 0,
    labelType: 'Rank'
  }
};

export const MOCK_MEMBERS: Member[] = [];
export const MOCK_RECAPS: ClassRecap[] = [];
