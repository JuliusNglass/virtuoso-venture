import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2, Users, GraduationCap, BookOpen,
  ShieldCheck, TrendingUp, Clock, BarChart3,
  Mail, Phone, User, Search, ChevronDown, ChevronUp, LogIn,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/* ─── Types ─────────────────────────────────────────────── */
type StudioRow = {
  id: string; name: string; owner_name: string | null;
  created_at: string; is_demo: boolean; student_count: number; slug: string | null;
};
type SignupRow = { user_id: string; full_name: string | null; created_at: string; role: string | null; };
type PlatformStats = {
  totals: { studios: number; users: number; students: number; lessons: number };
  studios: StudioRow[];
  recentSignups: SignupRow[];
};

type TeacherRow = {
  user_id: string; full_name: string | null; email: string | null;
  created_at: string | null; studio_name: string | null; studio_id: string | null;
  studio_is_demo: boolean | null; roles: string[];
};
type ParentRow = {
  user_id: string; full_name: string | null; email: string | null;
  phone: string | null; created_at: string | null; student_count: number;
  students: { id: string; name: string; level: string; status: string; studio_name: string | null }[];
};
type StudentRow = {
  id: string; name: string; parent_name: string | null; parent_email: string | null;
  parent_phone: string | null; parent_user_id: string | null; parent_user_email: string | null;
  studio_id: string | null; studio_name: string | null; level: string; status: string;
  age: number | null; lesson_day: string | null; lesson_time: string | null;
  current_piece: string | null; created_at: string;
};
type PlatformUsers = { teachers: TeacherRow[]; parents: ParentRow[]; students: StudentRow[] };

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: any; color: string; bg: string;
}) {
  return (
    <Card className="border-border/50 rounded-2xl">
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
  );
}

/* ─── Contact chip ──────────────────────────────────────── */
function ContactChip({ icon: Icon, value, href }: { icon: any; value: string | null | undefined; href?: string }) {
  if (!value) return null;
  const content = (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
      <Icon size={10} />
      {value}
    </span>
  );
  if (href) return <a href={href} className="hover:text-foreground transition-colors">{content}</a>;
  return content;
}

/* ─── Expandable student list ───────────────────────────── */
function StudentList({ students }: { students: ParentRow["students"] }) {
  const [open, setOpen] = useState(false);
  if (!students.length) return <span className="text-xs text-muted-foreground">No students</span>;
  const visible = open ? students : students.slice(0, 2);
  return (
    <div className="space-y-0.5">
      {visible.map(s => (
        <div key={s.id} className="flex items-center gap-1.5 text-xs">
          <GraduationCap size={10} className="text-muted-foreground shrink-0" />
          <span className="font-medium">{s.name}</span>
          <span className="text-muted-foreground">{s.level}</span>
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
            s.status === "active" ? "border-emerald-500/40 text-emerald-600" : "border-border/60"
          }`}>{s.status}</Badge>
          {s.studio_name && <span className="text-muted-foreground truncate max-w-[100px]">· {s.studio_name}</span>}
        </div>
      ))}
      {students.length > 2 && (
        <button onClick={() => setOpen(o => !o)}
          className="text-xs text-primary flex items-center gap-0.5 mt-0.5">
          {open ? <><ChevronUp size={10} />Less</> : <><ChevronDown size={10} />{students.length - 2} more</>}
        </button>
      )}
    </div>
  );
}

/* ─── Teachers Tab ──────────────────────────────────────── */
function TeachersTab({ teachers }: { teachers: TeacherRow[] }) {
  const [q, setQ] = useState("");
  const filtered = teachers.filter(t =>
    [t.full_name, t.email, t.studio_name].some(v => v?.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search teachers…" className="pl-8 h-9 text-sm" />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} teacher{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.map(t => (
          <Card key={t.user_id} className="border-border/40 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-sm">{t.full_name ?? <span className="text-muted-foreground italic">No name</span>}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ContactChip icon={Mail} value={t.email} href={`mailto:${t.email}`} />
                    </div>
                    {t.studio_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 size={10} />
                        {t.studio_name}
                        {t.studio_is_demo && <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">Demo</Badge>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {t.created_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No teachers found.</p>}
      </div>
    </div>
  );
}

/* ─── Parents Tab ───────────────────────────────────────── */
function ParentsTab({ parents }: { parents: ParentRow[] }) {
  const [q, setQ] = useState("");
  const filtered = parents.filter(p =>
    [p.full_name, p.email, p.phone].some(v => v?.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search parents…" className="pl-8 h-9 text-sm" />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} parent{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.user_id} className="border-border/40 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} className="text-blue-500" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-semibold text-sm">{p.full_name ?? <span className="text-muted-foreground italic">No name</span>}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ContactChip icon={Mail} value={p.email} href={`mailto:${p.email}`} />
                      <ContactChip icon={Phone} value={p.phone} href={`tel:${p.phone}`} />
                    </div>
                    <StudentList students={p.students} />
                  </div>
                </div>
                <div className="shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {p.student_count} student{p.student_count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No parents found.</p>}
      </div>
    </div>
  );
}

/* ─── Students Tab ──────────────────────────────────────── */
function StudentsTab({ students }: { students: StudentRow[] }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const statuses = ["all", ...Array.from(new Set(students.map(s => s.status)))];
  const filtered = students.filter(s => {
    const matchQ = [s.name, s.parent_name, s.parent_email, s.parent_phone, s.studio_name]
      .some(v => v?.toLowerCase().includes(q.toLowerCase()));
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchQ && matchStatus;
  });
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search students, parents…" className="pl-8 h-9 text-sm" />
        </div>
        <div className="flex gap-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 text-muted-foreground hover:border-border"
              }`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.map(s => (
          <Card key={s.id} className="border-border/40 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={16} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                        s.status === "active" ? "border-emerald-500/40 text-emerald-600" :
                        s.status === "paused" ? "border-amber-500/40 text-amber-600" :
                        "border-border/60 text-muted-foreground"
                      }`}>{s.status}</Badge>
                      <span className="text-xs text-muted-foreground">{s.level}</span>
                      {s.age && <span className="text-xs text-muted-foreground">Age {s.age}</span>}
                    </div>
                    {s.studio_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 size={10} /> {s.studio_name}
                      </p>
                    )}
                    {(s.lesson_day || s.lesson_time) && (
                      <p className="text-xs text-muted-foreground">
                        📅 {[s.lesson_day, s.lesson_time].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {s.current_piece && (
                      <p className="text-xs text-muted-foreground">🎵 {s.current_piece}</p>
                    )}
                    <Separator className="my-1.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground">Parent / Guardian</p>
                      <p className="text-sm font-medium">{s.parent_name ?? <span className="text-muted-foreground italic text-xs">No parent linked</span>}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <ContactChip icon={Mail} value={s.parent_email} href={`mailto:${s.parent_email}`} />
                        <ContactChip icon={Phone} value={s.parent_phone} href={`tel:${s.parent_phone}`} />
                        {s.parent_user_email && s.parent_user_email !== s.parent_email && (
                          <ContactChip icon={Mail} value={`Account: ${s.parent_user_email}`} href={`mailto:${s.parent_user_email}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No students found.</p>}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
const SuperAdmin = () => {
  const { role } = useAuth();

  const statsQuery = useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/platform-stats`, {
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Failed to load stats"); }
      return res.json();
    },
    enabled: role === "admin",
  });

  const usersQuery = useQuery<PlatformUsers>({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/platform-users`, {
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Failed to load users"); }
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

  const stats = statsQuery.data;
  const users = usersQuery.data;

  const statCards = stats ? [
    { label: "Total Studios", value: stats.totals.studios, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Users", value: stats.totals.users, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Total Students", value: stats.totals.students, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Lessons", value: stats.totals.lessons, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  ] : [];

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
        <Badge variant="outline" className="text-xs px-3 py-1 border-primary/40 text-primary">Super Admin</Badge>
      </div>

      {/* Stat Cards */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : statsQuery.error ? (
        <p className="text-destructive text-sm">{(statsQuery.error as Error).message}</p>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => <StatCard key={c.label} {...c} />)}
        </div>
      ) : null}

      {/* Main Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BarChart3 size={14} className="mr-1.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <User size={14} className="mr-1.5" />
            Teachers {users?.teachers.length != null && <span className="ml-1 text-xs text-muted-foreground">({users.teachers.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="parents">
            <Users size={14} className="mr-1.5" />
            Parents {users?.parents.length != null && <span className="ml-1 text-xs text-muted-foreground">({users.parents.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="students">
            <GraduationCap size={14} className="mr-1.5" />
            Students {users?.students.length != null && <span className="ml-1 text-xs text-muted-foreground">({users.students.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {statsQuery.isLoading ? (
            <div className="h-64 bg-muted rounded-2xl animate-pulse" />
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Studios List */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <BarChart3 size={16} className="text-muted-foreground" />
                  All Studios
                  <span className="text-xs text-muted-foreground font-normal">
                    ({stats.studios.filter(s => !s.is_demo).length} live · {stats.studios.filter(s => s.is_demo).length} demo)
                  </span>
                </h2>
                <div className="space-y-2">
                  {stats.studios.length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No studios yet.</p>}
                  {stats.studios.map(studio => (
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
                            {studio.is_demo
                              ? <Badge variant="outline" className="text-xs px-1.5 py-0.5">Demo</Badge>
                              : <Badge className="text-xs px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">Live</Badge>
                            }
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
                  <TrendingUp size={16} className="text-muted-foreground" />Recent Signups
                </h2>
                <Card className="border-border/50 rounded-2xl">
                  <CardContent className="p-0">
                    {stats.recentSignups.length === 0 && (
                      <p className="text-muted-foreground text-sm py-6 text-center">No signups yet.</p>
                    )}
                    {stats.recentSignups.map((s, i) => (
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
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 shrink-0 ${
                              s.role === "admin" ? "border-primary/40 text-primary" : "border-blue-400/40 text-blue-600"
                            }`}>
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
          ) : null}
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          {usersQuery.isLoading
            ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
            : usersQuery.error
              ? <p className="text-destructive text-sm">{(usersQuery.error as Error).message}</p>
              : users ? <TeachersTab teachers={users.teachers} /> : null}
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents">
          {usersQuery.isLoading
            ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
            : usersQuery.error
              ? <p className="text-destructive text-sm">{(usersQuery.error as Error).message}</p>
              : users ? <ParentsTab parents={users.parents} /> : null}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          {usersQuery.isLoading
            ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>
            : usersQuery.error
              ? <p className="text-destructive text-sm">{(usersQuery.error as Error).message}</p>
              : users ? <StudentsTab students={users.students} /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdmin;
