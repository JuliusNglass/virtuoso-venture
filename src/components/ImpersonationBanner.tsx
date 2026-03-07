import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

const ImpersonationBanner = () => {
  const { user } = useAuth();
  const [adminSession, setAdminSession] = useState<{ access_token: string; refresh_token: string } | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("impersonation_admin_session");
    if (stored) {
      try { setAdminSession(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [user]);

  if (!adminSession) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
      localStorage.removeItem("impersonation_admin_session");
      toast.success("Returned to super admin account");
      window.location.href = "/superadmin";
    } catch {
      toast.error("Failed to exit impersonation");
      setExiting(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium">
      <div className="flex items-center gap-2">
        <UserX size={15} />
        <span>
          You are impersonating <strong>{user?.email}</strong> — all actions are real.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-destructive-foreground/40 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground"
        onClick={handleExit}
        disabled={exiting}
      >
        {exiting ? "Exiting…" : "Exit Impersonation"}
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
