import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setIsLoading(false);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const [{ data: roleData }, { data: studioData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", authUser.id).maybeSingle(),
        supabase.from("studios").select("id").eq("owner_user_id", authUser.id).maybeSingle(),
      ]);
      setIsLoading(false);
      if (roleData?.role === "parent") navigate("/parent");
      else if (!studioData) navigate("/onboarding");
      else navigate("/dashboard");
    } else {
      setIsLoading(false);
      navigate("/dashboard");
    }
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
                  {isLoading ? "Signing in…" : "Sign In →"}
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
                  {isLoading ? "Creating account…" : "Create Account →"}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground mt-4">
              No credit card required · Free during beta
            </p>
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
