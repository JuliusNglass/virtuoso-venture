import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Admin client (service role) to create users
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Regular client to verify the caller is a studio owner
    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller owns a studio
    const { data: studio } = await adminClient
      .from("studios")
      .select("id, name")
      .eq("owner_user_id", caller.id)
      .maybeSingle();

    if (!studio) {
      return new Response(JSON.stringify({ error: "Not a studio owner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { parentEmail, parentName, studentName, studentId } = await req.json();

    if (!parentEmail) {
      return new Response(JSON.stringify({ error: "parentEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = req.headers.get("origin") || "https://virtuoso-venture.lovable.app";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === parentEmail);

    let inviteLink: string;
    let isNewUser = false;

    if (existingUser) {
      // User already exists — generate a magic link for them
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: parentEmail,
        options: { redirectTo: `${siteUrl}/parent-portal` },
      });
      if (linkError) throw linkError;
      inviteLink = linkData.properties.action_link;

      // Make sure student is linked to this parent
      await adminClient
        .from("students")
        .update({ parent_user_id: existingUser.id })
        .eq("id", studentId);
    } else {
      // New user — send invite
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        parentEmail,
        {
          data: { full_name: parentName || parentEmail },
          redirectTo: `${siteUrl}/parent-portal`,
        }
      );
      if (inviteError) throw inviteError;
      isNewUser = true;

      // Generate the invite link (the user will set password via the invite)
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: "invite",
        email: parentEmail,
        options: { redirectTo: `${siteUrl}/parent-portal` },
      });
      inviteLink = linkData?.properties?.action_link || `${siteUrl}/auth`;

      // Link student to future parent (they don't have a user id yet until they accept)
      // We store parent_email on the student so it auto-links when they sign up
    }

    // Assign parent role
    const targetUserId = existingUser?.id;
    if (targetUserId) {
      await adminClient
        .from("user_roles")
        .upsert({ user_id: targetUserId, role: "parent" }, { onConflict: "user_id,role" });
    }

    // Send welcome email via Resend
    if (RESEND_API_KEY && parentEmail) {
      const emailHtml = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fafaf8;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px;">Welcome to ${studio.name} 🎵</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Hi ${parentName || "there"},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            <strong>${studentName || "Your child"}</strong> has been enrolled at <strong>${studio.name}</strong>. 
            You now have access to a parent portal where you can track lessons, practice logs, homework, and more.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteLink}" 
               style="background: #C9A84C; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              ${isNewUser ? "Set up your account" : "Access parent portal"}
            </a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            This link is secure and unique to you. If you didn't expect this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Sent by ${studio.name} via Conservo</p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Conservo <recaps@conservo.app>",
          to: [parentEmail],
          subject: `You're invited to ${studio.name}'s parent portal`,
          html: emailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteLink,
        emailSent: !!RESEND_API_KEY,
        isNewUser,
        stub: !RESEND_API_KEY,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[invite-parent] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
