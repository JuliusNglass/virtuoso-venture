import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { updateSW } from "@/main";

/**
 * Listens for the "pwa-update-available" event (fired from main.tsx via registerSW)
 * and shows a bottom-anchored toast prompting the user to refresh.
 */
const PWAUpdateToast = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("pwa-update-available", handler);
    return () => window.removeEventListener("pwa-update-available", handler);
  }, []);

  if (!visible) return null;

  const handleRefresh = () => {
    setVisible(false);
    updateSW(true); // tell SW to skip waiting
    // Fallback reload in case skipWaiting doesn't trigger a controller change
    setTimeout(() => window.location.reload(), 400);
  };

  const handleDismiss = () => {
    setVisible(false);
    // The SW remains waiting; next page load will fire onNeedRefresh again
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm
                 bg-sidebar text-sidebar-foreground border border-sidebar-border
                 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
        <RefreshCw size={16} className="text-sidebar-primary" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Update available</p>
        <p className="text-xs text-sidebar-foreground/70 mt-0.5 leading-snug">
          A new version of Conservo is ready.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleRefresh}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg
                     bg-sidebar-primary text-sidebar-primary-foreground
                     hover:opacity-90 transition-opacity"
        >
          Refresh
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <X size={14} className="text-sidebar-foreground/60" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateToast;
