import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Users, GraduationCap, BookOpen,
  ShieldCheck, TrendingUp, Clock, BarChart3,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type StudioRow = {
  id: string;
  name: string;
  owner_name: string | null;
  created_at: string;
  is_demo: boolean;
  student_count: number;
  slug: string | null;
};

type SignupRow = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
};

type PlatformStats = {
  totals: { studios: number; users: number; students: number; lessons: number };
  studios: StudioRow[];
  recentSignups: SignupRow[];
};

const SuperAdmin = () => {
  const { role } = useAuth();

  const { data, isLoading, error } = useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/platform-stats`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load stats");
      }
      return res.json();
    },
    enabled: role === "admin",
  });

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <ShieldCheck size={40} className="text-muted-foreground" />
        <p className="text-muted-foreground">Platform admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  const { totals, studios, recentSignups } = data!;

  const statCards = [
    { label: "Total Studios", value: totals.studios, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Users", value: totals.users, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Total Students", value: totals.students, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Lessons", value: totals.lessons, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const liveStudios = studios.filter(s => !s.is_demo);
  const demoStudios = studios.filter(s => s.is_demo);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-primary" />
            <h1 className="font-heading text-3xl font-bold">Platform Admin</h1>
          </div>
          <p className="text-muted-foreground text-sm">Cross-studio overview — Conservo platform metrics</p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 border-primary/40 text-primary">
          Super Admin
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/50 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{label}</p>
                  <p className="text-3xl font-bold font-heading">{value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Studios List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              All Studios
              <span className="text-xs text-muted-foreground font-normal">({liveStudios.length} live · {demoStudios.length} demo)</span>
            </h2>
          </div>

          <div className="space-y-2">
            {studios.length === 0 && (
              <p className="text-muted-foreground text-sm py-6 text-center">No studios yet.</p>
            )}
            {studios.map(studio => (
              <Card key={studio.id} className="border-border/40 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{studio.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {studio.owner_name ?? "Unknown owner"} ·{" "}
                          {new Date(studio.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {studio.student_count} student{studio.student_count !== 1 ? "s" : ""}
                      </span>
                      {studio.is_demo && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">Demo</Badge>
                      )}
                      {!studio.is_demo && (
                        <Badge className="text-xs px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">Live</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
            Recent Signups
          </h2>

          <Card className="border-border/50 rounded-2xl">
            <CardContent className="p-0">
              {recentSignups.length === 0 && (
                <p className="text-muted-foreground text-sm py-6 text-center">No signups yet.</p>
              )}
              {recentSignups.map((s, i) => (
                <div key={s.user_id}>
                  {i > 0 && <Separator />}
                  <div className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {s.full_name || <span className="italic text-muted-foreground">No name</span>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {s.role && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.5 shrink-0 ${
                          s.role === "admin"
                            ? "border-primary/40 text-primary"
                            : "border-blue-400/40 text-blue-600"
                        }`}
                      >
                        {s.role === "admin" ? "Teacher" : "Parent"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default SuperAdmin;
