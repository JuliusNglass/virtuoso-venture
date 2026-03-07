import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PROJECT_ID   = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"teacher" | "parent" | null>(null);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const redirectAfterLogin = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/dashboard"); return; }

    const [{ data: roleRows }, { data: ownedStudio }] = await Promise.all([
      supabase.from("user_roles").select("role, studio_id").eq("user_id", authUser.id),
      supabase.from("studios").select("id, is_demo").eq("owner_user_id", authUser.id).maybeSingle(),
    ]);

    const roles = roleRows?.map(r => r.role) ?? [];
    const isAdmin = roles.includes("admin");
    const linkedStudioId = (roleRows ?? []).find(r => r.studio_id)?.studio_id as string | undefined;
    const hasAnyStudio = !!ownedStudio || !!linkedStudioId;

    // Parent-only → parent portal
    if (roles.includes("parent") && !isAdmin && !hasAnyStudio) {
      navigate("/parent"); return;
    }

    // Admin or has a studio → dashboard
    if (isAdmin || hasAnyStudio) {
      navigate("/dashboard"); return;
    }

    // Truly new user with no studio and no role → onboarding
    navigate("/onboarding");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
      return;
    }
    setForgotSent(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setIsLoading(false);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    await redirectAfterLogin();
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setIsLoading(false);
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    const { error: signInError } = await signIn(email, password);
    setIsLoading(false);
    if (signInError) {
      toast({ title: "Account created!", description: "Please sign in to continue." });
    } else {
      navigate("/onboarding");
    }
  };

  const handleTryDemo = async (role: "teacher" | "parent") => {
    setDemoLoading(role);
    try {
      // Seed (idempotent) — uses service role server-side, safe to call publicly
      const seedUrl = `${SUPABASE_URL}/functions/v1/seed-demo`;
      const res = await fetch(seedUrl, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Seeding failed");
      }
      const { teacher_email, teacher_password, parent_email, parent_password } = await res.json();

      // Sign in as requested role
      const demoEmail    = role === "teacher" ? teacher_email : parent_email;
      const demoPassword = role === "teacher" ? teacher_password : parent_password;

      const { error } = await signIn(demoEmail, demoPassword);
      if (error) throw new Error(error.message);

      await redirectAfterLogin();
    } catch (err: any) {
      toast({ title: "Demo unavailable", description: err.message, variant: "destructive" });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-gold/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-gold/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-scale-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold-lg mb-4">
            <span className="text-2xl">🎵</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-1">Conservo</h1>
          <p className="text-muted-foreground text-sm">Studio management for music teachers</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                mode === "signin"
                  ? "text-foreground border-b-2 border-gold bg-muted/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "text-foreground border-b-2 border-gold bg-muted/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="signin-email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@musicstudio.com" required maxLength={255}
                    className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="signin-password" type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-bold text-sm rounded-xl mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Sign In →"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-sm font-semibold">Full Name</Label>
                  <Input
                    id="signup-name" value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Sarah Jones" required maxLength={100}
                    className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="signup-email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@musicstudio.com" required maxLength={255}
                    className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="signup-password" type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters" required minLength={6}
                    className="h-11 rounded-xl border-border/60 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-bold text-sm rounded-xl mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Account →"}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground mt-4">
              No credit card required · Free during beta
            </p>
          </div>
        </div>

        {/* Try Demo Section */}
        <div className="mt-4 bg-card border border-border/60 rounded-2xl p-5">
          <div className="text-center mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try a live demo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Explore with real sample data — no sign-up needed</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-semibold rounded-xl border-border/60 hover:border-gold/60 hover:bg-gold/5 transition-all"
              onClick={() => handleTryDemo("teacher")}
              disabled={demoLoading !== null}
            >
              {demoLoading === "teacher"
                ? <Loader2 size={14} className="animate-spin" />
                : "🎹 Teacher Demo"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-semibold rounded-xl border-border/60 hover:border-gold/60 hover:bg-gold/5 transition-all"
              onClick={() => handleTryDemo("parent")}
              disabled={demoLoading !== null}
            >
              {demoLoading === "parent"
                ? <Loader2 size={14} className="animate-spin" />
                : "👨‍👩‍👧 Parent Demo"}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Conservo · Built for music teachers
        </p>
      </div>
    </div>
  );
};

export default Auth;
