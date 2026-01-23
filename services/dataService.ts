
import { Member, ClassRecap, SportType } from '../types';
import { MOCK_MEMBERS, MOCK_RECAPS } from '../constants';

// This service is the "bridge". 
// Currently it uses LocalStorage, but you can swap these functions for 
// Supabase calls (e.g., supabase.from('members').select('*')) later.

export const dataService = {
  // MEMBERS
  async getMembers(): Promise<Member[]> {
    const saved = localStorage.getItem('mt_members');
    if (saved) return JSON.parse(saved);
    return MOCK_MEMBERS;
  },

  async updateMemberRank(memberId: string, rank: string, stripes: number): Promise<void> {
    const members = await this.getMembers();
    const updated = members.map(m => m.id === memberId ? { ...m, rank, stripes } : m);
    localStorage.setItem('mt_members', JSON.stringify(updated));
  },

  // RECAPS (The "Training Log")
  async getRecaps(): Promise<ClassRecap[]> {
    const saved = localStorage.getItem('mt_recaps');
    if (saved) return JSON.parse(saved);
    return MOCK_RECAPS;
  },

  async saveRecap(recap: Omit<ClassRecap, 'id'>): Promise<ClassRecap> {
    const recaps = await this.getRecaps();
    const newRecap = { ...recap, id: Math.random().toString(36).substr(2, 9) };
    const updated = [newRecap, ...recaps];
    localStorage.setItem('mt_recaps', JSON.stringify(updated));
    return newRecap;
  },

  // CLUB STATS
  async getAcademyStats() {
    // This would be a complex SQL query in a real backend
    const members = await this.getMembers();
    return {
      totalMembers: members.length,
      activeThisWeek: Math.floor(members.length * 0.7),
      revenue: members.filter(m => m.isPremium).length * 4.99
    };
  }
};
