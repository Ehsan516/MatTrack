
import { Member, ClassRecap, UserRole, SportType } from '../types';
import { supabase } from './supabaseClient';

export const dataService = {
  // AUTHENTICATION
  async signUp(email: string, password: string, username: string) {
    // Fix: Using (supabase.auth as any) to resolve "Property 'signUp' does not exist" error
    const { data, error } = await (supabase.auth as any).signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    // Fix: Using (supabase.auth as any) to resolve "Property 'signInWithPassword' does not exist" error
    // Some versions use .signIn() or .signInWithPassword() depending on the specific SDK version
    const auth = supabase.auth as any;
    const signInMethod = auth.signInWithPassword || auth.signIn;
    const { data, error } = await signInMethod.call(auth, {
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, clubs(*)')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
    return data;
  },

  async createClub(ownerId: string, name: string, customId: string, sport: SportType) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert([{ name, custom_id: customId, sport, owner_id: ownerId }])
      .select()
      .single();

    if (clubError) throw clubError;

    // Fix: Using (supabase.auth as any).getUser() to resolve property error
    const { data: userData } = await (supabase.auth as any).getUser();
    const user = userData?.user;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: ownerId, 
        role: 'OWNER', 
        club_id: club.id, 
        username: user?.user_metadata?.username 
      }]);

    if (profileError) throw profileError;
    return club;
  },

  async joinClub(userId: string, customClubId: string) {
    // 1. Find the club by its user-facing custom ID
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('custom_id', customClubId)
      .single();

    if (clubError) throw new Error("Club not found. Please check the code.");

    // Fix: Using (supabase.auth as any).getUser() to resolve property error
    const { data: userData } = await (supabase.auth as any).getUser();
    const user = userData?.user;

    // 2. Link profile to this club
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: userId, 
        role: 'MEMBER', 
        club_id: club.id,
        username: user?.user_metadata?.username 
      }]);

    if (profileError) throw profileError;
    return club;
  },

  // MEMBERS & DATA
  async getMembers(clubId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('club_id', clubId);

    if (error) return [];

    return data.map(profile => ({
      id: profile.id,
      name: profile.username || 'Grappler',
      rank: profile.rank,
      stripes: profile.stripes,
      totalSessions: profile.total_sessions,
      joinDate: profile.created_at,
      isPremium: profile.is_premium
    }));
  },

  async getRecaps(clubId: string): Promise<ClassRecap[]> {
    const { data, error } = await supabase
      .from('class_recaps')
      .select('*')
      .eq('club_id', clubId)
      .order('date', { ascending: false });

    if (error) return [];

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
  }
};
