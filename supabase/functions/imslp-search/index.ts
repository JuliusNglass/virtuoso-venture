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

    // Browse action: use MediaWiki API to get file list from the page
    if (action === "browse" && url) {
      // Extract page title from URL
      const urlObj = new URL(url.startsWith("http") ? url : "https:" + url);
      const pageTitle = decodeURIComponent(urlObj.pathname.replace("/wiki/", ""));

      // Use MediaWiki images API to get all File: references on the page
      const imagesApiUrl = `https://imslp.org/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&imlimit=100`;
      const imagesRes = await fetch(imagesApiUrl, {
        headers: { "User-Agent": "VirtuosoStudio/1.0 (Music Teaching App)" },
      });
      const imagesData = await imagesRes.json();

      const pages = imagesData?.query?.pages || {};
      const pageData = Object.values(pages)[0] as any;
      const images: any[] = pageData?.images || [];

      // Filter to only PDF files
      const pdfFiles = images.filter((img: any) =>
        img.title && img.title.toLowerCase().endsWith(".pdf")
      );

      const editions: { label: string; url: string }[] = [];

      for (const file of pdfFiles) {
        // file.title is like "File:PMLP12345-Sullivan_LostChord.pdf"
        const filename = file.title.replace(/^File:/i, "");
        const encodedFilename = encodeURIComponent(filename);
        const disclaimerUrl = `https://imslp.org/wiki/Special:IMSLPDisclaimerAccept/${encodedFilename}`;

        // Make a human-readable label from the filename
        const label = filename
          .replace(/\.pdf$/i, "")
          .replace(/^PMLP\d+-/i, "")
          .replace(/_/g, " ")
          .trim() || filename;

        editions.push({ label, url: disclaimerUrl });
      }

      return new Response(JSON.stringify({ editions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Import action: download a specific PDF by URL and save it
    if (action === "import" && fileUrl) {
      // Step 1: Follow the disclaimer URL to get the redirect location
      const disclaimerRes = await fetch(fileUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VirtuosoStudio/1.0)",
          "Referer": "https://imslp.org/",
        },
        redirect: "manual", // Don't auto-follow so we can capture redirect
      });

      let actualPdfUrl = fileUrl;

      // IMSLP disclaimer redirects to the real file URL
      if (disclaimerRes.status === 302 || disclaimerRes.status === 301) {
        const location = disclaimerRes.headers.get("location");
        if (location) {
          actualPdfUrl = location.startsWith("http") ? location : `https://imslp.org${location}`;
        }
      } else if (disclaimerRes.status === 200) {
        // May be an HTML page — try to find the redirect in it
        const html = await disclaimerRes.text();
        // IMSLP sometimes embeds the download URL in the page
        const metaRedirect = html.match(/content=["'][^"']*url=([^"']+\.pdf[^"']*)/i);
        const linkMatch = html.match(/href="([^"]+\.pdf[^"]*)"/i);
        const imgMatch = html.match(/https?:\/\/[^"'\s]+\.pdf/i);
        const found = metaRedirect?.[1] || linkMatch?.[1] || imgMatch?.[0];
        if (found) {
          actualPdfUrl = found.startsWith("http") ? found : `https://imslp.org${found}`;
        }
      }

      // Step 2: Download the actual PDF
      const pdfRes = await fetch(actualPdfUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VirtuosoStudio/1.0)",
          "Referer": "https://imslp.org/",
        },
        redirect: "follow",
      });

      if (!pdfRes.ok) {
        return new Response(JSON.stringify({ success: false, reason: "download_failed", status: pdfRes.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

      // Verify it's actually a PDF (starts with %PDF)
      if (pdfBytes[0] !== 0x25 || pdfBytes[1] !== 0x50 || pdfBytes[2] !== 0x44 || pdfBytes[3] !== 0x46) {
        return new Response(JSON.stringify({ success: false, reason: "not_a_pdf" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
