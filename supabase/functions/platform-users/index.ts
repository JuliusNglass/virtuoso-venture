import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleRows } = await anonClient.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roleRows?.some(r => r.role === "admin");
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all auth users for emails
    const { data: authUsersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const authUsers = authUsersData?.users ?? [];
    const emailMap: Record<string, string> = {};
    authUsers.forEach(u => { emailMap[u.id] = u.email ?? ""; });

    const [
      { data: profiles },
      { data: allRoles },
      { data: studios },
      { data: students },
    ] = await Promise.all([
      admin.from("profiles").select("user_id, full_name, created_at, avatar_url"),
      admin.from("user_roles").select("user_id, role, studio_id"),
      admin.from("studios").select("id, name, owner_user_id, is_demo, slug, created_at"),
      admin.from("students").select("id, name, parent_name, parent_email, parent_phone, parent_user_id, studio_id, level, status, age, lesson_day, lesson_time, current_piece, created_at"),
    ]);

    const profileMap: Record<string, any> = {};
    (profiles ?? []).forEach(p => { profileMap[p.user_id] = p; });

    const studioByOwner: Record<string, any> = {};
    (studios ?? []).forEach(s => { studioByOwner[s.owner_user_id] = s; });

    const studioById: Record<string, any> = {};
    (studios ?? []).forEach(s => { studioById[s.id] = s; });

    // Build roles map: user_id -> roles[]
    const rolesMap: Record<string, string[]> = {};
    (allRoles ?? []).forEach(r => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    // All known user IDs from profiles
    const allUserIds = (profiles ?? []).map(p => p.user_id);

    // Teachers = users who own a studio (or have admin role but aren't pure super-admin)
    const teachers = allUserIds
      .filter(uid => studioByOwner[uid] || rolesMap[uid]?.includes("admin"))
      .map(uid => {
        const studio = studioByOwner[uid];
        return {
          user_id: uid,
          full_name: profileMap[uid]?.full_name ?? null,
          email: emailMap[uid] ?? null,
          created_at: profileMap[uid]?.created_at ?? null,
          studio_name: studio?.name ?? null,
          studio_id: studio?.id ?? null,
          studio_is_demo: studio?.is_demo ?? null,
          studio_created_at: studio?.created_at ?? null,
          roles: rolesMap[uid] ?? [],
        };
      });

    // Parents = users with parent role
    const parentUserIds = Object.entries(rolesMap)
      .filter(([, roles]) => roles.includes("parent"))
      .map(([uid]) => uid);

    // Also find parents who appear in students but may not have a role row
    const parentUserIdsFromStudents = [
      ...new Set(
        (students ?? [])
          .filter(s => s.parent_user_id)
          .map(s => s.parent_user_id as string)
      )
    ];

    const allParentIds = [...new Set([...parentUserIds, ...parentUserIdsFromStudents])];

    const parents = allParentIds.map(uid => {
      const linkedStudents = (students ?? []).filter(s => s.parent_user_id === uid);
      // Try to get contact from first linked student
      const firstStudent = linkedStudents[0];
      return {
        user_id: uid,
        full_name: profileMap[uid]?.full_name ?? firstStudent?.parent_name ?? null,
        email: emailMap[uid] ?? firstStudent?.parent_email ?? null,
        phone: firstStudent?.parent_phone ?? null,
        created_at: profileMap[uid]?.created_at ?? null,
        roles: rolesMap[uid] ?? ["parent"],
        student_count: linkedStudents.length,
        students: linkedStudents.map(s => ({
          id: s.id,
          name: s.name,
          level: s.level,
          status: s.status,
          studio_name: s.studio_id ? studioById[s.studio_id]?.name ?? null : null,
        })),
      };
    });

    // Students = all student records with full contact info
    const studentsEnriched = (students ?? []).map(s => ({
      ...s,
      studio_name: s.studio_id ? studioById[s.studio_id]?.name ?? null : null,
      parent_user_email: s.parent_user_id ? emailMap[s.parent_user_id] ?? null : null,
    }));

    return new Response(JSON.stringify({
      teachers,
      parents,
      students: studentsEnriched,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
