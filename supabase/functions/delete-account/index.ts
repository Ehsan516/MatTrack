import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey);

  // Identify caller from JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });
  }
  const uid = userData.user.id;

  // Find clubs where caller is owner
  const { data: ownedClubs, error: ownedErr } = await admin
    .from("clubs")
    .select("id")
    .eq("owner_id", uid);

  if (ownedErr) {
    return new Response(JSON.stringify({ error: ownedErr.message }), { status: 400 });
  }

  // If owner has any club with other members, block
  for (const c of ownedClubs ?? []) {
    const { count } = await admin
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("club_id", c.id);

    if ((count ?? 0) > 1) {
      return new Response(
        JSON.stringify({ error: "Transfer ownership or delete the club before deleting your account." }),
        { status: 400 }
      );
    }

    // owner is sole member → delete club (cascades handle rest)
    await admin.from("clubs").delete().eq("id", c.id);
  }

  // Clean user-owned rows (safe even if none)
  await admin.from("memberships").delete().eq("user_id", uid);
  await admin.from("bookings").delete().eq("user_id", uid);
  await admin.from("profiles").delete().eq("id", uid);

  // Finally delete auth user
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});