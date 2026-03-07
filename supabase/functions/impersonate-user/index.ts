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

    // Verify caller is authenticated and is an admin
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

    // Get target user id from request body
    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });

    // Prevent impersonating self
    if (user_id === user.id) return new Response(JSON.stringify({ error: "Cannot impersonate yourself" }), { status: 400, headers: corsHeaders });

    // Use service role to get user's email + roles + studio info
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: targetUser, error: targetError } = await admin.auth.admin.getUserById(user_id);
    if (targetError || !targetUser?.user?.email) {
      return new Response(JSON.stringify({ error: "Target user not found" }), { status: 404, headers: corsHeaders });
    }

    // Determine target user's role(s) and studio ownership
    const [{ data: targetRoleRows }, { data: targetStudio }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user_id),
      admin.from("studios").select("id").eq("owner_user_id", user_id).maybeSingle(),
    ]);

    const targetRoles = targetRoleRows?.map((r: any) => r.role) ?? [];
    const isParent = targetRoles.includes("parent") && !targetRoles.includes("admin") && !targetStudio;
    const targetRole = isParent ? "parent" : "teacher";

    const origin = req.headers.get("origin") || "https://virtuoso-venture.lovable.app";

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email,
      options: { redirectTo: `${origin}/` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: linkError?.message ?? "Failed to generate link" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      action_link: linkData.properties.action_link,
      email: targetUser.user.email,
      target_role: targetRole,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
