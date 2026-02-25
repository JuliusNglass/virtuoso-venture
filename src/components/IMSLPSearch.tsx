import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Download, Loader2, Music, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface IMSLPResult {
  title: string;
  url: string;
  description: string;
}

const IMSLPSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IMSLPResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounced opensearch for suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await supabase.functions.invoke("imslp-search", {
        body: { action: "suggest", query: q },
      });
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setShowSuggestions(true);
      }
    } catch {
      // silently fail suggestions
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(query.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setQuery(q);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearching(true);
    try {
      const res = await supabase.functions.invoke("imslp-search", {
        body: { query: q.trim() },
      });
      if (res.error) throw res.error;
      setResults(res.data?.results ?? []);
      if (!res.data?.results?.length) {
        toast({ title: "No results", description: "Try a different search term." });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (result: IMSLPResult) => {
    setImporting(result.title);
    try {
      const res = await supabase.functions.invoke("imslp-search", {
        body: { action: "import", url: result.url, title: result.title },
      });
      if (res.error) throw res.error;
      if (res.data?.success) {
        toast({ title: "Score imported!", description: `${result.title} has been added to your files.` });
        queryClient.invalidateQueries({ queryKey: ["files"] });
      } else {
        toast({
          title: "Could not auto-import",
          description: "Open the IMSLP page to download manually, then upload via Files.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Globe size={16} /> IMSLP Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Music size={20} /> Search IMSLP Library
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search the International Music Score Library Project for free public domain scores.
          </p>
        </DialogHeader>

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by composer, title, or work..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
            </div>
            <Button onClick={() => handleSearch()} disabled={searching || !query.trim()}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-12 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 border-b border-border/30 last:border-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearch(s);
                  }}
                >
                  <Music size={14} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mt-2">
          {results.length === 0 && !searching && (
            <div className="text-center py-12 text-muted-foreground">
              <Music size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Search for composers or pieces to find free scores</p>
            </div>
          )}
          {searching && (
            <div className="text-center py-12">
              <Loader2 size={32} className="mx-auto animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Searching IMSLP...</p>
            </div>
          )}
          {results.map((r, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={14} className="mr-1" /> View
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImport(r)}
                      disabled={importing === r.title}
                    >
                      {importing === r.title ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : (
                        <Download size={14} className="mr-1" />
                      )}
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IMSLPSearch;
