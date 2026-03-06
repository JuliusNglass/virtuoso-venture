import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2 } from "lucide-react";

type SignupRow = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
  studio_name: string | null;
  is_demo: boolean | null;
};

const Signups = () => {
  const { role } = useAuth();

  const { data: signups, isLoading } = useQuery({
    queryKey: ["signups"],
    queryFn: async () => {
      // Fetch profiles then enrich with roles + studio name via separate queries
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, studio_id");

      const { data: studios } = await supabase
        .from("studios")
        .select("id, name, is_demo");

      // Deduplicate profiles by user_id, pick primary role
      const seen = new Set<string>();
      const rows: SignupRow[] = [];

      for (const p of profiles ?? []) {
        if (seen.has(p.user_id)) continue;
        seen.add(p.user_id);

        const userRoles = (roles ?? []).filter(r => r.user_id === p.user_id);
        const adminRole = userRoles.find(r => r.role === "admin");
        const primaryRole = adminRole ?? userRoles[0] ?? null;
        const studio = primaryRole?.studio_id
          ? (studios ?? []).find(s => s.id === primaryRole.studio_id)
          : null;

        rows.push({
          user_id: p.user_id,
          full_name: p.full_name,
          created_at: p.created_at,
          role: primaryRole?.role ?? null,
          studio_name: studio?.name ?? null,
          is_demo: studio?.is_demo ?? null,
        });
      }

      return rows;
    },
    enabled: role === "admin",
  });

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) return <p className="text-muted-foreground p-6">Loading...</p>;

  const teachers = signups?.filter(s => s.role === "admin") ?? [];
  const parents  = signups?.filter(s => s.role === "parent") ?? [];
  const others   = signups?.filter(s => !s.role) ?? [];

  const roleColor: Record<string, string> = {
    admin:  "bg-primary/10 text-primary",
    parent: "bg-blue-100 text-blue-700",
  };

  const Section = ({ title, rows }: { title: string; rows: SignupRow[] }) => (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">None yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map(s => (
            <Card key={s.user_id} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-tight truncate">
                    {s.full_name || <span className="text-muted-foreground italic">No name</span>}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.is_demo && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">Demo</Badge>
                    )}
                    {s.role && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[s.role] ?? "bg-muted text-muted-foreground"}`}>
                        {s.role === "admin" ? "Teacher" : "Parent"}
                      </span>
                    )}
                  </div>
                </div>
                {s.studio_name && (
                  <p className="text-xs text-muted-foreground truncate">🎵 {s.studio_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Signed up{" "}
                  {new Date(s.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
          <Users2 size={28} /> Signups
        </h1>
        <p className="text-muted-foreground mt-1">
          {(signups?.length ?? 0)} total accounts
        </p>
      </div>

      <Section title="Teachers" rows={teachers} />
      <Section title="Parents" rows={parents} />
      {others.length > 0 && <Section title="No role assigned" rows={others} />}
    </div>
  );
};

export default Signups;
