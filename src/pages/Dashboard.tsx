import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FileUploadDialog from "@/components/FileUploadDialog";
import { Users, BookOpen, Calendar, TrendingUp, AlertCircle, UserPlus, Music, FileText, Send, PlayCircle, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns";
import LessonMode from "@/components/LessonMode";

const StatCard = ({ label, value, sub, icon: Icon, iconColor, onClick }: any) => (
  <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={onClick}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-4xl font-heading font-bold mt-1.5 tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { studio, loading: studioLoading } = useStudio();
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");
  const [lessonModeStudent, setLessonModeStudent] = useState<any>(null);

  const { data: students } = useQuery({
    queryKey: ["dashboard-students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name, status, lesson_day, lesson_time, current_piece");
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["dashboard-pending-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_requests").select("*").eq("status", "pending").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: weekLessons } = useQuery({
    queryKey: ["dashboard-week-lessons", weekStart],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*, students(name, lesson_time)").gte("date", weekStart).lte("date", weekEnd).order("date");
      if (error) throw error;
      return data;
    },
  });

  const { data: recentLessons } = useQuery({
    queryKey: ["dashboard-recent-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*, students(name)").order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: needsRecap } = useQuery({
    queryKey: ["dashboard-needs-recap"],
    queryFn: async () => {
      // Lessons without a recap
      const { data: allLessons } = await supabase.from("lessons").select("id").eq("date", todayStr).eq("attendance", "present");
      if (!allLessons || allLessons.length === 0) return 0;
      const lessonIds = allLessons.map(l => l.id);
      const { data: recaps } = await supabase.from("recap_messages").select("lesson_id").in("lesson_id", lessonIds);
      const recappedIds = new Set((recaps ?? []).map(r => r.lesson_id));
      return lessonIds.filter(id => !recappedIds.has(id)).length;
    },
  });

  const activeStudents = students?.filter(s => s.status === "active") ?? [];
  const awaitingPayment = students?.filter(s => s.status === "awaiting_payment") ?? [];
  const todayLessons = weekLessons?.filter(l => l.date === todayStr) ?? [];
  const completedThisWeek = weekLessons?.filter(l => l.attendance === "present")?.length ?? 0;
  const totalThisWeek = weekLessons?.length ?? 0;
  const attendanceRate = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;
  const studentOptions = students?.map(s => ({ id: s.id, name: s.name })) ?? [];

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Redirect to onboarding only after loading settles and no studio found
  useEffect(() => {
    if (!studioLoading && !studio) {
      const timer = setTimeout(() => navigate("/onboarding"), 300);
      return () => clearTimeout(timer);
    }
  }, [studioLoading, studio, navigate]);

  if (studioLoading) return null;
  if (!studio) return null;

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-0.5">{format(today, "EEEE, d MMMM yyyy")}</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-gradient-gold">{studio?.name ?? "Studio"}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your studio today.</p>
        </div>
        <FileUploadDialog students={studentOptions} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={activeStudents.length} sub="Enrolled" icon={Users} iconColor="bg-gold/15 text-gold" onClick={() => navigate("/students")} />
        <StatCard label="Today's Lessons" value={todayLessons.length} sub="Scheduled today" icon={Calendar} iconColor="bg-blue-500/10 text-blue-500" onClick={() => navigate("/calendar")} />
        <StatCard
          label="Needs Recap"
          value={needsRecap ?? 0}
          sub={needsRecap ? "Awaiting recap" : "All recaps sent ✓"}
          icon={Send}
          iconColor={needsRecap ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}
          onClick={() => navigate("/lessons")}
        />
        <StatCard label="Attendance" value={`${attendanceRate}%`} sub="This week" icon={TrendingUp} iconColor="bg-emerald-500/10 text-emerald-500" onClick={() => navigate("/calendar")} />
      </div>

      {/* Alerts */}
      {(awaitingPayment.length > 0 || (pendingRequests?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {awaitingPayment.length > 0 && (
            <Card className="border-gold/30 bg-gold/5">
              <CardHeader className="pb-2 pt-4"><CardTitle className="font-heading text-sm flex items-center gap-2"><AlertCircle size={14} className="text-gold" /> Payment Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2 pb-4">
                {awaitingPayment.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-gold/20 bg-card">
                    <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center shrink-0"><AlertCircle size={13} className="text-gold" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{s.name}</p><p className="text-xs text-muted-foreground">Awaiting payment</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(pendingRequests?.length ?? 0) > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5 cursor-pointer" onClick={() => navigate("/requests")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><UserPlus size={18} className="text-blue-500" /></div>
                <div>
                  <p className="font-semibold text-sm">{pendingRequests?.length} new application{pendingRequests!.length > 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground">Awaiting your review</p>
                </div>
                <AlertCircle size={16} className="text-blue-500 ml-auto" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Today's schedule + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent activity */}
        <div className="lg:col-span-3">
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/lessons")} className="text-xs text-muted-foreground h-8">View all →</Button>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {recentLessons && recentLessons.length > 0 ? recentLessons.map(lesson => (
                <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => navigate("/lessons")}>
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><Music size={14} className="text-gold" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Lesson with {(lesson as any).students?.name}</p>
                    {lesson.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    lesson.attendance === "present" ? "bg-emerald-100 text-emerald-700"
                    : lesson.attendance === "absent" ? "bg-red-100 text-red-600"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {lesson.attendance === "present" ? "Present" : lesson.attendance === "absent" ? "Absent" : "Cancelled"}
                  </span>
                </div>
              )) : (
                <div className="py-8 text-center"><Music size={28} className="text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No recent lessons yet</p></div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's schedule */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Today</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")} className="text-xs text-muted-foreground h-8">Calendar →</Button>
            </CardHeader>
            <CardContent className="space-y-2.5 pb-4">
              {todayLessons.length > 0 ? todayLessons.map(lesson => {
                const studentName = (lesson as any).students?.name ?? "Unknown";
                const lessonTime = (lesson as any).students?.lesson_time ?? "";
                const initials = studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                const isDone = lesson.attendance === "present";
                const matchedStudent = students?.find(s => s.name === studentName);

                return (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-gold/30 hover:bg-gold/5 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center text-charcoal text-xs font-bold shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{studentName}</p>
                      <p className="text-xs text-muted-foreground">{lessonTime}</p>
                    </div>
                    {!isDone && matchedStudent ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => setLessonModeStudent(matchedStudent)}
                      >
                        <PlayCircle size={12} className="mr-1" /> Start
                      </Button>
                    ) : (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isDone ? "bg-emerald-500" : lesson.attendance === "absent" ? "bg-destructive" : "bg-gold"}`} />
                    )}
                  </div>
                );
              }) : (
                <div className="py-8 text-center"><Calendar size={28} className="text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No lessons today</p></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-lg font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add Student", icon: UserPlus, path: "/students", primary: true },
            { label: "Log Lesson", icon: BookOpen, path: "/lessons", primary: true },
            { label: "Messages", icon: FileText, path: "/messages", primary: false },
            { label: "Calendar", icon: Calendar, path: "/calendar", primary: false },
          ].map(({ label, icon: Icon, path, primary }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200 font-medium text-sm ${
                primary
                  ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow-md"
                  : "border-2 border-border hover:border-gold/40 hover:bg-gold/5 text-foreground"
              }`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Mode Dialog */}
      {lessonModeStudent && (
        <LessonMode
          open={!!lessonModeStudent}
          onClose={() => setLessonModeStudent(null)}
          student={lessonModeStudent}
        />
      )}
    </div>
  );
};

export default Dashboard;
