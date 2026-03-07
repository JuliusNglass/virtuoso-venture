import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Check caller has admin role
    const { data: roleRows } = await anonClient.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roleRows?.some(r => r.role === "admin");
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    // Use service role for cross-tenant reads
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [
      { count: totalStudios },
      { count: totalUsers },
      { count: totalStudents },
      { count: totalLessons },
      { data: studios },
      { data: recentSignups },
    ] = await Promise.all([
      admin.from("studios").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("students").select("id", { count: "exact", head: true }),
      admin.from("lessons").select("id", { count: "exact", head: true }),
      admin.from("studios").select("id, name, owner_user_id, created_at, is_demo, slug").order("created_at", { ascending: false }),
      admin.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    // Enrich studios with student/lesson counts
    const studioIds = (studios ?? []).map(s => s.id);
    const [{ data: studentCounts }, { data: ownerProfiles }, { data: roleData }] = await Promise.all([
      admin.from("students").select("studio_id").in("studio_id", studioIds),
      admin.from("profiles").select("user_id, full_name").in("user_id", (studios ?? []).map(s => s.owner_user_id)),
      admin.from("user_roles").select("user_id, role"),
    ]);

    const studioList = (studios ?? []).map(s => ({
      ...s,
      student_count: (studentCounts ?? []).filter(st => st.studio_id === s.id).length,
      owner_name: (ownerProfiles ?? []).find(p => p.user_id === s.owner_user_id)?.full_name ?? null,
    }));

    // Enrich recent signups with role
    const signupList = (recentSignups ?? []).map(p => ({
      ...p,
      role: (roleData ?? []).find(r => r.user_id === p.user_id)?.role ?? null,
    }));

    return new Response(JSON.stringify({
      totals: {
        studios: totalStudios ?? 0,
        users: totalUsers ?? 0,
        students: totalStudents ?? 0,
        lessons: totalLessons ?? 0,
      },
      studios: studioList,
      recentSignups: signupList,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
