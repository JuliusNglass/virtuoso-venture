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
    const { query, action, url, title, fileUrl } = await req.json();

    // Suggest action: fast prefix-based opensearch for autocomplete
    if (action === "suggest") {
      const suggestUrl = `https://imslp.org/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&namespace=0&format=json`;
      const res = await fetch(suggestUrl, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const data = await res.json();
      const suggestions: string[] = data[1] || [];
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search action: use MediaWiki full-text search + resolve redirects
    if (!action || action === "search") {
      const searchUrl = `https://imslp.org/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=20&srnamespace=0&format=json`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const data = await res.json();

      const searchResults = data?.query?.search || [];

      const titles = searchResults.map((r: any) => r.title).join("|");
      let redirectMap: Record<string, string> = {};

      if (titles) {
        const redirectUrl = `https://imslp.org/api.php?action=query&titles=${encodeURIComponent(titles)}&redirects=1&format=json`;
        const redirectRes = await fetch(redirectUrl, {
          headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
        });
        const redirectData = await redirectRes.json();
        const redirects = redirectData?.query?.redirects || [];
        for (const r of redirects) {
          redirectMap[r.from] = r.to;
        }
      }

      const seen = new Set<string>();
      const results: any[] = [];

      for (const r of searchResults) {
        const originalTitle = r.title || "";
        const resolvedTitle = redirectMap[originalTitle] || originalTitle;
        
        if (seen.has(resolvedTitle)) continue;
        seen.add(resolvedTitle);

        const snippet = (r.snippet || "").replace(/<[^>]*>/g, "");
        const isRedirect = !!redirectMap[originalTitle];
        
        results.push({
          title: resolvedTitle,
          description: isRedirect ? `Redirected from: ${originalTitle}. ${snippet}` : snippet,
          url: `https://imslp.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, "_"))}`,
        });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Browse action: fetch IMSLP page and return list of available PDF editions
    if (action === "browse" && url) {
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const html = await pageRes.text();

      // Extract all disclaimer-accept PDF links and their nearby labels
      const editions: { label: string; url: string }[] = [];
      
      // Match blocks: find all IMSLPDisclaimerAccept links
      const pdfPattern = /href="((?:https?:)?\/\/imslp\.org\/wiki\/Special:IMSLPDisclaimerAccept\/[^"]+\.pdf[^"]*)"/gi;
      const matches = [...html.matchAll(pdfPattern)];

      // Also try to extract surrounding context (arranger/editor names)
      // We'll look for table rows containing PDF links to grab labels
      // Simple approach: for each PDF, look backwards ~500 chars for a label pattern
      const usedUrls = new Set<string>();

      for (const match of matches) {
        let pdfUrl = match[1];
        if (pdfUrl.startsWith("//")) pdfUrl = "https:" + pdfUrl;
        
        if (usedUrls.has(pdfUrl)) continue;
        usedUrls.add(pdfUrl);

        // Try to extract a label from the surrounding HTML (editor/arranger row)
        const pos = match.index ?? 0;
        const surrounding = html.substring(Math.max(0, pos - 800), pos + 200);
        
        // Look for editor/arranger/title patterns in the surrounding text
        let label = "";
        
        // Try to find "Editor" field
        const editorMatch = surrounding.match(/Editor\s*<\/[^>]+>\s*<[^>]+>([^<]{3,60})</i);
        if (editorMatch) label = `Ed. ${editorMatch[1].trim()}`;
        
        // Try to find file description label
        if (!label) {
          const descMatch = surrounding.match(/title="([^"]{5,80})"\s*(?:class="[^"]*")?[^>]*>\s*(?:PDF|score)/i);
          if (descMatch) label = descMatch[1].trim();
        }

        // Try to find arranger
        if (!label) {
          const arrangMatch = surrounding.match(/Arranger\s*<\/[^>]+>\s*<[^>]+>([^<]{3,60})</i);
          if (arrangMatch) label = `Arr. ${arrangMatch[1].trim()}`;
        }

        // Fallback: extract filename from URL
        if (!label) {
          const urlParts = pdfUrl.split("/");
          const filename = decodeURIComponent(urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "");
          label = filename.replace(/\.pdf$/i, "").replace(/_/g, " ").substring(0, 80) || `Score ${editions.length + 1}`;
        }

        editions.push({ label, url: pdfUrl });
      }

      return new Response(JSON.stringify({ editions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Import action: download a specific PDF by URL and save it
    if (action === "import" && fileUrl) {
      const pdfRes = await fetch(fileUrl, {
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

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { error: uploadError } = await supabase.storage
        .from("studio-files")
        .upload(filePath, pdfBytes, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

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
