import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHECK_INTERVAL = 60_000; // check every 60 seconds

const VersionChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [initialHash, setInitialHash] = useState<string | null>(null);

  const getPageHash = useCallback(async () => {
    try {
      const res = await fetch(window.location.origin + "/?_v=" + Date.now(), {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });
      const text = await res.text();
      // Extract script src hashes from the HTML to detect new builds
      const scripts = text.match(/src="\/assets\/[^"]+"/g);
      return scripts?.join(",") ?? text.slice(0, 500);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Capture initial hash on mount
    getPageHash().then(hash => {
      if (hash) setInitialHash(hash);
    });
  }, [getPageHash]);

  useEffect(() => {
    if (!initialHash) return;

    const interval = setInterval(async () => {
      const currentHash = await getPageHash();
      if (currentHash && currentHash !== initialHash) {
        setUpdateAvailable(true);
        clearInterval(interval);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [initialHash, getPageHash]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-xl shadow-lg border border-primary/20">
        <RefreshCw size={18} className="animate-spin-slow shrink-0" />
        <p className="text-sm font-medium">A new version is available!</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.location.reload()}
          className="ml-1"
        >
          Refresh
        </Button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-primary-foreground/70 hover:text-primary-foreground ml-1 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default VersionChecker;
