import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Supabase puts the recovery token in the URL hash — the SDK handles it
  // automatically via onAuthStateChange(PASSWORD_RECOVERY)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // user is now in a recovery session — form is already rendered
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-gold/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold-lg mb-4">
            <span className="text-2xl">🎵</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-1">Conservo</h1>
          <p className="text-muted-foreground text-sm">Set a new password</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-xl p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="text-emerald-500" size={40} />
              <p className="font-semibold text-foreground">Password updated!</p>
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm font-semibold">New Password</Label>
                <Input
                  id="new-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" required minLength={6}
                  className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm font-semibold">Confirm Password</Label>
                <Input
                  id="confirm-password" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your new password" required minLength={6}
                  className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-bold text-sm rounded-xl mt-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password →"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
