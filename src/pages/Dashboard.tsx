import { Users, BookOpen, Calendar, Clock, AlertCircle, Inbox, UserPlus, Music, Send, FileText, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import FileUploadDialog from "@/components/FileUploadDialog";
import { format, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { studio, loading: studioLoading } = useStudio();
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

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

  const activeStudents = students?.filter(s => s.status === "active") ?? [];
  const waitingStudents = students?.filter(s => s.status === "waiting") ?? [];
  const awaitingPayment = students?.filter(s => s.status === "awaiting_payment") ?? [];

  const todayLessons = weekLessons?.filter(l => l.date === todayStr) ?? [];
  const completedThisWeek = weekLessons?.filter(l => l.attendance === "present")?.length ?? 0;
  const totalThisWeek = weekLessons?.length ?? 0;

  const attendanceRate = totalThisWeek > 0
    ? Math.round((completedThisWeek / totalThisWeek) * 100)
    : 0;

  const studentOptions = students?.map(s => ({ id: s.id, name: s.name })) ?? [];

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Redirect to onboarding if no studio yet
  if (!studioLoading && !studio) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{greeting}, {studio?.name ?? "Studio"}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your studio today.</p>
        </div>
        <FileUploadDialog students={studentOptions} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/students")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Students</p>
                <p className="text-3xl font-heading font-bold mt-1">{activeStudents.length}</p>
                <p className="text-xs text-muted-foreground mt-2">Active this month</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/lessons")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Lessons</p>
                <p className="text-3xl font-heading font-bold mt-1">{todayLessons.length}</p>
                <p className="text-xs text-muted-foreground mt-2">Scheduled today</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Calendar size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/students")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Applications</p>
                <p className="text-3xl font-heading font-bold mt-1">{pendingRequests?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Require attention</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/calendar")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance Rate</p>
                <p className="text-3xl font-heading font-bold mt-1">{attendanceRate}%</p>
                <p className="text-xs text-muted-foreground mt-2">This week</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Alerts */}
      {awaitingPayment.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <AlertCircle size={18} className="text-gold" />
              Payment Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {awaitingPayment.map((s) => (
              <div key={s.id} className="flex items-start gap-4 p-4 rounded-lg border-l-4 border-l-gold bg-muted/30">
                <AlertCircle size={20} className="text-gold mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gold">Payment Pending</p>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">{s.name}</strong> — Awaiting payment to activate lessons</p>
                  <div className="flex gap-3 mt-2">
                    <Button variant="ghost" size="sm" className="text-gold h-7 text-xs">
                      <Send size={12} className="mr-1" /> Send Reminder
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Dismiss</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-3">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/lessons")} className="text-muted-foreground">
                View All →
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentLessons && recentLessons.length > 0 ? (
                recentLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/lessons")}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Music size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Lesson {lesson.attendance === "present" ? "completed" : "recorded"} with {(lesson as any).students?.name}
                      </p>
                      {lesson.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activities</p>
              )}

              {/* Pending applications as activity items */}
              {pendingRequests && pendingRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/requests")}
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <UserPlus size={14} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">New student inquiry</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.child_name} (age {req.child_age}) interested in {req.preferred_level} lessons
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Today's Schedule</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")} className="text-muted-foreground text-xs">
                Full Calendar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLessons.length > 0 ? (
                todayLessons.map((lesson) => {
                  const studentName = (lesson as any).students?.name ?? "Unknown";
                  const lessonTime = (lesson as any).students?.lesson_time ?? "";
                  const statusLabel = lesson.attendance === "present" ? "Completed" : lesson.attendance === "absent" ? "No-Show" : "Upcoming";
                  const statusColor = lesson.attendance === "present" 
                    ? "text-green-600" 
                    : lesson.attendance === "absent" 
                    ? "text-destructive" 
                    : "text-muted-foreground";

                  return (
                    <div
                      key={lesson.id}
                      className="p-3 rounded-lg border border-border/50 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => navigate("/lessons")}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal text-xs font-bold">
                            {studentName.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <p className="text-sm font-medium">{studentName}</p>
                        </div>
                        <span className={`text-xs font-medium ${statusColor}`}>
                          {statusLabel === "Completed" && "✓ "}
                          {statusLabel === "Upcoming" && "◷ "}
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-10">
                        {lessonTime} · 45 min
                      </p>
                      {lesson.pieces && lesson.pieces.length > 0 && (
                        <details className="mt-2 ml-10">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Lesson Notes
                          </summary>
                          <p className="text-xs mt-1 text-muted-foreground">
                            {lesson.pieces.join(", ")}
                          </p>
                        </details>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No lessons scheduled for today</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/students")}
            className="p-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex flex-col items-center gap-3"
          >
            <UserPlus size={24} />
            <span className="text-sm font-medium">Add New Student</span>
          </button>
          <button
            onClick={() => navigate("/lessons")}
            className="p-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex flex-col items-center gap-3"
          >
            <FileText size={24} />
            <span className="text-sm font-medium">Create Lesson Note</span>
          </button>
          <button
            onClick={() => navigate("/requests")}
            className="p-6 rounded-xl border-2 border-border hover:bg-muted transition-colors flex flex-col items-center gap-3"
          >
            <Send size={24} />
            <span className="text-sm font-medium">Review Applications</span>
          </button>
          <button
            onClick={() => navigate("/calendar")}
            className="p-6 rounded-xl border-2 border-border hover:bg-muted transition-colors flex flex-col items-center gap-3"
          >
            <Calendar size={24} />
            <span className="text-sm font-medium">View Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
