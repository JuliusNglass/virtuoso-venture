import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Music, Sparkles, ArrowRight } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const { refetch } = useStudio();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studioName, setStudioName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!studioName.trim()) return;

    setIsLoading(true);

    // Generate a slug from studio name
    const slug = studioName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    const { error } = await supabase.from("studios").insert({
      name: studioName.trim(),
      slug,
      owner_user_id: user.id,
    });

    if (error) {
      setIsLoading(false);
      if (error.code === "23505") {
        // Slug conflict — just insert without slug
        const { error: error2 } = await supabase.from("studios").insert({
          name: studioName.trim(),
          owner_user_id: user.id,
        });
        if (error2) {
          toast({ title: "Error creating studio", description: error2.message, variant: "destructive" });
          return;
        }
      } else {
        toast({ title: "Error creating studio", description: error.message, variant: "destructive" });
        return;
      }
    }

    // Assign admin role to this user
    const { error: roleError } = await supabase.from("user_roles").upsert({
      user_id: user.id,
      role: "admin",
    }, { onConflict: "user_id,role" });

    if (roleError && roleError.code !== "23505") {
      console.warn("Role assignment warning:", roleError.message);
    }

    setIsLoading(false);
    refetch();
    toast({ title: "Studio created!", description: `Welcome to ${studioName}` });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Music size={28} className="text-charcoal" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Welcome to StudioDesk</h1>
          <p className="text-muted-foreground mt-1">Let's set up your studio in 30 seconds.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">✓</div>
            <span className="text-sm text-muted-foreground">Account created</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">2</div>
            <span className="text-sm font-medium">Name your studio</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground text-xs font-bold">3</div>
            <span className="text-sm text-muted-foreground">Start teaching</span>
          </div>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Sparkles size={20} className="text-gold" /> Name Your Studio
            </CardTitle>
            <CardDescription>
              This is what parents and students will see. You can change it later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studio-name">Studio Name</Label>
                <Input
                  id="studio-name"
                  value={studioName}
                  onChange={e => setStudioName(e.target.value)}
                  placeholder="e.g. Sarah's Piano Studio"
                  required
                  maxLength={100}
                  className="text-base"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Use your name + "Piano Studio", "Music Academy", or "Music School"
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold"
                disabled={isLoading || !studioName.trim()}
              >
                {isLoading ? "Creating your studio..." : (
                  <>Create My Studio <ArrowRight size={16} className="ml-2" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          No credit card required · Free to get started
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
