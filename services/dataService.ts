import {
  Member,
  ClassRecap,
  UserRole,
  SportType,
  Class,
  Booking,
  Club,
  ClubAlert,
} from "../types";
import { supabase } from "./supabaseClient";

export const dataService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await (supabase.auth as any).signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    return data;
  },

  async verifyEmail(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) throw error;
    return data;
  },

  async resendVerification(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
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

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...updates }, { onConflict: "id" });
    if (error) throw error;
  },

  async getUserMemberships(userId: string) {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, clubs(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

async createClub(
  ownerId: string,
  name: string,
  customId: string,
  sport: SportType
) {
  // 1) create club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert([{ name, custom_id: customId, sport, owner_id: ownerId }])
    .select()
    .single();

  if (clubError) throw clubError;
  if (!club) throw new Error("Club insert returned no data.");

  // 2) create membership row
  const { error: membershipError } = await supabase
    .from("memberships")
    .insert([{ user_id: ownerId, club_id: club.id, role: "OWNER" }]);

  if (membershipError) throw membershipError;

  // 3) update profile to point at club
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: ownerId, club_id: club.id, role: "OWNER" },
      { onConflict: "id" }
    );

  if (profileError) throw profileError;

  return club;
},

  async updateClub(clubId: string, updates: any) {
    const { error } = await supabase.from("clubs").update(updates).eq("id", clubId);
    if (error) throw error;
  },

  async updateMembershipRole(clubId: string, userId: string, role: string) {
    const { error } = await supabase
      .from("memberships")
      .update({ role })
      .eq("club_id", clubId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  /**
   * Atomic ownership transfer (recommended).
   * Requires SQL RPC function: public.transfer_club_ownership(club_id uuid, new_owner_id uuid)
   */
  async transferClubOwnership(clubId: string, newOwnerId: string) {
    const { error } = await supabase.rpc("transfer_club_ownership", {
      club_id: clubId,
      new_owner_id: newOwnerId,
    });
    if (error) throw error;
  },

  async deleteClub(clubId: string) {
    // Requires SQL RPC function: public.delete_club(club_id uuid)
    const { error } = await supabase.rpc("delete_club", { club_id: clubId });
    if (error) throw error;
  },

  /**
   * Deletes the authenticated user's account.
   * Implement as an Edge Function and call it from the client.
   */
  async deleteAccount() {
    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: {},
    });
    if (error) throw error;
    return data;
  },

async joinClub(userId: string, customClubId: string) {
  // 1) find club by custom_id
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("custom_id", customClubId)
    .single();

  if (clubError) throw new Error("Club not found.");
  if (!club) throw new Error("Club lookup returned no data.");

  // 2) insert membership
  const { error: membershipError } = await supabase
    .from("memberships")
    .insert([{ user_id: userId, club_id: club.id, role: "MEMBER" }]);

  if (membershipError) throw membershipError;

  // 3) update profile
  const { error: profileError } = await supabase
  .from("profiles")
  .upsert(
    { id: userId, club_id: club.id, role: "MEMBER" },
    { onConflict: "id" }
  );


  if (profileError) throw profileError;

  return club;
},

  async getMembers(clubId: string): Promise<Member[]> {
    // 1) memberships for this club
    const { data: ms, error: mErr } = await supabase
      .from("memberships")
      .select("user_id, role, created_at")
      .eq("club_id", clubId);
      console.log("membership count", ms.length);

    if (mErr || !ms) return [];

    const ids = ms.map((m: any) => m.user_id).filter(Boolean);
    if (ids.length === 0) return [];

    // 2) profiles for those users
    const { data: ps, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);
      console.log("profiles fetched", ps?.length);

    if (pErr || !ps) return [];

    const profileMap = new Map(ps.map((p: any) => [p.id, p]));

    // 3) merge
    return ms.map((m: any) => {
      const p: any = profileMap.get(m.user_id);
      return {
        id: m.user_id,
        name: p?.username || "Grappler",
        rank: p?.rank || "White",
        stripes: p?.stripes || 0,
        totalSessions: p?.total_sessions || 0,
        joinDate: m.created_at,
        avatar_url: p?.avatar_url,
        role: m.role,
        lastAttendance: p?.updated_at,
      };
      
    });
    
  },

  async removeMember(clubId: string, userId: string) {
    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async getClasses(clubId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("club_id", clubId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return [];
    return data as any;
  },

  async createClass(
    clubId: string,
    classData: Omit<Class, "id" | "club_id">
  ): Promise<void> {
    const { error } = await supabase.from("classes").insert([
      {
        club_id: clubId,
        name: classData.name,
        instructor: classData.instructor,
        day: classData.day,
        start_time: classData.start_time,
        end_time: classData.end_time,
        type: classData.type,
        capacity: classData.capacity,
      },
    ]);
    if (error) throw error;
  },

  async deleteClass(classId: string) {
    // best-effort cleanup
    await supabase.from("bookings").delete().eq("class_id", classId);

    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) throw error;
  },

  async updateClass(classId: string, updates: Partial<Class>) {
    const { error } = await supabase.from("classes").update(updates).eq("id", classId);
    if (error) throw error;
  },

  async getBookingCount(classId: string, bookingDate: string): Promise<number> {
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("booking_date", bookingDate);

    if (error) return 0;
    return count || 0;
  },

  async getClassAttendees(classId: string, bookingDateISO: string): Promise<Member[]> {
    // 1) fetch bookings for that class + day
    const { data: bs, error: bErr } = await supabase
      .from("bookings")
      .select("user_id")
      .eq("class_id", classId)
      .eq("booking_date", bookingDateISO);

    if (bErr || !bs) return [];

    const ids = bs.map((b: any) => b.user_id).filter(Boolean);
    if (ids.length === 0) return [];

    // 2) fetch profiles for those users
    const { data: ps, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (pErr || !ps) return [];

    const profileMap = new Map(ps.map((p: any) => [p.id, p]));

    // 3) map to Member[]
    return ids.map((uid: string) => {
      const p: any = profileMap.get(uid);
      return {
        id: uid,
        name: p?.username || "Grappler",
        rank: p?.rank || "White",
        stripes: p?.stripes || 0,
        totalSessions: p?.total_sessions || 0,
        joinDate: p?.created_at,
        is_premium_member: false, // keep field if your UI expects it
        avatar_url: p?.avatar_url,
      };
    });
  },

  async bookClass(userId: string, classId: string, bookingDate: string): Promise<void> {
    const { error } = await supabase.from("bookings").insert([
      {
        user_id: userId,
        class_id: classId,
        booking_date: bookingDate,
      },
    ]);
    if (error) throw error;
  },

  async getNextBooking(userId: string): Promise<(Booking & { classes: Class }) | null> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, classes(*)")
      .eq("user_id", userId)
      .order("booking_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as any;
  },

  async postAlert(clubId: string, userId: string, title: string, body?: string) {
    const { error } = await supabase.from("club_alerts").insert([
      { club_id: clubId, created_by: userId, title, body: body ?? null },
    ]);
    if (error) throw error;
  },

  async getAlerts(clubId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("club_alerts")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  async saveRecap(clubId: string, recapData: Omit<ClassRecap, "id" | "club_id" | "date">) {
    const { error } = await supabase.from("class_recaps").insert([
      {
        club_id: clubId,
        class_name: recapData.className,
        instructor: recapData.instructor,
        type: recapData.type,
        techniques: recapData.techniques,
        notes: recapData.notes,
        date: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
  },

  async getRecaps(clubId: string): Promise<ClassRecap[]> {
    const { data, error } = await supabase
      .from("class_recaps")
      .select("*")
      .eq("club_id", clubId)
      .order("date", { ascending: false });

    if (error) return [];

    return (data as any[]).map((r) => ({
      id: r.id,
      club_id: r.club_id,
      className: r.class_name,
      instructor: r.instructor,
      type: r.type,
      techniques: r.techniques,
      notes: r.notes,
      date: r.date,
    }));
  },
};
