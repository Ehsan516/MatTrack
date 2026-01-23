
import { Member, ClassRecap, UserRole, SportType, Class, Booking, Club } from '../types';
import { supabase } from './supabaseClient';

export const dataService = {
  // AUTHENTICATION
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await (supabase.auth as any).signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const auth = supabase.auth as any;
    const signInMethod = auth.signInWithPassword || auth.signIn;
    const { data, error } = await signInMethod.call(auth, {
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async verifyPassword(email: string, password: string) {
    // Supabase doesn't have a checkPassword, so we attempt a silent sign-in
    const { error } = await (supabase.auth as any).signInWithPassword({
      email,
      password,
    });
    return !error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, clubs(*)')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(userId: string, updates: { username?: string, rank?: string, stripes?: number, avatar_url?: string }) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  },

  async createClub(ownerId: string, name: string, customId: string, sport: SportType) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert([{ name, custom_id: customId, sport, owner_id: ownerId }])
      .select()
      .single();

    if (clubError) throw clubError;

    const { data: userData } = await (supabase.auth as any).getUser();
    const user = userData?.user;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: ownerId, 
        role: 'OWNER', 
        club_id: club.id, 
        username: user?.user_metadata?.username || 'New Owner',
        rank: 'White',
        stripes: 0
      }]);

    if (profileError) throw profileError;
    return club;
  },

  async joinClub(userId: string, customClubId: string) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('custom_id', customClubId)
      .single();

    if (clubError) throw new Error("Club not found. Please check the code.");

    const { data: userData } = await (supabase.auth as any).getUser();
    const user = userData?.user;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: userId, 
        role: 'MEMBER', 
        club_id: club.id,
        username: user?.user_metadata?.username || 'New Member',
        rank: 'White',
        stripes: 0
      }]);

    if (profileError) throw profileError;
    return club;
  },

  // DANGER ZONE ACTIONS
  async transferOwnership(clubId: string, currentOwnerId: string, newOwnerId: string) {
    // 1. Update Profile of New Owner
    const { error: newOwnerError } = await supabase
      .from('profiles')
      .update({ role: 'OWNER' })
      .eq('id', newOwnerId);
    if (newOwnerError) throw newOwnerError;

    // 2. Update Profile of Old Owner
    const { error: oldOwnerError } = await supabase
      .from('profiles')
      .update({ role: 'MEMBER' })
      .eq('id', currentOwnerId);
    if (oldOwnerError) throw oldOwnerError;

    // 3. Update Club Owner reference
    const { error: clubError } = await supabase
      .from('clubs')
      .update({ owner_id: newOwnerId })
      .eq('id', clubId);
    if (clubError) throw clubError;
  },

  async deleteClub(clubId: string) {
    // Cleanup related data
    await supabase.from('classes').delete().eq('club_id', clubId);
    await supabase.from('class_recaps').delete().eq('club_id', clubId);
    await supabase.from('profiles').update({ club_id: null, role: null }).eq('club_id', clubId);
    
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);
    if (error) throw error;
  },

  async deleteAccount(userId: string) {
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;
    await supabase.auth.signOut();
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
      rank: profile.rank || 'White',
      stripes: profile.stripes || 0,
      totalSessions: profile.total_sessions || 0,
      joinDate: profile.created_at,
      isPremium: profile.is_premium || false,
      avatar_url: profile.avatar_url
    }));
  },

  // CLASSES & SCHEDULING
  async getClasses(clubId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('club_id', clubId)
      .order('day', { ascending: true })
      .order('time', { ascending: true });

    if (error) return [];
    return data;
  },

  async createClass(clubId: string, classData: Omit<Class, 'id' | 'club_id'>): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .insert([{ club_id: clubId, ...classData }]);
    if (error) throw error;
  },

  async bookClass(userId: string, classId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, class_id: classId, date: new Date().toISOString() }]);
    if (error) throw error;
  },

  async getNextBooking(userId: string): Promise<(Booking & { classes: Class }) | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, classes(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  // RECAPS
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
