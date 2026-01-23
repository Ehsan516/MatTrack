
import { Member, ClassRecap, SportType } from '../types';
import { supabase } from './supabaseClient';

export const dataService = {
  // MEMBERS
  async getMembers(clubId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('club_id', clubId);

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }

    return data.map(profile => ({
      id: profile.id,
      name: profile.username || 'Anonymous',
      rank: profile.rank,
      stripes: profile.stripes,
      totalSessions: profile.total_sessions,
      joinDate: profile.created_at,
      isPremium: profile.is_premium
    }));
  },

  async updateMemberRank(memberId: string, rank: string, stripes: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ rank, stripes, updated_at: new Date() })
      .eq('id', memberId);

    if (error) throw error;
  },

  // RECAPS
  async getRecaps(clubId: string): Promise<ClassRecap[]> {
    const { data, error } = await supabase
      .from('class_recaps')
      .select('*')
      .eq('club_id', clubId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching recaps:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      className: item.class_name,
      instructor: item.instructor,
      type: item.type,
      techniques: item.techniques,
      notes: item.notes
    }));
  },

  async saveRecap(clubId: string, recap: Omit<ClassRecap, 'id' | 'date'>): Promise<void> {
    const { error } = await supabase
      .from('class_recaps')
      .insert([{
        club_id: clubId,
        class_name: recap.className,
        instructor: recap.instructor,
        type: recap.type,
        techniques: recap.techniques,
        notes: recap.notes,
        date: new Date()
      }]);

    if (error) throw error;
  },

  // AUTH HELPERS (Simulated for this demo, usually handled by supabase.auth)
  async signIn(email: string) {
    // In a real app: await supabase.auth.signInWithOtp({ email })
    console.log('Signing in user:', email);
  }
};
