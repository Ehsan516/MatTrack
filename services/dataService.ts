
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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async verifyPassword(email: string, password: string) {
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
      .select('*')
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

  // MULTI-CLUB MEMBERSHIPS
  async getUserMemberships(userId: string) {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, clubs(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async createClub(ownerId: string, name: string, customId: string, sport: SportType) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert([{ name, custom_id: customId, sport, owner_id: ownerId }])
      .select()
      .single();

    if (clubError) throw clubError;

    const { error: memError } = await supabase
      .from('memberships')
      .insert([{ user_id: ownerId, club_id: club.id, role: 'OWNER' }]);

    if (memError) throw memError;

    const { data: userData } = await (supabase.auth as any).getUser();
    await supabase.from('profiles').upsert([{ 
      id: ownerId, 
      username: userData?.user?.user_metadata?.username || 'New Owner'
    }]);

    return club;
  },

  async joinClub(userId: string, customClubId: string) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('custom_id', customClubId)
      .single();

    if (clubError) throw new Error("Club not found. Please check the code.");

    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', club.id)
      .maybeSingle();

    if (existing) throw new Error("You are already a member of this academy.");

    const { error: memError } = await supabase
      .from('memberships')
      .insert([{ user_id: userId, club_id: club.id, role: 'MEMBER' }]);

    if (memError) throw memError;

    const { data: userData } = await (supabase.auth as any).getUser();
    await supabase.from('profiles').upsert([{ 
      id: userId, 
      username: userData?.user?.user_metadata?.username || 'New Member'
    }]);

    return club;
  },

  async leaveClub(userId: string, clubId: string) {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
    if (error) throw error;
  },

  async removeMember(clubId: string, memberId: string) {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', memberId)
      .eq('club_id', clubId);
    if (error) throw error;
  },

  // DANGER ZONE ACTIONS
  async transferOwnership(clubId: string, currentOwnerId: string, newOwnerId: string) {
    await supabase.from('memberships').update({ role: 'OWNER' }).eq('user_id', newOwnerId).eq('club_id', clubId);
    await supabase.from('memberships').update({ role: 'MEMBER' }).eq('user_id', currentOwnerId).eq('club_id', clubId);
    await supabase.from('clubs').update({ owner_id: newOwnerId }).eq('id', clubId);
  },

  async deleteClub(clubId: string) {
    await supabase.from('classes').delete().eq('club_id', clubId);
    await supabase.from('class_recap').delete().eq('club_id', clubId);
    await supabase.from('memberships').delete().eq('club_id', clubId);
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) throw error;
  },

  async deleteAccount(userId: string) {
    await supabase.from('memberships').delete().eq('user_id', userId);
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) throw profileError;
    await supabase.auth.signOut();
  },

  // MEMBERS & DATA
  async getMembers(clubId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('user_id, role, profiles(*)')
      .eq('club_id', clubId);

    if (error || !data) return [];

    return data.map((m: any) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        id: m.user_id,
        name: p?.username || 'Grappler',
        rank: p?.rank || 'White',
        stripes: p?.stripes || 0,
        totalSessions: p?.total_sessions || 0,
        joinDate: p?.created_at,
        isPremium: p?.is_premium || false,
        avatar_url: p?.avatar_url,
        role: m.role
      };
    });
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

  async updateClass(classId: string, classData: Partial<Class>): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', classId);
    if (error) throw error;
  },

  async getBookingCount(classId: string, date: string): Promise<number> {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('date', date);
    
    if (error) return 0;
    return count || 0;
  },

  async getClassAttendees(classId: string, date: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('user_id, profiles(*)')
      .eq('class_id', classId)
      .eq('date', date);

    if (error || !data) return [];
    
    return data.map((b: any) => {
      const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      return {
        id: b.user_id,
        name: p?.username || 'Grappler',
        rank: p?.rank || 'White',
        stripes: p?.stripes || 0,
        totalSessions: p?.total_sessions || 0,
        joinDate: p?.created_at,
        isPremium: p?.is_premium || false,
        avatar_url: p?.avatar_url
      };
    });
  },

  async bookClass(userId: string, classId: string, date: string): Promise<void> {
    // 1. Check if already booked
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classId)
      .eq('date', date)
      .maybeSingle();

    if (existing) throw new Error("Already booked for this session.");

    // 2. Check capacity
    const { data: classObj } = await supabase
      .from('classes')
      .select('capacity')
      .eq('id', classId)
      .single();

    if (classObj && classObj.capacity) {
      const count = await this.getBookingCount(classId, date);
      if (count >= classObj.capacity) {
        throw new Error("FULL"); // Custom signal for full class
      }
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, class_id: classId, date }]);
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
      .from('class_recap')
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
      .from('class_recap')
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
