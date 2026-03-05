import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, bodyHtml, studentName } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      // Stub mode: log success, no email sent
      console.log(`[send-recap-email] STUB - No RESEND_API_KEY. Would have sent to ${to}: ${subject}`);
      return new Response(
        JSON.stringify({ success: true, stub: true, message: "Email provider not configured — recap saved." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!to) {
      return new Response(
        JSON.stringify({ success: true, stub: true, message: "No parent email — recap saved." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Conservo <recaps@conservo.app>",
        to: [to],
        subject,
        html: bodyHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message ?? "Resend error");
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
