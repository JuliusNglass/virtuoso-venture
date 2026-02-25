import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, action, url, title } = await req.json();

    // Search action: use MediaWiki full-text search API (better than opensearch for piece titles)
    if (!action || action === "search") {
      const searchUrl = `https://imslp.org/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=20&srnamespace=0&format=json`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const data = await res.json();

      const searchResults = data?.query?.search || [];
      const results = searchResults.map((r: any) => ({
        title: r.title || "",
        description: (r.snippet || "").replace(/<[^>]*>/g, ""), // strip HTML tags from snippet
        url: `https://imslp.org/wiki/${encodeURIComponent((r.title || "").replace(/ /g, "_"))}`,
      }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Import action: try to find and download a PDF from the IMSLP page
    if (action === "import" && url) {
      // Fetch the IMSLP page to find PDF links
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const html = await pageRes.text();

      // Look for PDF file links on the page (IMSLP uses //imslp.org/wiki/Special:IMSLPDisclaimerAccept/ pattern)
      const pdfPattern = /href="((?:https?:)?\/\/imslp\.org\/wiki\/Special:IMSLPDisclaimerAccept\/[^"]+\.pdf[^"]*)"/gi;
      const matches = [...html.matchAll(pdfPattern)];

      if (matches.length === 0) {
        // Try alternate pattern for direct file links
        const altPattern = /href="((?:https?:)?\/\/[^"]*\.imslp\.[^"]*\.pdf[^"]*)"/gi;
        const altMatches = [...html.matchAll(altPattern)];
        if (altMatches.length === 0) {
          return new Response(JSON.stringify({ success: false, reason: "no_pdf_found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Get the first PDF link
      let pdfUrl = matches[0]?.[1] || "";
      if (pdfUrl.startsWith("//")) pdfUrl = "https:" + pdfUrl;

      // Download the PDF
      const pdfRes = await fetch(pdfUrl, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
        redirect: "follow",
      });

      if (!pdfRes.ok) {
        return new Response(JSON.stringify({ success: false, reason: "download_failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
      const safeName = (title || "score").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();
      const filePath = `music_sheet/${Date.now()}-${safeName}.pdf`;

      // Upload to storage
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { error: uploadError } = await supabase.storage
        .from("studio-files")
        .upload(filePath, pdfBytes, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      // Create file record
      const authHeader = req.headers.get("authorization");
      let userId: string | null = null;
      if (authHeader) {
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
        const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = user?.id || null;
      }

      const { error: dbError } = await supabase.from("files").insert({
        name: `${safeName}.pdf`,
        file_path: filePath,
        file_type: "music_sheet",
        file_size: pdfBytes.length,
        mime_type: "application/pdf",
        uploaded_by: userId,
      });

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
