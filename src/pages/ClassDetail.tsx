import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft, Plus, Trash2, PlayCircle, CalendarPlus,
  Users, Calendar, BarChart3, Search, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import ScheduleClassSessionDialog from "@/components/ScheduleClassSessionDialog";
import { useNavigate as useNav } from "react-router-dom";

const AttendanceBadge = ({ value }: { value: string }) => {
  if (value === "present") return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Present</Badge>;
  if (value === "absent") return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Absent</Badge>;
  if (value === "late") return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Late</Badge>;
  return <Badge variant="secondary" className="text-xs">Scheduled</Badge>;
};

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const { studio } = useStudio();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cls } = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ["class-members", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_members")
        .select("*, students(id, name, level, parent_email, status)")
        .eq("class_id", classId!)
        .eq("status", "active")
        .order("joined_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classId,
  });

  const { data: allStudents } = useQuery({
    queryKey: ["active-students-for-class", studio?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, level")
        .eq("status", "active")
        .eq("studio_id", studio!.id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studio?.id,
  });

  const { data: sessions } = useQuery({
    queryKey: ["class-sessions", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*, class_attendance(student_id, attendance)")
        .eq("class_id", classId!)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("class_members").upsert({
        studio_id: studio!.id,
        class_id: classId!,
        student_id: studentId,
        status: "active",
      }, { onConflict: "class_id,student_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-members", classId] });
      toast({ title: "Student added to class ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("class_members").update({ status: "inactive" }).eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-members", classId] });
      toast({ title: "Student removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const memberStudentIds = (members ?? []).map((m: any) => m.student_id);
  const availableToAdd = (allStudents ?? []).filter(s => !memberStudentIds.includes(s.id));
  const filtered = availableToAdd.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Attendance report
  const completedSessions = (sessions ?? []).filter((s: any) => s.status === "completed" || s.class_attendance?.length > 0);
  const attendanceReport = (members ?? []).map((m: any) => {
    const student = m.students;
    let present = 0, absent = 0, late = 0, total = 0;
    (sessions ?? []).forEach((s: any) => {
      const record = (s.class_attendance ?? []).find((a: any) => a.student_id === m.student_id);
      if (!record || record.attendance === "scheduled") return;
      total++;
      if (record.attendance === "present") present++;
      else if (record.attendance === "absent") absent++;
      else if (record.attendance === "late") late++;
    });
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : null;
    return { student, present, absent, late, total, pct };
  });

  const upcomingSessions = (sessions ?? [])
    .filter((s: any) => s.status === "scheduled" && new Date(s.starts_at) >= new Date())
    .reverse();
  const pastSessions = (sessions ?? [])
    .filter((s: any) => s.status !== "scheduled" || new Date(s.starts_at) < new Date())
    .slice(0, 20);

  if (!cls) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/classes")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">{cls.name}</h1>
          <p className="text-muted-foreground text-sm">
            {cls.default_day && cls.default_time ? `${cls.default_day}s at ${cls.default_time} · ` : ""}
            {cls.duration_minutes} min
            {cls.capacity ? ` · Max ${cls.capacity}` : ""}
          </p>
        </div>
      </div>

      <Tabs defaultValue="roster">
        <TabsList className="mb-4">
          <TabsTrigger value="roster" className="gap-1.5"><Users size={14} />Roster ({memberStudentIds.length})</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar size={14} />Schedule</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5"><BarChart3 size={14} />Attendance</TabsTrigger>
        </TabsList>

        {/* ── ROSTER ── */}
        <TabsContent value="roster" className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Current Roster</p>
              {(members ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No students in this class yet.</p>
              ) : (
                <div className="space-y-2">
                  {(members ?? []).map((m: any) => {
                    const s = m.students;
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {s?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s?.name}</p>
                          <p className="text-xs text-muted-foreground">{s?.level}</p>
                        </div>
                        <button
                          onClick={() => removeMemberMutation.mutate(m.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {availableToAdd.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Add Students</p>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9 text-sm"
                    placeholder="Search students…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {filtered.slice(0, 20).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.level}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => addMemberMutation.mutate(s.id)}
                        disabled={addMemberMutation.isPending}
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SCHEDULE ── */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold"
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarPlus size={14} className="mr-1.5" /> Schedule Session
            </Button>
          </div>

          {upcomingSessions.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</p>
                <div className="space-y-2">
                  {upcomingSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{format(parseISO(s.starts_at), "EEEE, d MMMM yyyy")}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(s.starts_at), "HH:mm")} – {format(parseISO(s.ends_at), "HH:mm")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold text-xs font-semibold shrink-0"
                        onClick={() => navigate(`/class-session/${s.id}`)}
                      >
                        <PlayCircle size={13} className="mr-1.5" /> Start
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pastSessions.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Past Sessions</p>
                <div className="space-y-2">
                  {pastSessions.map((s: any) => {
                    const att = s.class_attendance ?? [];
                    const p = att.filter((a: any) => a.attendance === "present").length;
                    const ab = att.filter((a: any) => a.attendance === "absent").length;
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{format(parseISO(s.starts_at), "d MMM yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(s.starts_at), "HH:mm")}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {p > 0 && <span className="text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 size={11} />{p}</span>}
                          {ab > 0 && <span className="text-red-500 font-medium flex items-center gap-0.5"><XCircle size={11} />{ab}</span>}
                          <Badge variant={s.status === "completed" ? "secondary" : "outline"} className="text-xs">{s.status}</Badge>
                        </div>
                        <button
                          onClick={() => navigate(`/class-session/${s.id}`)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {sessions?.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-sm mb-4">No sessions scheduled yet.</p>
                <Button size="sm" className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold" onClick={() => setScheduleOpen(true)}>
                  <CalendarPlus size={14} className="mr-1.5" /> Schedule First Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ATTENDANCE REPORT ── */}
        <TabsContent value="attendance">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Attendance by Student</p>
              {attendanceReport.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No attendance data yet.</p>
              ) : (
                <div className="space-y-3">
                  {attendanceReport.map(({ student, present, absent, late, total, pct }) => (
                    <div key={student?.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                        {student?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{student?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {total} sessions · {present}✓ {absent}✗ {late > 0 ? `${late}⏰` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {pct !== null ? (
                          <span className={`text-sm font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"}`}>
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleClassSessionDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        classId={classId!}
        studioId={cls.studio_id}
        durationMinutes={cls.duration_minutes}
        defaultDay={cls.default_day}
        defaultTime={cls.default_time}
        memberStudentIds={memberStudentIds}
      />
    </div>
  );
};

export default ClassDetail;
