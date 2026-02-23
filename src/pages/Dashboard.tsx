import { Users, BookOpen, Calendar, TrendingUp, Clock, AlertCircle, Inbox, UserPlus, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FileUploadDialog from "@/components/FileUploadDialog";
import { format, startOfWeek, endOfWeek, isToday } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Good morning, Shanika</h1>
          <p className="text-muted-foreground mt-1">Here's your studio overview for today.</p>
        </div>
        <FileUploadDialog students={studentOptions} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/students")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-heading font-bold mt-1">{activeStudents.length}</p>
                {waitingStudents.length > 0 && (
                  <p className="text-xs text-gold mt-2">{waitingStudents.length} on waiting list</p>
                )}
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
                <p className="text-sm text-muted-foreground">Lessons This Week</p>
                <p className="text-2xl font-heading font-bold mt-1">{totalThisWeek}</p>
                <p className="text-xs text-gold mt-2">{todayLessons.length} today</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/calendar")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-heading font-bold mt-1">{attendanceRate}%</p>
                <p className="text-xs text-gold mt-2">This week</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Calendar size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/admin-requests")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
                <p className="text-2xl font-heading font-bold mt-1">{pendingRequests?.length ?? 0}</p>
                {awaitingPayment.length > 0 && (
                  <p className="text-xs text-gold mt-2">{awaitingPayment.length} awaiting payment</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Inbox size={20} className="text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Applications */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Applications Under Review</CardTitle>
            {(pendingRequests?.length ?? 0) > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin-requests")} className="text-gold">
                View all
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests && pendingRequests.length > 0 ? (
              pendingRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate("/admin-requests")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal text-xs font-bold">
                      <UserPlus size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{req.child_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.preferred_level} · {req.parent_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                      Pending
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(req.created_at), "d MMM")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending applications</p>
            )}
          </CardContent>
        </Card>

        {/* Today's Lessons */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayLessons.length > 0 ? (
              todayLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate("/lessons")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal text-xs font-bold">
                      {(lesson as any).students?.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{(lesson as any).students?.name}</p>
                      {lesson.pieces && lesson.pieces.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Music size={10} /> {lesson.pieces[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{(lesson as any).students?.lesson_time ?? ""}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      lesson.attendance === "present"
                        ? "bg-green-100 text-green-700"
                        : lesson.attendance === "absent"
                        ? "bg-red-100 text-red-700"
                        : "bg-accent/20 text-accent-foreground"
                    }`}>
                      {lesson.attendance}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No lessons scheduled for today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {(awaitingPayment.length > 0 || waitingStudents.length > 0) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {awaitingPayment.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => navigate("/students")}>
                <AlertCircle size={18} className="text-gold mt-0.5 shrink-0" />
                <p className="text-sm"><strong>{s.name}</strong> — Awaiting payment to activate lessons</p>
              </div>
            ))}
            {waitingStudents.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => navigate("/students")}>
                <Clock size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm"><strong>{s.name}</strong> — On waiting list</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
